// src/components/launcher/ActionPill.jsx
// Unified action pill for the desktop ChatLauncher: Create · Discover · Map · Scan
// in a single indigo-bordered capsule. Selection is a SOLID ROUNDED PILL (never a
// rectangle); indigo hairline dividers show only between two idle segments.
//
// Presentational + defensive:
//   • all handlers default to no-ops, so a missing prop can't throw.
//   • Map/Scan keep their hover tooltips and their "active" (modal-open) highlight,
//     driven by `activeTool` — same semantics as the old toggle.
//   • Create is the subtle lead segment; the active tool is the solid pill.
import React from 'react';
import theme from '../../design-system/tokens';

const noop = () => {};
const safe = (fn) => (typeof fn === 'function' ? fn : noop);

const ICONS = {
  create: (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" style={{ flexShrink: 0 }}>
      <line x1="9" y1="3.5" x2="9" y2="14.5" />
      <line x1="3.5" y1="9" x2="14.5" y2="9" />
    </svg>
  ),
  discover: (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r="7" />
      <polygon points="11.5,6.5 8,8 6.5,11.5 10,10" />
    </svg>
  ),
  map: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r="7" />
      <path d="M9 2c-1.5 1.5-2.5 3.8-2.5 7s1 5.5 2.5 7" />
      <path d="M9 2c1.5 1.5 2.5 3.8 2.5 7s-1 5.5-2.5 7" />
      <line x1="2.5" y1="9" x2="15.5" y2="9" />
      <line x1="3.2" y1="6" x2="14.8" y2="6" />
      <line x1="3.2" y1="12" x2="14.8" y2="12" />
    </svg>
  ),
  scan: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ flexShrink: 0 }}>
      <circle cx="8.5" cy="8.5" r="4.5" />
      <line x1="12" y1="12" x2="16" y2="16" />
      <line x1="8.5" y1="3.5" x2="8.5" y2="4.5" />
      <line x1="13.5" y1="8.5" x2="12.5" y2="8.5" />
      <line x1="8.5" y1="13.5" x2="8.5" y2="12.5" />
      <line x1="3.5" y1="8.5" x2="4.5" y2="8.5" />
    </svg>
  )
};

const TOOLTIP_TEXT = { map: 'Explore myths and legends.', scan: 'Upload myths and icons.' };
// horizontal centre of each of the 4 equal segments, as a % of pill width
const TOOLTIP_LEFT = { map: '62.5%', scan: '87.5%' };

export default function ActionPill({
  onCreate,
  onDiscover,
  onMap,
  onScan,
  activeTool = null,   // 'map' | 'scan' | null
  toolHint = null,     // 'map' | 'scan' | null
  setToolHint
}) {
  const setHint = safe(setToolHint);

  // Per-segment visual state: 'lead' (Create) | 'active' (open tool) | 'idle'
  const segments = [
    { key: 'create', label: 'Create', icon: ICONS.create, onClick: safe(onCreate), state: 'lead' },
    { key: 'discover', label: 'Discover', icon: ICONS.discover, onClick: safe(onDiscover), state: 'idle' },
    { key: 'map', label: 'Map', icon: ICONS.map, onClick: safe(onMap), tool: 'map', state: activeTool === 'map' ? 'active' : 'idle' },
    { key: 'scan', label: 'Scan', icon: ICONS.scan, onClick: safe(onScan), tool: 'scan', state: activeTool === 'scan' ? 'active' : 'idle' }
  ];

  const bgFor = (state) => {
    if (state === 'active') return `linear-gradient(135deg, ${theme.colors.accent.primary}, ${theme.colors.accent.hover})`;
    if (state === 'lead') return 'rgba(99,102,241,0.18)';
    return 'transparent';
  };
  const colorFor = (state) => (state === 'idle' ? theme.colors.text.secondary : '#fff');

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '420px', marginTop: theme.spacing.lg }}>
      {/* hover tooltip for Map / Scan */}
      {(toolHint === 'map' || toolHint === 'scan') && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: TOOLTIP_LEFT[toolHint],
          transform: 'translateX(-50%)',
          background: theme.colors.background.surface,
          border: `1px solid ${theme.colors.border.medium}`,
          borderRadius: theme.borderRadius.sm,
          padding: '4px 10px',
          fontSize: theme.typography.sizes.caption,
          fontFamily: theme.typography.fonts.body,
          color: theme.colors.text.secondary,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: theme.shadows.elevation02,
          zIndex: 10
        }}>
          {TOOLTIP_TEXT[toolHint]}
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        padding: '4px',
        border: `1px solid ${theme.colors.accent.primary}`,
        borderRadius: theme.borderRadius.full,
        background: '#0C1220',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
      }}>
        {segments.map((seg, i) => {
          const prev = segments[i - 1];
          const showDivider = i > 0 && seg.state === 'idle' && prev && prev.state === 'idle';
          const isActive = seg.state === 'active';
          const isLead = seg.state === 'lead';

          return (
            <React.Fragment key={seg.key}>
              {showDivider && (
                <span aria-hidden style={{
                  alignSelf: 'center',
                  width: '1px',
                  height: '52%',
                  background: theme.colors.accent.primary,
                  opacity: 0.5
                }} />
              )}
              <button
                type="button"
                onClick={seg.onClick}
                aria-label={seg.label}
                onMouseEnter={(e) => {
                  if (seg.tool) setHint(seg.tool);
                  if (seg.state === 'idle') {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
                    e.currentTarget.style.color = theme.colors.text.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (seg.tool) setHint(null);
                  if (seg.state === 'idle') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = theme.colors.text.secondary;
                  }
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.62rem 0.4rem',
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  borderRadius: theme.borderRadius.full,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.bodySmall,
                  fontWeight: theme.typography.weights.semibold,
                  whiteSpace: 'nowrap',
                  transition: theme.transitions.fast,
                  background: bgFor(seg.state),
                  color: colorFor(seg.state),
                  boxShadow: isActive ? '0 2px 10px rgba(99,102,241,0.4)' : 'none'
                }}
                onFocus={(e) => {
                  if (seg.state === 'idle') e.currentTarget.style.color = theme.colors.text.primary;
                }}
                onBlur={(e) => {
                  if (seg.state === 'idle') e.currentTarget.style.color = theme.colors.text.secondary;
                }}
              >
                {seg.icon}
                {seg.label}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}