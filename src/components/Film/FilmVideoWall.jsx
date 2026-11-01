// src/components/Film/FilmVideoWall.jsx
//
// Ambient looping film reel behind the My Films library (left 60% column).
// Same cross-platform contract as the podcast/landing hero:
//   autoplay + muted + loop + playsInline  → autoplays on macOS/iOS Safari,
//   Chrome (Win/Mac/ChromeOS), Edge, Android.
//
// It sits BEHIND the shelf at low opacity (see FilmWorkspace.css .film-video-wall*)
// with a dark scrim so glass cards stay readable. Because this is an app view
// people keep open, it:
//   • pauses when the browser tab is hidden (saves CPU/battery), and
//   • honours prefers-reduced-motion by showing a static poster (no playback).
//
// Degrades gracefully: if the video errors/404s, we hide it and the existing
// canvas background shows through — nothing looks broken.

import React, { useEffect, useRef, useState } from 'react';

const CDN = 'https://awakeverse-blog.lon1.cdn.digitaloceanspaces.com';
const WALL_MP4 = `${CDN}/content/film-wall/film-wall-loop.mp4`;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function FilmVideoWall({ src = WALL_MP4 }) {
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [reduced] = useState(prefersReducedMotion);

  // Force muted attribute (React quirk) + kick play() for Safari autoplay.
  useEffect(() => {
    if (reduced) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.setAttribute('muted', '');
    v.playsInline = true;
    if (v.play) v.play().catch(() => {});
  }, [reduced]);

  // Pause when the tab is hidden; resume when it returns. Keeps a background
  // video from decoding while the user is in another tab.
  useEffect(() => {
    if (reduced) return;
    const onVis = () => {
      const v = videoRef.current;
      if (!v) return;
      if (document.hidden) v.pause();
      else v.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [reduced]);

  if (failed) return null;

  return (
    <div className="film-video-wall" aria-hidden="true">
      {reduced ? (
        // Static frame only — no playback under reduced-motion.
        <div
          className="film-video-wall__still"
          style={{ backgroundImage: `url(${src.replace(/\.mp4$/, '.jpg')})` }}
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
        >
          <source src={src} type="video/mp4" onError={() => setFailed(true)} />
        </video>
      )}
      <div className="film-video-wall__scrim" />
    </div>
  );
}