// src/components/CharacterBuilder.jsx
// Single scrollable form — no steps, placeholder-based inputs, visual_description field

import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

// ─── Shared input styles ──────────────────────────────────────
const inputStyle = (hasError, disabled) => ({
  width: '100%',
  padding: '0.6rem 0.75rem',
  fontSize: '0.85rem',
  border: `1px solid ${hasError ? '#f87171' : 'rgba(99,102,241,0.3)'}`,
  borderRadius: '8px',
  background: 'rgba(28,38,64,0.8)',
  color: '#F1F5F9',
  outline: 'none',
  fontFamily: "'Inter', system-ui, sans-serif",
  transition: 'border-color 0.2s ease',
  resize: 'vertical',
  lineHeight: 1.5,
  opacity: disabled ? 0.5 : 1,
  boxSizing: 'border-box'
});

const labelStyle = {
  display: 'block', color: '#94A3B8',
  fontSize: '0.72rem', fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  marginBottom: '0.35rem'
};

const hintStyle = {
  color: 'rgba(148,163,184,0.6)', fontSize: '0.72rem',
  margin: '0.25rem 0 0 0', lineHeight: 1.4
};

const sectionDivider = (label) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    margin: '1.5rem 0 1rem'
  }}>
    <div style={{ flex: 1, height: '1px', background: 'rgba(99,102,241,0.15)' }} />
    <span style={{
      color: '#6366F1', fontSize: '0.68rem', fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0
    }}>
      {label}
    </span>
    <div style={{ flex: 1, height: '1px', background: 'rgba(99,102,241,0.15)' }} />
  </div>
);

// ─── Field wrapper ────────────────────────────────────────────
function Field({ label, required, hint, error, char, maxChar, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: '#f87171', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
        {error
          ? <p style={{ color: '#f87171', fontSize: '0.72rem', margin: 0 }}>{error}</p>
          : hint
            ? <p style={hintStyle}>{hint}</p>
            : <span />
        }
        {maxChar !== undefined && (
          <span style={{ ...hintStyle, margin: 0, flexShrink: 0 }}>
            {char}/{maxChar}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
const CharacterBuilder = ({ template, onClose, onSuccess }) => {
  const { user }     = useUser();
  const isScratch    = !template?.id || template.id === -1;
  const [showInfo, setShowInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Form state ──────────────────────────────────────────────
  // Template pre-fills display_name only. All other fields are placeholder-driven.
  const [formData, setFormData] = useState({
    display_name:      isScratch ? '' : (template?.name || ''),
    short_description: '',
    system_instruction: '',
    behavior_goals:    '',   // comma-separated string → array on submit
    style_tone:        '',   // comma-separated string → array on submit
    constraints:       '',
    keyword_triggers:  '',   // comma-separated string → array on submit
    visual_description: ''
  });

  const [errors, setErrors]         = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Re-init if template changes
  useEffect(() => {
    if (template) {
      setFormData(prev => ({
        ...prev,
        display_name: isScratch ? '' : (template.name || '')
      }));
    }
  }, [template]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    if (submitError)   setSubmitError(null);
  };

  // ── Focus/blur helpers ──────────────────────────────────────
  const onFocus  = (e) => { e.target.style.borderColor = 'rgba(99,102,241,0.65)'; };
  const onBlur   = (e, field) => {
    e.target.style.borderColor = errors[field] ? '#f87171' : 'rgba(99,102,241,0.3)';
  };

  // ── Validation ──────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!formData.display_name.trim())
      e.display_name = 'Character name is required';
    else if (formData.display_name.length < 2)
      e.display_name = 'At least 2 characters';
    else if (formData.display_name.length > 50)
      e.display_name = 'Max 50 characters';

    if (!formData.short_description.trim())
      e.short_description = 'Description is required';
    else if (formData.short_description.length < 20)
      e.short_description = 'At least 20 characters';
    else if (formData.short_description.length > 500)
      e.short_description = 'Max 500 characters';

    if (!formData.system_instruction.trim())
      e.system_instruction = 'Personality instructions are required';
    else if (formData.system_instruction.length < 50)
      e.system_instruction = 'At least 50 characters';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsCreating(true);
    setSubmitError(null);

    // Convert comma-separated strings → clean arrays
    const toArray = (str) =>
      str.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
      template_id:        template?.id || -1,
      display_name:       formData.display_name.trim(),
      short_description:  formData.short_description.trim(),
      system_instruction: formData.system_instruction.trim(),
      behavior_goals:     toArray(formData.behavior_goals),
      style_tone:         toArray(formData.style_tone),
      constraints:        formData.constraints.trim(),
      keyword_triggers:   toArray(formData.keyword_triggers),
      visual_description: formData.visual_description.trim(),
      relationships:      {},
      // Template metadata (null for scratch)
      historical_period:      template?.historical_period  || null,
      personality_archetype:  template?.personality_archetype || null,
      expertise_domain:       template?.expertise_domain   || null
    };

    try {
      const res = await fetch(`${API_BASE}/api/premium/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCookie('av_csrf')
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          if (result.can_grant_trial) {
            try {
              await fetch(`${API_BASE}/api/premium/trial/${user?.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCookie('av_csrf') },
                credentials: 'include',
                body: JSON.stringify({ trial_days: 3 })
              });
              setSubmitError('Trial activated! Please try creating your character again.');
            } catch { setSubmitError(result.error || 'Permission denied.'); }
          } else {
            setSubmitError(result.error || 'Character creation requires premium access.');
          }
          return;
        }
        if (res.status === 400) {
          setSubmitError(result.error || 'Invalid character data. Please check your inputs.');
          return;
        }
        if (res.status >= 500) {
          setSubmitError('Server error. Please try again later.');
          return;
        }
        setSubmitError(result.error || 'Character creation failed. Please try again.');
        return;
      }

      setSubmitSuccess(true);
      setTimeout(() => { if (onSuccess) onSuccess(result); }, 2000);

    } catch (err) {
      console.error('Character creation error:', err);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────
  if (submitSuccess) return (
    <div style={{
      width: '100%', height: '100vh', background: '#0A0F1A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      <div style={{
        background: '#141B2E', border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '20px', padding: '2.5rem', textAlign: 'center', maxWidth: '440px'
      }}>
        <div style={{
          width: '64px', height: '64px',
          background: 'linear-gradient(135deg, rgba(0,255,136,0.9), #00CC6A)',
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.75rem', color: 'white'
        }}>✓</div>
        <h2 style={{ color: '#6366F1', fontSize: '1.5rem', margin: '0 0 0.75rem 0', fontFamily: "'Syne', sans-serif" }}>
          Character Created!
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.75rem 0' }}>
          <strong style={{ color: '#F1F5F9' }}>{formData.display_name}</strong> has been submitted for
          approval. You'll receive an email when your character is ready — usually within 24–48 hours.
        </p>
        <button onClick={onClose} style={{
          background: 'linear-gradient(135deg, #6366F1, #4f46e5)', border: 'none',
          borderRadius: '999px', color: '#fff', fontSize: '0.9rem',
          fontWeight: 700, padding: '0.75rem 2rem', cursor: 'pointer',
          fontFamily: "'Inter', system-ui, sans-serif"
        }}>
          Continue Exploring
        </button>
      </div>
    </div>
  );

  // ── Main render ─────────────────────────────────────────────
  return (
    <div style={{
      width: '100%', height: '100vh', background: '#0A0F1A',
      fontFamily: "'Inter', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>

      {/* Header */}
      <div style={{
        padding: isMobile ? '1rem 1.25rem' : '1rem 2rem',
        borderBottom: '1px solid rgba(99,102,241,0.2)',
        background: '#141B2E',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: isMobile ? '1.1rem' : '1.35rem',
            color: '#F5F5DC', margin: '0 0 0.15rem 0', fontWeight: 700
          }}>
            {isScratch ? 'Create from Scratch' : 'Customise Template'}
          </h1>
          <p style={{ color: '#64748B', margin: 0, fontSize: '0.75rem' }}>
            {isScratch ? 'Build your character from a blank canvas'
              : `Based on: ${template?.name}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowInfo(v => !v)}
            style={{
              background: showInfo ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.35)',
              borderRadius: '7px', color: '#818CF8',
              fontSize: '0.75rem', fontWeight: 600,
              padding: '0.4rem 0.8rem', cursor: 'pointer',
              fontFamily: "'Inter', system-ui, sans-serif",
              transition: 'all 0.2s ease'
            }}
          >
            ℹ Info
          </button>
          <button
            onClick={onClose}
            disabled={isCreating}
            style={{
              background: 'rgba(28,38,64,0.8)',
              border: '1px solid rgba(148,163,184,0.25)',
              borderRadius: '7px', color: '#94A3B8',
              fontSize: '0.75rem', fontWeight: 600,
              padding: '0.4rem 0.9rem', cursor: isCreating ? 'not-allowed' : 'pointer',
              opacity: isCreating ? 0.5 : 1,
              fontFamily: "'Inter', system-ui, sans-serif"
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div style={{
          background: 'rgba(99,102,241,0.05)',
          border: '1px solid rgba(99,102,241,0.18)',
          borderRadius: '10px', padding: '1rem 1.25rem',
          margin: '0.75rem 2rem 0', color: '#94A3B8',
          fontSize: '0.8rem', lineHeight: 1.6, flexShrink: 0
        }}>
          <strong style={{ color: '#818CF8' }}>Building a great character</strong>
          <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
            <li>Use an accurate, memorable name — it helps with avatar generation too</li>
            <li>System instructions are the core: be specific about speech patterns and expertise</li>
            <li>Avatar description helps generate an accurate image — describe appearance and style</li>
            <li>Behaviour goals and style tags improve how the AI performs in group dialogues</li>
          </ul>
        </div>
      )}

      {/* Scrollable form */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: isMobile ? '1rem 1.25rem' : '1rem 2rem',
        display: 'flex', justifyContent: 'center'
      }}>
        <div style={{ width: '100%', maxWidth: '620px', paddingBottom: '1rem' }}>

          {/* ── Section: Basic Info ── */}
          {sectionDivider('Basic Info')}

          <Field label="Character Name" required error={errors.display_name}
            char={formData.display_name.length} maxChar={50}
          >
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => handleChange('display_name', e.target.value.slice(0, 50))}
              placeholder="e.g. Marcus Aurelius, Ada Lovelace, Ibn Battuta"
              disabled={isCreating}
              style={inputStyle(errors.display_name, isCreating)}
              onFocus={onFocus}
              onBlur={(e) => onBlur(e, 'display_name')}
            />
          </Field>

          <Field label="Short Description" required error={errors.short_description}
            hint="1–2 sentences capturing who they are and what makes them unique"
            char={formData.short_description.length} maxChar={500}
          >
            <textarea
              rows={3}
              value={formData.short_description}
              onChange={(e) => handleChange('short_description', e.target.value.slice(0, 500))}
              placeholder="e.g. Roman emperor and Stoic philosopher who ruled the empire while writing private meditations on virtue and duty"
              disabled={isCreating}
              style={inputStyle(errors.short_description, isCreating)}
              onFocus={onFocus}
              onBlur={(e) => onBlur(e, 'short_description')}
            />
          </Field>

          {/* ── Section: Personality ── */}
          {sectionDivider('Personality & Behaviour')}

          <Field label="System Instructions" required error={errors.system_instruction}
            hint="Define how they think, speak, and behave. The more specific, the more authentic."
            char={formData.system_instruction.length}
          >
            <textarea
              rows={6}
              value={formData.system_instruction}
              onChange={(e) => handleChange('system_instruction', e.target.value)}
              placeholder={`You are [Name], a [role/era description]. Your speaking style is [formal/conversational/archaic]. You frequently reference [topics, events, beliefs]. You approach questions through the lens of [philosophy/expertise]. You avoid [anachronisms/certain topics]. When challenged, you respond with [reasoning style].`}
              disabled={isCreating}
              style={inputStyle(errors.system_instruction, isCreating)}
              onFocus={onFocus}
              onBlur={(e) => onBlur(e, 'system_instruction')}
            />
          </Field>

          <Field label="Behaviour Goals (optional)"
            hint="What should this character aim to do in conversations? Comma-separated."
          >
            <input
              type="text"
              value={formData.behavior_goals}
              onChange={(e) => handleChange('behavior_goals', e.target.value)}
              placeholder="e.g. Share historical insights, Challenge assumptions, Teach through storytelling"
              disabled={isCreating}
              style={inputStyle(false, isCreating)}
              onFocus={onFocus}
              onBlur={(e) => onBlur(e, 'behavior_goals')}
            />
          </Field>

          <Field label="Style & Tone Tags (optional)"
            hint="Descriptive tags for how they communicate. Comma-separated."
          >
            <input
              type="text"
              value={formData.style_tone}
              onChange={(e) => handleChange('style_tone', e.target.value)}
              placeholder="e.g. Authoritative, Philosophical, Measured, Rich in metaphor"
              disabled={isCreating}
              style={inputStyle(false, isCreating)}
              onFocus={onFocus}
              onBlur={(e) => onBlur(e, 'style_tone')}
            />
          </Field>

          <Field label="Keyword Triggers (optional)"
            hint="Topics that naturally draw this character to engage. Comma-separated."
          >
            <input
              type="text"
              value={formData.keyword_triggers}
              onChange={(e) => handleChange('keyword_triggers', e.target.value)}
              placeholder="e.g. philosophy, virtue, leadership, Roman history, duty"
              disabled={isCreating}
              style={inputStyle(false, isCreating)}
              onFocus={onFocus}
              onBlur={(e) => onBlur(e, 'keyword_triggers')}
            />
          </Field>

          <Field label="Constraints (optional)"
            hint="Any guardrails — topics to avoid or boundaries to respect."
          >
            <textarea
              rows={2}
              value={formData.constraints}
              onChange={(e) => handleChange('constraints', e.target.value)}
              placeholder="e.g. Avoid referencing events after 180 AD. Do not use modern slang."
              disabled={isCreating}
              style={inputStyle(false, isCreating)}
              onFocus={onFocus}
              onBlur={(e) => onBlur(e, 'constraints')}
            />
          </Field>

          {/* ── Section: Avatar ── */}
          {sectionDivider('Avatar Description')}

          <Field label="Visual Description (optional)"
            hint="Describe appearance for AI image generation. Max 200 characters."
            char={formData.visual_description.length} maxChar={200}
          >
            <textarea
              rows={2}
              value={formData.visual_description}
              onChange={(e) => handleChange('visual_description', e.target.value.slice(0, 200))}
              placeholder="e.g. Middle-aged man with a beard, wearing Roman imperial armour, wise and calm expression, oil painting style"
              disabled={isCreating}
              style={inputStyle(false, isCreating)}
              onFocus={onFocus}
              onBlur={(e) => onBlur(e, 'visual_description')}
            />
          </Field>

          {/* ── Error ── */}
          {submitError && (
            <div style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: '8px', padding: '0.75rem 1rem',
              color: '#f87171', fontSize: '0.82rem', margin: '0.5rem 0'
            }}>
              {submitError}
            </div>
          )}

          {/* ── Submit ── */}
          <div style={{
            marginTop: '1.25rem', paddingTop: '1rem',
            borderTop: '1px solid rgba(99,102,241,0.12)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <p style={{ color: '#475569', fontSize: '0.72rem', margin: 0, maxWidth: '55%' }}>
              Your character will be reviewed for quality — usually approved within 24 hours.
            </p>
            <button
              onClick={handleSubmit}
              disabled={isCreating}
              style={{
                background: isCreating
                  ? 'rgba(99,102,241,0.4)'
                  : 'linear-gradient(135deg, #6366F1, #4f46e5)',
                border: 'none', borderRadius: '8px',
                color: '#fff', fontSize: '0.875rem', fontWeight: 700,
                padding: '0.65rem 1.75rem', cursor: isCreating ? 'not-allowed' : 'pointer',
                boxShadow: isCreating ? 'none' : '0 4px 14px rgba(99,102,241,0.45)',
                fontFamily: "'Inter', system-ui, sans-serif",
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isCreating) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(79,70,229,0.7)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isCreating ? 'none' : '0 4px 14px rgba(99,102,241,0.45)';
              }}
            >
              {isCreating ? (
                <>
                  <div style={{
                    width: '14px', height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid #fff',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                  }} />
                  Submitting...
                </>
              ) : 'Submit for Approval →'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea, input { color: #F1F5F9 !important; }
        textarea::placeholder, input::placeholder {
          color: rgba(148,163,184,0.45) !important;
        }
      `}</style>
    </div>
  );
};

export default CharacterBuilder;