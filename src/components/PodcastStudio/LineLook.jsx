// src/components/PodcastStudio/LineLook.jsx
//
// Per-line look (gaze), 2026-10-22 = podcast_video.LOOKS / podcast_session.LOOKS.
// Sent as lines[].look only when not 'auto' (the validator drops 'auto' and rejects
// anything else). Add a new look here AND to the backend lists.
//
//   auto      the layout's default — vertical duo: at each other · solo: at the camera ·
//             16:9 two/three speakers: unchanged
//   partner   at the other speaker, never into the lens (solo: treated as camera)
//   camera    straight into the lens, talking to the viewer
//   thinking  eyes lowered / to the side, considering
//
// Partner, camera and thinking show a face from our own test renders; the faces load
// from the CDN (content/podcast_studio/looks/<id>.jpg — HANDOVER_media_integration).
// Auto has no single face (it depends on the layout), so it is always the glyph, and
// any face that can't load falls back to its glyph too.

import React from 'react';

// Same base as CameraPopover.STUDIO_MEDIA — repeated here, not imported, because
// CameraPopover imports this file (an import cycle would leave the value unset).
const STUDIO_MEDIA = `${(process.env.REACT_APP_CDN_BASE
  || 'https://awakeverse-blog.lon1.cdn.digitaloceanspaces.com').replace(/\/$/, '')}/content/podcast_studio`;
const lookImg = (id) => `${STUDIO_MEDIA}/looks/${id}.jpg`;

export const LOOKS = [
  { id: 'auto',     name: 'Auto',      short: 'Auto' },
  { id: 'partner',  name: 'At them',   short: 'At them',   img: lookImg('partner') },
  { id: 'camera',   name: 'At camera', short: 'At camera', img: lookImg('camera') },
  { id: 'thinking', name: 'Thinking',  short: 'Thinking',  img: lookImg('thinking') },
];
export const LOOK_BY_ID = Object.fromEntries(LOOKS.map(l => [l.id, l]));

// The look a line really gets, for display: unknown → auto; solo has no partner, so
// the server treats 'partner' as 'camera' and so do we.
export function effectiveLook(look, speakerCount) {
  const id = LOOK_BY_ID[look] ? look : 'auto';
  return id === 'partner' && speakerCount < 2 ? 'camera' : id;
}

// What Auto means in this layout, and what "At them" points at.
export function lookNote(id, { speakerCount, vertical, partnerName }) {
  if (id === 'auto') {
    if (speakerCount < 2) return { b: 'Auto:', t: ' into the lens, talking to the viewer.' };
    if (vertical && speakerCount === 2) return { b: 'Auto:', t: ' they look at each other.' };
    return { b: 'Auto:', t: ' the usual shot for this layout.' };
  }
  if (id === 'partner') {
    return speakerCount === 2 && partnerName
      ? { b: `At ${partnerName === 'You' ? 'you' : partnerName}`, t: ', never into the lens.' }
      : { b: 'At the others', t: ', never into the lens.' };
  }
  if (id === 'camera') return { b: 'At camera:', t: ' straight into the lens, talking to the viewer.' };
  return { b: 'Thinking:', t: ' eyes lowered, considering. Good for a pause before an answer.' };
}

// A small face whose eyes show the look: centred (camera, with a lens ring), turned
// (partner, with an arrow), lowered with heavy lids (thinking), or "A" for auto.
export function LookGlyph({ look = 'auto', size = 22 }) {
  const [px, py] = { auto: [0, 0], partner: [1.5, 0], camera: [0, 0], thinking: [-1.3, 1.3] }[look] || [0, 0];
  return (
    <svg width={size * 1.25} height={size} viewBox="0 0 40 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {[11, 21].map(x => (
        <g key={x}>
          <circle cx={x} cy="14" r="3.3" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <circle cx={x + px} cy={14 + py} r="1.5" fill="currentColor" />
          {look === 'thinking' && <path d={`M${x - 3.4} 12.6h6.8`} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
        </g>
      ))}
      <path d={`M13 21.5q3 ${look === 'thinking' ? 0 : 1.6} 6 0`} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {look === 'camera' && <circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2.4" opacity="0.7" />}
      {look === 'partner' && <path d="M33 16h5m-2-2 2 2-2 2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />}
      {look === 'thinking' && (<>
        <circle cx="31" cy="7" r="1.1" fill="currentColor" />
        <circle cx="34.5" cy="4.5" r="1.4" fill="currentColor" />
        <circle cx="38" cy="2.5" r="1.1" fill="currentColor" opacity="0.7" />
      </>)}
      {look === 'auto' && <text x="33" y="10" fontSize="8" fontWeight="700" fill="currentColor" fontFamily="Inter, sans-serif">A</text>}
    </svg>
  );
}