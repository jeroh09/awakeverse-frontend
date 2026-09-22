// src/components/PodcastStudio/InsufficientCreditsBanner.jsx
//
// Replaces VideoBudgetBanner. The old seconds-budget 403 path is retired — the
// backend now returns a 402 (insufficient credits) from the podcast render POST.
// This shows that state in the studio's onboarding visual language (double border,
// Syne heading, Inter body, AV monogram), matching the old banner so nothing looks
// out of place.
//
// Props:
//   block     — { needed, available, shortBy, title, message } | null  (from the 402)
//   onUpgrade — go to billing (top up / upgrade)
//   onDismiss — clear the block

import React from 'react';

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());

export default function InsufficientCreditsBanner({ block, onUpgrade, onDismiss }) {
  if (!block) return null;

  return (
    <div style={{
      background:   'rgba(15, 23, 42, 0.9)',
      border:       '1px solid rgba(245, 158, 11, 0.30)',
      boxShadow:    [
        '0 0 0 1px rgba(245, 158, 11, 0.08)',
        '0 8px 28px rgba(0, 0, 0, 0.45)',
        '0 4px 18px rgba(245, 158, 11, 0.08)',
      ].join(', '),
      borderRadius: '14px',
      padding:      '1.1rem 1.25rem 1rem',
      marginBottom: '0.85rem',
      display:      'flex',
      flexDirection:'column',
      gap:          '0.65rem',
    }}>

      {/* Header row: AV monogram + eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{
          fontFamily: "'Caveat', cursive", fontStyle: 'italic', fontWeight: 600,
          fontSize: '1.25rem', lineHeight: 1, letterSpacing: '0.04em', flexShrink: 0,
        }}>
          <span style={{ color: '#6366f1' }}>A</span>
          <span style={{ color: '#f5f5dc' }}>V</span>
        </span>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontSize: '0.68rem', fontWeight: 600,
          letterSpacing: '0.18em', textTransform: 'uppercase', color: '#f59e0b',
        }}>
          Not enough credits
        </span>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: '#f59e0b',
          flexShrink: 0, boxShadow: '0 0 6px rgba(245,158,11,0.8)', marginLeft: 'auto',
        }} />
      </div>

      {/* Heading */}
      <p style={{
        fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700,
        color: '#f5f5dc', lineHeight: 1.25, margin: 0,
      }}>
        {block.title || 'You need more credits to make this podcast.'}
      </p>

      {/* Detail */}
      <p style={{
        fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', lineHeight: 1.65,
        color: '#94a3b8', margin: 0,
      }}>
        {block.message || (
          <>This needs <b style={{ color: '#f5f5dc' }}>{fmt(block.needed)}</b> credits and you
          have <b style={{ color: '#f5f5dc' }}>{fmt(block.available)}</b> — you&rsquo;re{' '}
          <b style={{ color: '#f5f5dc' }}>{fmt(block.shortBy)}</b> short.</>
        )}
      </p>

      {/* Callout stripe */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.55rem 0.85rem', background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.2)', borderRadius: '9px',
        fontFamily: "'Inter', sans-serif", fontSize: '0.73rem', color: '#818cf8',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: '#6366f1',
          flexShrink: 0, boxShadow: '0 0 6px rgba(99,102,241,0.8)',
        }} />
        Top up or upgrade your plan for more monthly credits.
      </div>

      {/* Footer buttons */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        paddingTop: '0.35rem', borderTop: '1px solid rgba(148,163,184,0.08)', marginTop: '0.1rem',
      }}>
        <button
          onClick={onUpgrade}
          style={{
            fontFamily: "'Inter', sans-serif", fontSize: '0.82rem', fontWeight: 600,
            padding: '0.52rem 1.2rem', borderRadius: '9px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: '#fff',
            boxShadow: '0 2px 14px rgba(99,102,241,0.4)', transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 4px 22px rgba(99,102,241,0.55)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 2px 14px rgba(99,102,241,0.4)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Go to billing
        </button>

        <button
          onClick={onDismiss}
          style={{
            fontFamily: "'Inter', sans-serif", fontSize: '0.82rem', fontWeight: 600,
            padding: '0.52rem 1.2rem', borderRadius: '9px', cursor: 'pointer',
            background: 'transparent', color: '#64748b', border: '1px solid transparent',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.borderColor = 'rgba(148,163,184,0.18)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}