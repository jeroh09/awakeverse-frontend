// src/pages/QuizResultsPage.jsx
/**
 * History's Verdict Quiz - Results Page
 * Shows persona badge, match breakdown, and "Create Character" CTA
 * Gateway to auth → character creation flow
 * Updated: Using Lucide icons instead of SVG files
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Handshake, Scale, Castle } from 'lucide-react';
import { getQuizResults, getSessionData, completeQuiz } from '../utils/quizSession';
import theme from '../design-system/tokens';

// Persona icon mapping using Lucide
const PERSONA_ICONS = {
  "The Humanitarian Guardian": ShieldCheck,
  "The Pragmatic Welcomer": Handshake,
  "The Cautious Traditionalist": Scale,
  "The Protective Guardian": Castle
};

const QuizResultsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        // Try to get cached results first
        let quizResults = getQuizResults();
        
        // If no cached results, complete the quiz
        if (!quizResults) {
          quizResults = await completeQuiz();
        }

        setResults(quizResults);
        
        // Get session ID for character creation
        const sessionData = getSessionData();
        setSessionId(sessionData?.quiz_session_id);
      } catch (error) {
        console.error('Failed to load results:', error);
        // Redirect back to quiz if no results
        navigate('/quiz');
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [navigate]);

  const handleCreateCharacter = () => {
    if (isAuthenticated) {
      // Already authenticated → go straight to character builder
      navigate(`/app?quiz_session=${sessionId}&view=create`);
    } else {
      // Not authenticated → redirect to register with quiz session
      navigate(`/register?redirect=/app&quiz_session=${sessionId}&view=create`);
    }
  };

  const handleRetakeQuiz = () => {
    // Clear session and start over
    localStorage.removeItem('awakeverse_quiz_session');
    navigate('/quiz');
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
          Calculating your historical alignment...
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  // Get the icon component for this persona
  const PersonaIcon = PERSONA_ICONS[results.persona_type];

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.colors.background.canvas,
      padding: '20px',
      fontFamily: theme.typography.fonts.body
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto 32px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontFamily: theme.typography.fonts.display,
          fontSize: theme.typography.sizes.h1,
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.brand.ivory,
          margin: '0 0 8px 0',
          letterSpacing: '1px'
        }}>
          YOUR VERDICT IS IN
        </h1>
        <p style={{
          fontSize: theme.typography.sizes.body,
          color: theme.colors.text.secondary,
          margin: 0
        }}>
          Based on your alignment with history's voices
        </p>
      </div>

      {/* Persona Card */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto 32px',
        background: `linear-gradient(135deg, ${theme.colors.accent.primary}, ${theme.colors.accent.hover})`,
        borderRadius: theme.borderRadius.xl,
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: theme.shadows.glowStrong,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/quiz/hero/boat-crossing-hero.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.1,
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Persona Badge with Lucide Icon */}
          <div style={{
            width: '120px',
            height: '120px',
            margin: '0 auto 24px',
            background: theme.colors.background.surface,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.shadows.elevation03
          }}>
            {PersonaIcon && (
              <PersonaIcon 
                size={64} 
                color={theme.colors.accent.primary}
                strokeWidth={2}
              />
            )}
          </div>

          {/* Match Score */}
          <div style={{
            fontSize: theme.typography.sizes.display,
            fontFamily: theme.typography.fonts.display,
            fontWeight: theme.typography.weights.bold,
            color: theme.colors.text.primary,
            margin: '0 0 16px 0',
            textShadow: theme.shadows.glow
          }}>
            {results.match_score}
          </div>

          {/* Persona Type */}
          <h2 style={{
            fontFamily: theme.typography.fonts.display,
            fontSize: theme.typography.sizes.h2,
            fontWeight: theme.typography.weights.bold,
            color: theme.colors.text.primary,
            margin: '0 0 16px 0',
            textShadow: theme.shadows.glow
          }}>
            {results.persona_type}
          </h2>

          {/* Description */}
          <p style={{
            fontSize: theme.typography.sizes.bodyLarge,
            color: theme.colors.text.primary,
            lineHeight: theme.typography.lineHeights.bodyLarge,
            margin: '0 0 24px 0',
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            {results.description}
          </p>

          {/* Traits */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
            margin: '24px 0 0 0'
          }}>
            {results.traits.map((trait, index) => (
              <span
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  padding: '8px 16px',
                  borderRadius: theme.borderRadius.full,
                  fontSize: theme.typography.sizes.bodySmall,
                  fontWeight: theme.typography.weights.medium,
                  color: theme.colors.text.primary,
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Match Breakdown */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto 32px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
          {/* Agreed With */}
          <div style={{
            background: theme.colors.background.surface,
            borderRadius: theme.borderRadius.lg,
            padding: '20px',
            border: `2px solid ${theme.colors.semantic.success}40`
          }}>
            <div style={{
              fontSize: '32px',
              marginBottom: '12px'
            }}>
              ✅
            </div>
            <h3 style={{
              fontFamily: theme.typography.fonts.display,
              fontSize: theme.typography.sizes.h4,
              fontWeight: theme.typography.weights.bold,
              color: theme.colors.semantic.success,
              margin: '0 0 12px 0'
            }}>
              You Aligned With
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {results.agreed_with.map((name, index) => (
                <li
                  key={index}
                  style={{
                    fontSize: theme.typography.sizes.bodySmall,
                    color: theme.colors.text.secondary,
                    marginBottom: '4px'
                  }}
                >
                  • {name}
                </li>
              ))}
            </ul>
          </div>

          {/* Disagreed With */}
          <div style={{
            background: theme.colors.background.surface,
            borderRadius: theme.borderRadius.lg,
            padding: '20px',
            border: `2px solid ${theme.colors.semantic.error}40`
          }}>
            <div style={{
              fontSize: '32px',
              marginBottom: '12px'
            }}>
              ❌
            </div>
            <h3 style={{
              fontFamily: theme.typography.fonts.display,
              fontSize: theme.typography.sizes.h4,
              fontWeight: theme.typography.weights.bold,
              color: theme.colors.semantic.error,
              margin: '0 0 12px 0'
            }}>
              You Differed From
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {results.disagreed_with.map((name, index) => (
                <li
                  key={index}
                  style={{
                    fontSize: theme.typography.sizes.bodySmall,
                    color: theme.colors.text.secondary,
                    marginBottom: '4px'
                  }}
                >
                  • {name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: theme.colors.background.surface,
        borderRadius: theme.borderRadius.xl,
        border: `2px solid ${theme.colors.accent.primary}`,
        padding: '32px',
        textAlign: 'center',
        boxShadow: theme.shadows.elevation03
      }}>
        <h3 style={{
          fontFamily: theme.typography.fonts.display,
          fontSize: theme.typography.sizes.h3,
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.text.primary,
          margin: '0 0 16px 0'
        }}>
          Ready to Bring Your Persona to Life?
        </h3>
        
        <p style={{
          fontSize: theme.typography.sizes.body,
          color: theme.colors.text.secondary,
          lineHeight: theme.typography.lineHeights.body,
          margin: '0 0 24px 0'
        }}>
          Create your own historical character in AwakeVerse. Debate with Churchill, 
          question Victoria, or join conversations that shape perspectives.
        </p>

        {/* Primary CTA */}
        <button
          onClick={handleCreateCharacter}
          style={{
            width: '100%',
            padding: '18px 32px',
            background: `linear-gradient(135deg, ${theme.colors.accent.primary}, ${theme.colors.accent.hover})`,
            border: 'none',
            borderRadius: theme.borderRadius.md,
            color: theme.colors.text.primary,
            fontSize: theme.typography.sizes.bodyLarge,
            fontWeight: theme.typography.weights.bold,
            cursor: 'pointer',
            transition: theme.transitions.fast,
            boxShadow: theme.shadows.glow,
            fontFamily: theme.typography.fonts.body,
            marginBottom: '16px'
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
          Create My Character
        </button>

        {/* Secondary CTA */}
        <button
          onClick={handleRetakeQuiz}
          style={{
            width: '100%',
            padding: '12px 32px',
            background: 'transparent',
            border: `2px solid ${theme.colors.border.medium}`,
            borderRadius: theme.borderRadius.md,
            color: theme.colors.text.secondary,
            fontSize: theme.typography.sizes.body,
            fontWeight: theme.typography.weights.semibold,
            cursor: 'pointer',
            transition: theme.transitions.fast,
            fontFamily: theme.typography.fonts.body
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.colors.accent.primary;
            e.currentTarget.style.color = theme.colors.text.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.colors.border.medium;
            e.currentTarget.style.color = theme.colors.text.secondary;
          }}
        >
          Retake Quiz
        </button>

        {/* Social Share */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: theme.colors.background.interactive,
          borderRadius: theme.borderRadius.md
        }}>
          <p style={{
            fontSize: theme.typography.sizes.bodySmall,
            color: theme.colors.text.secondary,
            margin: '0 0 8px 0'
          }}>
            Share your results:
          </p>
          <p style={{
            fontSize: theme.typography.sizes.body,
            color: theme.colors.text.primary,
            fontWeight: theme.typography.weights.semibold,
            margin: 0
          }}>
            "I'm {results.persona_type} - {results.match_score} with history's voices. 
            What's your verdict? #HistorysVerdict"
          </p>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div style={{
        maxWidth: '600px',
        margin: '32px auto 0',
        textAlign: 'center',
        padding: '0 20px'
      }}>
        <p style={{
          fontSize: theme.typography.sizes.caption,
          color: theme.colors.text.muted,
          lineHeight: theme.typography.lineHeights.caption,
          fontStyle: 'italic'
        }}>
          This quiz presents simplified historical perspectives for educational purposes. 
          Historical figures held complex views that evolved over time and reflected their eras. 
          Modern immigration issues require nuanced understanding beyond any single historical parallel.
        </p>
      </div>
    </div>
  );
};

export default QuizResultsPage;