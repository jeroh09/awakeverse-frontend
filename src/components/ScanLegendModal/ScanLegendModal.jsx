// src/components/ScanLegendModal/ScanLegendModal.jsx
//
// Upload an image of a sculpture, monument, or artifact.
// Pipeline: Groq vision → DuckDuckGo search → Groq fill → prefill CharacterBuilder.
//
// Props:
//   isOpen        bool
//   onClose       () => void
//   onPrefill     (fields: object) => void   — called on success, closes modal
//   isMobile      bool

import React, { useState, useRef, useCallback } from 'react';
import styles from './ScanLegendModal.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};


// ── SVG Icon components — no emoji, no Lucide ────────────────────────────────
const ScanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="url(#scan-g)" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <defs>
      <linearGradient id="scan-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#818CF8"/>
        <stop offset="100%" stopColor="#6366F1"/>
      </linearGradient>
    </defs>
    <circle cx="11" cy="11" r="5.5"/>
    <line x1="15.5" y1="15.5" x2="20" y2="20"/>
    <line x1="11" y1="4" x2="11" y2="5.5" stroke="#818CF8" strokeWidth="1.4"/>
    <line x1="18" y1="11" x2="16.5" y2="11" stroke="#818CF8" strokeWidth="1.4"/>
    <line x1="11" y1="18" x2="11" y2="16.5" stroke="#818CF8" strokeWidth="1.4"/>
    <line x1="4" y1="11" x2="5.5" y2="11" stroke="#818CF8" strokeWidth="1.4"/>
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <circle cx="11" cy="11" r="6"/>
    <line x1="16" y1="16" x2="20" y2="20"/>
  </svg>
);

const ScrollIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="9" y1="13" x2="15" y2="13"/>
    <line x1="9" y1="17" x2="13" y2="17"/>
  </svg>
);

const PenSparkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const QuestionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="url(#q-g)" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
    <defs>
      <linearGradient id="q-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#818CF8"/>
        <stop offset="100%" stopColor="#6366F1"/>
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <circle cx="12" cy="17" r="0.8" fill="#818CF8" stroke="none"/>
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="url(#ul-g)" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width="38" height="38">
    <defs>
      <linearGradient id="ul-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#818CF8"/>
        <stop offset="100%" stopColor="#6366F1"/>
      </linearGradient>
    </defs>
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

const WarningIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none"/>
  </svg>
);

// ── Progress stages ────────────────────────────────────────────────────────
const STAGES = [
  { key: 'identifying', label: 'Identifying figure…',      icon: <SearchIcon />  },
  { key: 'searching',   label: 'Searching history…',       icon: <ScrollIcon />  },
  { key: 'filling',     label: 'Filling character form…',  icon: <PenSparkIcon /> },
];

// ── Simulate stage progression during API call ─────────────────────────────
function useStageProgress(active) {
  const [stageIdx, setStageIdx] = React.useState(0);
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    if (!active) { setStageIdx(0); return; }
    // Advance through stages at natural intervals
    // Stage 0 → 1 after 2.5s, stage 1 → 2 after 5s
    timerRef.current = setTimeout(() => setStageIdx(1), 2500);
    return () => clearTimeout(timerRef.current);
  }, [active]);

  React.useEffect(() => {
    if (!active || stageIdx !== 1) return;
    timerRef.current = setTimeout(() => setStageIdx(2), 3000);
    return () => clearTimeout(timerRef.current);
  }, [active, stageIdx]);

  return stageIdx;
}

// ── Main component ─────────────────────────────────────────────────────────
const ScanLegendModal = ({ isOpen, onClose, onPrefill, isMobile }) => {
  const [dragOver, setDragOver]   = useState(false);
  const [preview, setPreview]     = useState(null);   // data URL for preview
  const [file, setFile]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [identified, setIdentified] = useState(null); // low_confidence result
  const inputRef                  = useRef(null);
  const stageIdx                  = useStageProgress(loading);

  const reset = useCallback(() => {
    setPreview(null);
    setFile(null);
    setError(null);
    setIdentified(null);
    setLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // ── File selection ──────────────────────────────────────────────────────
  const processFile = useCallback((f) => {
    if (!f) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(f.type)) {
      setError('Please upload a JPEG, PNG, or WebP image.');
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setError('Image must be under 8MB.');
      return;
    }
    setError(null);
    setIdentified(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    processFile(dropped);
  }, [processFile]);

  const onInputChange = (e) => processFile(e.target.files[0]);

  // ── Submit to pipeline ──────────────────────────────────────────────────
  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setIdentified(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_BASE}/api/scan-legend`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': getCookie('av_csrf') },
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.');
        return;
      }

      if (data.status === 'low_confidence') {
        setIdentified(data);
        return;
      }

      if (data.status === 'success') {
        // Pass fields to CharacterBuilder and close
        onPrefill({
          fields:      data.fields,
          source_hint: data.source_hint,
          identified:  data.identified,
        });
        handleClose();
      }

    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentStage = STAGES[stageIdx];

  return (
    <>
      <div className={styles.backdrop} onClick={handleClose} aria-hidden="true" />

      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Scan a Legend"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}><ScanIcon /></div>
            <div>
              <h2 className={styles.title}>Scan a Legend</h2>
              <p className={styles.subtitle}>
                Upload a sculpture, monument, or portrait — we'll identify the figure and pre-fill your character form
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">×</button>
        </div>

        {/* Body */}
        <div className={styles.body}>

          {/* ── Loading state ── */}
          {loading && (
            <div className={styles.loadingWrap}>
              <div className={styles.loadingGlobe}>
                {preview && (
                  <img src={preview} alt="Scanning" className={styles.loadingThumb} />
                )}
                <div className={styles.loadingRing} />
              </div>

              <div className={styles.stages}>
                {STAGES.map((s, i) => (
                  <div
                    key={s.key}
                    className={`${styles.stage} ${
                      i < stageIdx ? styles.stageDone
                      : i === stageIdx ? styles.stageActive
                      : styles.stagePending
                    }`}
                  >
                    <span className={styles.stageIcon}>
                      {i < stageIdx ? <CheckIcon /> : s.icon}
                    </span>
                    <span className={styles.stageLabel}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Low confidence result ── */}
          {!loading && identified && (
            <div className={styles.lowConfidence}>
              <div className={styles.lcIcon}><QuestionIcon /></div>
              <p className={styles.lcTitle}>Couldn't identify a specific figure</p>
              <p className={styles.lcText}>{identified.message}</p>
              {identified.identified?.region && (
                <p className={styles.lcHint}>
                  Region detected: <strong>{identified.identified.region}</strong>
                  {identified.identified.era ? ` · ${identified.identified.era}` : ''}
                </p>
              )}
              <div className={styles.lcActions}>
                <button className={styles.btnGhost} onClick={reset}>Try another image</button>
                <button
                  className={styles.btnPrimary}
                  onClick={() => {
                    // Prefill with partial data — user fills the rest
                    onPrefill({
                      fields: {
                        historical_period: identified.identified?.era || '',
                        personality_archetype: identified.identified?.category || '',
                      },
                      source_hint: 'Partial identification — please fill in the character details.',
                      identified: identified.identified,
                    });
                    handleClose();
                  }}
                >
                  Fill what we found →
                </button>
              </div>
            </div>
          )}

          {/* ── Upload zone ── */}
          {!loading && !identified && (
            <>
              <div
                className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''} ${preview ? styles.dropZoneHasFile : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => !preview && inputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload image"
              >
                {preview ? (
                  <div className={styles.previewWrap}>
                    <img src={preview} alt="Preview" className={styles.preview} />
                    <button
                      className={styles.changeBtn}
                      onClick={(e) => { e.stopPropagation(); reset(); inputRef.current?.click(); }}
                    >
                      Change image
                    </button>
                  </div>
                ) : (
                  <div className={styles.dropPrompt}>
                    <div className={styles.dropIcon}><UploadIcon /></div>
                    <p className={styles.dropTitle}>Drop an image here</p>
                    <p className={styles.dropHint}>
                      Sculptures · Monuments · Murals · Portraits · Artifacts
                    </p>
                    <button
                      className={styles.btnBrowse}
                      onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                    >
                      Browse files
                    </button>
                    <p className={styles.dropMeta}>JPEG, PNG, WebP · Max 8MB</p>
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={onInputChange}
              />

              {/* Examples hint */}
              <div className={styles.examples}>
                <span className={styles.examplesLabel}>Works well with:</span>
                <div className={styles.exampleTags}>
                  {['Greek sculptures', 'African carvings', 'Temple reliefs', 'Coins & medals', 'Historic portraits', 'Landmarks'].map(t => (
                    <span key={t} className={styles.exampleTag}>{t}</span>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className={styles.errorBox}>
                  <WarningIcon /> {error}
                </div>
              )}

              {/* Footer */}
              <div className={styles.footer}>
                <p className={styles.footerNote}>
                  All fields are editable after scanning. You review everything before submitting.
                </p>
                <button
                  className={`${styles.btnPrimary} ${!file || loading ? styles.btnDisabled : ''}`}
                  onClick={handleScan}
                  disabled={!file || loading}
                >
                  {loading ? 'Scanning…' : 'Scan Image →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ScanLegendModal;