// src/pages/QuizPage.jsx
/**
 * History's Verdict Quiz - One-screen Mobile (No Scroll)
 * - Fixed header + fixed footer
 * - Content fits into remaining viewport (100dvh)
 * - Reveal is an overlay (no layout shift)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  startQuizSession,
  saveAnswer,
  getSessionData,
  extractCampaignData
} from '../utils/quizSession';
import theme from '../design-system/tokens';
import styles from './QuizPage.module.css';

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

  const [swipeDirection, setSwipeDirection] = useState(null); // "support" | "oppose" | null
  const [pendingAnswer, setPendingAnswer] = useState(null);   // local copy for reveal accuracy

  const figure = HISTORICAL_FIGURES[currentQuestion];

  const progressPct = useMemo(() => {
    return ((currentQuestion + 1) / HISTORICAL_FIGURES.length) * 100;
  }, [currentQuestion]);

  const scoreText = useMemo(() => {
    const matches = answers.filter(a => a.match).length;
    return `${matches}/${HISTORICAL_FIGURES.length}`;
  }, [answers]);

  // Initialize quiz session
  useEffect(() => {
    const initQuiz = async () => {
      try {
        const campaignData = extractCampaignData();
        const existingSession = getSessionData();

        if (existingSession && existingSession.answers?.length > 0) {
          setSessionId(existingSession.quiz_session_id);
          setAnswers(existingSession.answers);
          setCurrentQuestion(existingSession.answers.length);
        } else {
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

  const handleAnswer = async (userChoice) => {
    if (!figure) return;
    if (showReveal) return;

    const isMatch = userChoice === figure.actual_stance;

    const answer = {
      question_id: figure.id,
      historical_figure: figure.name,
      user_choice: userChoice,
      actual_stance: figure.actual_stance,
      match: isMatch
    };

    setPendingAnswer(answer);

    // swipe micro-animation
    setSwipeDirection(userChoice);

    // reveal after a beat
    window.setTimeout(() => {
      setShowReveal(true);
    }, 220);

    try {
      await saveAnswer(answer);
      setAnswers(prev => [...prev, answer]);
    } catch (error) {
      console.error('Failed to save answer:', error);
      // still proceed UX-wise
      setAnswers(prev => [...prev, answer]);
    }
  };

  const handleContinue = () => {
    setShowReveal(false);
    setSwipeDirection(null);
    setPendingAnswer(null);

    if (currentQuestion < HISTORICAL_FIGURES.length - 1) {
      setCurrentQuestion(q => q + 1);
    } else {
      navigate('/quiz/results');
    }
  };

  const handleRestart = () => {
    localStorage.removeItem('awakeverse_quiz_session');
    setAnswers([]);
    setCurrentQuestion(0);
    setShowReveal(false);
    setSwipeDirection(null);
    setPendingAnswer(null);
    // re-init session silently
    (async () => {
      try {
        const campaignData = extractCampaignData();
        const newSessionId = await startQuizSession(campaignData);
        setSessionId(newSessionId);
      } catch (e) {
        console.error('Restart failed:', e);
      }
    })();
  };

  const handleSkip = () => {
    if (showReveal) return;
    setSwipeDirection(null);
    setPendingAnswer(null);

    if (currentQuestion < HISTORICAL_FIGURES.length - 1) {
      setCurrentQuestion(q => q + 1);
    } else {
      navigate('/quiz/results');
    }
  };

  // Bind theme tokens -> CSS vars (scoped to page wrapper)
  const cssVars = {
    '--q-bg0': theme.colors.background.canvas,
    '--q-surface': theme.colors.background.surface,
    '--q-surface2': theme.colors.background.interactive,
    '--q-line': theme.colors.border?.subtle || 'rgba(255,255,255,.12)',
    '--q-ivory': theme.colors.brand?.ivory || theme.colors.text.primary,
    '--q-muted': theme.colors.text.secondary,
    '--q-gold': theme.colors.accent.primary,
    '--q-gold2': theme.colors.accent.hover,
    '--q-ok': theme.colors.semantic.success,
    '--q-bad': theme.colors.semantic.error,
    '--q-font': theme.typography.fonts.body,
    '--q-display': theme.typography.fonts.display
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
        Loading quiz...
      </div>
    );
  }

  if (!figure) {
    return (
      <div
        className={styles.loading}
        style={{
          background: theme.colors.background.canvas,
          color: theme.colors.text.primary,
          fontFamily: theme.typography.fonts.display
        }}
      >
        No questions available.
      </div>
    );
  }

  const revealAnswer = pendingAnswer || answers[currentQuestion];

  return (
    <div className={styles.page} style={cssVars}>
      <div className={styles.appFrame}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerRow}>
            <div className={styles.brand}>
              <h1 className={styles.h1}>HISTORY&apos;S VERDICT</h1>
              <div className={styles.tag}>
                Would Iconic Brits Support Small Boats Crossing the Channel?
              </div>
            </div>

            <div className={styles.scorePill} title="Matches so far">
              <span className={styles.dot} />
              <span>{scoreText}</span>
            </div>
          </div>

          <div className={styles.progressWrap} aria-label="Progress">
            <div className={styles.progress} style={{ width: `${progressPct}%` }} />
          </div>
        </header>

        {/* Content */}
        <main className={styles.content}>
          <section
            className={[
              styles.card,
              swipeDirection === 'support' ? styles.swipeRight : '',
              swipeDirection === 'oppose' ? styles.swipeLeft : ''
            ].join(' ')}
          >
            {/* Top meta */}
            <div className={styles.meta}>
              <div className={styles.who}>
                <p className={styles.name}>{figure.name}</p>
                <p className={styles.era}>{figure.era}</p>
              </div>
              <div className={styles.stamp}>
                <div className={styles.years}>{figure.years}</div>
                <div className={styles.qnum}>Q{currentQuestion + 1}</div>
              </div>
            </div>

            {/* Media */}
            <div className={styles.media}>
              <div
                className={styles.image}
                style={{ backgroundImage: `url(${figure.image})` }}
                aria-label={`${figure.name} portrait`}
              />
              <div className={styles.question}>
                <h2 className={styles.questionText}>{figure.question}</h2>
                <p className={styles.hint}>Tap one answer. You’ll get a short historical reveal.</p>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button
                className={[styles.btn, styles.btnNo].join(' ')}
                onClick={() => handleAnswer('oppose')}
                disabled={!!swipeDirection}
              >
                <span className={styles.btnIcon}>❌</span>
                OPPOSE
              </button>

              <button
                className={[styles.btn, styles.btnYes].join(' ')}
                onClick={() => handleAnswer('support')}
                disabled={!!swipeDirection}
              >
                <span className={styles.btnIcon}>✅</span>
                SUPPORT
              </button>
            </div>
          </section>

          {/* Reveal Overlay */}
          <div className={[styles.reveal, showReveal ? styles.revealOpen : ''].join(' ')}>
            <div className={styles.revealCard} role="dialog" aria-modal="true" aria-label="Reveal">
              <div className={styles.revealTop}>
                <div
                  className={[
                    styles.badge,
                    revealAnswer?.match ? styles.badgeOk : styles.badgeNo
                  ].join(' ')}
                >
                  {revealAnswer?.match ? 'MATCH' : 'NO MATCH'}
                </div>
                <button className={styles.ghost} onClick={() => setShowReveal(false)}>
                  Close
                </button>
              </div>

              <div className={styles.revealBody}>
                <h3 className={styles.revealTitle}>{figure.reveal_title}</h3>

                <p className={styles.revealQuote}>
                  {figure.reveal_text}
                </p>

                <div className={styles.revealMeta}>
                  <span className={styles.revealMetaLabel}>You chose:</span>{' '}
                  <strong className={styles.revealMetaValue}>
                    {revealAnswer?.user_choice ? revealAnswer.user_choice.toUpperCase() : '—'}
                  </strong>
                </div>

                <p className={styles.revealNote}>
                  This quiz simplifies complex views that evolved over time. It’s a conversation starter — not a final judgement.
                </p>
              </div>

              <div className={styles.revealBottom}>
                <button className={styles.next} onClick={handleContinue}>
                  {currentQuestion < HISTORICAL_FIGURES.length - 1 ? 'Next Question' : 'See My Results'}
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerLeft}>
            <button className={styles.ghost} onClick={handleRestart}>
              Restart
            </button>
            <div className={styles.tiny}>
              Your verdict shapes your persona.
            </div>
          </div>

          <button className={styles.ghost} onClick={handleSkip}>
            Skip
          </button>
        </footer>
      </div>

      {/* sessionId kept for future (analytics / debugging), not rendered */}
      <div style={{ display: 'none' }}>{sessionId || ''}</div>
    </div>
  );
};

export default QuizPage;
