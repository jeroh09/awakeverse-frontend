// src/components/LegendsMapPanel/LegendsMapPanel.jsx
//
// Legends Map — interactive 3D globe overlay.
// Renderer  : react-globe.gl (replaces raw Three.js)
// Design    : centered modal, double indigo border, AwakeVerse tokens
// Z-index   : backdrop=1199  panel=1200
//             CharacterDetailPanel (z 2500) rendered by ChatLauncherPage
//             when onCharacterSelect fires — not by this component.
//
// Install   : npm install react-globe.gl

import React, {
  useState, useEffect, useRef, useCallback, memo
} from 'react';
import Globe from 'react-globe.gl';
import styles from './LegendsMapPanel.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CONTINENTS = [
  'All', 'Africa', 'Asia', 'Europe',
  'Middle East', 'North America', 'South America', 'Oceania',
];

// Semantic colours per continent — matches design tokens
const CONT_COLOR = {
  Africa:          '#10B981',
  Asia:            '#EF4444',
  Europe:          '#6366F1',
  'Middle East':   '#F59E0B',
  'North America': '#3B82F6',
  'South America': '#EC4899',
  Oceania:         '#14B8A6',
};

const AUTO_RESUME_MS = 4000;

// ── Globe SVG icon — replaces emoji ──────────────────────────────────────────
const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="url(#lgd-grad)" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="lgd-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3c-2 2-3.2 5-3.2 9s1.2 7 3.2 9" />
    <path d="M12 3c2 2 3.2 5 3.2 9s-1.2 7-3.2 9" />
    <line x1="3.5" y1="12" x2="20.5" y2="12" />
    <line x1="4.8" y1="7.5" x2="19.2" y2="7.5" />
    <line x1="4.8" y1="16.5" x2="19.2" y2="16.5" />
  </svg>
);

// ── Filter pills ─────────────────────────────────────────────────────────────
const FilterPills = memo(({ active, onChange }) => (
  <div className={styles.filterRow}>
    {CONTINENTS.map(c => (
      <button
        key={c}
        className={`${styles.pill} ${active === c ? styles.pillActive : ''}`}
        onClick={() => onChange(c)}
      >
        {c}
      </button>
    ))}
  </div>
));

// ── Image src with jpg/jpeg fallback ─────────────────────────────────────────
function useImageSrc(pin) {
  const initial = pin?.image_url || (pin ? `/images/${pin.character_key}.jpg` : null);
  const [src, setSrc]                     = useState(initial);
  const [fallbackTried, setFallbackTried] = useState(false);
  const [failed, setFailed]               = useState(false);

  useEffect(() => {
    const next = pin?.image_url || (pin ? `/images/${pin.character_key}.jpg` : null);
    setSrc(next);
    setFallbackTried(false);
    setFailed(false);
  }, [pin?.character_key]);

  const handleError = useCallback(() => {
    if (!fallbackTried && src) {
      const swapped = src.endsWith('.jpeg')
        ? src.slice(0, -5) + '.jpg'
        : src.slice(0, src.lastIndexOf('.')) + '.jpeg';
      setSrc(swapped);
      setFallbackTried(true);
    } else {
      setFailed(true);
    }
  }, [src, fallbackTried]);

  return { src, failed, handleError };
}

// ── Character card — right column ────────────────────────────────────────────
const CharacterCard = memo(({ pin, onClose, onStartChat }) => {
  const { src, failed, handleError } = useImageSrc(pin);
  if (!pin) return null;

  return (
    <div className={styles.charCard}>
      {/* Layer 1 — full-bleed image */}
      {!failed && src ? (
        <img
          src={src}
          alt={pin.display_name}
          className={styles.cardBgImage}
          onError={handleError}
          draggable={false}
        />
      ) : (
        <div className={styles.cardBgFallback}>
          {(pin.display_name || '?').charAt(0).toUpperCase()}
        </div>
      )}

      {/* Layer 2 — gradient fade */}
      <div className={styles.cardGradient} />

      {/* Layer 3 — content */}
      <div className={styles.cardContent}>
        <button className={styles.cardClose} onClick={onClose} aria-label="Close">
          &times;
        </button>
        <div className={styles.cardName}>{pin.display_name}</div>
        <div className={styles.cardOrigin}>
          {pin.country}{pin.continent ? ` · ${pin.continent}` : ''}
        </div>
        {pin.historical_period && (
          <div className={styles.cardPeriod}>{pin.historical_period}</div>
        )}
        {pin.short_description && (
          <p className={styles.cardDesc}>{pin.short_description}</p>
        )}
        <button className={styles.cardCta} onClick={() => onStartChat(pin)}>
          View Full Profile
        </button>
      </div>
    </div>
  );
});

// ── Main component ────────────────────────────────────────────────────────────
const LegendsMapPanel = ({ isOpen, onClose, onCharacterSelect }) => {
  const [pins, setPins]                       = useState([]);
  const [filtered, setFiltered]               = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);
  const [activeContinent, setActiveContinent] = useState('All');
  const [selectedPin, setSelectedPin]         = useState(null);
  const [rotating, setRotating]               = useState(true);
  const [pauseHint, setPauseHint]             = useState(false);
  // Globe canvas dimensions — driven by ResizeObserver on the wrapper
  const [globeSize, setGlobeSize]             = useState({ w: 660, h: 500 });
  // Hovered pin drives the React-rendered tooltip
  const [hoveredPin, setHoveredPin]           = useState(null);

  const globeRef       = useRef(null);
  const globeWrapRef   = useRef(null);
  const resumeTimerRef = useRef(null);
  const rotatingRef    = useRef(true);
  const selectedPinRef = useRef(null);

  // Keep selectedPinRef in sync with state
  useEffect(() => { selectedPinRef.current = selectedPin; }, [selectedPin]);

  // ── Measure globe wrapper via ResizeObserver ───────────────────────────────
  useEffect(() => {
    const el = globeWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setGlobeSize({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Globe initial setup ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !globeRef.current) return;
    const controls = globeRef.current.controls();
    if (!controls) return;
    controls.autoRotate      = true;
    controls.autoRotateSpeed = 0.5;
    controls.enableZoom      = true;
    controls.minDistance     = 180;
    controls.maxDistance     = 600;
    globeRef.current.pointOfView({ altitude: 2.2 });
  }, [isOpen]);

  // ── Sync rotating state → globe controls ──────────────────────────────────
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) controls.autoRotate = rotating;
  }, [rotating]);

  // ── Fetch pins ─────────────────────────────────────────────────────────────
  const fetchPins = useCallback(async () => {
    if (pins.length > 0) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_BASE}/api/legends-map`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status === 'success') {
        setPins(data.pins || []);
        setFiltered(data.pins || []);
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    } catch (e) {
      setError('Could not load the Legends Map. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pins.length]);

  useEffect(() => { if (isOpen) fetchPins(); }, [isOpen, fetchPins]);

  // ── Continent filter ───────────────────────────────────────────────────────
  useEffect(() => {
    setFiltered(
      activeContinent === 'All'
        ? pins
        : pins.filter(p => p.continent === activeContinent)
    );
  }, [activeContinent, pins]);

  // ── Rotation helpers ───────────────────────────────────────────────────────
  const pauseRotation = useCallback((resumeAfter = AUTO_RESUME_MS) => {
    rotatingRef.current = false;
    setRotating(false);
    clearTimeout(resumeTimerRef.current);
    if (!selectedPinRef.current && resumeAfter < 99999) {
      resumeTimerRef.current = setTimeout(() => {
        rotatingRef.current = true;
        setRotating(true);
        setPauseHint(false);
      }, resumeAfter);
    }
  }, []);

  const resumeRotation = useCallback(() => {
    clearTimeout(resumeTimerRef.current);
    rotatingRef.current = true;
    setRotating(true);
    setPauseHint(false);
  }, []);

  // ── Globe background click — pause / resume ────────────────────────────────
  const handleGlobeClick = useCallback(() => {
    if (rotatingRef.current) {
      pauseRotation(99999);
      setPauseHint(true);
    } else if (!selectedPinRef.current) {
      resumeRotation();
    }
  }, [pauseRotation, resumeRotation]);

  // ── Card handlers ──────────────────────────────────────────────────────────
  const handleCardClose = useCallback(() => {
    setSelectedPin(null);
    selectedPinRef.current = null;
    pauseRotation(AUTO_RESUME_MS);
  }, [pauseRotation]);

  const handleStartChat = useCallback((pin) => {
    onCharacterSelect({
      key:                   pin.character_key,
      character_key:         pin.character_key,
      name:                  pin.display_name,
      display_name:          pin.display_name,
      description:           pin.short_description,
      short_description:     pin.short_description,
      thumbnailUrl:          pin.image_url,
      historical_period:     pin.historical_period,
      personality_archetype: pin.personality_archetype,
      _mapOrigin: {
        country:   pin.country,
        region:    pin.region,
        continent: pin.continent,
      },
    });
  }, [onCharacterSelect]);

  // ── Continent change ───────────────────────────────────────────────────────
  const handleContinentChange = useCallback((c) => {
    setActiveContinent(c);
    setSelectedPin(null);
    selectedPinRef.current = null;
  }, []);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => () => { clearTimeout(resumeTimerRef.current); }, []);

  // ── Escape key ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop — semi-transparent, clickable to dismiss */}
      <div
        className={styles.backdrop}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — centered modal */}
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Legends of the World"
      >
        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.titleIcon}>
              <GlobeIcon />
            </div>
            <div>
              <h2 className={styles.title}>Legends of the World</h2>
              <p className={styles.subtitle}>
                {filtered.length}{' '}
                {filtered.length === 1 ? 'legend' : 'legends'} across history &amp; myth
              </p>
            </div>
          </div>

          <FilterPills active={activeContinent} onChange={handleContinentChange} />

          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close map"
          >
            ×
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>

          {/* Globe stage */}
          <div className={styles.globeWrap} ref={globeWrapRef}>

            {loading && (
              <div className={styles.stateBox}>
                <div className={styles.spinner} />
                <p>Summoning legends…</p>
              </div>
            )}

            {error && !loading && (
              <div className={styles.stateBox}>
                <span className={styles.stateIcon}>⚠️</span>
                <p>{error}</p>
                <button className={styles.retryBtn} onClick={fetchPins}>Retry</button>
              </div>
            )}

            {!loading && !error && pins.length === 0 && (
              <div className={styles.stateBox}>
                <span className={styles.stateIcon}>🗺️</span>
                <p>No legends mapped yet — the cron job populates this daily.</p>
              </div>
            )}

            {!loading && !error && (
              <Globe
                ref={globeRef}
                width={globeSize.w}
                height={globeSize.h}
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                atmosphereColor="#6366F1"
                atmosphereAltitude={0.14}

                pointsData={filtered}
                pointLat={d => d.lat}
                pointLng={d => d.lng}
                pointAltitude={0.012}
                pointColor={d => CONT_COLOR[d.continent] || '#6366F1'}
                pointRadius={0.45}
                pointLabel={() => ''}

                ringsData={filtered}
                ringLat={d => d.lat}
                ringLng={d => d.lng}
                ringColor={d => CONT_COLOR[d.continent] || '#6366F1'}
                ringMaxRadius={3}
                ringPropagationSpeed={2}
                ringRepeatPeriod={1200}
                ringAltitude={0.005}

                onPointClick={(pin) => {
                  setSelectedPin(pin);
                  selectedPinRef.current = pin;
                  rotatingRef.current = false;
                  setRotating(false);
                  clearTimeout(resumeTimerRef.current);
                }}
                onPointHover={(pin) => setHoveredPin(pin || null)}
                onGlobeClick={handleGlobeClick}
              />
            )}

            {/* React-rendered tooltip — no raw DOM */}
            {hoveredPin && (
              <div className={styles.tooltip}>
                <strong>{hoveredPin.display_name}</strong>
                <span>
                  {hoveredPin.country}
                  {hoveredPin.historical_period ? ` · ${hoveredPin.historical_period}` : ''}
                </span>
              </div>
            )}

            {!loading && !error && (
              <div className={`${styles.rotHint} ${!rotating ? styles.rotHintPaused : ''}`}>
                {pauseHint
                  ? '● paused — click globe to resume'
                  : rotating
                    ? '● rotating — click to pause'
                    : '● paused'}
              </div>
            )}
          </div>

          {/* Character card column — expands on pin click */}
          <div className={`${styles.cardCol} ${selectedPin ? styles.cardColVisible : ''}`}>
            <div className={styles.cardInner}>
              <CharacterCard
                pin={selectedPin}
                onClose={handleCardClose}
                onStartChat={handleStartChat}
              />
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          <span>Click any pin to explore a legend</span>
          <span className={styles.footerDot}>·</span>
          <span>Drag to rotate · Scroll to zoom</span>
        </div>
      </div>
    </>
  );
};

export default LegendsMapPanel;