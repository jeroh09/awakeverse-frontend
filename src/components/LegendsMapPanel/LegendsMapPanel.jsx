// src/components/LegendsMapPanel/LegendsMapPanel.jsx
//
// Legends Map — interactive 3D globe overlay.
// Design tokens: Syne (display) + Inter (body), indigo accent (#6366F1).
// Three.js driven directly — no react-globe.gl dependency.
//
// Install: npm install three
//
// Z-index: panel = 1200. CharacterDetailPanel (z 1001) is rendered by
// ChatLauncherPage when onCharacterSelect fires — not by this component.

import React, {
  useState, useEffect, useRef, useCallback, memo
} from 'react';
import * as THREE from 'three';
import styles from './LegendsMapPanel.module.css';
import theme from '../../design-system/tokens';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CONTINENTS = [
  'All','Africa','Asia','Europe',
  'Middle East','North America','South America','Oceania',
];

// Semantic colours per continent (from design tokens where possible)
const CONT_COLOR = {
  Africa:          '#10B981', // semantic.success
  Asia:            '#EF4444', // semantic.error
  Europe:          '#6366F1', // accent.primary
  'Middle East':   '#F59E0B', // semantic.warning
  'North America': '#3B82F6', // semantic.info
  'South America': '#EC4899',
  Oceania:         '#14B8A6',
};

const AUTO_RESUME_MS = 4000;

// ── Geometry helpers ─────────────────────────────────────────────────────────

function ll2xyz(lat, lng, r = 1.028) {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(r * Math.sin(phi) * Math.cos(theta)),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
  );
}

function makeLatRing(radius, tiltRad, opacity) {
  const pts = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const ring = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity })
  );
  ring.rotation.x = tiltRad;
  return ring;
}

function makeMeridian(rotY, opacity) {
  const pts = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    pts.push(new THREE.Vector3(0, Math.cos(a) * 1.012, Math.sin(a) * 1.012));
  }
  const m = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity })
  );
  m.rotation.y = rotY;
  return m;
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

// ── Resolve image src with jpg/jpeg fallback ─────────────────────────────
function useImageSrc(pin) {
  const initial = pin?.image_url || (pin ? `/images/${pin.character_key}.jpg` : null);
  const [src, setSrc]                   = React.useState(initial);
  const [fallbackTried, setFallbackTried] = React.useState(false);
  const [failed, setFailed]             = React.useState(false);

  // Reset when pin changes
  React.useEffect(() => {
    const next = pin?.image_url || (pin ? `/images/${pin.character_key}.jpg` : null);
    setSrc(next);
    setFallbackTried(false);
    setFailed(false);
  }, [pin?.character_key]);

  const handleError = React.useCallback(() => {
    if (!fallbackTried && src) {
      // jpg → jpeg, jpeg → jpg
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

// ── Character card — full-bleed image with gradient fade ─────────────────
// Matches ChatLauncherPage CategoryCard pattern:
//   Layer 1: character image fills entire card (cover)
//   Layer 2: natural gradient top → dark bottom (no hard cutoff)
//   Layer 3: text content pinned to bottom
const CharacterCard = memo(({ pin, onClose, onStartChat }) => {
  const { src, failed, handleError } = useImageSrc(pin);

  return (
  <div className={`${styles.charCard} ${pin ? styles.charCardVisible : ''}`}>
    {pin && (
      <>
        {/* Layer 1 — background image, fills entire card */}
        {!failed && src ? (
          <img
            src={src}
            alt={pin.display_name}
            className={styles.cardBgImage}
            onError={handleError}
            draggable={false}
          />
        ) : (
          /* Fallback bg when both jpg and jpeg fail */
          <div className={styles.cardBgFallback}>
            {(pin.display_name || '?').charAt(0).toUpperCase()}
          </div>
        )}

        {/* Layer 2 — natural gradient fade, transparent → dark */}
        <div className={styles.cardGradient} />

        {/* Layer 3 — content pinned to bottom */}
        <div className={styles.cardContent}>
          <button className={styles.cardClose} onClick={onClose} aria-label="Close">×</button>

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
            Start Chat →
          </button>
        </div>
      </>
    )}
  </div>
));

// ── Main component ────────────────────────────────────────────────────────────

const LegendsMapPanel = ({ isOpen, onClose, onCharacterSelect }) => {
  const [pins, setPins]               = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [activeContinent, setActiveContinent] = useState('All');
  const [selectedPin, setSelectedPin] = useState(null);
  const [rotating, setRotating]       = useState(true);
  const [pauseHint, setPauseHint]     = useState(false);

  // Three.js refs — mutations never trigger re-renders
  const canvasRef      = useRef(null);
  const areaRef        = useRef(null);
  const rendererRef    = useRef(null);
  const globeRef       = useRef(null);
  const pinGroupRef    = useRef(null);
  const ringGroupRef   = useRef(null);
  const merGroupRef    = useRef(null);
  const pinMeshesRef   = useRef([]);
  const rafRef         = useRef(null);
  const resumeTimerRef = useRef(null);
  const rotatingRef    = useRef(true);
  const isDraggingRef  = useRef(false);
  const didDragRef     = useRef(false);
  const prevMouseRef   = useRef({ x: 0, y: 0 });
  const tooltipRef     = useRef(null);
  const hoveredPinRef  = useRef(null);
  const selectedPinRef = useRef(null);
  const cameraRef      = useRef(null);

  // Keep refs in sync
  useEffect(() => { rotatingRef.current  = rotating;   }, [rotating]);
  useEffect(() => { selectedPinRef.current = selectedPin; }, [selectedPin]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPins = useCallback(async () => {
    if (pins.length > 0) return;
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API_BASE}/api/legends-map`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status === 'success') {
        setPins(data.pins || []);
        setFiltered(data.pins || []);
      } else throw new Error(data.message || 'Unknown error');
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
      activeContinent === 'All' ? pins : pins.filter(p => p.continent === activeContinent)
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

  // ── Rebuild pin meshes when filtered list changes ──────────────────────────
  const buildPins = useCallback((list) => {
    const group = pinGroupRef.current;
    if (!group) return;
    while (group.children.length) group.remove(group.children[0]);
    pinMeshesRef.current = [];
    list.forEach(pin => {
      const pos   = ll2xyz(pin.lat, pin.lng);
      const color = new THREE.Color(CONT_COLOR[pin.continent] || theme.colors.accent.primary);
      const mesh  = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 12, 12),
        new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.55 })
      );
      mesh.position.copy(pos);
      mesh.userData.pin = pin;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.028, 0.037, 24),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.38, side: THREE.DoubleSide })
      );
      ring.position.copy(pos);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      ring.rotateX(Math.PI / 2);
      group.add(mesh); group.add(ring);
      pinMeshesRef.current.push(mesh);
    });
  }, []);

  useEffect(() => {
    if (pinGroupRef.current) buildPins(filtered);
  }, [filtered, buildPins]);

  // ── Three.js scene (runs once when panel opens) ────────────────────────────
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const area   = areaRef.current;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 2.8;
    cameraRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const sun = new THREE.DirectionalLight(0xc8d8ff, 0.9);
    sun.position.set(4, 3, 5); scene.add(sun);
    const fill = new THREE.DirectionalLight(0x1a1040, 0.5);
    fill.position.set(-4, -2, -5); scene.add(fill);

    // Globe
    const tl    = new THREE.TextureLoader();
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshPhongMaterial({
        map:       tl.load('https://unpkg.com/three-globe/example/img/earth-night.jpg'),
        bumpMap:   tl.load('https://unpkg.com/three-globe/example/img/earth-topology.png'),
        bumpScale: 0.04,
        specular:  new THREE.Color(0x112244),
        shininess: 6,
      })
    );
    scene.add(globe);
    globeRef.current = globe;

    // Atmosphere
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.025, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0x6366f1, transparent: true, opacity: 0.045, side: THREE.FrontSide })
    ));

    // Latitude rings
    const ringGroup = new THREE.Group();
    ringGroupRef.current = ringGroup;
    scene.add(ringGroup);
    ringGroup.add(makeLatRing(1.012, 0, 0.55));
    ringGroup.add(makeLatRing(Math.cos(23.5*Math.PI/180)*1.012,  23.5*Math.PI/180, 0.26));
    ringGroup.add(makeLatRing(Math.cos(23.5*Math.PI/180)*1.012, -23.5*Math.PI/180, 0.26));
    ringGroup.add(makeLatRing(Math.cos(66.5*Math.PI/180)*1.012,  66.5*Math.PI/180, 0.13));
    ringGroup.add(makeLatRing(Math.cos(66.5*Math.PI/180)*1.012, -66.5*Math.PI/180, 0.13));

    // Meridian rings
    const merGroup = new THREE.Group();
    merGroupRef.current = merGroup;
    scene.add(merGroup);
    merGroup.add(makeMeridian(0,               0.42));
    merGroup.add(makeMeridian(Math.PI/2,       0.20));
    merGroup.add(makeMeridian(Math.PI/4,       0.13));
    merGroup.add(makeMeridian(Math.PI*3/4,     0.13));

    // Pin group
    const pinGroup = new THREE.Group();
    pinGroupRef.current = pinGroup;
    scene.add(pinGroup);

    // Resize observer
    const resize = () => {
      if (!area) return;
      const w = area.clientWidth, h = area.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(area);

    // Render loop — use performance.now() directly (THREE.Clock is deprecated in newer builds)
    let lastTime = performance.now();
    const tick  = () => {
      rafRef.current = requestAnimationFrame(tick);
      const now = performance.now();
      const dt  = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms to avoid jumps
      lastTime  = now;
      if (rotatingRef.current) {
        const s = 0.07;
        globe.rotation.y    += dt * s; pinGroup.rotation.y  += dt * s;
        ringGroup.rotation.y+= dt * s; merGroup.rotation.y  += dt * s;
      }
      pinMeshesRef.current.forEach(m => {
        const active = hoveredPinRef.current === m.userData.pin || selectedPinRef.current === m.userData.pin;
        const ts = active ? 1.65 : 1.0;
        m.scale.lerp(new THREE.Vector3(ts, ts, ts), 0.12);
        m.material.emissiveIntensity += ((active ? 1.0 : 0.55) - m.material.emissiveIntensity) * 0.1;
      });
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(resumeTimerRef.current);
      ro.disconnect();
      renderer.dispose();
      rendererRef.current = globeRef.current = pinGroupRef.current =
      ringGroupRef.current = merGroupRef.current = cameraRef.current = null;
      pinMeshesRef.current = [];
    };
  }, [isOpen]); // intentional: scene setup runs once per open, not on every dep change

  // ── Canvas event handlers ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;

    const ray = new THREE.Raycaster();
    const toNDC = (e) => {
      const r = canvas.getBoundingClientRect();
      return new THREE.Vector2(
         ((e.clientX - r.left) / r.width)  * 2 - 1,
        -((e.clientY - r.top)  / r.height) * 2 + 1,
      );
    };

    const onMouseMove = (e) => {
      if (isDraggingRef.current || !cameraRef.current) return;
      ray.setFromCamera(toNDC(e), cameraRef.current);
      const hits = ray.intersectObjects(pinMeshesRef.current);
      if (hits.length) {
        const pin = hits[0].object.userData.pin;
        hoveredPinRef.current = pin;
        if (tooltipRef.current) {
          const r = canvas.getBoundingClientRect();
          Object.assign(tooltipRef.current.style, {
            left: (e.clientX - r.left + 16) + 'px',
            top:  (e.clientY - r.top  - 12) + 'px',
            opacity: '1',
          });
          tooltipRef.current.querySelector('strong').textContent = pin.display_name;
          tooltipRef.current.querySelector('span').textContent =
            `${pin.country || ''}${pin.historical_period ? ' · ' + pin.historical_period : ''}`;
        }
        clearTimeout(resumeTimerRef.current);
        rotatingRef.current = false;
        canvas.style.cursor = 'pointer';
      } else {
        hoveredPinRef.current = null;
        if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
        canvas.style.cursor = 'grab';
      }
    };

    const onMouseDown = (e) => {
      didDragRef.current   = false;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor  = 'grabbing';
    };

    const onWindowMouseMove = (e) => {
      if (canvas.style.cursor !== 'grabbing') return;
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        isDraggingRef.current = true;
        didDragRef.current    = true;
        pauseRotation(AUTO_RESUME_MS);
      }
      [globeRef, pinGroupRef, ringGroupRef, merGroupRef]
        .map(r => r.current).filter(Boolean)
        .forEach(g => { g.rotation.y += dx * 0.005; g.rotation.x += dy * 0.003; });
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onWindowMouseUp = () => {
      canvas.style.cursor = hoveredPinRef.current ? 'pointer' : 'grab';
      setTimeout(() => { isDraggingRef.current = false; }, 40);
    };

    const onClick = (e) => {
      if (didDragRef.current) { didDragRef.current = false; return; }
      if (!cameraRef.current) return;
      ray.setFromCamera(toNDC(e), cameraRef.current);
      const pinHits = ray.intersectObjects(pinMeshesRef.current);
      if (pinHits.length) {
        if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
        const pin = pinHits[0].object.userData.pin;
        selectedPinRef.current = pin;
        setSelectedPin(pin);
        clearTimeout(resumeTimerRef.current);
        rotatingRef.current = false;
        setRotating(false);
        return;
      }
      // Globe body click → toggle pause
      if (rotatingRef.current) {
        pauseRotation(99999);
        setPauseHint(true);
      } else if (!selectedPinRef.current) {
        resumeRotation();
      }
    };

    const onWheel = (e) => {
      if (!cameraRef.current) return;
      cameraRef.current.position.z = Math.max(1.8, Math.min(4.5, cameraRef.current.position.z + e.deltaY * 0.002));
      e.preventDefault();
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('click',     onClick);
    canvas.addEventListener('wheel',     onWheel, { passive: false });
    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup',   onWindowMouseUp);
    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('click',     onClick);
      canvas.removeEventListener('wheel',     onWheel);
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup',   onWindowMouseUp);
    };
  }, [isOpen, pauseRotation, resumeRotation]);

  // ── Escape key ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleContinentChange = useCallback((c) => {
    setActiveContinent(c);
    setSelectedPin(null);
    selectedPinRef.current = null;
  }, []);

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
      _mapOrigin: { country: pin.country, region: pin.region, continent: pin.continent },
    });
  }, [onCharacterSelect]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Legends Map">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.titleIcon}>🌍</span>
            <div>
              <h2 className={styles.title}>Legends of the World</h2>
              <p className={styles.subtitle}>
                {filtered.length} {filtered.length === 1 ? 'legend' : 'legends'} across history &amp; myth
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close map">×</button>
        </div>

        {/* Continent pills */}
        <FilterPills active={activeContinent} onChange={handleContinentChange} />

        {/* Globe */}
        <div className={styles.globeWrap} ref={areaRef}>
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
              <p></p>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className={styles.canvas}
            style={{ display: loading || error ? 'none' : 'block' }}
          />

          {/* Tooltip — positioned via DOM for perf */}
          <div ref={tooltipRef} className={styles.tooltip} aria-hidden="true">
            <strong />
            <span />
          </div>

          {/* Rotation hint */}
          <div className={`${styles.rotHint} ${!rotating ? styles.rotHintPaused : ''}`}>
            {pauseHint ? '● paused — click globe to resume'
              : rotating ? '● rotating — click to pause'
              : '● paused'}
          </div>

          {/* Character card */}
          <CharacterCard
            pin={selectedPin}
            onClose={handleCardClose}
            onStartChat={handleStartChat}
          />
        </div>

        <div className={styles.footer}>
          <span>Click any pin to explore</span>
          <span className={styles.footerDot}>·</span>
          <span>Drag to rotate · Scroll to zoom</span>
        </div>
      </div>
    </>
  );
};

export default LegendsMapPanel;