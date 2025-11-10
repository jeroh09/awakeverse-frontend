import React, { useEffect, useMemo, useState } from 'react';
import css from './StoryCreator.module.css';

const CHAR_CHOICES = [
  { key: 'sherlock', name: 'Sherlock Holmes' },
  { key: 'rasputin', name: 'Rasputin' },
  { key: 'voltaire', name: 'Voltaire' },
  { key: 'helen_of_troy', name: 'Helen of Troy' },
  { key: 'baba_yaga', name: 'Baba Yaga' },
];

export default function StoryCreator({ open, onClose, template, onSubmit, gated }) {
  const [title, setTitle] = useState('');
  const [characterKey, setCharacterKey] = useState('sherlock');
  const [era, setEra] = useState('');
  const [situation, setSituation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  // Prefill from template if present
  useEffect(() => {
    setTitle(template ? `My ${template.title}` : '');
    setCharacterKey(template?.preset_character_key || 'sherlock');
    setEra(template?.preset_era || '');
    setSituation(template?.preset_situation || '');
  }, [template]);

  const canSubmit = useMemo(() => {
    if (gated) return false; // upgrade wall
    return (title?.trim()?.length || 0) > 0 && characterKey && (situation?.trim()?.length || 0) > 0;
  }, [title, characterKey, situation, gated]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setErr(null);
    try {
      const payload = {
        title: title.trim(),
        character_key: characterKey,
        starting_situation: situation.trim(),
        template_id: template?.id ?? null,
        custom_era: era?.trim() || undefined,
      };
      const res = await onSubmit(payload);
      // On success, close modal and (later) open chat window in Step 3-4
      onClose();
      // You can bubble success upward if you want to auto-open chat
      // e.g., props.onCreated?.(res)
      console.info('Story created:', res);
    } catch (e) {
      setErr(e.message || 'Failed to create story');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={css.overlay} onClick={() => !submitting && onClose()} />
      <div className={css.modal} role="dialog" aria-modal="true" aria-label="Create Story">
        <header className={css.hd}>
          <h3>{template ? `${template.title} — Create` : 'Create Story'}</h3>
          <button className={css.close} onClick={() => !submitting && onClose()}>×</button>
        </header>

        <div className={css.bd}>
          {gated && (
            <div className={css.gate}>
              You’re on the Free plan. Upgrade to start a story.
            </div>
          )}

          <div className={css.field}>
            <label className={css.label}>Title</label>
            <input className={css.input} value={title} onChange={e=>setTitle(e.target.value)} placeholder="My Victorian Adventure" />
          </div>

          <div className={css.field}>
            <label className={css.label}>Character</label>
            <select className={css.select} value={characterKey} onChange={e=>setCharacterKey(e.target.value)}>
              {CHAR_CHOICES.map(c => <option key={c.key} value={c.key}>{c.name}</option>)}
            </select>
          </div>

          <div className={css.row2}>
            <div className={css.field}>
              <label className={css.label}>Era (optional)</label>
              <input className={css.input} value={era} onChange={e=>setEra(e.target.value)} placeholder="1890s" />
            </div>
            <div className={css.field}>
              <label className={css.label}>Template</label>
              <input className={css.input} disabled value={template ? `#${template.id}` : '—'} />
            </div>
          </div>

          <div className={css.field}>
            <label className={css.label}>Starting Situation</label>
            <textarea className={css.textarea} value={situation} onChange={e=>setSituation(e.target.value)} placeholder="A mysterious letter arrives at Baker Street..." />
          </div>

          {err && <div className={css.error}>⚠ {err}</div>}
        </div>

        <footer className={css.ft}>
          <button className={css.btn} onClick={onClose} disabled={submitting}>Cancel</button>
          <button className={css.btnGold} onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? 'Starting…' : 'Start Story'}
          </button>
        </footer>
      </div>
    </>
  );
}
