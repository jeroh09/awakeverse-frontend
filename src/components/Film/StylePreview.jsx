// src/components/Film/StylePreview.jsx
// A silent, auto-looping clip that shows "what this look produces". Purely
// presentational: it reads the picker's current styleKey/aspect and nothing
// more — it never touches the create payload or any series/chaining state.
//
// Autoplay contract mirrors the hero / film-wall videos: muted is forced as an
// attribute (some browsers only honor the attribute, not the property),
// playsInline for iOS, and a play() kick for Safari. key={styleKey} forces a
// clean source reload when the style changes. On any load error the preview
// hides itself, so an incomplete clip set never breaks the picker.

import React, { useRef, useEffect, useState } from 'react';
import { stylePreviewUrl, stylePosterUrl } from './filmStyleMedia';
import './StylePreview.css';

export default function StylePreview({ styleKey, aspect }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.setAttribute('muted', '');
    v.playsInline = true;
    setFailed(false);
    if (v.play) v.play().catch(() => {});
  }, [styleKey, aspect]);

  if (failed) return null;

  return (
    <div className={`film-style-preview ar-${String(aspect).replace(':', 'x')}`}>
      <video
        ref={ref}
        key={styleKey}                 /* reload source when the style changes */
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={stylePosterUrl(styleKey)}
        onError={() => setFailed(true)}
      >
        <source src={stylePreviewUrl(styleKey, aspect)} type="video/mp4" />
      </video>
    </div>
  );
}