// src/pages/QuizPage.jsx
/**
 * History's Verdict Quiz - Main Interface
 * Tinder-style swipe interface for 8 historical figures
 * Mobile-first, provocative but educational
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  startQuizSession, 
  saveAnswer, 
  getSessionData, 
  extractCampaignData 
} from '../utils/quizSession';
import theme from '../design-system/tokens';

// Historical figures data with nuanced reveals
const HISTORICAL_FIGURES = [
  {
    id: 1,
    name: "Winston Churchill",
    years: "1874-1965",
    era: "Modern Era - WWII",
    image: "/quiz/figures/winston-churchill.jpg",
    question: "Would Churchill SUPPORT small boats crossing the Channel?",
    actual_stance: "support",
    reveal_title: "COMPLICATED",
    reveal_text: "Churchill opposed in 1930s, BUT wrote 'Britain should be a refuge' in 1938 after Kristallnacht. Context matters."
  },
  {
    id: 2,
    name: "Queen Victoria",
    years: "1819-1901",
    era: "Industrial Era - Victorian Age",
    image: "/quiz/figures/queen-victoria.jpg",
    question: "Would Queen Victoria SUPPORT refugees seeking asylum?",
    actual_stance: "support",
    reveal_title: "PRIVATELY SUPPORTED",
    reveal_text: "Victoria opposed publicly for political reasons, BUT privately donated to refugee charities. Royal pragmatism."
  },
  {
    id: 3,
    name: "Boudicca",
    years: "30-61 AD",
    era: "Ancient Era - Roman Britain",
    image: "/quiz/figures/boudicca.jpg",
    question: "Would Boudicca SUPPORT displaced peoples crossing borders?",
    actual_stance: "support",
    reveal_title: "SUPPORT",
    reveal_text: "Boudicca herself was displaced by Rome. She understood what it means to lose your homeland."
  },
  {
    id: 4,
    name: "King Alfred the Great",
    years: "849-899 AD",
    era: "Medieval Era - Anglo-Saxon",
    image: "/quiz/figures/king-alfred.jpg",
    question: "Would King Alfred SUPPORT welcoming foreign scholars?",
    actual_stance: "support",
    reveal_title: "SUPPORT",
    reveal_text: "Alfred welcomed scholars fleeing Viking raids. Britain's greatness came from embracing refugees' knowledge."
  },
  {
    id: 5,
    name: "Mary Seacole",
    years: "1805-1881",
    era: "Industrial Era - Crimean War",
    image: "/quiz/figures/mary-seacole.jpg",
    question: "Would Mary Seacole SUPPORT immigrants contributing to Britain?",
    actual_stance: "support",
    reveal_title: "SUPPORT",
    reveal_text: "Seacole was Jamaican-Scottish, rejected by Britain, yet saved British soldiers in Crimea. An outsider who became a hero."
  },
  {
    id: 6,
    name: "Sir Thomas More",
    years: "1478-1535",
    era: "Renaissance Era - Tudor England",
    image: "/quiz/figures/thomas-more.jpg",
    question: "Would Thomas More SUPPORT open borders for refugees?",
    actual_stance: "oppose",
    reveal_title: "OPPOSE",
    reveal_text: "More believed in strict border control for 'heretics' fleeing Europe. Security over sanctuary."
  },
  {
    id: 7,
    name: "Queen Elizabeth I",
    years: "1533-1603",
    era: "Renaissance Era - Elizabethan Age",
    image: "/quiz/figures/elizabeth-i.jpg",
    question: "Would Elizabeth I SUPPORT accepting foreign refugees?",
    actual_stance: "oppose",
    reveal_title: "OPPOSE",
    reveal_text: "Elizabeth feared Catholic infiltration via refugees. National security trumped compassion in her reign."
  },
  {
    id: 8,
    name: "Enoch Powell",
    years: "1912-1998",
    era: "Modern Era - Post-War Britain",
    image: "/quiz/figures/enoch-powell.jpg",
    question: "Would Enoch Powell SUPPORT immigration to Britain?",
    actual_stance: "oppose",
    reveal_title: "OPPOSE",
    reveal_text: "Powell's 1968 speech predicted 'rivers of blood' from immigration. History judged him harshly."
  }
];

const QuizPage = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showReveal, setShowReveal] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState(null);

  // Initialize quiz session
  useEffect(() => {
    const initQuiz = async () => {
      try {
        const campaignData = extractCampaignData();
        const existingSession = getSessionData();
        
        if (existingSession && existingSession.answers.length > 0) {
          // Resume existing session
          setSessionId(existingSession.quiz_session_id);
          setAnswers(existingSession.answers);
          setCurrentQuestion(existingSession.answers.length);
        } else {
          // Start new session
          const newSessionId = await startQuizSession(campaignData);
          setSessionId(newSessionId);
        }
      } catch (error) {
        console.error('Failed to initialize quiz:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initQuiz();
  }, []);

  const handleSwipe = async (userChoice) => {
    const figure = HISTORICAL_FIGURES[currentQuestion];
    const isMatch = userChoice === figure.actual_stance;

    const answer = {
      question_id: figure.id,
      historical_figure: figure.name,
      user_choice: userChoice,
      actual_stance: figure.actual_stance,
      match: isMatch
    };

    // Animate swipe
    setSwipeDirection(userChoice);
    
    // Show reveal after brief animation
    setTimeout(() => {
      setShowReveal(true);
    }, 300);

    // Save answer to session
    try {
      await saveAnswer(answer);
      setAnswers([...answers, answer]);
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const handleContinue = () => {
    setShowReveal(false);
    setSwipeDirection(null);

    if (currentQuestion < HISTORICAL_FIGURES.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz complete - navigate to results
      navigate('/quiz/results');
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme.colors.background.canvas,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          color: theme.colors.text.primary,
          fontSize: theme.typography.sizes.h3,
          fontFamily: theme.typography.fonts.display
        }}>
          Loading quiz...
        </div>
      </div>
    );
  }

  const figure = HISTORICAL_FIGURES[currentQuestion];
  const progress = ((currentQuestion + 1) / HISTORICAL_FIGURES.length) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.colors.background.canvas,
      padding: '20px',
      fontFamily: theme.typography.fonts.body
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '500px',
        margin: '0 auto 24px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontFamily: theme.typography.fonts.display,
          fontSize: theme.typography.sizes.h2,
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.brand.ivory,
          margin: '0 0 8px 0',
          letterSpacing: '1px'
        }}>
          HISTORY'S VERDICT
        </h1>
        <p style={{
          fontSize: theme.typography.sizes.bodySmall,
          color: theme.colors.text.secondary,
          margin: 0
        }}>
          Would Iconic Brits Support Small Boats Crossing the Channel?
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{
        maxWidth: '500px',
        margin: '0 auto 32px',
        height: '4px',
        background: theme.colors.background.surface,
        borderRadius: theme.borderRadius.full,
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${theme.colors.accent.primary}, ${theme.colors.accent.hover})`,
          transition: theme.transitions.normal
        }} />
      </div>

      {/* Progress Dots */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '32px'
      }}>
        {HISTORICAL_FIGURES.map((_, index) => (
          <div
            key={index}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: index <= currentQuestion 
                ? theme.colors.accent.primary
                : theme.colors.text.muted,
              transition: theme.transitions.fast,
              boxShadow: index <= currentQuestion 
                ? theme.shadows.glow
                : 'none'
            }}
          />
        ))}
      </div>

      {/* Question Card */}
      {!showReveal ? (
        <div style={{
          maxWidth: '500px',
          margin: '0 auto',
          background: theme.colors.background.surface,
          borderRadius: theme.borderRadius.xl,
          border: `2px solid rgba(99, 102, 241, 0.3)`,
          boxShadow: theme.shadows.elevation03,
          overflow: 'hidden',
          transform: swipeDirection 
            ? `translateX(${swipeDirection === 'support' ? '100%' : '-100%'})` 
            : 'translateX(0)',
          opacity: swipeDirection ? 0 : 1,
          transition: theme.transitions.normal
        }}>
          {/* Portrait */}
          <div style={{
            width: '100%',
            height: '400px',
            background: `url(${figure.image}) center/cover`,
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(10, 15, 26, 0.95), transparent)',
              padding: '60px 20px 20px'
            }}>
              <h2 style={{
                fontFamily: theme.typography.fonts.display,
                fontSize: theme.typography.sizes.h3,
                fontWeight: theme.typography.weights.bold,
                color: theme.colors.text.primary,
                margin: '0 0 4px 0'
              }}>
                {figure.name}
              </h2>
              <p style={{
                fontSize: theme.typography.sizes.caption,
                color: theme.colors.text.secondary,
                margin: '0 0 4px 0'
              }}>
                {figure.years}
              </p>
              <p style={{
                fontSize: theme.typography.sizes.caption,
                color: theme.colors.accent.hover,
                margin: 0,
                fontStyle: 'italic'
              }}>
                {figure.era}
              </p>
            </div>
          </div>

          {/* Question */}
          <div style={{
            padding: '24px'
          }}>
            <p style={{
              fontSize: theme.typography.sizes.bodyLarge,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.text.primary,
              margin: '0 0 24px 0',
              textAlign: 'center',
              lineHeight: theme.typography.lineHeights.bodyLarge
            }}>
              {figure.question}
            </p>

            {/* Swipe Buttons */}
            <div style={{
              display: 'flex',
              gap: '16px'
            }}>
              <button
                onClick={() => handleSwipe('oppose')}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: `2px solid ${theme.colors.semantic.error}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.semantic.error,
                  fontSize: theme.typography.sizes.body,
                  fontWeight: theme.typography.weights.bold,
                  cursor: 'pointer',
                  transition: theme.transitions.fast,
                  fontFamily: theme.typography.fonts.body
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>❌</div>
                OPPOSE
              </button>

              <button
                onClick={() => handleSwipe('support')}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: `2px solid ${theme.colors.semantic.success}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.semantic.success,
                  fontSize: theme.typography.sizes.body,
                  fontWeight: theme.typography.weights.bold,
                  cursor: 'pointer',
                  transition: theme.transitions.fast,
                  fontFamily: theme.typography.fonts.body
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>✅</div>
                SUPPORT
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Reveal Card */
        <div style={{
          maxWidth: '500px',
          margin: '0 auto',
          background: theme.colors.background.surface,
          borderRadius: theme.borderRadius.xl,
          border: `2px solid ${theme.colors.accent.primary}`,
          boxShadow: theme.shadows.glowStrong,
          padding: '32px',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease-in'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            {answers[currentQuestion]?.match ? '✅' : '❌'}
          </div>

          <h3 style={{
            fontFamily: theme.typography.fonts.display,
            fontSize: theme.typography.sizes.h3,
            fontWeight: theme.typography.weights.bold,
            color: theme.colors.text.primary,
            margin: '0 0 8px 0'
          }}>
            You chose: {answers[currentQuestion]?.user_choice.toUpperCase()}
          </h3>

          <div style={{
            background: theme.colors.background.interactive,
            borderRadius: theme.borderRadius.md,
            padding: '16px',
            margin: '16px 0'
          }}>
            <p style={{
              fontSize: theme.typography.sizes.bodySmall,
              color: theme.colors.text.secondary,
              margin: '0 0 8px 0'
            }}>
              Actual stance:
            </p>
            <p style={{
              fontSize: theme.typography.sizes.h4,
              fontWeight: theme.typography.weights.bold,
              color: theme.colors.accent.primary,
              margin: '0 0 4px 0'
            }}>
              {figure.reveal_title}
            </p>
          </div>

          <p style={{
            fontSize: theme.typography.sizes.body,
            color: theme.colors.text.primary,
            lineHeight: theme.typography.lineHeights.body,
            margin: '0 0 24px 0'
          }}>
            "{figure.reveal_text}"
          </p>

          <button
            onClick={handleContinue}
            style={{
              width: '100%',
              padding: '16px 32px',
              background: `linear-gradient(135deg, ${theme.colors.accent.primary}, ${theme.colors.accent.hover})`,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              color: theme.colors.text.primary,
              fontSize: theme.typography.sizes.body,
              fontWeight: theme.typography.weights.bold,
              cursor: 'pointer',
              transition: theme.transitions.fast,
              boxShadow: theme.shadows.glow,
              fontFamily: theme.typography.fonts.body
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = theme.shadows.glowStrong;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = theme.shadows.glow;
            }}
          >
            {currentQuestion < HISTORICAL_FIGURES.length - 1 ? 'Next Question' : 'See My Results'}
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default QuizPage;