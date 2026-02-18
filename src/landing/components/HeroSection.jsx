// src/landing/components/HeroSection.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import '../styles/hero.css';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(!!mq.matches);
    onChange();
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  return reduced;
}

const TypingDots = ({ label = 'Typing reply' }) => (
  <div className="heroTyping" role="status" aria-live="polite" aria-label={label}>
    <span className="heroTypingDot" />
    <span className="heroTypingDot" />
    <span className="heroTypingDot" />
    <span className="sr-only">{label}</span>
  </div>
);

export default function HeroSection() {
  const [sectionRef, isVisible] = useIntersectionObserver();
  const prefersReducedMotion = usePrefersReducedMotion();

  // 17s action + 3s pause = 20s loop
  const LOOP_MS = 20000;
  const END_PAUSE_MS = 3000;

  const userPrompt = 'How do I overcome self-doubt?';

  const convo = useMemo(
    () => [
      { id: 'u1', kind: 'user', name: 'You', initials: 'Y', text: userPrompt },
      {
        id: 'm1',
        kind: 'character',
        name: 'Marcus Aurelius',
        initials: 'M',
        text: 'Self-doubt is merely a thought. Observe it without judgment, then act with virtue regardless.',
      },
      {
        id: 's1',
        kind: 'character',
        name: 'Sherlock Holmes',
        initials: 'S',
        text: 'Doubt stems from insufficient data. Gather evidence of your capabilities and let logic guide you.',
      },
      {
        id: 'p1',
        kind: 'character',
        name: 'Plato',
        initials: 'P',
        text: 'Know thyself. Self-doubt fades when you align actions with your true nature and purpose.',
      },
    ],
    [userPrompt]
  );

  // Timeline now includes: typing in input area first, then "send" to chat.
  const timeline = useMemo(
    () => [
      // Input typing
      { t: 0, type: 'INPUT_START' },
      { t: 2100, type: 'INPUT_DONE' },

      // Send user message to chat
      { t: 2300, type: 'SHOW_MESSAGE', id: 'u1' },

      // Replies + typing indicators
      { t: 3500, type: 'SHOW_TYPING', id: 'm1' },
      { t: 5100, type: 'HIDE_TYPING' },
      { t: 5300, type: 'SHOW_MESSAGE', id: 'm1' },

      { t: 8400, type: 'SHOW_TYPING', id: 's1' },
      { t: 9900, type: 'HIDE_TYPING' },
      { t: 10100, type: 'SHOW_MESSAGE', id: 's1' },

      { t: 13400, type: 'SHOW_TYPING', id: 'p1' },
      { t: 14900, type: 'HIDE_TYPING' },
      { t: 15100, type: 'SHOW_MESSAGE', id: 'p1' },

      { t: LOOP_MS - END_PAUSE_MS, type: 'HOLD_END' },
    ],
    [LOOP_MS, END_PAUSE_MS]
  );

  const [visibleIds, setVisibleIds] = useState(() => new Set());
  const [typingFor, setTypingFor] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isInputTyping, setIsInputTyping] = useState(false);

  const logRef = useRef(null);
  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach((x) => clearTimeout(x));
    timersRef.current = [];
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (!logRef.current) return;
      logRef.current.scrollTop = logRef.current.scrollHeight;
    });
  };

  const resetCycle = () => {
    setVisibleIds(new Set());
    setTypingFor(null);
    setInputText('');
    setIsInputTyping(false);
    if (logRef.current) logRef.current.scrollTop = 0;
  };

  const runInputTypewriter = () => {
    setIsInputTyping(true);
    setInputText('');
    const total = userPrompt.length;
    const duration = 2000; // ms
    const step = Math.max(25, Math.floor(duration / total));

    for (let i = 1; i <= total; i += 1) {
      const id = setTimeout(() => setInputText(userPrompt.slice(0, i)), i * step);
      timersRef.current.push(id);
    }

    const doneId = setTimeout(() => setIsInputTyping(false), duration + 50);
    timersRef.current.push(doneId);
  };

  const runCycle = () => {
    resetCycle();

    // schedule events
    timeline.forEach((evt) => {
      const id = setTimeout(() => {
        if (evt.type === 'INPUT_START') runInputTypewriter();
        if (evt.type === 'INPUT_DONE') {
          setIsInputTyping(false);
          setInputText(userPrompt);
        }

        if (evt.type === 'SHOW_MESSAGE') {
          setVisibleIds((prev) => {
            const next = new Set(prev);
            next.add(evt.id);
            return next;
          });
          // clear the input after sending (keeps window stable)
          setInputText('');
          scrollToBottom();
        }

        if (evt.type === 'SHOW_TYPING') {
          setTypingFor(evt.id);
          scrollToBottom();
        }
        if (evt.type === 'HIDE_TYPING') setTypingFor(null);
      }, evt.t);

      timersRef.current.push(id);
    });
  };

  useEffect(() => {
    clearTimers();

    if (prefersReducedMotion) {
      const all = new Set(convo.map((m) => m.id));
      setVisibleIds(all);
      setTypingFor(null);
      setInputText(userPrompt);
      setIsInputTyping(false);
      return () => clearTimers();
    }

    runCycle();

    const intervalId = setInterval(() => {
      clearTimers();
      runCycle();
    }, LOOP_MS);

    timersRef.current.push(intervalId);
    return () => clearTimers();
  }, [prefersReducedMotion, convo, LOOP_MS, userPrompt, timeline]);

  const visibleMessages = convo.filter((m) => visibleIds.has(m.id));
  const typingMeta = typingFor ? convo.find((m) => m.id === typingFor) : null;

  return (
    <section
      id="hero"
      ref={sectionRef}
      className={`hero-section ${isVisible ? 'animate-in' : ''}`}
      aria-label="AwakeVerse hero"
    >
      <div className="hero-container">
        <div className="hero-scene">
          <img
            src="/images/heroscene.jpeg"
            alt="Historical figures in conversation"
            className="hero-image"
            loading="eager"
            width="1200"
            height="675"
          />

          <div className="heroChatSlot" aria-label="Conversation preview">
            <div className="heroChat" role="region" aria-label="Conversation window preview">
              <div className="heroChatHeader">
                <div className="heroChatTitle">
                  <span className="heroChatTitleDot" aria-hidden="true" />
                  <span>Dialogue</span>
                </div>
                <Link to="/register" className="heroChatHeaderCta">
                  Start Chat
                </Link>
              </div>

              <div className="heroChatLog" ref={logRef} role="log" aria-live="polite" aria-relevant="additions text">
                {visibleMessages.map((m) => (
                  <div key={m.id} className={`heroMsgRow ${m.kind === 'user' ? 'isUser' : 'isChar'}`}>
                    <div className={`heroAvatar ${m.kind === 'user' ? 'isUser' : 'isChar'}`} aria-hidden="true">
                      {m.kind === 'user' ? 'Y' : m.initials}
                    </div>

                    <div className="heroBubbleWrap">
                      <div className="heroMeta">
                        <span className="heroName">{m.kind === 'user' ? 'You' : m.name}</span>
                      </div>
                      <div className={`heroBubble ${m.kind === 'user' ? 'isUser' : 'isChar'}`}>{m.text}</div>
                    </div>
                  </div>
                ))}

                {typingMeta && (
                  <div className="heroMsgRow isChar isTyping">
                    <div className="heroAvatar isChar" aria-hidden="true">
                      {typingMeta.initials}
                    </div>
                    <div className="heroBubbleWrap">
                      <div className="heroMeta">
                        <span className="heroName">{typingMeta.name}</span>
                      </div>
                      <div className="heroBubble isChar heroBubbleTyping">
                        <TypingDots />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="heroChatFooter" aria-label="Chat input preview">
                <div className={`heroInputFake ${isInputTyping ? 'isTyping' : ''}`}>
                  <span className="heroInputText">{inputText || 'Ask anything…'}</span>
                  {isInputTyping && <span className="heroInputCursor" aria-hidden="true">|</span>}
                </div>
                <Link to="/register" className="heroSendFake" aria-label="Start your first conversation">
                  →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-content">
          <h1 className="hero-title">The Conversation AI</h1>
          <p className="hero-subtitle">Create, chat, collaborate, and earn with iconic minds</p>
          <Link to="/register" className="hero-cta">
            Start Your First Conversation <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
