// src/components/LegendsMapPanel/LegendsMapPanel.jsx
// ✅ UPDATED: CityPanel — Option A two-pane slide (city view ↔ character view)
// ✅ UPDATED: CharacterCard "View Full Profile" → "Start Chat" (direct, no intermediate step)
// ✅ All globe logic, legends mode, state, refs — untouched

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

// ── Globe SVG icon ────────────────────────────────────────────────────────────
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

// ── City icon SVG ─────────────────────────────────────────────────────────────
const CityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="url(#city-grad)" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="city-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
    </defs>
    <rect x="3" y="10" width="6" height="11" />
    <rect x="9" y="6" width="6" height="15" />
    <rect x="15" y="13" width="6" height="8" />
    <line x1="1" y1="21" x2="23" y2="21" />
    <line x1="6" y1="10" x2="6" y2="7" />
    <line x1="6" y1="7" x2="12" y2="3" />
    <line x1="12" y1="3" x2="12" y2="6" />
  </svg>
);

// ── Back arrow SVG ────────────────────────────────────────────────────────────
const BackArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M19 12H5M11 6l-6 6 6 6"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Filter pills ──────────────────────────────────────────────────────────────
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

// ── Character card — right column ─────────────────────────────────────────────
// ✅ "View Full Profile" renamed to "Start Chat" — fires onStartChat directly
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
        {/* ✅ Direct to chat — no intermediate profile panel */}
        <button className={styles.cardCta} onClick={() => onStartChat(pin)}>
          Start Chat
        </button>
      </div>
    </div>
  );
});

// ── City character chip ───────────────────────────────────────────────────────
const CityChip = memo(({ char, selected, onClick }) => {
  const { src, failed, handleError } = useImageSrc({
    image_url: char.image_url,
    character_key: char.character_key,
  });
  return (
    <button
      className={`${styles.chip} ${selected ? styles.chipSelected : ''}`}
      onClick={onClick}
      title={char.display_name}
    >
      {!failed && src ? (
        <img src={src} alt={char.display_name}
          className={styles.chipImg} onError={handleError} draggable={false} />
      ) : (
        <div className={styles.chipImgFallback}>
          {(char.display_name || '?').charAt(0).toUpperCase()}
        </div>
      )}
      <div className={styles.chipName}>{char.display_name}</div>
    </button>
  );
});

// ── City panel — Option A two-pane slide ──────────────────────────────────────
// view: 'city' shows city info + chips
// view: 'character' slides in full CharacterCard, chips hidden
const CityPanel = memo(({ city, cityChars, loadingChars, selectedChar, onChipClick, onCharClose, onStartChat }) => {
  if (!city) return null;

  // Which pane is visible
  const view = selectedChar ? 'character' : 'city';

  return (
    <div className={styles.cityPanelInner}>

      {/* ── Sliding track: both panes side by side, translateX switches view ── */}
      <div
        className={styles.citySlideTrack}
        style={{ transform: view === 'character' ? 'translateX(-100%)' : 'translateX(0)' }}
      >

        {/* ── Pane 1: City info + chips ──────────────────────────────────── */}
        <div className={styles.cityPane}>

          {/* City hero */}
          <div className={styles.cityHero}>
            <div className={styles.cityTopRow}>
              <div className={styles.cityName}>{city.display_name}</div>
              {city.continent && (
                <span className={styles.cityContBadge}>{city.continent}</span>
              )}
            </div>
            {city.dominant_era && (
              <div className={styles.cityEra}>{city.dominant_era}</div>
            )}
            {city.famous_for && (
              <div className={styles.cityFamous}>{city.famous_for}</div>
            )}
            {Array.isArray(city.themes) && city.themes.length > 0 && (
              <div className={styles.cityTags}>
                {city.themes.slice(0, 4).map(t => (
                  <span key={t} className={styles.cityTag}>{t}</span>
                ))}
              </div>
            )}
            {city.cultural_summary && (
              <p className={styles.citySummary}>{city.cultural_summary}</p>
            )}
          </div>

          {/* Character chips */}
          <div className={styles.chipsSection}>
            <div className={styles.chipsLabel}>
              {city.character_count || 0} legend{city.character_count !== 1 ? 's' : ''} from here
            </div>

            {loadingChars && (
              <div className={styles.chipsLoading}>
                <div className={styles.spinnerSm} />
              </div>
            )}

            {!loadingChars && cityChars.length > 0 && (
              <div className={styles.chipsGrid}>
                {cityChars.map(char => (
                  <CityChip
                    key={char.character_key}
                    char={char}
                    selected={selectedChar?.character_key === char.character_key}
                    onClick={() => onChipClick(char)}
                  />
                ))}
              </div>
            )}

            {!loadingChars && cityChars.length === 0 && (
              <p className={styles.chipsEmpty}>No legends linked yet</p>
            )}
          </div>

        </div>

        {/* ── Pane 2: Full character card ────────────────────────────────── */}
        <div className={styles.cityPane}>
          {/* Back button — returns to city view */}
          <button
            className={styles.cityBackBtn}
            onClick={onCharClose}
            aria-label="Back to city"
          >
            <BackArrowIcon />
            <span>Back to {city.display_name}</span>
          </button>

          {/* Full-height character card */}
          <div className={styles.cityCharCardWrap}>
            <CharacterCard
              pin={selectedChar}
              onClose={onCharClose}
              onStartChat={onStartChat}
            />
          </div>
        </div>

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
  const [globeSize, setGlobeSize]             = useState({ w: 660, h: 500 });
  const [hoveredPin, setHoveredPin]           = useState(null);

  // City memory state
  const [activeMode, setActiveMode]           = useState('legends');
  const [cityPins, setCityPins]               = useState([]);
  const [cityFiltered, setCityFiltered]       = useState([]);
  const [loadingCities, setLoadingCities]     = useState(false);
  const [selectedCity, setSelectedCity]       = useState(null);
  const [cityChars, setCityChars]             = useState([]);
  const [loadingCityChars, setLoadingCityChars] = useState(false);
  const [citySelectedChar, setCitySelectedChar] = useState(null);

  const globeRef       = useRef(null);
  const globeWrapRef   = useRef(null);
  const resumeTimerRef = useRef(null);
  const rotatingRef    = useRef(true);
  const selectedPinRef = useRef(null);

  useEffect(() => { selectedPinRef.current = selectedPin; }, [selectedPin]);

  // ── Measure globe wrapper ─────────────────────────────────────────────────
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

  // ── Globe initial setup ───────────────────────────────────────────────────
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

  // ── Sync rotating → globe controls ───────────────────────────────────────
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) controls.autoRotate = rotating;
  }, [rotating]);

  // ── Fetch pins ────────────────────────────────────────────────────────────
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
      setError(e.message || 'Failed to load legends');
    } finally {
      setLoading(false);
    }
  }, [pins.length]);

  // ── Fetch city pins ───────────────────────────────────────────────────────
  const fetchCityPins = useCallback(async () => {
    if (cityPins.length > 0) return;
    setLoadingCities(true);
    try {
      const res  = await fetch(`${API_BASE}/api/legends-map/cities`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status === 'success') {
        setCityPins(data.cities || []);
        setCityFiltered(data.cities || []);
      }
    } catch (e) {
      console.error('City pins fetch error:', e);
    } finally {
      setLoadingCities(false);
    }
  }, [cityPins.length]);

  // ── Fetch characters for a city ───────────────────────────────────────────
  const fetchCityChars = useCallback(async (cityKey) => {
    setLoadingCityChars(true);
    setCityChars([]);
    try {
      const res  = await fetch(`${API_BASE}/api/legends-map/city/${cityKey}/characters`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCityChars(data.characters || []);
    } catch (e) {
      console.error('City chars fetch error:', e);
    } finally {
      setLoadingCityChars(false);
    }
  }, []);

  // ── Open panel ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) fetchPins();
  }, [isOpen, fetchPins]);

  // ── Continent filter ──────────────────────────────────────────────────────
  const handleContinentChange = useCallback((continent) => {
    setActiveContinent(continent);
    if (activeMode === 'legends') {
      setFiltered(continent === 'All' ? pins : pins.filter(p => p.continent === continent));
    } else {
      setCityFiltered(continent === 'All' ? cityPins : cityPins.filter(c => c.continent === continent));
    }
    setSelectedPin(null);
    setSelectedCity(null);
    setCitySelectedChar(null);
  }, [activeMode, pins, cityPins]);

  // ── Mode switch ───────────────────────────────────────────────────────────
  const handleModeSwitch = useCallback((mode) => {
    setActiveMode(mode);
    setSelectedPin(null);
    setSelectedCity(null);
    setCitySelectedChar(null);
    if (mode === 'cities') fetchCityPins();
  }, [fetchCityPins]);

  // ── Globe click (pause/resume) ────────────────────────────────────────────
  const handleGlobeClick = useCallback(() => {
    if (!selectedPinRef.current) {
      const next = !rotatingRef.current;
      rotatingRef.current = next;
      setRotating(next);
      if (!next) {
        setPauseHint(true);
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = setTimeout(() => {
          rotatingRef.current = true;
          setRotating(true);
          setPauseHint(false);
        }, AUTO_RESUME_MS);
      } else {
        setPauseHint(false);
      }
    }
  }, []);

  // ── Card close ────────────────────────────────────────────────────────────
  const handleCardClose = useCallback(() => {
    setSelectedPin(null);
    selectedPinRef.current = null;
  }, []);

  // ── Chip click ────────────────────────────────────────────────────────────
  const handleChipClick = useCallback((char) => {
    setCitySelectedChar(char);
  }, []);

  // ── Start chat ────────────────────────────────────────────────────────────
  const handleStartChat = useCallback((pin) => {
    onCharacterSelect(pin);
    onClose();
  }, [onCharacterSelect, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />

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
              {activeMode === 'legends' ? <GlobeIcon /> : <CityIcon />}
            </div>
            <div>
              <h2 className={styles.title}>
                {activeMode === 'legends' ? 'Legends of the World' : 'City Memories'}
              </h2>
              <p className={styles.subtitle}>
                {activeMode === 'legends'
                  ? `${filtered.length} ${filtered.length === 1 ? 'legend' : 'legends'} across history & myth`
                  : `${cityFiltered.length} cities · ${cityPins.reduce((s,c) => s + (c.character_count||0), 0)} legends`
                }
              </p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeTab} ${activeMode === 'legends' ? styles.modeTabActive : ''}`}
              onClick={() => handleModeSwitch('legends')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              Legends
            </button>
            <button
              className={`${styles.modeTab} ${activeMode === 'cities' ? styles.modeTabActive : ''}`}
              onClick={() => handleModeSwitch('cities')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="10" width="5" height="11"/><rect x="9" y="6" width="6" height="15"/><rect x="16" y="13" width="5" height="8"/><line x1="1" y1="21" x2="23" y2="21"/></svg>
              Cities
            </button>
          </div>

          <FilterPills active={activeContinent} onChange={handleContinentChange} />

          <button className={styles.closeBtn} onClick={onClose} aria-label="Close map">×</button>
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

                pointsData={activeMode === 'legends' ? filtered : cityFiltered}
                pointLat={d => d.lat}
                pointLng={d => d.lng}
                pointAltitude={activeMode === 'legends' ? 0.012 : 0.02}
                pointColor={d =>
                  activeMode === 'cities'
                    ? (selectedCity?.city_key === d.city_key ? '#ffffff' : 'rgba(224,231,255,0.75)')
                    : (CONT_COLOR[d.continent] || '#6366F1')
                }
                pointRadius={activeMode === 'legends' ? 0.45 : 0.7}
                pointLabel={d =>
                  activeMode === 'cities'
                    ? `<div style="background:rgba(10,15,26,0.95);border:1px solid rgba(99,102,241,0.4);border-radius:8px;padding:5px 10px;font-family:Inter,sans-serif;font-size:11px;color:#f5f5dc"><strong>${d.display_name}</strong><br/><span style="color:#818cf8;font-size:10px">${d.dominant_era||''}</span></div>`
                    : ''
                }

                ringsData={activeMode === 'legends' ? filtered : cityFiltered}
                ringLat={d => d.lat}
                ringLng={d => d.lng}
                ringColor={d =>
                  activeMode === 'cities'
                    ? (selectedCity?.city_key === d.city_key ? '#ffffff' : 'rgba(224,231,255,0.6)')
                    : (CONT_COLOR[d.continent] || '#6366F1')
                }
                ringMaxRadius={activeMode === 'cities' ? 4 : 3}
                ringPropagationSpeed={activeMode === 'cities' ? 1.5 : 2}
                ringRepeatPeriod={1200}
                ringAltitude={0.005}

                onPointClick={(point) => {
                  if (activeMode === 'legends') {
                    setSelectedPin(point);
                    selectedPinRef.current = point;
                  } else {
                    setSelectedCity(point);
                    setCitySelectedChar(null);
                    fetchCityChars(point.city_key);
                  }
                  rotatingRef.current = false;
                  setRotating(false);
                  clearTimeout(resumeTimerRef.current);
                }}
                onPointHover={(point) => {
                  setHoveredPin(point || null);
                }}
                onGlobeClick={handleGlobeClick}
              />
            )}

            {/* Tooltip */}
            {hoveredPin && (
              <div className={styles.tooltip}>
                <strong>{hoveredPin.display_name}</strong>
                <span>
                  {activeMode === 'cities'
                    ? hoveredPin.dominant_era || hoveredPin.country || ''
                    : `${hoveredPin.country || ''}${hoveredPin.historical_period ? ' · ' + hoveredPin.historical_period : ''}`
                  }
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

          {/* Card / City panel column */}
          <div className={`${styles.cardCol} ${
            (activeMode === 'legends' && selectedPin) ||
            (activeMode === 'cities' && selectedCity)
              ? styles.cardColVisible : ''
          }`}>
            <div className={styles.cardInner}>
              {activeMode === 'legends' && (
                <CharacterCard
                  pin={selectedPin}
                  onClose={handleCardClose}
                  onStartChat={handleStartChat}
                />
              )}
              {activeMode === 'cities' && selectedCity && (
                <CityPanel
                  city={selectedCity}
                  cityChars={cityChars}
                  loadingChars={loadingCityChars}
                  selectedChar={citySelectedChar}
                  onChipClick={handleChipClick}
                  onCharClose={() => setCitySelectedChar(null)}
                  onStartChat={handleStartChat}
                />
              )}
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          <span>
            {activeMode === 'legends'
              ? 'Click any pin to explore a legend'
              : 'Click any ring to open a city memory'}
          </span>
          <span className={styles.footerDot}>·</span>
          <span>Drag to rotate · Scroll to zoom</span>
        </div>
      </div>
    </>
  );
};

export default LegendsMapPanel;