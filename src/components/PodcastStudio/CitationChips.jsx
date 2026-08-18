// src/components/PodcastStudio/CitationChips.jsx
//
// Citation chips rendered under a script line in the Write Lines editor.
// Each chip = one claim the line rests on: "sourceLabel · anchor", coloured
// by the grounding verdict. Clicking a chip toggles a small popover showing
// the claim snippet, so a reviewer can check the passage before rendering.
//
// States:
//   verdict 'supported'         → indigo chip (normal)
//   verdict 'weak'|'unsupported'→ amber chip + "check" mark — the grounding
//                                 pass couldn't fully back this line
//   verdict null                → neutral chip (verify pass skipped)
//   edited (prop)               → ALL chips go amber-outline "edited —
//                                 unverified": the user changed the line text,
//                                 so verdicts no longer apply.
//
// Self-contained styles (inline <style> — tiny, and keeps this a single-file
// drop-in). If it grows, promote to CitationChips.module.css.
//
// Props:
//   citations  [{claimId, sourceLabel, anchor, snippet, verdict}]
//   edited     boolean — line text was changed after generation
//
// Usage inside the line editor (see PODCAST_SOURCES_INTEGRATION.md):
//   {line.citations?.length ? (
//     <CitationChips citations={line.citations} edited={!!line.citationsEdited} />
//   ) : null}

import React, { useState } from 'react';

const S = {
  row:   { display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5, position: 'relative' },
  chip:  {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: '0.58rem', fontWeight: 600, lineHeight: 1,
    padding: '3px 8px', borderRadius: 999, cursor: 'pointer',
    fontFamily: "'Inter', system-ui, sans-serif",
    background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.35)',
    color: '#a5b4fc', maxWidth: 180, whiteSpace: 'nowrap',
    overflow: 'hidden', textOverflow: 'ellipsis',
  },
  chipWarn: {
    background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)',
    color: '#fcd34d',
  },
  chipEdited: {
    background: 'transparent', border: '1px dashed rgba(245,158,11,0.5)',
    color: '#fbbf24',
  },
  pop: {
    position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 40,
    width: 260, maxWidth: '90vw', background: '#0a0f22',
    border: '1px solid rgba(99,102,241,0.35)', borderRadius: 10,
    boxShadow: '0 16px 40px -12px rgba(0,0,0,0.8)', padding: '10px 12px',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  popSrc:  { fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.1em',
             textTransform: 'uppercase', color: '#818CF8', marginBottom: 4 },
  popText: { fontSize: '0.68rem', color: '#e2e8f0', lineHeight: 1.5, margin: 0 },
  popNote: { fontSize: '0.56rem', color: '#f59e0b', marginTop: 6, marginBottom: 0 },
};

export default function CitationChips({ citations = [], edited = false }) {
  const [openId, setOpenId] = useState(null);
  if (!citations.length) return null;

  return (
    <div style={S.row} onMouseLeave={() => setOpenId(null)}>
      {citations.map((c, i) => {
        const warn  = c.verdict === 'weak' || c.verdict === 'unsupported';
        const style = edited
          ? { ...S.chip, ...S.chipEdited }
          : warn ? { ...S.chip, ...S.chipWarn } : S.chip;
        const key   = `${c.claimId}-${i}`;
        const label = `${c.sourceLabel || 'source'}${c.anchor ? ` · ${c.anchor}` : ''}`;

        return (
          <React.Fragment key={key}>
            <button
              type="button"
              style={style}
              aria-expanded={openId === key}
              aria-label={`Citation: ${label}${warn ? ' — needs review' : ''}${edited ? ' — line edited, unverified' : ''}`}
              onClick={(e) => { e.stopPropagation(); setOpenId(openId === key ? null : key); }}
            >
              {edited ? '✎' : warn ? '⚠' : '❝'} {label}
            </button>

            {openId === key ? (
              <div style={S.pop} role="tooltip">
                <div style={S.popSrc}>{label}</div>
                <p style={S.popText}>{c.snippet}</p>
                {edited ? (
                  <p style={S.popNote}>This line was edited after generation — the citation may no longer match.</p>
                ) : warn ? (
                  <p style={S.popNote}>
                    {c.verdict === 'unsupported'
                      ? "Our check couldn't verify this line against the source — review before rendering."
                      : 'The line may overstate this claim — worth a quick review.'}
                  </p>
                ) : null}
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}