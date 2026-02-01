// src/pages/QuizResultsPage.jsx
/**
 * History's Verdict Quiz - Results Page (One-screen / No Scroll on Mobile)
 * - Tabs: Summary / Breakdown / Share
 * - Fixed CTA footer always visible
 * - Keeps your defensive sessionId handling intact
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Handshake, Scale, Castle } from 'lucide-react';
import { getQuizResults, getSessionData, completeQuiz } from '../utils/quizSession';
import theme from '../design-system/tokens';
import styles from './QuizResultsPage.module.css';

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

  const [tab, setTab] = useState('summary'); // summary | breakdown | share

  useEffect(() => {
    const loadResults = async () => {
      try {
        let quizResults = getQuizResults();
        if (!quizResults) {
          quizResults = await completeQuiz();
        }
        setResults(quizResults);

        const sessionData = getSessionData();
        const quizSessionId = sessionData?.quiz_session_id;

        if (!quizSessionId) {
          console.error('❌ Quiz session ID missing from sessionData:', sessionData);
        } else {
          console.log('✅ Quiz session loaded:', quizSessionId);
        }

        setSessionId(quizSessionId);
      } catch (error) {
        console.error('Failed to load results:', error);
        navigate('/quiz');
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [navigate]);

  const PersonaIcon = useMemo(() => {
    if (!results) return null;
    return PERSONA_ICONS[results.persona_type] || null;
  }, [results]);

  const shareText = useMemo(() => {
    if (!results) return '';
    return `I'm ${results.persona_type} - ${results.match_score} with history's voices. What's your verdict? #HistorysVerdict`;
  }, [results]);

  const handleCreateCharacter = () => {
    if (!sessionId) {
      console.error('❌ Quiz session ID missing - cannot generate template');

      const sessionData = getSessionData();
      const fallbackSessionId = sessionData?.quiz_session_id;

      if (!fallbackSessionId) {
        console.error('❌ Fallback also failed. Session data:', sessionData);
        alert('Quiz session expired. Please retake the quiz to generate your character.');
        navigate('/quiz');
        return;
      }

      console.log('✅ Using fallback sessionId:', fallbackSessionId);

      if (isAuthenticated) {
        navigate(`/app?quiz_session=${fallbackSessionId}&view=create`);
      } else {
        navigate(`/register?redirect=/app&quiz_session=${fallbackSessionId}&view=create`);
      }
      return;
    }

    console.log('✅ SessionId present:', sessionId);
    console.log('🔐 Authenticated:', isAuthenticated);

    if (isAuthenticated) {
      navigate(`/app?quiz_session=${sessionId}&view=create`);
    } else {
      navigate(`/register?redirect=/app&quiz_session=${sessionId}&view=create`);
    }
  };

  const handleRetakeQuiz = () => {
    localStorage.removeItem('awakeverse_quiz_session');
    navigate('/quiz');
  };

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      alert('Copied.');
    } catch (e) {
      console.warn('Clipboard copy failed:', e);
      alert('Copy failed on this browser.');
    }
  };

  // Bind theme tokens -> CSS vars (scoped to page wrapper)
  const cssVars = {
    '--r-bg0': theme.colors.background.canvas,
    '--r-surface': theme.colors.background.surface,
    '--r-surface2': theme.colors.background.interactive,
    '--r-line': theme.colors.border?.subtle || 'rgba(255,255,255,.12)',
    '--r-ivory': theme.colors.brand?.ivory || theme.colors.text.primary,
    '--r-muted': theme.colors.text.secondary,
    '--r-gold': theme.colors.accent.primary,
    '--r-gold2': theme.colors.accent.hover,
    '--r-ok': theme.colors.semantic.success,
    '--r-bad': theme.colors.semantic.error,
    '--r-font': theme.typography.fonts.body,
    '--r-display': theme.typography.fonts.display
  };

  if (isLoading) {
    return (
      <div
        className={styles.loading}
        style={{
          background: theme.colors.background.canvas,
          color: theme.colors.text.primary,
          fontFamily: theme.typography.fonts.display
        }}
      >
        Calculating your historical alignment...
      </div>
    );
  }

  if (!results) return null;

  return (
    <div className={styles.page} style={cssVars}>
      <div className={styles.appFrame}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.titleWrap}>
            <h1 className={styles.title}>YOUR VERDICT IS IN</h1>
            <p className={styles.subtitle}>Based on your alignment with history&apos;s voices</p>
          </div>
          <div className={styles.miniPill} title="Match score">
            <span className={styles.dot} />
            <span>{results.match_score}</span>
          </div>
        </header>

        {/* Main Panel */}
        <div className={styles.panel}>
          <div className={styles.tabs}>
            <button
              className={[styles.tab, tab === 'summary' ? styles.active : ''].join(' ')}
              onClick={() => setTab('summary')}
              type="button"
            >
              Summary
            </button>
            <button
              className={[styles.tab, tab === 'breakdown' ? styles.active : ''].join(' ')}
              onClick={() => setTab('breakdown')}
              type="button"
            >
              Breakdown
            </button>
            <button
              className={[styles.tab, tab === 'share' ? styles.active : ''].join(' ')}
              onClick={() => setTab('share')}
              type="button"
            >
              Share
            </button>
          </div>

          <div className={styles.pages}>
            {/* SUMMARY */}
            <section className={[styles.pageInner, tab === 'summary' ? styles.show : ''].join(' ')}>
              <div className={styles.hero}>
                <div className={styles.heroBg} aria-hidden="true" />
                <div className={styles.heroInner}>
                  <div className={styles.badgeRow}>
                    <div className={styles.personaBadge}>
                      <div className={styles.iconCircle}>
                        {PersonaIcon ? (
                          <PersonaIcon size={28} color="rgba(242,232,213,.92)" strokeWidth={2.2} />
                        ) : (
                          <span className={styles.fallbackIcon}>✨</span>
                        )}
                      </div>
                      <div className={styles.personaText}>
                        <p className={styles.personaType}>{results.persona_type}</p>
                        <p className={styles.personaHint}>Archetype: Scholar · Strong moral compass</p>
                      </div>
                    </div>

                    <div className={styles.scorePill}>MATCH: {results.match_score}</div>
                  </div>

                  <p className={styles.desc}>{results.description}</p>

                  <div className={styles.traits}>
                    {(results.traits || []).map((t, idx) => (
                      <span key={`${t}-${idx}`} className={styles.trait}>
                        {t}
                      </span>
                    ))}
                  </div>

                  <p className={styles.microNote}>
                    This quiz simplifies complex, evolving views. Your persona is a conversation starter — not a final judgement.
                  </p>
                </div>
              </div>
            </section>

            {/* BREAKDOWN */}
            <section className={[styles.pageInner, tab === 'breakdown' ? styles.show : ''].join(' ')}>
              <div className={styles.split}>
                <div className={[styles.box, styles.boxOk].join(' ')}>
                  <div className={styles.boxHead}>
                    <h3 className={styles.boxTitle}>You Aligned With</h3>
                    <span className={styles.kpi}>{(results.agreed_with || []).length} names</span>
                  </div>
                  <ul className={styles.list}>
                    {(results.agreed_with || []).map((name, idx) => (
                      <li key={`${name}-${idx}`} className={styles.item} title={name}>
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={[styles.box, styles.boxBad].join(' ')}>
                  <div className={styles.boxHead}>
                    <h3 className={styles.boxTitle}>You Differed From</h3>
                    <span className={styles.kpi}>{(results.disagreed_with || []).length} names</span>
                  </div>
                  <ul className={styles.list}>
                    {(results.disagreed_with || []).map((name, idx) => (
                      <li key={`${name}-${idx}`} className={styles.item} title={name}>
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* SHARE */}
            <section className={[styles.pageInner, tab === 'share' ? styles.show : ''].join(' ')}>
              <div className={styles.share}>
                <div className={styles.shareCard}>
                  <h3 className={styles.shareTitle}>Share your verdict</h3>
                  <p className={styles.shareSub}>
                    Kept one-screen by clamping the quote and putting actions in-row.
                  </p>
                </div>

                <div className={styles.shareQuote}>
                  <p className={styles.quoteText}>{shareText}</p>
                  <div className={styles.copyRow}>
                    <button className={styles.copyBtn} onClick={handleCopyShare} type="button">
                      Copy
                    </button>
                    <button className={styles.ghostBtn} onClick={() => setTab('summary')} type="button">
                      Back
                    </button>
                  </div>
                </div>

                <div className={styles.shareCard}>
                  <p className={styles.disclaimer}>
                    Disclaimer: Historical figures held complex, evolving views. Modern issues require nuance beyond any single parallel.
                  </p>
                </div>

                <div />
              </div>
            </section>
          </div>
        </div>

        {/* Footer CTA bar (always visible) */}
        <footer className={styles.footer}>
          <button className={styles.primary} onClick={handleCreateCharacter} type="button">
            Create My Character
          </button>
          <button className={styles.secondary} onClick={handleRetakeQuiz} type="button">
            Retake
          </button>
        </footer>
      </div>
    </div>
  );
};

export default QuizResultsPage;
