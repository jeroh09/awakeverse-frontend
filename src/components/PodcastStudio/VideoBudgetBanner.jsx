// src/components/PodcastStudio/VideoBudgetBanner.jsx
//
// Budget limit banner — shown in the Generate tab when a 403
// video budget error fires via useVideoBudget.
//
// Design: matches AwakeVerse onboarding language exactly.
//   • Double border (ob-panel pattern)
//   • Syne heading · Inter body
//   • Indigo/ivory AV monogram (Caveat italic)
//   • ob-btn--primary upgrade CTA · ob-btn--ghost dismiss
//   • ob-eyebrow label above heading
//
// Props:
//   budgetState   — from useVideoBudget()
//   budgetDisplay — from useVideoBudget()
//   onUpgrade     — handleUpgrade from useVideoBudget()
//   onDismiss     — clearBudgetError from useVideoBudget()

import React from 'react';

// ── Tier display names — mirrors PaymentRouter.js TIER_CONFIG ────────────────
const TIER_DISPLAY = {
  starter:   'EXPLORER',
  pro:       'PROFESSIONAL',
  unlimited: 'CREATOR',
};

export default function VideoBudgetBanner({
  budgetState,
  budgetDisplay,
  onUpgrade,
  onDismiss,
}) {
  if (!budgetState?.hit) return null;

  const tierLabel = budgetState.suggestedTier
    ? TIER_DISPLAY[budgetState.suggestedTier] || budgetState.suggestedTier
    : null;

  return (
    <div style={{
      // ── Double border — mirrors .ob-panel exactly ──────────────────────
      background:   'rgba(15, 23, 42, 0.9)',
      border:       '1px solid rgba(239, 68, 68, 0.28)',
      boxShadow:    [
        '0 0 0 1px rgba(239, 68, 68, 0.08)',   // outer ring
        '0 8px 28px rgba(0, 0, 0, 0.45)',       // depth
        '0 4px 18px rgba(239, 68, 68, 0.08)',   // warm red ambient
      ].join(', '),
      borderRadius: '14px',
      padding:      '1.1rem 1.25rem 1rem',
      marginBottom: '0.85rem',
      display:      'flex',
      flexDirection:'column',
      gap:          '0.65rem',
    }}>

      {/* ── Header row: AV monogram + eyebrow ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {/* AV monogram — Caveat italic, mirrors .ob-wordmark */}
        <span style={{
          fontFamily:  "'Caveat', cursive",
          fontStyle:   'italic',
          fontWeight:  600,
          fontSize:    '1.25rem',
          lineHeight:  1,
          letterSpacing: '0.04em',
          flexShrink:  0,
        }}>
          <span style={{ color: '#6366f1' }}>A</span>
          <span style={{ color: '#f5f5dc' }}>V</span>
        </span>

        {/* Eyebrow — mirrors .ob-eyebrow */}
        <span style={{
          fontFamily:    "'Inter', sans-serif",
          fontSize:      '0.68rem',
          fontWeight:    600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color:         '#ef4444',
        }}>
          Monthly limit reached
        </span>

        {/* Glowing dot — mirrors .ob-callout__dot */}
        <span style={{
          width:        6,
          height:       6,
          borderRadius: '50%',
          background:   '#ef4444',
          flexShrink:   0,
          boxShadow:    '0 0 6px rgba(239,68,68,0.8)',
          marginLeft:   'auto',
        }} />
      </div>

      {/* ── Heading — mirrors .ob-heading ── */}
      <p style={{
        fontFamily: "'Syne', sans-serif",
        fontSize:   '1rem',
        fontWeight: 700,
        color:      '#f5f5dc',
        lineHeight: 1.25,
        margin:     0,
      }}>
        You've used your video budget for this cycle.
      </p>

      {/* ── Usage detail — mirrors .ob-text ── */}
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize:   '0.8rem',
        lineHeight: 1.65,
        color:      '#94a3b8',
        margin:     0,
      }}>
        {budgetDisplay?.secondsUsedLabel} of {budgetDisplay?.budgetLabel} used
        across all video types.{' '}
        {budgetDisplay?.remainingLabel === '0m'
          ? 'No seconds remaining this billing cycle.'
          : `${budgetDisplay?.remainingLabel} remaining.`}
      </p>

      {/* ── Callout stripe — mirrors .ob-callout ── */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '0.6rem',
        padding:      '0.55rem 0.85rem',
        background:   'rgba(99,102,241,0.06)',
        border:       '1px solid rgba(99,102,241,0.2)',
        borderRadius: '9px',
        fontFamily:   "'Inter', sans-serif",
        fontSize:     '0.73rem',
        color:        '#818cf8',
      }}>
        <span style={{
          width:        6,
          height:       6,
          borderRadius: '50%',
          background:   '#6366f1',
          flexShrink:   0,
          boxShadow:    '0 0 6px rgba(99,102,241,0.8)',
        }} />
        {tierLabel
          ? `Upgrade to ${tierLabel} for more monthly video time.`
          : 'Upgrade your plan for more monthly video time.'}
      </div>

      {/* ── Footer buttons — mirrors .ob-footer pattern ── */}
      <div style={{
        display:       'flex',
        alignItems:    'center',
        gap:           '0.6rem',
        paddingTop:    '0.35rem',
        borderTop:     '1px solid rgba(148,163,184,0.08)',
        marginTop:     '0.1rem',
      }}>
        {/* Upgrade — mirrors .ob-btn--primary */}
        {budgetState.suggestedTier && (
          <button
            onClick={() => onUpgrade(budgetState.suggestedTier)}
            disabled={budgetState.upgrading}
            style={{
              fontFamily:  "'Inter', sans-serif",
              fontSize:    '0.82rem',
              fontWeight:  600,
              padding:     '0.52rem 1.2rem',
              borderRadius:'9px',
              border:      'none',
              cursor:      budgetState.upgrading ? 'wait' : 'pointer',
              background:  'linear-gradient(135deg, #6366f1, #818cf8)',
              color:       '#fff',
              boxShadow:   budgetState.upgrading
                ? 'none'
                : '0 2px 14px rgba(99,102,241,0.4)',
              opacity:     budgetState.upgrading ? 0.65 : 1,
              transition:  'all 0.18s ease',
            }}
            onMouseEnter={e => {
              if (!budgetState.upgrading) {
                e.currentTarget.style.boxShadow = '0 4px 22px rgba(99,102,241,0.55)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 2px 14px rgba(99,102,241,0.4)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {budgetState.upgrading ? 'Redirecting…' : `Upgrade to ${tierLabel}`}
          </button>
        )}

        {/* Dismiss — mirrors .ob-btn--ghost */}
        <button
          onClick={onDismiss}
          style={{
            fontFamily:  "'Inter', sans-serif",
            fontSize:    '0.82rem',
            fontWeight:  600,
            padding:     '0.52rem 1.2rem',
            borderRadius:'9px',
            cursor:      'pointer',
            background:  'transparent',
            color:       '#64748b',
            border:      '1px solid transparent',
            transition:  'all 0.18s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color       = '#94a3b8';
            e.currentTarget.style.borderColor = 'rgba(148,163,184,0.18)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color       = '#64748b';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}