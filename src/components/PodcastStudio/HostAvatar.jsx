// src/components/PodcastStudio/HostAvatar.jsx
//
// A tasteful "host video" placeholder — a podcast host with headphones + mic in
// the AwakeVerse night-blue / indigo / ivory palette. Replaces the flat grey
// silhouette used in ComparisonSetup and the overlay position pickers.
//
// gradient ids are suffixed with a per-instance uid so multiple avatars on the
// same page don't collide in the SVG <defs> namespace.

import React, { useId } from 'react';

export default function HostAvatar({ size = '100%', className, title = 'Host video' }) {
  const raw = useId();
  const uid = String(raw).replace(/[^a-zA-Z0-9]/g, '');
  const bg = `hav-bg-${uid}`;
  const cup = `hav-cup-${uid}`;
  const sh = `hav-sh-${uid}`;

  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={title}
    >
      <defs>
        <radialGradient id={bg} cx="50%" cy="30%" r="75%">
          <stop offset="0" stopColor="#33436e" />
          <stop offset="1" stopColor="#0e1526" />
        </radialGradient>
        <linearGradient id={cup} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#818CF8" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id={sh} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#46568a" />
          <stop offset="1" stopColor="#2b3a63" />
        </linearGradient>
      </defs>

      <circle cx="60" cy="60" r="58" fill={`url(#${bg})`} />
      {/* shoulders */}
      <path d="M18 120 C20 90 44 82 60 82 C76 82 100 90 102 120 Z" fill={`url(#${sh})`} />
      {/* neck */}
      <path d="M52 70 h16 v10 q-8 6 -16 0 Z" fill="#caa588" />
      {/* head */}
      <circle cx="60" cy="50" r="21" fill="#d8b79a" />
      {/* hair */}
      <path d="M39 50 a21 21 0 0 1 42 0 c0 -16 -42 -16 -42 0 Z" fill="#241f2b" />
      {/* eyes + smile */}
      <circle cx="52" cy="52" r="2.4" fill="#3b2f2a" />
      <circle cx="68" cy="52" r="2.4" fill="#3b2f2a" />
      <path d="M55 60 q5 4 10 0" stroke="#a9836a" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* headphone band + cups */}
      <path d="M36 52 a24 24 0 0 1 48 0" stroke={`url(#${cup})`} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <rect x="31" y="48" width="10" height="17" rx="5" fill={`url(#${cup})`} />
      <rect x="79" y="48" width="10" height="17" rx="5" fill={`url(#${cup})`} />
      {/* mic */}
      <rect x="57" y="86" width="6" height="20" rx="3" fill="#0f172a" />
      <circle cx="60" cy="90" r="8" fill="#0f172a" />
      <circle cx="60" cy="90" r="5.5" fill="#818CF8" />
      <circle cx="60" cy="90" r="2" fill="#c7d2fe" />
    </svg>
  );
}