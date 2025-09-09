// src/pages/ChatLauncherPage.jsx - Updated with enhanced premium architecture
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { characterCategories } from '../data/characterCategories';
import useInteractedCharacters from '../hooks/useInteractedCharacters';

// NEW: Import enhanced premium hooks
import { usePremiumCapabilitiesContext } from '../contexts/PremiumCapabilitiesContext';
import usePremiumCharacters from '../hooks/usePremiumCharacters';
import { PremiumStateRenderer, CapabilityGate } from '../components/PremiumComponents';

// Existing imports
import TemplateGallery from '../components/TemplateGallery';
import CharacterBuilder from '../components/CharacterBuilder';
import CharacterCreationSuccess from '../components/CharacterCreationSuccess';
//import { useSimplifiedPremiumFlow } from '../hooks/useSimplifiedPremiumFlow';

// Subscription state constants
const SUBSCRIPTION_STATES = {
  FREE: 'free',
  TRIAL_ACTIVE: 'trial_active',
  TRIAL_EXPIRED: 'trial_expired',
  PREMIUM_ACTIVE: 'premium_active', 
  PREMIUM_EXPIRED: 'premium_expired',
  PENDING_APPROVAL: 'pending_approval'
};

// Enhanced semantic mappings (keeping your existing logic)
const ENHANCED_SEMANTIC_MAPPINGS = {
  'truth': ['truthweavers', 'thinkers'],
  'meaning': ['thinkers', 'veilwalkers'],
  'power': ['warlords', 'goldhands'],
  'war': ['warlords'],
  'strategy': ['warlords', 'goldhands'],
  'battle': ['warlords'],
  'leadership': ['warlords', 'goldhands'],
  'create': ['makers', 'heartstrings'],
  'invent': ['makers'],
  'art': ['makers', 'heartstrings'],
  'innovation': ['makers'],
  'technology': ['makers'],
  'money': ['goldhands'],
  'business': ['goldhands'],
  'success': ['goldhands', 'warlords'],
  'wealth': ['goldhands'],
  'entrepreneur': ['goldhands'],
  'spiritual': ['veilwalkers', 'stargazers'],
  'magic': ['veilwalkers'],
  'destiny': ['stargazers', 'veilwalkers'],
  'future': ['stargazers', 'veilwalkers'],
  'stars': ['stargazers'],
  'astrology': ['stargazers'],
  'detective': ['sleuths'],
  'mystery': ['sleuths'],
  'investigation': ['sleuths'],
  'love': ['heartstrings'],
  'romance': ['heartstrings'],
  'passion': ['heartstrings'],
  'philosophy': ['thinkers'],
  'wisdom': ['thinkers', 'veilwalkers'],
  'science': ['makers', 'thinkers'],
  'invention': ['makers'],
  'engineering': ['makers'],
  'enlightenment': ['thinkers', 'truthweavers'],
  'revolution': ['truthweavers', 'warlords'],
  'mysticism': ['veilwalkers'],
  'prophecy': ['stargazers', 'veilwalkers'],
  'trade': ['goldhands'],
  'empire': ['warlords', 'goldhands'],
  'poetry': ['heartstrings', 'truthweavers'],
  'literature': ['heartstrings', 'truthweavers'],
  'justice': ['truthweavers', 'sleuths'],
  'deduction': ['sleuths'],
  'logic': ['thinkers', 'sleuths'],
  'mathematics': ['makers', 'thinkers'],
  'alchemy': ['veilwalkers', 'makers'],
  'medicine': ['veilwalkers', 'makers'],
  'astronomy': ['stargazers', 'makers'],
  'exploration': ['truthweavers', 'makers'],
  'adventure': ['truthweavers', 'warlords'],
  'rebellion': ['truthweavers', 'warlords'],
  'freedom': ['truthweavers', 'warlords'],
  'honor': ['warlords', 'truthweavers'],
  'courage': ['warlords', 'truthweavers'],
  'beauty': ['heartstrings'],
  'seduction': ['heartstrings'],
  'desire': ['heartstrings'],
  'mythology': ['veilwalkers', 'stargazers'],
  'legend': ['veilwalkers', 'warlords'],
  'folklore': ['veilwalkers', 'truthweavers'],
  'economics': ['goldhands'],
  'finance': ['goldhands'],
  'industry': ['goldhands', 'makers'],
  'discovery': ['makers', 'truthweavers'],
  'genius': ['makers', 'thinkers'],
  'military': ['warlords'],
  'tactics': ['warlords'],
  'conquest': ['warlords'],
  'diplomacy': ['warlords', 'goldhands'],
  'espionage': ['sleuths', 'warlords'],
  'spy': ['sleuths'],
  'crime': ['sleuths'],
  'puzzle': ['sleuths', 'thinkers'],
  'riddle': ['sleuths', 'veilwalkers'],
  'secret': ['sleuths', 'veilwalkers'],
  'hidden': ['sleuths', 'veilwalkers'],
  'ancient': ['veilwalkers', 'stargazers', 'thinkers'],
  'classical': ['thinkers', 'heartstrings'],
  'renaissance': ['makers', 'heartstrings'],
  'medieval': ['veilwalkers', 'warlords'],
  'modern': ['makers', 'goldhands'],
  'contemporary': ['makers', 'goldhands']
};

const ORACLE_PROMPTS = [
  "Who do you want to talk to?",
  "Seek wisdom from...",
  "Which guide calls to you?",
  "Who would you counsel with?",
  "Find your mentor...",
];

// Category representatives - most famous face for each category
const categoryRepresentatives = {
  'sleuths': '/images/sherlock.jpg',
  'stargazers': '/images/nostradamus.jpg',
  'truthweavers': '/images/dante.jpg',
  'veilwalkers': '/images/rasputin.jpg',
  'goldhands': '/images/mansa_musa.jpg',
  'heartstrings': '/images/shakespeare.jpg',
  'thinkers': '/images/socrates.jpg',
  'makers': '/images/da_vinci.jpg',
  'warlords': '/images/sun_tzu.jpg',
  'pathfinders': '/images/christopher_columbus.jpg',
  'performers': '/images/harry_houdini.jpg',
  'my_characters': '/images/default-character.jpg'
};

// ============================================================================
// MY CHARACTERS PANEL COMPONENTS - Subscription State Aware
// ============================================================================

const MyCharactersFreeUser = ({ onStartTrial, isMobile, hasSubmittedCharacter }) => (
  <div style={{
    maxWidth: isMobile ? '400px' : '500px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: isMobile ? '1.5rem' : '2rem'
  }}>
    {/* Hero Icon */}
    <div style={{
      width: isMobile ? '80px' : '120px',
      height: isMobile ? '80px' : '120px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
      border: '3px solid rgba(255, 215, 0, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: isMobile ? '32px' : '48px',
      marginBottom: isMobile ? '0' : '1rem'
    }}>
      ✨
    </div>

    {/* Headline */}
    <div style={{ textAlign: 'center' }}>
      <h3 style={{
        color: '#FFD700',
        fontSize: isMobile ? '1.4rem' : '1.8rem',
        fontFamily: "'Playfair Display', serif",
        textTransform: 'none',
        margin: '0 0 0.8rem 0',
        letterSpacing: '1px',
        textShadow: '0 0 15px rgba(255, 215, 0, 0.5)'
      }}>
        Create Your Own Character
      </h3>
      
      <p style={{
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: isMobile ? '0.9rem' : '1.1rem',
        lineHeight: 1.6,
        margin: '0 0 1.5rem 0',
        maxWidth: isMobile ? '300px' : '400px'
      }}>
        Design a custom AI character with unique personality, expertise, and backstory.
        {!isMobile && " From historical figures to original creations - bring your vision to life."}
      </p>
    </div>

    {/* Features List */}
    <div style={{
      display: isMobile ? 'flex' : 'grid',
      flexDirection: isMobile ? 'column' : 'row',
      gridTemplateColumns: isMobile ? 'none' : 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: isMobile ? '0.8rem' : '1rem',
      width: '100%',
      marginBottom: '1.5rem'
    }}>
      {[
        { icon: '🎭', title: 'Custom Personality', desc: isMobile ? undefined : 'Define unique traits and speaking style' },
        { icon: '📚', title: 'Expert Knowledge', desc: isMobile ? undefined : 'Specialized in any domain you choose' },
        { icon: '🏛️', title: 'Historical Context', desc: isMobile ? undefined : 'Set in any time period or culture' }
      ].map((feature, index) => (
        <div key={index} style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: isMobile ? '8px' : '12px',
          padding: isMobile ? '0.8rem' : '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.8rem' : '0',
          flexDirection: isMobile ? 'row' : 'column',
          textAlign: isMobile ? 'left' : 'center'
        }}>
          <div style={{ fontSize: isMobile ? '1.2rem' : '2rem', marginBottom: isMobile ? '0' : '0.5rem' }}>
            {feature.icon}
          </div>
          <div>
            <h4 style={{
              color: '#FFD700',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              margin: '0 0 0.5rem 0',
              fontWeight: 600
            }}>
              {feature.title}
            </h4>
            {!isMobile && feature.desc && (
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.8rem',
                margin: 0,
                lineHeight: 1.4
              }}>
                {feature.desc}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>

    {/* CTA Buttons */}
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '0.8rem' : '1rem',
      width: isMobile ? '100%' : 'auto'
    }}>
      <button
        onClick={onStartTrial}
        disabled={hasSubmittedCharacter}
        style={{
          background: hasSubmittedCharacter 
            ? 'rgba(128, 128, 128, 0.3)' 
            : 'linear-gradient(135deg, #FFD700, #FFA500)',
          border: 'none',
          borderRadius: isMobile ? '20px' : '25px',
          color: hasSubmittedCharacter ? 'rgba(255, 255, 255, 0.5)' : '#000',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: 700,
          padding: isMobile ? '0.8rem 1.5rem' : '1rem 2rem',
          cursor: hasSubmittedCharacter ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          fontFamily: "'Georgia', serif",
          textTransform: 'none',
          boxShadow: hasSubmittedCharacter ? 'none' : '0 4px 15px rgba(255, 215, 0, 0.3)',
          width: isMobile ? '100%' : 'auto',
          opacity: hasSubmittedCharacter ? 0.6 : 1
        }}
      >
        {hasSubmittedCharacter 
          ? 'Character Pending Approval' 
          : 'Start 3-Day Free Trial'
        }
      </button>
      
      <button
        style={{
          background: 'transparent',
          border: '2px solid rgba(255, 215, 0, 0.5)',
          borderRadius: isMobile ? '20px' : '25px',
          color: '#FFD700',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: 600,
          padding: isMobile ? '0.8rem 1.5rem' : '1rem 2rem',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          fontFamily: "'Georgia', serif",
          textTransform: 'none',
          width: isMobile ? '100%' : 'auto'
        }}
      >
        Learn More
      </button>
    </div>

    {/* Trust Indicator */}
    <p style={{
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: isMobile ? '0.75rem' : '0.85rem',
      margin: '0.5rem 0 0 0',
      fontStyle: 'italic'
    }}>
      No credit card required • Cancel anytime
    </p>
  </div>
);

const MyCharactersPendingApproval = ({ characters, isMobile }) => (
  <div style={{
    maxWidth: isMobile ? '400px' : '500px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    textAlign: 'center'
  }}>
    <div style={{
      width: isMobile ? '80px' : '100px',
      height: isMobile ? '80px' : '100px',
      borderRadius: '50%',
      background: 'rgba(255, 165, 0, 0.1)',
      border: '2px solid rgba(255, 165, 0, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: isMobile ? '32px' : '40px'
    }}>
      ⏳
    </div>

    <div>
      <h3 style={{
        color: '#FFA500',
        fontSize: isMobile ? '1.3rem' : '1.5rem',
        margin: '0 0 1rem 0',
        fontFamily: "'Playfair Display', serif",
        textTransform: 'none'
      }}>
        Character Under Review
      </h3>
      
      <p style={{
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: isMobile ? '0.9rem' : '1rem',
        lineHeight: 1.6,
        margin: '0 0 1.5rem 0'
      }}>
        <strong>{characters[0]?.display_name}</strong> is being reviewed by our team. 
        You'll receive an email when it's approved (usually within 24-48 hours).
      </p>
    </div>

    {characters.map((character, index) => (
      <div key={index} style={{
        background: 'rgba(255, 165, 0, 0.05)',
        border: '1px solid rgba(255, 165, 0, 0.3)',
        borderRadius: '12px',
        padding: '1rem',
        width: '100%',
        maxWidth: '350px'
      }}>
        <h4 style={{
          color: '#FFA500',
          fontSize: '1rem',
          margin: '0 0 0.5rem 0'
        }}>
          {character.display_name}
        </h4>
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.85rem',
          margin: 0,
          lineHeight: 1.4
        }}>
          {character.short_description}
        </p>
      </div>
    ))}

    <p style={{
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: '0.8rem',
      margin: 0
    }}>
      We'll email you as soon as it's ready!
    </p>
  </div>
);

const MyCharactersTrialActive = ({ characters, onCreateCharacter, canCreate, daysRemaining, isMobile }) => (
  <div style={{
    maxWidth: isMobile ? '400px' : '500px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem'
  }}>
    {characters.length === 0 ? (
      // No characters yet - show creation flow
      <>
        <div style={{
          width: isMobile ? '80px' : '100px',
          height: isMobile ? '80px' : '100px',
          borderRadius: '50%',
          background: 'rgba(255, 215, 0, 0.1)',
          border: '2px solid rgba(255, 215, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '32px' : '40px'
        }}>
          🎨
        </div>

        <div style={{ textAlign: 'center' }}>
          <h3 style={{
            color: '#FFD700',
            fontSize: isMobile ? '1.3rem' : '1.5rem',
            margin: '0 0 1rem 0',
            fontFamily: "'Playfair Display', serif",
            textTransform: 'none'
          }}>
            Trial Active - Create Your Character!
          </h3>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: isMobile ? '0.9rem' : '1rem',
            lineHeight: 1.6,
            margin: '0 0 1rem 0'
          }}>
            Your 3-day trial is active{daysRemaining ? ` (${daysRemaining} days remaining)` : ''}. 
            Create your custom character now!
          </p>

          {daysRemaining && daysRemaining <= 1 && (
            <div style={{
              background: 'rgba(255, 165, 0, 0.1)',
              border: '1px solid rgba(255, 165, 0, 0.3)',
              borderRadius: '8px',
              padding: '0.75rem',
              margin: '0 0 1rem 0'
            }}>
              <p style={{
                color: '#FFA500',
                fontSize: '0.85rem',
                margin: 0,
                fontWeight: 600
              }}>
                Trial expires soon! Create your character to keep access.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onCreateCharacter}
          disabled={!canCreate}
          style={{
            background: canCreate 
              ? 'linear-gradient(135deg, #FFD700, #FFA500)' 
              : 'rgba(128, 128, 128, 0.3)',
            border: 'none',
            borderRadius: isMobile ? '20px' : '25px',
            color: canCreate ? '#000' : 'rgba(255, 255, 255, 0.5)',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: 700,
            padding: isMobile ? '0.8rem 1.5rem' : '1rem 2rem',
            cursor: canCreate ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            fontFamily: "'Georgia', serif",
            textTransform: 'none',
            boxShadow: canCreate ? '0 4px 15px rgba(255, 215, 0, 0.3)' : 'none',
            opacity: canCreate ? 1 : 0.6
          }}
        >
          Create Your Character
        </button>
      </>
    ) : (
      // Has characters - show them
      <div style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(1, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem'
      }}>
        {characters.map((character, index) => (
          <div key={index} style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '16px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <h4 style={{
              color: '#FFD700',
              fontSize: '1rem',
              margin: '0 0 0.5rem 0'
            }}>
              {character.display_name}
            </h4>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.85rem',
              margin: 0,
              lineHeight: 1.4
            }}>
              {character.short_description}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
);

const MyCharactersExpiredTrial = ({ characters, onUpgrade, isMobile }) => (
  <div style={{
    maxWidth: isMobile ? '400px' : '500px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    textAlign: 'center'
  }}>
    <div style={{
      width: isMobile ? '80px' : '100px',
      height: isMobile ? '80px' : '100px',
      borderRadius: '50%',
      background: 'rgba(255, 165, 0, 0.1)',
      border: '2px solid rgba(255, 165, 0, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: isMobile ? '32px' : '40px'
    }}>
      ⭐
    </div>

    <div>
      <h3 style={{
        color: '#FFA500',
        fontSize: isMobile ? '1.3rem' : '1.5rem',
        margin: '0 0 1rem 0',
        fontFamily: "'Playfair Display', serif",
        textTransform: 'none'
      }}>
        Continue Your Journey
      </h3>
      
      <p style={{
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: isMobile ? '0.9rem' : '1rem',
        lineHeight: 1.6,
        margin: '0 0 1.5rem 0'
      }}>
        Your trial has ended, but <strong>{characters[0]?.display_name}</strong> is waiting for you! 
        Subscribe to continue chatting with your custom character.
      </p>
    </div>

    <button
      onClick={onUpgrade}
      style={{
        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
        border: 'none',
        borderRadius: isMobile ? '20px' : '25px',
        color: '#000',
        fontSize: isMobile ? '0.9rem' : '1rem',
        fontWeight: 700,
        padding: isMobile ? '0.8rem 1.5rem' : '1rem 2rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: "'Georgia', serif",
        textTransform: 'none',
        boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
      }}
    >
      Upgrade to Premium
    </button>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SplitScreenLauncher = ({ onStartChat }) => {
  const { token } = useAuth();
  const { user } = useUser();
  
  // NEW: Use enhanced premium capabilities
  const {
    subscriptionState,
    canCreateCharacter,
    should_show_trial_prompt: shouldShowTrial,
    should_show_upgrade: shouldShowUpgrade,
    daysRemaining,
    isInitialized,
    loading: capabilitiesLoading,
    error: capabilitiesError
  } = usePremiumCapabilitiesContext();

  // NEW: Use simplified character hook (no premium gating)
  const {
    userCharacters,
    approvedCharacters,
    pendingCharacters,
    characterTemplates,
    createCharacter,
    loading: charactersLoading
  } = usePremiumCharacters();

  // Existing hooks
  const { 
    recentCharacters,
    shouldShowForYou,
    trackInteraction,
    hasActiveConversations 
  } = useInteractedCharacters();

  // Legacy flow for modals (transition period)
  //const {
    //showTemplateGallery,
    //showCharacterBuilder,
    //selectedTemplate,
    //startTemplateFlow,
    //successData
  //} = useSimplifiedPremiumFlow();


  // Local state
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedChar, setSelectedChar] = useState(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Success modal check
  //if (successData) {
    //return (
      //<div style={{
        //position: 'fixed',
        //top: 0,
        //left: 0,
        //width: '100%',
        //height: '100%',
        //zIndex: 4000,
        //background: 'rgba(0, 0, 0, 0.95)'
      //}}>
      //  <CharacterCreationSuccess />
    //  </div>
  //  );
//  }

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Rotate placeholder text
  useEffect(() => {
    const interval = setInterval(
      () => setPlaceholderIndex(prev => (prev + 1) % ORACLE_PROMPTS.length),
      4000
    );
    return () => clearInterval(interval);
  }, []);

  // Enhanced categories with My Characters integration
  const enhancedCategories = useMemo(() => {
    const allCategories = [...characterCategories];
    
    const myCharIndex = allCategories.findIndex(cat => cat.key === 'my_characters');

    if (myCharIndex !== -1) {
      allCategories[myCharIndex] = {
        ...allCategories[myCharIndex],
        characters: approvedCharacters.map(char => ({
          key: char.character_key,
          name: char.display_name,
          description: char.short_description,
          thumbnailUrl: char.avatar_url || char.thumbnailUrl || '/images/default-character.jpg'
        }))
      };
    }

    return allCategories;
  }, [approvedCharacters]);

  // Computed properties for UI logic
  const hasSubmittedCharacter = useMemo(() => {
    if (!user?.id) return false;
    return localStorage.getItem(`pending_submission_${user.id}`) === 'true';
  }, [user?.id]);

  // Search function
  const performSemanticSearch = useMemo(() => {
    return (query) => {
      if (!query.trim()) return [];
      const searchTerm = query.toLowerCase().trim();
      const results = [];

      enhancedCategories.forEach(category => {
        category.characters.forEach(character => {
          const nameMatch = character.name.toLowerCase().includes(searchTerm);
          const descMatch = character.description.toLowerCase().includes(searchTerm);
          const nameParts = character.name.toLowerCase().split(' ');
          const partialNameMatch = nameParts.some(part =>
            part.includes(searchTerm) || searchTerm.includes(part)
          );

          if (nameMatch || descMatch || partialNameMatch) {
            results.push({
              ...character,
              category: category.title,
              categoryKey: category.key,
              relevance: nameMatch ? 100 : (partialNameMatch ? 90 : 80)
            });
          }
        });
      });
      
      return results.sort((a, b) => b.relevance - a.relevance).slice(0, 8);
    };
  }, [enhancedCategories]);

  // Event handlers
  const handleInputChange = (text) => {
    setInputValue(text);
    if (text.length >= 2) {
      const results = performSemanticSearch(text);
      setSearchResults(results);
      setShowResults(true);
    } else {
      setShowResults(false);
      setSearchResults([]);
    }
  };

  const handleCharacterSelect = (character) => {
    trackInteraction(character.key);
    setSelectedChar({
      key: character.key,
      name: character.name,
      thumbnailUrl: character.thumbnailUrl,
      description: character.description,
      category: character.category
    });
  };

  const handleRecentCharacterSelect = (recentCharacter) => {
    trackInteraction(recentCharacter.character);
    onStartChat(recentCharacter.character);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowResults(false);
    setInputValue('');
  };

  const handleBackToCategories = () => setSelectedCategory(null);

  // Premium action handlers using new architecture
  const handleStartTrial = () => {
    console.log('Starting trial via new capabilities flow');
    startTemplateFlow(); // Still uses legacy flow during transition
  };

  const handleCreateCharacter = () => {
    console.log('Creating character via new capabilities flow');
    startTemplateFlow(); // Still uses legacy flow during transition
  };

  const handleUpgrade = () => {
    console.log('Upgrade flow triggered');
    // TODO: Implement upgrade flow
    window.location.href = '/upgrade';
  };

  const currentPlaceholder = ORACLE_PROMPTS[placeholderIndex];

  // Loading states
  if (!isInitialized || capabilitiesLoading) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
        fontFamily: "'Georgia', serif"
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 215, 0, 0.3)',
            borderTop: '3px solid #FFD700',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{
            color: 'rgba(255, 215, 0, 0.8)',
            fontSize: '1rem',
            margin: 0
          }}>
            Loading your premium status...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (capabilitiesError) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
        fontFamily: "'Georgia', serif"
      }}>
        <div style={{
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <h3 style={{
            color: '#ff6b6b',
            margin: '0 0 1rem 0'
          }}>
            Unable to Load Premium Features
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            margin: '0 0 1rem 0'
          }}>
            {capabilitiesError}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'rgba(255, 215, 0, 0.2)',
              border: '2px solid rgba(255, 215, 0, 0.4)',
              borderRadius: '8px',
              color: '#FFD700',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        padding: '1rem',
        fontFamily: "'Georgia', serif",
        textTransform: 'none',
        background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* Debug Info for Testing */}
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 255, 0, 0.8)',
          color: '#000',
          padding: '0.5rem',
          borderRadius: '4px',
          fontSize: '0.7rem',
          zIndex: 9999,
          fontFamily: 'monospace'
        }}>
          State: {subscriptionState} | Action: {primaryAction}
        </div>

        {/* Welcome Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          width: '100%',
          maxWidth: '500px',
        }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            textTransform: 'none',
            fontSize: '1.8rem',
            background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            margin: '0 0 1rem 0',
            textShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
            letterSpacing: '1px',
            fontWeight: 700
          }}>
            Welcome, {user?.displayName || 'Seeker'}
          </h1>
          
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255, 215, 0, 0.8)',
            fontStyle: 'italic',
            letterSpacing: '0.5px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
            margin: 0,
            transition: 'opacity 0.5s ease',
            opacity: showResults ? 0.5 : 1
          }}>
            {currentPlaceholder}
          </p>
        </div>

        {/* Search Section */}
        <div style={{
          width: '100%',
          maxWidth: '500px',
          position: 'relative',
          marginBottom: '1rem'
        }}>
          <input
            type="text"
            placeholder="Search characters..."
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => inputValue.length >= 2 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '25px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#FFD700',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              fontFamily: "'Georgia', serif",
              textTransform: 'none'
            }}
          />

          {/* Search Results */}
          {showResults && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: '300px',
              overflowY: 'auto',
              background: 'rgba(11, 20, 38, 0.95)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '15px',
              backdropFilter: 'blur(20px)',
              padding: '1rem',
              marginTop: '0.5rem',
              zIndex: 1000
            }}>
              {searchResults.map((character, index) => (
                <div
                  key={character.key}
                  onClick={() => handleCharacterSelect(character)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    marginBottom: index < searchResults.length - 1 ? '0.5rem' : 0
                  }}
                >
                  <img
                    src={character.thumbnailUrl}
                    alt={character.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(255, 215, 0, 0.3)'
                    }}
                    onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#FFD700',
                      marginBottom: '0.25rem'
                    }}>
                      {character.name}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 215, 0, 0.7)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {character.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showResults && searchResults.length === 0 && inputValue.length >= 2 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'rgba(11, 20, 38, 0.95)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '15px',
              backdropFilter: 'blur(20px)',
              padding: '1rem',
              marginTop: '0.5rem',
              textAlign: 'center',
              zIndex: 1000
            }}>
              <p style={{
                color: 'rgba(255, 215, 0, 0.8)',
                margin: '0 0 0.5rem 0',
                fontSize: '1rem'
              }}>
                No matches for "{inputValue}"
              </p>
              <small style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.85rem'
              }}>
                Try searching for character names or themes
              </small>
            </div>
          )}
        </div>

        {/* Personalized Section (Mobile) */}
        {shouldShowForYou && (
          <PersonalizedSection 
            characters={recentCharacters}
            onCharacterSelect={handleRecentCharacterSelect}
            hasActiveConversations={hasActiveConversations}
            isMobile={true}
          />
        )}

        {/* Categories or Characters View */}
        {!selectedCategory ? (
          <div style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
            marginTop: '1rem',
          }}>
            {enhancedCategories.map((category) => (
              <div
                key={category.key}
                onClick={() => handleCategorySelect(category)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '16px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  aspectRatio: '1',
                }}
              >
                {/* Mobile Category Avatar Display */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  marginBottom: '0.7rem',
                  border: '3px solid rgba(255, 215, 0, 0.4)',
                  transition: 'all 0.3s ease',
                  background: 'rgba(0,0,0,0.3)',
                  position: 'relative'
                }}>
                  {category.key === 'my_characters' ? (
                    charactersLoading ? (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid rgba(255, 215, 0, 0.3)',
                          borderTop: '2px solid #FFD700',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                      </div>
                    ) : approvedCharacters.length > 0 ? (
                      <img
                        src={approvedCharacters[0].thumbnailUrl || '/images/default-character.jpg'}
                        alt="My Character"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: 'sepia(20%) contrast(1.1)',
                          transition: 'filter 0.3s ease'
                        }}
                        onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        color: '#FFD700'
                      }}>
                        👤
                      </div>
                    )
                  ) : (
                    <img
                      src={categoryRepresentatives[category.key]}
                      alt={category.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'sepia(20%) contrast(1.1)',
                        transition: 'filter 0.3s ease'
                      }}
                      onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                    />
                  )}
                </div>
                
                {/* Mobile Category Title */}
                <h3 style={{
                  color: '#FFD700',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  margin: '0 0 0.3rem 0',
                  letterSpacing: '0.5px',
                  fontFamily: "'Georgia', serif",
                  textTransform: 'none',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  lineHeight: 1.1
                }}>
                  {category.title}
                </h3>
                
                {/* Mobile Category Badge */}
                <span style={{
                  color: 'rgba(255, 215, 0, 0.7)',
                  fontSize: '0.65rem',
                  background: 'rgba(255, 215, 0, 0.1)',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 215, 0, 0.2)'
                }}>
                  {category.key === 'my_characters' 
                    ? (charactersLoading ? 'Loading...' : 
                       approvedCharacters.length > 0 ? `${approvedCharacters.length} custom` : 'Create')
                    : `${category.characters.length} guides`
                  }
                </span>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Category Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              maxWidth: '500px',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(255, 215, 0, 0.3)'
            }}>
              <h2 style={{
                color: '#FFD700',
                fontSize: '1.5rem',
                fontFamily: "'Playfair Display', serif",
                textTransform: 'none',
                margin: 0,
                letterSpacing: '1px',
                textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
              }}>
                {selectedCategory.title}
              </h2>
              
              <button
                onClick={handleBackToCategories}
                style={{
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: '6px',
                  color: '#FFD700',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.3rem 0.8rem',
                  cursor: 'pointer',
                  fontFamily: "'Georgia', serif",
                  textTransform: 'none'
                }}
              >
                ← Back
              </button>
            </div>

            {/* Mobile Characters Content Area */}
            {selectedCategory.key === 'my_characters' ? (
              // My Characters Panel - Mobile Version with State-Aware Rendering
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px',
                textAlign: 'center',
                padding: '1rem',
                width: '100%'
              }}>
                <PremiumStateRenderer
                  freeComponent={
                    <MyCharactersFreeUser 
                      onStartTrial={handleStartTrial}
                      isMobile={true}
                      hasSubmittedCharacter={hasSubmittedCharacter}
                    />
                  }
                  trialActiveComponent={
                    <MyCharactersTrialActive
                      characters={userCharacters}
                      onCreateCharacter={handleCreateCharacter}
                      canCreate={canCreateCharacter}
                      daysRemaining={daysRemaining}
                      isMobile={true}
                    />
                  }
                  trialExpiredComponent={
                    <MyCharactersExpiredTrial
                      characters={approvedCharacters}
                      onUpgrade={handleUpgrade}
                      isMobile={true}
                    />
                  }
                  premiumActiveComponent={
                    <MyCharactersTrialActive
                      characters={userCharacters}
                      onCreateCharacter={handleCreateCharacter}
                      canCreate={canCreateCharacter}
                      daysRemaining={null}
                      isMobile={true}
                    />
                  }
                  premiumExpiredComponent={
                    <MyCharactersExpiredTrial
                      characters={approvedCharacters}
                      onUpgrade={handleUpgrade}
                      isMobile={true}
                    />
                  }
                  pendingApprovalComponent={
                    <MyCharactersPendingApproval
                      characters={pendingCharacters}
                      isMobile={true}
                    />
                  }
                  loadingComponent={
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid rgba(255, 215, 0, 0.3)',
                        borderTop: '3px solid #FFD700',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <p style={{
                        color: 'rgba(255, 215, 0, 0.8)',
                        fontSize: '1rem',
                        margin: 0
                      }}>
                        Loading your characters...
                      </p>
                    </div>
                  }
                />
              </div>
            ) : (
              // Regular Categories - Mobile Characters Grid
              <div style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                marginTop: '1rem',
              }}>
                {selectedCategory.characters.map((character) => (
                  <div
                    key={character.key}
                    onClick={() => handleCharacterSelect(character)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 215, 0, 0.2)',
                      borderRadius: '16px',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minHeight: '180px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      marginBottom: '0.5rem',
                      border: '2px solid rgba(255, 215, 0, 0.3)',
                    }}>
                      <img
                        src={character.thumbnailUrl}
                        alt={character.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                      />
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{
                        color: '#FFD700',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        margin: '0 0 0.3rem 0',
                        letterSpacing: '0.5px',
                        lineHeight: 1.2
                      }}>
                        {character.name}
                      </h3>
                      
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.85)',
                        fontSize: '0.65rem',
                        lineHeight: 1.3,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {character.description.slice(0, 80)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Character Detail Modal (Mobile) */}
        {selectedChar && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(11, 20, 38, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '16px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '400px',
              backdropFilter: 'blur(20px)',
              textAlign: 'center',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <img
                src={selectedChar.thumbnailUrl}
                alt={selectedChar.name}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid rgba(255, 215, 0, 0.4)',
                  marginBottom: '1rem'
                }}
                onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
              />
              
              <h2 style={{
                color: '#FFD700',
                fontSize: '1.3rem',
                fontWeight: 600,
                margin: '0 0 0.5rem 0',
                letterSpacing: '1px'
              }}>
                {selectedChar.name}
              </h2>
              
              <p style={{
                color: 'rgba(255, 215, 0, 0.7)',
                fontSize: '0.8rem',
                textTransform: 'none',
                letterSpacing: '0.5px',
                margin: '0 0 1rem 0'
              }}>
                {selectedChar.category}
              </p>
              
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                margin: '0 0 1.5rem 0'
              }}>
                {selectedChar.description}
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    trackInteraction(selectedChar.key);
                    onStartChat(selectedChar.key);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
                    border: '2px solid rgba(255, 215, 0, 0.5)',
                    borderRadius: '8px',
                    color: '#FFD700',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    padding: '0.6rem 1.2rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Georgia', serif",
                    textTransform: 'none',
                  }}
                >
                  Start Chat
                </button>
                <button
                  onClick={() => setSelectedChar(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    padding: '0.6rem 1.2rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Georgia', serif",
                    textTransform: 'none'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Template Gallery Modal for Mobile */}
        {showTemplateGallery && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 3000,
            background: 'rgba(0, 0, 0, 0.95)',
            overflowY: 'auto'
          }}>
            <TemplateGallery />
          </div>
        )}

        {/* Character Builder Modal for Mobile */}
        {showCharacterBuilder && selectedTemplate && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 3000,
            background: 'rgba(0, 0, 0, 0.95)'
          }}>
            <CharacterBuilder />
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  // Desktop layout will be similar but with proper desktop responsiveness
  // Desktop layout
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      fontFamily: "'Georgia', serif",
      textTransform: 'none',
      background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
      overflow: 'hidden'
    }}>
      {/* Debug Info for Testing */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 255, 0, 0.8)',
        color: '#000',
        padding: '0.5rem',
        borderRadius: '4px',
        fontSize: '0.7rem',
        zIndex: 9999,
        fontFamily: 'monospace'
      }}>
        State: {subscriptionState} | Action: {primaryAction}
      </div>

      {/* LEFT HALF - Search Section */}
      <div style={{
        width: '50%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: '4rem 2rem 2rem 2rem',
        position: 'relative',
        borderRight: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        {/* Welcome Section */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            textTransform: 'none',
            fontSize: '2.5rem',
            background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            margin: '0 0 1rem 0',
            textShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
            letterSpacing: '2px',
            fontWeight: 700
          }}>
            Welcome, {user?.displayName || 'Seeker'}
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: 'rgba(255, 215, 0, 0.8)',
            fontStyle: 'italic',
            letterSpacing: '1px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
            margin: 0,
            transition: 'opacity 0.5s ease',
            opacity: showResults ? 0.5 : 1
          }}>
            {currentPlaceholder}
          </p>
        </div>

        {/* Search Section */}
        <div style={{ width: '100%', maxWidth: '400px', position: 'relative', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search characters..."
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => inputValue.length >= 2 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              fontSize: '1.1rem',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '25px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#FFD700',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              fontFamily: "'Georgia', serif",
              textTransform: 'none'
            }}
          />

          {/* Search Results */}
          {showResults && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: '300px',
              overflowY: 'auto',
              background: 'rgba(11, 20, 38, 0.95)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '15px',
              backdropFilter: 'blur(20px)',
              padding: '1rem',
              marginTop: '0.5rem',
              zIndex: 1000
            }}>
              {searchResults.map((character, index) => (
                <div
                  key={character.key}
                  onClick={() => handleCharacterSelect(character)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    marginBottom: index < searchResults.length - 1 ? '0.5rem' : 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
                  }}
                >
                  <img
                    src={character.thumbnailUrl}
                    alt={character.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(255, 215, 0, 0.3)'
                    }}
                    onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFD700', marginBottom: '0.25rem' }}>
                      {character.name}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 215, 0, 0.7)',
                      textTransform: 'none',
                      letterSpacing: '0.5px'
                    }}>
                      {character.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showResults && searchResults.length === 0 && inputValue.length >= 2 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'rgba(11, 20, 38, 0.95)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '15px',
              backdropFilter: 'blur(20px)',
              padding: '1rem',
              marginTop: '0.5rem',
              textAlign: 'center',
              zIndex: 1000
            }}>
              <p style={{
                color: 'rgba(255, 215, 0, 0.8)',
                margin: '0 0 0.5rem 0',
                fontSize: '1rem'
              }}>
                No matches for "{inputValue}"
              </p>
              <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                Try searching for character names or themes
              </small>
            </div>
          )}
        </div>

        {/* Personalized Section (Desktop) */}
        {shouldShowForYou && (
          <PersonalizedSection 
            characters={recentCharacters}
            onCharacterSelect={handleRecentCharacterSelect}
            hasActiveConversations={hasActiveConversations}
            isMobile={false}
          />
        )}
      </div>

      {/* RIGHT HALF - Categories/Characters */}
      <div style={{ width: '50%', height: '100%', position: 'relative', perspective: '1000px' }}>

        {/* Categories Grid - Dynamic Viewport Sizing */}
        <div 
          className="categories-grid-container"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            padding: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(4, 1fr)',
            gap: '1rem',
            alignContent: 'start',
            justifyContent: 'center',
            transform: selectedCategory ? 'rotateY(-90deg)' : 'rotateY(0deg)',
            transition: 'transform 0.6s ease-in-out',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            overflowY: 'auto',
            overflowX: 'hidden',
            maxHeight: '100%',
            paddingRight: '2.5rem'
          }}
        >
          {enhancedCategories.map((category, index) => (
            <div
              key={category.key}
              onClick={() => handleCategorySelect(category)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                borderRadius: '16px',
                padding: '1.5rem',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                aspectRatio: '1',
                opacity: 0,
                animation: `categorySlideIn 0.6s ease-out ${index * 0.1}s forwards`,
                minHeight: '150px',
                maxHeight: '200px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.6)';
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 215, 0, 0.2)';
                const img = e.currentTarget.querySelector('img');
                if (img) {
                  img.style.filter = 'sepia(0%) contrast(1.2) brightness(1.1)';
                  img.parentElement.style.borderColor = 'rgba(255, 215, 0, 0.8)';
                  img.parentElement.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                const img = e.currentTarget.querySelector('img');
                if (img) {
                  img.style.filter = 'sepia(20%) contrast(1.1)';
                  img.parentElement.style.borderColor = 'rgba(255, 215, 0, 0.4)';
                  img.parentElement.style.boxShadow = 'none';
                }
              }}
            >
              {/* Desktop Category Avatar Display */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                overflow: 'hidden',
                marginBottom: '0.7rem',
                border: '3px solid rgba(255, 215, 0, 0.4)',
                transition: 'all 0.3s ease',
                background: 'rgba(0,0,0,0.3)',
                position: 'relative'
              }}>
                {/* Avatar content */}
                {category.key === 'my_characters' ? (
                  charactersLoading ? (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid rgba(255, 215, 0, 0.3)',
                        borderTop: '2px solid #FFD700',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    </div>
                  ) : approvedCharacters.length > 0 ? (
                    <img
                      src={approvedCharacters[0].thumbnailUrl || '/images/default-character.jpg'}
                      alt="My Character"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'sepia(20%) contrast(1.1)',
                        transition: 'filter 0.3s ease'
                      }}
                      onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      color: '#FFD700'
                    }}>
                      👤
                    </div>
                  )
                ) : (
                  <img
                    src={categoryRepresentatives[category.key]}
                    alt={category.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'sepia(20%) contrast(1.1)',
                      transition: 'filter 0.3s ease'
                    }}
                    onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                  />
                )}
              </div>
              
              {/* Desktop Category Title */}
              <h3 style={{
                color: '#FFD700',
                fontSize: '0.9rem',
                fontWeight: 600,
                margin: '0 0 0.3rem 0',
                letterSpacing: '0.5px',
                fontFamily: "'Georgia', serif",
                textTransform: 'none',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                lineHeight: 1.1
              }}>
                {category.title}
              </h3>
              
              {/* Desktop Category Badge */}
              <span style={{
                color: 'rgba(255, 215, 0, 0.7)',
                fontSize: '0.65rem',
                background: 'rgba(255, 215, 0, 0.1)',
                padding: '0.15rem 0.4rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 215, 0, 0.2)'
              }}>
                {category.key === 'my_characters' 
                  ? (charactersLoading ? 'Loading...' : 
                     approvedCharacters.length > 0 ? `${approvedCharacters.length} custom` : 'Create')
                  : `${category.characters.length} guides`
                }
              </span>
            </div>
          ))}
        </div>

        {/* Characters Panel */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          padding: '2rem',
          transform: selectedCategory ? 'rotateY(0deg)' : 'rotateY(90deg)',
          transition: 'transform 0.6s ease-in-out',
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          overflowY: 'auto'
        }} className="character-panel">
          {selectedCategory && (
            <>
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '2px solid rgba(255, 215, 0, 0.3)'
              }}>
                <h2 style={{
                  color: '#FFD700',
                  fontSize: '2rem',
                  fontFamily: "'Playfair Display', serif",
                  textTransform: 'none',
                  margin: 0,
                  letterSpacing: '2px',
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
                }}>
                  {selectedCategory.title}
                </h2>
                
                <button
                  onClick={handleBackToCategories}
                  style={{
                    background: 'rgba(255, 215, 0, 0.1)',
                    border: '2px solid rgba(255, 215, 0, 0.4)',
                    borderRadius: '8px',
                    color: '#FFD700',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Georgia', serif",
                    textTransform: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.4)';
                  }}
                >
                  ← Back
                </button>
              </div>

              {/* Desktop Content Area */}
              {selectedCategory.key === 'my_characters' ? (
                // Desktop: My Characters Special Panel
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '400px',
                  textAlign: 'center',
                  padding: '2rem'
                }}>
                  <PremiumStateRenderer
                    freeComponent={
                      <MyCharactersFreeUser 
                        onStartTrial={handleStartTrial}
                        isMobile={false}
                        hasSubmittedCharacter={hasSubmittedCharacter}
                      />
                    }
                    trialActiveComponent={
                      <MyCharactersTrialActive
                        characters={userCharacters}
                        onCreateCharacter={handleCreateCharacter}
                        canCreate={canCreateCharacter}
                        daysRemaining={daysRemaining}
                        isMobile={false}
                      />
                    }
                    trialExpiredComponent={
                      <MyCharactersExpiredTrial
                        characters={approvedCharacters}
                        onUpgrade={handleUpgrade}
                        isMobile={false}
                      />
                    }
                    premiumActiveComponent={
                      <MyCharactersTrialActive
                        characters={userCharacters}
                        onCreateCharacter={handleCreateCharacter}
                        canCreate={canCreateCharacter}
                        daysRemaining={null}
                        isMobile={false}
                      />
                    }
                    premiumExpiredComponent={
                      <MyCharactersExpiredTrial
                        characters={approvedCharacters}
                        onUpgrade={handleUpgrade}
                        isMobile={false}
                      />
                    }
                    pendingApprovalComponent={
                      <MyCharactersPendingApproval
                        characters={pendingCharacters}
                        isMobile={false}
                      />
                    }
                    loadingComponent={
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          border: '3px solid rgba(255, 215, 0, 0.3)',
                          borderTop: '3px solid #FFD700',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        <p style={{
                          color: 'rgba(255, 215, 0, 0.8)',
                          fontSize: '1.1rem',
                          margin: 0
                        }}>
                          Loading your characters...
                        </p>
                      </div>
                    }
                  />
                </div>
              ) : (
                // Regular Categories - Desktop Characters Grid
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`,
                  gap: '1rem',
                  maxHeight: 'calc(100vh - 200px)',
                  overflowY: 'auto',
                  paddingRight: '0.5rem'
                }}>
                  {selectedCategory.characters.map((character, index) => (
                    <div
                      key={character.key}
                      onClick={() => handleCharacterSelect(character)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 215, 0, 0.2)',
                        borderRadius: '16px',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: 0,
                        animation: `characterSlideIn 0.6s ease-out ${index * 0.05}s forwards`,
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                        e.currentTarget.style.transform = 'translateY(-6px)';
                        e.currentTarget.style.boxShadow = '0 16px 32px rgba(255, 215, 0, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        marginBottom: '0.75rem',
                        border: '3px solid rgba(255, 215, 0, 0.3)',
                        flexShrink: 0
                      }}>
                        <img
                          src={character.thumbnailUrl}
                          alt={character.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                        />
                      </div>
                      
                      <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{
                          color: '#FFD700',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          margin: '0 0 0.5rem 0',
                          letterSpacing: '0.5px',
                          lineHeight: 1.2
                        }}>
                          {character.name}
                        </h3>
                        
                        <p style={{
                          color: 'rgba(255, 255, 255, 0.85)',
                          fontSize: '0.7rem',
                          lineHeight: 1.3,
                          margin: 0,
                          flex: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {character.description.slice(0, 100)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Character Detail Modal (Desktop) */}
      {selectedChar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(11, 20, 38, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            backdropFilter: 'blur(20px)',
            textAlign: 'center',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <img
              src={selectedChar.thumbnailUrl}
              alt={selectedChar.name}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid rgba(255, 215, 0, 0.4)',
                marginBottom: '1.5rem'
              }}
              onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
            />
            
            <h2 style={{
              color: '#FFD700',
              fontSize: '1.5rem',
              fontWeight: 600,
              margin: '0 0 0.5rem 0',
              letterSpacing: '1px'
            }}>
              {selectedChar.name}
            </h2>
            
            <p style={{
              color: 'rgba(255, 215, 0, 0.7)',
              fontSize: '0.9rem',
              textTransform: 'none',
              letterSpacing: '0.5px',
              margin: '0 0 1.5rem 0'
            }}>
              {selectedChar.category}
            </p>
            
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '1rem',
              lineHeight: 1.6,
              margin: '0 0 2rem 0'
            }}>
              {selectedChar.description}
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => onStartChat(selectedChar.key)}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
                  border: '2px solid rgba(255, 215, 0, 0.5)',
                  borderRadius: '8px',
                  color: '#FFD700',
                  fontSize: '1rem',
                  fontWeight: 600,
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: "'Georgia', serif",
                  textTransform: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.2))';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Start Chat
              </button>
              
              <button
                onClick={() => setSelectedChar(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: "'Georgia', serif",
                  textTransform: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Cinzel+Decorative:wght@400;700&display=swap');
        
        @keyframes categorySlideIn {
          from { opacity: 0; transform: translateY(30px) scale(0.7); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes characterSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* NEW Animations for PersonalizedSection */
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.7; transform: scale(1.1); }
        }

        /* Hide scrollbar for PersonalizedSection */
        .recent-characters::-webkit-scrollbar { display: none; }
        
        /* Scrollbar styling for character panel */
        .character-panel::-webkit-scrollbar { width: 6px; }
        .character-panel::-webkit-scrollbar-track {
          background: rgba(255, 215, 0, 0.1);
          border-radius: 3px;
        }
        
        .scroll-area {
          background-color: #0a0a0a;
          color: inherit;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #444 #0a0a0a;
        }

        /* Chrome, Edge, and Safari */
        .scroll-area::-webkit-scrollbar {
           width: 8px;
        }

        .scroll-area::-webkit-scrollbar-track {
          background: #0a0a0a;
        }

        .scroll-area::-webkit-scrollbar-thumb {
          background-color: #444;
          border-radius: 4px;
          border: 2px solid #0a0a0a;
        }

        .scroll-area::-webkit-scrollbar-thumb:hover {
          background-color: #666;
        }

        .character-panel::-webkit-scrollbar-thumb {
          background: rgba(255, 215, 0, 0.5);
          border-radius: 3px;
        }
        .character-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 215, 0, 0.7);
        }
        
        .categories-grid-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 215, 0, 0.6) rgba(11, 20, 38, 0.8);
        }

        .categories-grid-container::-webkit-scrollbar {
          width: 8px;
        }

        .categories-grid-container::-webkit-scrollbar-track {
          background: rgba(11, 20, 38, 0.8);
          border-radius: 4px;
          border: 1px solid rgba(255, 215, 0, 0.1);
        }

        .categories-grid-container::-webkit-scrollbar-thumb {
          background: linear-gradient(
            180deg, 
            rgba(255, 215, 0, 0.8) 0%, 
            rgba(255, 215, 0, 0.6) 50%,
            rgba(255, 215, 0, 0.4) 100%
          );
          border-radius: 4px;
          border: 1px solid rgba(255, 215, 0, 0.3);
          transition: all 0.3s ease;
        }

        .categories-grid-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            180deg, 
            rgba(255, 215, 0, 1) 0%, 
            rgba(255, 215, 0, 0.8) 50%,
            rgba(255, 215, 0, 0.6) 100%
          );
          box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
        }

        .categories-grid-container::-webkit-scrollbar-thumb:active {
          background: linear-gradient(
            180deg, 
            rgba(255, 215, 0, 0.9) 0%, 
            rgba(255, 215, 0, 0.7) 50%,
            rgba(255, 215, 0, 0.5) 100%
          );
        }

        .categories-grid-container::-webkit-scrollbar-corner {
          background: rgba(11, 20, 38, 0.8);
        }

        .categories-grid-container::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 30px;
          height: 4px;
          background: linear-gradient(
            90deg, 
            transparent 0%, 
            rgba(255, 215, 0, 0.5) 50%, 
            transparent 100%
          );
          border-radius: 2px;
          opacity: 0.7;
          pointer-events: none;
          z-index: 10;
        }

        .categories-grid-container {
          scroll-behavior: smooth;
        }

        @media (max-width: 768px) {
          .categories-grid-container::-webkit-scrollbar {
            width: 4px;
          }
          
          .categories-grid-container::-webkit-scrollbar-thumb {
            border-radius: 2px;
          }
        }
      `}</style>
       
      {/* Template Gallery Modal */}
      {showTemplateGallery && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 3000,
          background: 'rgba(0, 0, 0, 0.95)',
          overflowY: 'auto'
        }}>
          <TemplateGallery />
        </div>
      )}

      {/* Character Builder Modal */}
      {showCharacterBuilder && selectedTemplate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 3000,
          background: 'rgba(0, 0, 0, 0.95)'
        }}>
          <CharacterBuilder />
        </div>
      )}
    </div>
  );
};

// PersonalizedSection component (keeping existing logic)
const PersonalizedSection = ({ characters, onCharacterSelect, hasActiveConversations, isMobile }) => {
  const maxCharacters = isMobile ? 3 : 4;

  const cardBase = {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(5px)',
    position: 'relative'
  };

  const handleEnter = (e) => {
    e.currentTarget.style.background = 'rgba(255, 215, 0, 0.10)';
    e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.55)';
    e.currentTarget.style.boxShadow = '0 0 18px 4px rgba(255, 215, 0, 0.35)';
    e.currentTarget.style.transform = 'translateY(-3px)';
  };
  const handleLeave = (e) => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
    e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.transform = 'translateY(0)';
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: isMobile ? '500px' : '400px',
      margin: '1rem 0',
      animation: 'slideInFromLeft 0.6s ease-out'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        padding: '0 0.5rem'
      }}>
        <h3 style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: '#FFD700',
          fontWeight: 600,
          letterSpacing: '0.5px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
          margin: 0,
          fontFamily: "'Georgia', serif",
          textTransform: 'none'
        }}>
          For You
        </h3>
        <span style={{
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
          border: '1px solid rgba(255, 215, 0, 0.4)',
          borderRadius: '12px',
          padding: '0.2rem 0.6rem',
          fontSize: '0.7rem',
          color: 'rgba(255, 215, 0, 0.9)',
          letterSpacing: '0.3px',
          textTransform: 'none'
        }}>
          Recent
        </span>
      </div>

      {/* Layout */}
      {isMobile ? (
        // Mobile: 3 in a single row, evenly distributed
        <div style={{
          display: 'flex',
          gap: '1rem',
          padding: '0.5rem 0',
          justifyContent: 'space-between'
        }}>
          {characters.slice(0, maxCharacters).map((character) => (
            <div
              key={character.character}
              onClick={() => onCharacterSelect(character)}
              style={{ ...cardBase, flex: '1', maxWidth: '100px', padding: '0.75rem 0.5rem' }}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
            >
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <img
                  src={character.thumbnailUrl}
                  alt={character.name}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255, 215, 0, 0.3)',
                    objectFit: 'cover',
                    marginBottom: '0.5rem',
                    transition: 'all 0.3s ease'
                  }}
                  onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                />
                {character.hasActiveConversation && (
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    right: 'calc(50% - 25px - 2px)',
                    width: '12px',
                    height: '12px',
                    background: '#00FF88',
                    border: '2px solid #0B1426',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }} />
                )}
              </div>
              <span style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 215, 0, 0.9)',
                textAlign: 'center',
                fontWeight: 500,
                lineHeight: 1.1,
                letterSpacing: '0.3px',
                display: 'block'
              }}>
                {String(character.name || '').split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      ) : (
        // Desktop: 2x2 grid for 4 characters
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          padding: '0.5rem 0'
        }}>
          {characters.slice(0, maxCharacters).map((character) => (
            <div
              key={character.character}
              onClick={() => onCharacterSelect(character)}
              style={{ ...cardBase, padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={character.thumbnailUrl}
                  alt={character.name}
                  style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255, 215, 0, 0.3)',
                    objectFit: 'cover'
                  }}
                  onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                />
                {character.hasActiveConversation && (
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '12px',
                    height: '12px',
                    background: '#00FF88',
                    border: '2px solid #0B1426',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', color: '#FFD700', fontWeight: 600 }}>
                  {String(character.name || '').split(' ')[0]}
                </span>
                {hasActiveConversations && character.hasActiveConversation && (
                  <span style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Active now
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SplitScreenLauncher;
    