// src/utils/quizSession.js
/**
 * Quiz Session Manager
 * Handles localStorage persistence + API calls for History's Verdict campaign
 * Defensive: Works offline, syncs when online
 */

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';
const STORAGE_KEY = 'awakeverse_quiz_session';

/**
 * Get or create quiz session ID
 */
export const getQuizSessionId = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      // Check if session expired (24 hours)
      const expiresAt = new Date(data.expires_at);
      if (expiresAt > new Date()) {
        return data.quiz_session_id;
      }
    } catch (e) {
      console.warn('Quiz session parse error:', e);
    }
  }
  return null;
};

/**
 * Start new quiz session
 */
export const startQuizSession = async (campaignData = {}) => {
  try {
    const response = await fetch(`${API_BASE}/api/quiz/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ campaign_data: campaignData }),
    });

    if (!response.ok) {
      throw new Error('Failed to start quiz session');
    }

    const data = await response.json();
    
    // Store session data in localStorage
    const sessionData = {
      quiz_session_id: data.quiz_session_id,
      expires_at: data.expires_at,
      started_at: new Date().toISOString(),
      answers: [],
      campaign_data: campaignData,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    
    return data.quiz_session_id;
  } catch (error) {
    console.error('Failed to start quiz session:', error);
    // Defensive fallback: Create local session even if API fails
    const fallbackSessionId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fallbackData = {
      quiz_session_id: fallbackSessionId,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      started_at: new Date().toISOString(),
      answers: [],
      campaign_data: campaignData,
      offline: true, // Flag for later sync
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackData));
    return fallbackSessionId;
  }
};

/**
 * Get current session data
 */
export const getSessionData = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.warn('Failed to parse session data:', e);
    return null;
  }
};

/**
 * Save answer to session (localStorage + API)
 */
export const saveAnswer = async (answer) => {
  const sessionData = getSessionData();
  if (!sessionData) {
    throw new Error('No active quiz session');
  }

  // Update localStorage immediately (defensive)
  sessionData.answers.push(answer);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));

  // Try to sync with API (non-blocking)
  if (!sessionData.offline) {
    try {
      await fetch(`${API_BASE}/api/quiz/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quiz_session_id: sessionData.quiz_session_id,
          answer: answer,
        }),
      });
    } catch (error) {
      console.warn('Failed to sync answer to API:', error);
      // Don't throw - localStorage is source of truth
    }
  }

  return sessionData.answers;
};

/**
 * Complete quiz and get results
 */
export const completeQuiz = async () => {
  const sessionData = getSessionData();
  if (!sessionData) {
    throw new Error('No active quiz session');
  }

  if (sessionData.answers.length < 8) {
    throw new Error(`Quiz incomplete: ${sessionData.answers.length}/8 questions answered`);
  }

  // Calculate results locally (defensive)
  const matches = sessionData.answers.filter(a => a.match).length;
  const agreedWith = sessionData.answers.filter(a => a.match).map(a => a.historical_figure);
  const disagreedWith = sessionData.answers.filter(a => !a.match).map(a => a.historical_figure);
  
  const personaType = calculatePersonaType(matches);
  const personaData = PERSONA_TYPES[personaType];

  const results = {
    persona_type: personaType,
    match_score: `${matches}/8`,
    agreed_with: agreedWith,
    disagreed_with: disagreedWith,
    description: personaData.description,
    traits: personaData.traits,
    completed_at: new Date().toISOString(),
  };

  // Store results in localStorage
  sessionData.results = results;
  sessionData.completed_at = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));

  // Try to sync with API (non-blocking)
  if (!sessionData.offline) {
    try {
      const response = await fetch(`${API_BASE}/api/quiz/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quiz_session_id: sessionData.quiz_session_id,
        }),
      });

      if (response.ok) {
        const apiResults = await response.json();
        // Use API results if available, fallback to local
        return apiResults.results || results;
      }
    } catch (error) {
      console.warn('Failed to sync completion to API:', error);
    }
  }

  return results;
};

/**
 * Clear quiz session (for retaking quiz)
 */
export const clearQuizSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Get quiz results (for results page)
 */
export const getQuizResults = () => {
  const sessionData = getSessionData();
  return sessionData?.results || null;
};

// ============================================================================
// PERSONA CALCULATION (Client-side fallback)
// ============================================================================

const PERSONA_TYPES = {
  "The Humanitarian Guardian": {
    score_range: [7, 8],
    description: "You believe Britain's strength comes from compassion and moral leadership",
    archetype: "Explorer",
    traits: ["Compassionate", "Principled", "Courageous", "Empathetic", "Globally-minded", "Justice-focused"]
  },
  "The Pragmatic Welcomer": {
    score_range: [5, 6],
    description: "You believe Britain's strength comes from adaptation and balanced openness",
    archetype: "Explorer",
    traits: ["Open-minded", "Pragmatic", "Historically aware", "Adaptive", "Nuanced", "Solution-focused"]
  },
  "The Cautious Traditionalist": {
    score_range: [3, 4],
    description: "You value Britain's heritage while acknowledging change requires careful thought",
    archetype: "Scholar",
    traits: ["Thoughtful", "Traditional", "Questioning", "Careful", "Principled", "Community-focused"]
  },
  "The Protective Guardian": {
    score_range: [0, 2],
    description: "You prioritize Britain's security and the preservation of established order",
    archetype: "Warrior",
    traits: ["Protective", "Patriotic", "Security-focused", "Principled", "Resolute", "Stability-seeking"]
  }
};

function calculatePersonaType(matchScore) {
  for (const [personaName, data] of Object.entries(PERSONA_TYPES)) {
    const [min, max] = data.score_range;
    if (matchScore >= min && matchScore <= max) {
      return personaName;
    }
  }
  return "The Pragmatic Welcomer"; // Default fallback
}

// ============================================================================
// CAMPAIGN UTM EXTRACTION
// ============================================================================

/**
 * Extract UTM parameters from URL
 */
export const extractCampaignData = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || 'history-verdict',
    utm_content: params.get('utm_content') || null,
    utm_term: params.get('utm_term') || null,
    referrer: document.referrer || null,
  };
};