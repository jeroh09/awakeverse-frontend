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
//   • The top of the modal is a STAGE: this speaker's avatar (Original) → the
//     change (the new-outfit preview while creating one, else the outfit picked
//     for this episode). The wardrobe is a compact strip below it.
//   • "＋ New outfit" runs generate-preview → confirm inline (same shape as the
//     avatar generate/confirm flow), then selects the new outfit.
//
// Controlled: onSelect(outfitRefUrl | null, label | null) writes the choice onto
// the speaker in the page; the modal stays open until Done/✕/backdrop.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './OutfitPicker.module.css';
import { IconOutfit, IconClose, IconPerson, IconArrowRight, IconCheck, IconBin, IconPlus } from './StudioIcons';

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

  // ── The stage: THIS avatar (left) → the change (right) ──────────────────
  // Always the selected speaker's own avatar on the left. The right side is:
  // the new-outfit preview while creating one; else the outfit picked for this
  // episode; else a prompt (Original = no change).
  const originalImg   = original?.imageUrl || null;
  const selectedOutfit = currentRefUrl ? outfits.find(o => o.outfitRefUrl === currentRefUrl) : null;
  let changeImg = null, changeLabel = 'This episode', changeHint = null;
  if (authorOpen) {
    changeImg   = preview?.url || null;
    changeLabel = 'New outfit';
    changeHint  = busy ? 'Generating…' : 'Describe the outfit below, then generate a preview';
  } else if (currentRefUrl) {
    changeImg   = selectedOutfit?.fullbodyRefUrl || currentRefUrl;
    changeLabel = selectedOutfit?.label || 'Selected outfit';
  } else {
    changeHint  = 'No change — wearing the original. Pick an outfit below or create a new one.';
  }
  const startNew = () => { setAuthor(true); setErr(null); };

  return (
    <div className={styles.backdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Choose outfit" ref={dialogRef}>
        <div className={styles.head}>
          <span className={styles.ic} aria-hidden="true"><IconOutfit size={20} /></span>
          <div className={styles.title}>Outfit — {speakerLabel}<small>This episode · saved to your avatar</small></div>
          <button type="button" className={styles.close} aria-label="Close" onClick={onClose}><IconClose size={14} /></button>
        </div>

        <div className={styles.body}>
          {/* Stage — the avatar being changed → the change */}
          <div className={styles.stage}>
            <figure className={styles.stageCol}>
              <div className={styles.stageFrame}>
                {originalImg
                  ? <img className={styles.stageFig} src={originalImg} alt={`${speakerLabel} — original outfit`} />
                  : <span className={`${styles.stageFig} ${styles.stageEmpty}`} aria-hidden="true"><IconPerson size="1em" /></span>}
                {originalBusy && <span className={styles.figBusy}>Preparing…</span>}
              </div>
              <figcaption className={styles.stageLab}>{speakerLabel} · Original</figcaption>
            </figure>

            <span className={styles.stageArrow} aria-hidden="true"><IconArrowRight size={18} /></span>

            <figure className={styles.stageCol}>
              <div className={styles.stageFrame}>
                {changeImg
                  ? <img className={`${styles.stageFig} ${authorOpen && busy ? styles.stageDim : ''}`}
                         src={changeImg} alt={`${speakerLabel} — ${changeLabel}`} />
                  : <span className={`${styles.stageFig} ${styles.stageEmpty} ${styles.stageEmptyText}`}>{changeHint}</span>}
              </div>
              <figcaption className={`${styles.stageLab} ${styles.stageLabNew}`}>{changeLabel}</figcaption>
            </figure>
          </div>

          {authorOpen && (
            <div className={styles.author}>
              <div className={styles.cardLabel}>New outfit for {speakerLabel}</div>
              <textarea
                className={styles.textarea}
                value={desc}
                placeholder="Describe the clothing — e.g. navy blazer over a white tee"
                onChange={(e) => setDesc(e.target.value)}
              />
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
              <p className={styles.hint}>Re-dresses {speakerLabel} — same face, hair and build; only the clothes change.</p>
            </div>
          )}

          {/* Wardrobe — compact strip; click to choose for this episode */}
          <div className={styles.wardrobe}>
            <div className={styles.cardLabel}>Wardrobe</div>
            <div className={styles.grid}>
              <button type="button"
                className={`${styles.tile} ${!currentRefUrl ? styles.on : ''}`}
                onClick={pickOriginal} title="Original — no outfit change">
                {originalImg
                  ? <img className={styles.fig} src={originalImg} alt="" />
                  : <span className={styles.figOriginal} aria-hidden="true"><IconPerson size="1em" /></span>}
                <span className={styles.chk}><IconCheck size={11} strokeWidth={2.6} /></span>
                <span className={styles.lab}>Original</span>
              </button>

              {outfits.map((o) => (
                <button type="button" key={o.outfitId}
                  className={`${styles.tile} ${currentRefUrl === o.outfitRefUrl ? styles.on : ''}`}
                  onClick={() => pickOutfit(o)} title={o.description || o.label}>
                  <img className={styles.fig} src={o.fullbodyRefUrl} alt="" loading="lazy" />
                  <span className={styles.chk}><IconCheck size={11} strokeWidth={2.6} /></span>
                  <span className={styles.lab}>{o.label}</span>
                  <span className={styles.del} title="Delete outfit" onClick={(e) => handleDelete(o, e)}><IconBin size={11} /></span>
                </button>
              ))}

              {!authorOpen && (
                <button type="button" className={`${styles.tile} ${styles.new}`} onClick={startNew}>
                  <span className={styles.plus}><IconPlus size={22} /></span>
                  <span className={styles.lab}>New outfit</span>
                </button>
              )}
            </div>
            {loading && <p className={styles.hint}>Loading outfits…</p>}
          </div>
        </div>

        <div className={styles.foot}>
          <span className={styles.hint}>Pick an outfit, or add a new one. “Original” sends no outfit.</span>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}