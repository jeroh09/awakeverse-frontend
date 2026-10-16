// src/components/PodcastStudio/OutfitPicker.jsx
//
// Per-episode wardrobe picker for a real-person speaker, opened from the Voice
// picker row. Mirrors the VoiceBrowser modal pattern.
//
//   • Lists the avatar's saved outfits — each outfit's fullbody IS its thumbnail
//     (backend returns fullbody_ref_url, which doubles as the picker image AND
//     the outfit_ref_url the session speaker carries at render).
//   • "Original" = no outfit (the avatar's base look; sends nothing). Shows the
//     REAL avatar (2026-10-16 — was an emoji): the backend's `original` look,
//     ideally its full-body ref so it matches the outfit tiles. If that doesn't
//     exist yet, the best fallback shows straight away and the full-body is made
//     once in the background (ensureOriginalFullbody), then swapped in.
//   • New outfit shows Original | New side by side, same size, so the user
//     compares like for like before saving.
//   • "＋ New outfit" runs generate-preview → confirm inline (same shape as the
//     avatar generate/confirm flow), then selects the new outfit.
//
// Controlled: onSelect(outfitRefUrl | null, label | null) writes the choice onto
// the speaker in the page; the modal stays open until Done/✕/backdrop.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './OutfitPicker.module.css';

export default function OutfitPicker({
  open,
  onClose,
  avatarId,
  speakerLabel = 'Host',
  currentRefUrl = null,
  onSelect,
  loadOutfits,
  generateOutfitPreview,
  confirmOutfit,
  deleteOutfit,
  loadWardrobe,             // optional (avatarId) → { original, outfits }; falls back to loadOutfits
  ensureOriginalFullbody,   // optional (avatarId) → { fullbodyRefUrl }
}) {
  const [outfits, setOutfits]   = useState([]);
  const [original, setOriginal] = useState(null);   // { imageUrl, isFullbody, photoUrl, … } | null
  const [originalBusy, setOriginalBusy] = useState(false);
  const ensuredFor = useRef(null);                   // avatarId we've already asked to prepare
  const [loading, setLoading]   = useState(false);
  const [authorOpen, setAuthor] = useState(false);
  const [desc, setDesc]         = useState('');
  const [attempt, setAttempt]   = useState(1);
  const [preview, setPreview]   = useState(null);   // { url }
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState(null);
  const dialogRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!avatarId) return;
    setLoading(true);
    try {
      if (loadWardrobe) {
        const w = await loadWardrobe(avatarId);
        setOutfits(w.outfits || []);
        setOriginal(w.original || null);
      } else {
        setOutfits(await loadOutfits(avatarId));
      }
    } finally { setLoading(false); }
  }, [avatarId, loadOutfits, loadWardrobe]);

  // Original look not available as a full-body yet → make it once (server
  // caches it; the render reuses it). The fallback image shows meanwhile, and a
  // failure just leaves the fallback — never blocks the picker.
  useEffect(() => {
    if (!open || !avatarId || !ensureOriginalFullbody) return;
    if (!original || original.isFullbody || !original.photoUrl) return;
    if (ensuredFor.current === avatarId) return;
    ensuredFor.current = avatarId;
    let alive = true;
    setOriginalBusy(true);
    ensureOriginalFullbody(avatarId)
      .then(r => {
        if (alive && r?.fullbodyRefUrl) {
          setOriginal(o => ({ ...(o || {}), imageUrl: r.fullbodyRefUrl,
                              fullbodyRefUrl: r.fullbodyRefUrl, isFullbody: true }));
        }
      })
      .catch(() => { ensuredFor.current = null; })   // allow a retry next open
      .finally(() => { if (alive) setOriginalBusy(false); });
    return () => { alive = false; };
  }, [open, avatarId, original, ensureOriginalFullbody]);

  useEffect(() => {
    if (!open) return;
    setAuthor(false); setDesc(''); setPreview(null); setErr(null); setAttempt(1);
    setOriginal(null);   // never flash another speaker's original look
    refresh();
  }, [open, refresh]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose?.(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const pickOriginal = () => onSelect?.(null, null);
  const pickOutfit   = (o) => onSelect?.(o.outfitRefUrl, o.label);

  const handleGenerate = async () => {
    if (!desc.trim()) { setErr('Describe the outfit first.'); return; }
    setBusy(true); setErr(null);
    try {
      const r = await generateOutfitPreview({ avatarId, description: desc.trim(), attemptNumber: attempt });
      setPreview({ url: r.previewUrl });
    } catch (e) {
      setErr(e.message || 'Generation failed. Try again.');
      if (e.rejected) setAttempt((n) => Math.min(3, n + 1));
    } finally { setBusy(false); }
  };

  const handleConfirm = async () => {
    if (!preview?.url) return;
    setBusy(true); setErr(null);
    try {
      const saved = await confirmOutfit({ avatarId, previewUrl: preview.url, description: desc.trim() });
      await refresh();
      onSelect?.(saved.outfitRefUrl, saved.label);   // auto-select the new outfit
      setAuthor(false); setDesc(''); setPreview(null); setAttempt(1);
    } catch (e) {
      setErr(e.message || 'Could not save outfit.');
    } finally { setBusy(false); }
  };

  const handleDelete = async (o, e) => {
    e.stopPropagation();
    setBusy(true);
    try {
      await deleteOutfit({ avatarId, outfitId: o.outfitId });
      if (currentRefUrl === o.outfitRefUrl) onSelect?.(null, null);  // fell back to Original
      await refresh();
    } catch (_e) { /* keep list as-is on failure */ }
    finally { setBusy(false); }
  };

  return (
    <div className={styles.backdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Choose outfit" ref={dialogRef}>
        <div className={styles.head}>
          <span className={styles.ic}>👗</span>
          <div className={styles.title}>Outfit — {speakerLabel}<small>This episode · saved to your avatar</small></div>
          <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.grid}>
            {/* Original */}
            <button type="button"
              className={`${styles.tile} ${!currentRefUrl ? styles.on : ''}`}
              onClick={pickOriginal}>
              {original?.imageUrl
                ? <img className={styles.fig} src={original.imageUrl}
                       alt={`${speakerLabel} — original outfit`} loading="lazy" />
                : <span className={styles.figOriginal} aria-hidden="true">🧍</span>}
              {originalBusy && <span className={styles.figBusy}>Preparing…</span>}
              <span className={styles.chk}>✓</span>
              <span className={styles.lab}>Original</span>
            </button>

            {/* Saved outfits — fullbody is the thumbnail */}
            {outfits.map((o) => (
              <button type="button" key={o.outfitId}
                className={`${styles.tile} ${currentRefUrl === o.outfitRefUrl ? styles.on : ''}`}
                onClick={() => pickOutfit(o)} title={o.description || o.label}>
                <img className={styles.fig} src={o.fullbodyRefUrl} alt={o.label} loading="lazy" />
                <span className={styles.chk}>✓</span>
                <span className={styles.lab}>{o.label}</span>
                <span className={styles.del} title="Delete outfit" onClick={(e) => handleDelete(o, e)}>✕</span>
              </button>
            ))}

            {/* New outfit */}
            <button type="button" className={`${styles.tile} ${styles.new}`} onClick={() => { setAuthor(true); setErr(null); }}>
              <span className={styles.plus}>＋</span>
              <span className={styles.lab}>New outfit</span>
            </button>
          </div>

          {loading && <p className={styles.hint}>Loading outfits…</p>}

          {authorOpen && (
            <div className={styles.author}>
              <div className={styles.cardLabel}>New outfit</div>
              <div className={styles.authorRow}>
                <textarea
                  className={styles.textarea}
                  value={desc}
                  placeholder="Describe the clothing — e.g. navy blazer over a white tee"
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>

              {/* Original | New — same size, side by side */}
              <div className={styles.compare}>
                <figure className={styles.compareCol}>
                  {original?.imageUrl
                    ? <img className={styles.compareFig} src={original.imageUrl} alt="Original outfit" />
                    : <span className={`${styles.compareFig} ${styles.compareEmpty}`} aria-hidden="true">🧍</span>}
                  <figcaption className={styles.compareLab}>Original</figcaption>
                </figure>
                <span className={styles.compareArrow} aria-hidden="true">→</span>
                <figure className={styles.compareCol}>
                  {preview?.url
                    ? <img className={`${styles.compareFig} ${busy ? styles.compareDim : ''}`} src={preview.url} alt="New outfit preview" />
                    : <span className={`${styles.compareFig} ${styles.compareEmpty}`}>
                        {busy ? 'Generating…' : 'Your new outfit appears here'}
                      </span>}
                  <figcaption className={`${styles.compareLab} ${styles.compareLabNew}`}>New</figcaption>
                </figure>
              </div>
              {err && <p className={styles.err}>{err}</p>}
              <div className={styles.btnRow}>
                {!preview
                  ? <button type="button" className={`${styles.btn} ${styles.primary}`} disabled={busy} onClick={handleGenerate}>{busy ? 'Generating…' : 'Generate preview'}</button>
                  : <>
                      <button type="button" className={`${styles.btn} ${styles.primary}`} disabled={busy} onClick={handleConfirm}>{busy ? 'Saving…' : 'Save & use'}</button>
                      <button type="button" className={`${styles.btn} ${styles.ghost}`} disabled={busy} onClick={handleGenerate}>Regenerate</button>
                    </>
                }
                <button type="button" className={`${styles.btn} ${styles.ghost}`} disabled={busy}
                  onClick={() => { setAuthor(false); setDesc(''); setPreview(null); setErr(null); setAttempt(1); }}>Cancel</button>
              </div>
              <p className={styles.hint}>Re-clothes your avatar’s original face photo — likeness preserved. One pass, same as an avatar preview.</p>
            </div>
          )}
        </div>

        <div className={styles.foot}>
          <span className={styles.hint}>Pick an outfit, or add a new one. “Original” sends no outfit.</span>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}