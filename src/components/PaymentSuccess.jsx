// src/components/PaymentSuccess.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [provider, setProvider] = useState(null); // Track payment provider
  const timerRef = useRef(null);
  


  useEffect(() => {
    const detectedProvider = searchParams.get('provider'); // 'stripe' or 'paypal'
    const sessionId = searchParams.get('session_id'); // Stripe
    const subscriptionId = searchParams.get('subscription_id'); // PayPal
    setProvider(detectedProvider); // Save to state


    if (!sessionId && !subscriptionId) {
      navigate('/', { replace: true });
      return;
    }

    (async () => {
      try {
        // Choose verification endpoint based on provider
        const verifyUrl = detectedProvider === 'paypal' 
          ? `/api/paypal/subscription/verify?subscription_id=${encodeURIComponent(subscriptionId)}`
          : `/api/stripe/checkout/verify?session_id=${encodeURIComponent(sessionId)}`;

        const res = await fetch(verifyUrl, { credentials: 'include' });
    
        if (!res.ok) throw new Error('Verification failed');

        setStatus('success');
        setSecondsLeft(4);
        timerRef.current = setInterval(() => {
          setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
        }, 1000);

        setTimeout(() => {
          navigate('/app#chat', { replace: true });
        }, 4000);
      } catch (err) {
        console.error('Payment verification error:', err);
        setStatus('error');
        setTimeout(() => navigate('/payment-cancelled', { replace: true }), 2000);
      }
    })();

    return () => timerRef.current && clearInterval(timerRef.current);
  }, [searchParams, navigate]);

  // Theme tokens
  const colors = {
    bg: 'radial-gradient(1200px 800px at 50% -10%, #0d1330 0%, #0a0f26 45%, #070b1d 100%)',
    panel: '#0f1637',
    gold: '#FFD700',
    goldSoft: 'rgba(255, 215, 0, 0.25)',
    green: '#21d07a',
    red: '#ff5c6a',
    text: '#e6ebff',
    textDim: '#b8c2ff',
    border: 'rgba(255,255,255,0.08)',
  };

  const progressPct = ((4 - secondsLeft) / 4) * 100;

  return (
    <div className="ps-root" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: colors.bg,
      padding: '24px',
    }}>
      {/* Scoped CSS (desktop-first + mobile breakpoints) */}
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.88); opacity: 0; }
          60% { transform: scale(1.03); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0px rgba(255,215,0,0.35), inset 0 0 0 rgba(255,215,0,0.15); }
          50% { box-shadow: 0 0 22px rgba(255,215,0,0.6), inset 0 0 10px rgba(255,215,0,0.2); }
        }
        @keyframes checkStroke {
          0% { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .ps-card {
          width: min(980px, 92vw);
          background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00));
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 28px;
          position: relative;
          animation: popIn 420ms ease-out;
          backdrop-filter: blur(6px);
        }
        .ps-rim {
          position: absolute;
          inset: 0;
          border-radius: 20px;
          pointer-events: none;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.05), 0 0 80px rgba(255, 215, 0, 0.25);
        }
        .ps-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 18px;
        }
        .ps-hero {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: radial-gradient(36px 36px at 50% 45%, rgba(255, 215, 0, 0.25), transparent);
          border: 1px solid rgba(255, 215, 0, 0.25);
        }
        .ps-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 20px;
        }
        .ps-panel {
          background: linear-gradient(180deg, rgba(15,22,55,0.88), rgba(15,22,55,0.58));
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 20px 22px;
          position: relative;
          overflow: hidden;
        }
        .ps-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(500px 200px at 0% 0%, rgba(255, 215, 0, 0.25), transparent 60%);
          pointer-events: none;
        }
        .ps-actions {
          display: flex;
          gap: 10px;
        }
        .ps-btn {
          padding: 12px 14px;
          border-radius: 12px;
          border: 0;
          cursor: pointer;
        }
        .ps-btn--primary {
          flex: 1;
          background: linear-gradient(180deg, #FFD700, #f7c400);
          color: #1a1a1a;
          font-weight: 700;
          letter-spacing: 0.3px;
          box-shadow: 0 6px 24px rgba(255, 215, 0, 0.25);
        }
        .ps-btn--ghost {
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent;
          color: #e6ebff;
        }

        /* ——— Mobile ——— */
        @media (max-width: 860px) {
          .ps-card { padding: 18px; border-radius: 16px; }
          .ps-header { gap: 12px; }
          .ps-hero { width: 52px; height: 52px; }
          .ps-grid { grid-template-columns: 1fr; gap: 14px; }
          .ps-actions { flex-direction: column; }
          .ps-btn { width: 100%; padding: 12px; border-radius: 10px; }
        }

        @media (max-width: 420px) {
          .ps-card { padding: 14px; }
          .ps-hero { width: 46px; height: 46px; }
        }
      `}</style>

      <div className="ps-card">
        <div className="ps-rim" />

        {/* Header */}
        <div className="ps-header">
          <div
            className="ps-hero"
            style={{ animation: status === 'success' ? 'pulseGlow 2.2s ease-in-out infinite' : undefined }}
          >
            {/* Animated icons */}
            {status === 'success' && (
              <svg width="34" height="34" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="24" stroke={colors.gold} strokeOpacity="0.25" strokeWidth="2" />
                <path
                  d="M14.5 27.5l8 7 15-16"
                  stroke={colors.gold}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ strokeDasharray: 60, strokeDashoffset: 0, animation: 'checkStroke 650ms ease-out forwards' }}
                />
              </svg>
            )}
            {status === 'verifying' && (
              <svg width="34" height="34" viewBox="0 0 50 50" fill="none" style={{ transform: 'translateZ(0)' }}>
                <circle cx="25" cy="25" r="20" stroke={colors.gold} strokeOpacity="0.25" strokeWidth="4" />
                <path d="M45 25a20 20 0 0 1-20 20"
                  stroke={colors.gold} strokeWidth="4" strokeLinecap="round"
                  style={{ transformOrigin: '25px 25px', animation: 'spin 1s linear infinite' }} />
              </svg>
            )}
            {status === 'error' && (
              <svg width="34" height="34" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="24" stroke={colors.red} strokeOpacity="0.25" strokeWidth="2" />
                <path d="M18 18l16 16M34 18L18 34" stroke={colors.red} strokeWidth="4" strokeLinecap="round" />
              </svg>
            )}
          </div>

          <div>
            <h1 style={{
              margin: 0,
              fontSize: 28,
              letterSpacing: 0.5,
              color: colors.text,
            }}>
              {status === 'verifying' && 'Processing Payment…'}
              {status === 'success' && 'Payment Successful'}
              {status === 'error' && 'Verification Failed'}
            </h1>
            <p style={{
              margin: '6px 0 0',
              color: colors.textDim,
              fontSize: 14,
              lineHeight: 1.5,
            }}>
              {status === 'verifying' && `Please wait while we confirm your subscription with ${provider === 'paypal' ? 'PayPal' : 'Stripe'}.`}
              {status === 'success' && 'Your subscription is active. Welcome to the Creator experience.'}
              {status === 'error' && 'Something went wrong confirming your payment. Redirecting…'}
            </p>
          </div>
        </div>

        {/* Content */}
        {status !== 'error' && (
          <div className="ps-grid">
            {/* Left: Feature list */}
            <div className="ps-panel">
              <h2 style={{
                margin: 0,
                color: colors.gold,
                fontSize: 18,
                letterSpacing: 0.6,
                textShadow: `0 0 12px ${colors.goldSoft}`,
                position: 'relative',
                zIndex: 1,
              }}>
                You now have Creator access
              </h2>

              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '14px 0 0',
                display: 'grid',
                gap: 12,
                position: 'relative',
                zIndex: 1,
              }}>
                {[
                  'You can now access Creator Hub',
                  'Create characters and scenarios',
                  'Publish your characters and scenarios to the marketplace',
                  'Track engagement metrics',
                  'Monetize your creations and earn!',
                ].map((text, idx) => (
                  <li key={idx} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    color: colors.text,
                    fontSize: 15.5,
                    lineHeight: 1.55,
                    animation: `fadeUp 450ms ease ${100 + idx * 70}ms both`,
                  }}>
                    <span style={{
                      width: 22,
                      height: 22,
                      minWidth: 22,
                      borderRadius: 6,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'rgba(255, 215, 0, 0.12)',
                      border: `1px solid ${colors.goldSoft}`,
                      marginTop: 2,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                        <path d="M5 10l3 3 7-7" stroke={colors.gold} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Countdown / CTA */}
            <div className="ps-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}>
                  <span style={{ color: colors.textDim, fontSize: 14 }}>
                    Redirecting to AwakeVerse
                  </span>
                  {status === 'success' && (
                    <span style={{ color: colors.gold, fontWeight: 600 }}>
                      {secondsLeft}s
                    </span>
                  )}
                </div>

                <div style={{
                  height: 8,
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${progressPct}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${colors.gold}, #ffe680)`,
                    boxShadow: `0 0 18px ${colors.goldSoft}`,
                    transition: 'width 400ms ease',
                  }} />
                </div>
              </div>

              <div className="ps-actions">
                <button
                  onClick={() => navigate('/app#chat', { replace: true })}
                  className="ps-btn ps-btn--primary"
                >
                  Enter Creator Hub
                </button>
                <button
                  onClick={() => navigate('/', { replace: true })}
                  className="ps-btn ps-btn--ghost"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error panel */}
        {status === 'error' && (
          <div style={{
            background: 'rgba(255, 92, 106, 0.08)',
            border: `1px solid rgba(255, 92, 106, 0.35)`,
            color: colors.text,
            padding: '18px 20px',
            borderRadius: 14,
            marginTop: 12,
          }}>
            We couldn’t confirm your payment. You’ll be redirected to retry shortly.
          </div>
        )}
      </div>
    </div>
  );
}
