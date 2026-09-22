// src/components/PaymentSuccess.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PaymentRouter from '../services/PaymentRouter';
import { colors, typography, shadows, borderRadius, transitions } from '../design-system/tokens';
import './PaymentSuccess.css';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [provider, setProvider] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const detectedProvider = searchParams.get('provider');
    const sessionId = searchParams.get('session_id');
    const subscriptionId = searchParams.get('subscription_id');
    setProvider(detectedProvider);

    if (!sessionId && !subscriptionId) {
      navigate('/', { replace: true });
      return;
    }

    (async () => {
      try {
        // Routes through PaymentRouter → StripeProvider.getSessionStatus()
        const idToVerify = detectedProvider === 'paypal' ? subscriptionId : sessionId;
        const result = await PaymentRouter.verifySession(idToVerify, detectedProvider || 'stripe');

        if (!result.success) {
          console.error('[PaymentSuccess] verifySession failed:', result.error);
          throw new Error(result.error?.message || 'Verification failed');
        }

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

  const progressPct = ((4 - secondsLeft) / 4) * 100;

  // ─── Derived token values used in inline styles ───────────────────────────
  const t = {
    canvas:       colors.background.canvas,
    surface:      colors.background.surface,
    interactive:  colors.background.interactive,
    accent:       colors.accent.primary,
    accentHover:  colors.accent.hover,
    accentGlow:   colors.accent.glow,
    accentGlowSt: colors.accent.glowStrong,
    ivory:        colors.brand.ivory,
    ivoryDim:     colors.brand.ivoryDim,
    success:      colors.semantic.success,
    error:        colors.semantic.error,
    textPrimary:  colors.text.primary,
    textSecondary:colors.text.secondary,
    borderSubtle: colors.border.subtle,
    borderMedium: colors.border.medium,
    shadow04:     shadows.elevation04,
    shadowGlow:   shadows.glow,
  };

  return (
    <div
      className="ps-root"
      style={{
        background: `radial-gradient(1100px 700px at 50% -5%, ${colors.background.interactive} 0%, ${colors.background.canvas} 55%, ${colors.background.canvas} 100%)`,
      }}
    >
      <div
        className="ps-card"
        style={{
          background: colors.background.surface,
          border: `1px solid ${status === 'error' ? colors.border.medium : colors.border.subtle}`,
          boxShadow: status === 'success'
            ? `${shadows.elevation04}, 0 0 60px ${colors.accent.glow}`
            : shadows.elevation03,
        }}
      >
        {/* Subtle top accent line */}
        <div
          className="ps-accent-line"
          style={{
            background: status === 'error'
              ? `linear-gradient(90deg, transparent, ${colors.semantic.error}, transparent)`
              : `linear-gradient(90deg, transparent, ${colors.accent.primary}, transparent)`,
          }}
        />

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="ps-header">
          <div
            className={`ps-hero ${status === 'success' ? 'ps-hero--pulse' : ''}`}
            style={{
              background: status === 'error'
                ? `radial-gradient(circle, rgba(239,68,68,0.12), transparent)`
                : `radial-gradient(circle, ${colors.accent.glow}, transparent)`,
              border: `1px solid ${status === 'error' ? 'rgba(239,68,68,0.25)' : colors.border.medium}`,
            }}
          >
            {status === 'success' && (
              <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="24" stroke={t.ivory} strokeOpacity="0.3" strokeWidth="1.5" />
                <path
                  d="M14.5 27.5l8 7 15-16"
                  stroke={t.ivory}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ps-check"
                />
              </svg>
            )}
            {status === 'verifying' && (
              <svg width="32" height="32" viewBox="0 0 50 50" fill="none">
                <circle cx="25" cy="25" r="20" stroke={t.accent} strokeOpacity="0.2" strokeWidth="4" />
                <path
                  d="M45 25a20 20 0 0 1-20 20"
                  stroke={t.accent}
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="ps-spinner"
                />
              </svg>
            )}
            {status === 'error' && (
              <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="24" stroke={t.error} strokeOpacity="0.3" strokeWidth="1.5" />
                <path d="M18 18l16 16M34 18L18 34" stroke={t.error} strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            )}
          </div>

          <div className="ps-heading">
            <h1
              className="ps-title"
              style={{
                color: status === 'error' ? t.error : t.textPrimary,
                fontFamily: typography.fonts.display,
              }}
            >
              {status === 'verifying' && 'Processing…'}
              {status === 'success'   && 'Payment confirmed'}
              {status === 'error'     && 'Verification failed'}
            </h1>
            <p
              className="ps-subtitle"
              style={{ color: t.textSecondary, fontFamily: typography.fonts.body }}
            >
              {status === 'verifying' && `Confirming your subscription with ${provider === 'paypal' ? 'PayPal' : 'Stripe'}…`}
              {status === 'success'   && 'Your subscription is active. Welcome to AwakeVerse.'}
              {status === 'error'     && 'Something went wrong confirming your payment. Redirecting…'}
            </p>
          </div>
        </div>

        {/* ── Success body ────────────────────────────────────────────── */}
        {status !== 'error' && (
          <div className="ps-grid">

            {/* Left: feature list */}
            <div
              className="ps-panel"
              style={{
                background: colors.background.interactive,
                border: `1px solid ${colors.border.subtle}`,
              }}
            >
              <p
                className="ps-panel-label"
                style={{ color: t.ivory, fontFamily: typography.fonts.display }}
              >
                What's unlocked
              </p>

              <ul className="ps-features">
                {[
                  'Creator Hub access',
                  'Build characters and scenarios',
                  'Publish to the marketplace',
                  'Track engagement metrics',
                  'Monetize your creations',
                ].map((text, idx) => (
                  <li
                    key={idx}
                    className="ps-feature-item"
                    style={{
                      color: t.textPrimary,
                      animationDelay: `${80 + idx * 65}ms`,
                      fontFamily: typography.fonts.body,
                    }}
                  >
                    <span
                      className="ps-feature-tick"
                      style={{
                        background: `rgba(99,102,241,0.1)`,
                        border: `1px solid ${colors.border.medium}`,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M3 8l3.5 3.5L13 5"
                          stroke={t.accent}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: countdown + CTA */}
            <div
              className="ps-panel ps-panel--right"
              style={{
                background: colors.background.interactive,
                border: `1px solid ${colors.border.subtle}`,
              }}
            >
              {/* Countdown */}
              <div className="ps-countdown-wrap">
                <div className="ps-countdown-row">
                  <span
                    style={{ color: t.textSecondary, fontFamily: typography.fonts.body, fontSize: 13 }}
                  >
                    Redirecting to AwakeVerse
                  </span>
                  {status === 'success' && (
                    <span
                      style={{
                        color: t.accent,
                        fontWeight: 600,
                        fontFamily: typography.fonts.body,
                        fontSize: 13,
                      }}
                    >
                      {secondsLeft}s
                    </span>
                  )}
                </div>

                <div
                  className="ps-progress-track"
                  style={{ background: colors.border.subtle }}
                >
                  <div
                    className="ps-progress-fill"
                    style={{
                      width: `${progressPct}%`,
                      background: `linear-gradient(90deg, ${t.accent}, ${t.accentHover})`,
                      boxShadow: `0 0 12px ${t.accentGlow}`,
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="ps-actions">
                <button
                  className="ps-btn ps-btn--primary"
                  onClick={() => navigate('/app#chat', { replace: true })}
                  style={{
                    background: `linear-gradient(135deg, ${t.accent}, ${t.accentHover})`,
                    boxShadow: `0 4px 20px ${t.accentGlow}`,
                    fontFamily: typography.fonts.body,
                    color: '#fff',
                  }}
                >
                  Enter Creator Hub
                </button>
                <button
                  className="ps-btn ps-btn--ghost"
                  onClick={() => navigate('/', { replace: true })}
                  style={{
                    border: `1px solid ${colors.border.medium}`,
                    color: t.textSecondary,
                    fontFamily: typography.fonts.body,
                  }}
                >
                  Go home
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ── Error state ─────────────────────────────────────────────── */}
        {status === 'error' && (
          <div
            className="ps-error-panel"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: `1px solid rgba(239,68,68,0.2)`,
              color: t.textPrimary,
              fontFamily: typography.fonts.body,
            }}
          >
            We couldn't confirm your payment. You'll be redirected shortly to try again.
          </div>
        )}
      </div>
    </div>
  );
}