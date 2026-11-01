// src/components/TemplateGallery.jsx
// Show 5 templates by default + expand + always-visible "Create from Scratch" card
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const FALLBACK_TEMPLATES = {
  'Scholar': [{
    id: 1, name: 'Ancient Philosopher',
    description: 'Wise thinker from classical antiquity seeking truth through dialogue',
    historical_period: 'Ancient', personality_archetype: 'Scholar', expertise_domain: 'Philosophy'
  }],
  'Artist': [{
    id: 2, name: 'Renaissance Artist',
    description: 'Creative genius from the Renaissance period fascinated by beauty and science',
    historical_period: 'Renaissance', personality_archetype: 'Artist', expertise_domain: 'Art'
  }],
  'Leader': [{
    id: 3, name: 'Industrial Innovator',
    description: 'Inventor or entrepreneur from the Industrial Revolution',
    historical_period: 'Industrial', personality_archetype: 'Leader', expertise_domain: 'Science'
  }],
  'Warrior': [{
    id: 4, name: 'Champion Athlete',
    description: 'Legendary competitor who dominated their sport',
    historical_period: 'Sports', personality_archetype: 'Warrior', expertise_domain: 'Athletics'
  }],
  'Explorer': [{
    id: 5, name: 'Sci-Fi Explorer',
    description: 'Space traveler or futuristic scientist from the unknown future',
    historical_period: 'Science Fiction', personality_archetype: 'Explorer', expertise_domain: 'Science'
  }]
};

// ─── Scratch template sentinel ────────────────────────────────
const SCRATCH_TEMPLATE = {
  id: -1,
  name: 'Create from Scratch',
  isScratch: true,
  description: 'Build your character from a blank canvas — complete creative control, no template constraints.',
  historical_period: null,
  personality_archetype: null,
  expertise_domain: null
};

const VISIBLE_COUNT = 7; // How many templates to show before "Show more"

// ─── Style helpers ────────────────────────────────────────────
const S = {
  overlay: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: '#0A0F1A', overflowY: 'auto',
    fontFamily: "'Inter', system-ui, sans-serif"
  },
  header: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(10,15,26,0.97)', backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(99,102,241,0.25)',
    padding: '1rem 2rem'
  },
  headerInner: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    maxWidth: '1200px', margin: '0 auto'
  },
  title: {
    color: '#F5F5DC', fontSize: '1.6rem',
    fontFamily: "'Syne', sans-serif", margin: '0 0 0.3rem 0', fontWeight: 700
  },
  subtitle: { color: '#94A3B8', margin: 0, fontSize: '0.85rem' },
  closeBtn: {
    background: 'rgba(28,38,64,0.8)', border: '1px solid rgba(148,163,184,0.3)',
    borderRadius: '8px', color: '#F1F5F9', fontSize: '0.9rem',
    fontWeight: 600, padding: '0.5rem 1rem', cursor: 'pointer',
    transition: 'all 0.2s ease', fontFamily: "'Inter', system-ui, sans-serif",
    flexShrink: 0
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '1.25rem',
    padding: '1.5rem 2rem',
    maxWidth: '1200px', margin: '0 auto'
  },
  card: (selected, isScratch) => ({
    background: isScratch
      ? 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(20,27,46,0.95))'
      : '#141B2E',
    border: selected
      ? '2px solid #6366F1'
      : isScratch
        ? '1px dashed rgba(99,102,241,0.45)'
        : '1px solid rgba(99,102,241,0.15)',
    borderRadius: '14px', padding: '1.25rem',
    cursor: 'pointer', transition: 'all 0.2s ease',
    display: 'flex', flexDirection: 'column', gap: '0.6rem',
    boxShadow: selected ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none'
  }),
  badge: (color) => ({
    display: 'inline-block', padding: '0.15rem 0.5rem',
    background: color + '22', border: `1px solid ${color}55`,
    borderRadius: '4px', color: color,
    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em',
    textTransform: 'uppercase'
  }),
  cardTitle: {
    color: '#F1F5F9', fontSize: '0.95rem', fontWeight: 700,
    margin: 0, fontFamily: "'Syne', sans-serif"
  },
  cardDesc: {
    color: '#94A3B8', fontSize: '0.8rem', lineHeight: 1.5, margin: 0, flex: 1
  },
  expertise: { color: '#6366F1', fontSize: '0.75rem', fontWeight: 600 },
  useBtn: (isScratch) => ({
    marginTop: '0.5rem', padding: '0.55rem 1rem',
    background: isScratch
      ? 'transparent'
      : 'linear-gradient(135deg, #6366F1, #4f46e5)',
    border: isScratch ? '1px solid rgba(99,102,241,0.5)' : 'none',
    borderRadius: '999px', color: '#fff', fontSize: '0.8rem',
    fontWeight: 600, cursor: 'pointer', width: '100%',
    boxShadow: isScratch ? 'none' : '0 4px 14px rgba(79,70,229,0.55)',
    transition: 'all 0.2s ease', fontFamily: "'Inter', system-ui, sans-serif"
  }),
  expandBtn: {
    display: 'block', margin: '0 auto 1.5rem',
    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.28)',
    borderRadius: '8px', color: '#818CF8', fontSize: '0.82rem',
    fontWeight: 600, padding: '0.55rem 1.4rem', cursor: 'pointer',
    transition: 'all 0.2s ease', fontFamily: "'Inter', system-ui, sans-serif"
  },
  filterBar: {
    padding: '0.75rem 2rem',
    background: 'rgba(255,255,255,0.02)',
    borderBottom: '1px solid rgba(99,102,241,0.1)'
  },
  filterInner: {
    maxWidth: '1200px', margin: '0 auto',
    display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap'
  },
  filterLabel: { color: 'rgba(99,102,241,0.8)', fontSize: '0.8rem', fontWeight: 600 },
  filterBtn: (active) => ({
    background: active ? 'rgba(99,102,241,0.18)' : '#141B2E',
    border: active ? '1px solid #6366F1' : '1px solid rgba(148,163,184,0.25)',
    borderRadius: '20px', color: active ? '#F1F5F9' : '#94A3B8',
    fontSize: '0.75rem', fontWeight: 600, padding: '0.35rem 0.75rem',
    cursor: 'pointer', transition: 'all 0.2s ease', textTransform: 'capitalize',
    fontFamily: "'Inter', system-ui, sans-serif",
    boxShadow: active ? '0 2px 10px rgba(99,102,241,0.35)' : 'none'
  }),
  confirmBar: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: 'rgba(10,15,26,0.97)', backdropFilter: 'blur(10px)',
    borderTop: '1px solid rgba(99,102,241,0.3)',
    padding: '0.85rem 2rem', zIndex: 100
  },
  confirmInner: {
    maxWidth: '1200px', margin: '0 auto',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  confirmName: {
    color: '#6366F1', fontSize: '0.875rem', fontWeight: 700,
    margin: '0 0 0.15rem 0', fontFamily: "'Syne', sans-serif"
  },
  confirmSub: { color: '#94A3B8', fontSize: '0.75rem', margin: 0 }
};

// ─── Era badge colours ────────────────────────────────────────
const eraColor = (era) => {
  const map = {
    ancient: '#8B6914', medieval: '#2C3E50', renaissance: '#B45309',
    industrial: '#7D3C98', sports: '#2E86C1', 'science fiction': '#0D9488',
    modern: '#1F618D', future: '#16A34A'
  };
  return map[(era || '').toLowerCase().trim()] || '#4F46E5';
};

// ─── Card component ───────────────────────────────────────────
function TemplateCard({ template, selected, onSelect }) {
  const isScratch = template.isScratch;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        ...S.card(selected, isScratch),
        ...(hovered ? { borderColor: '#6366F1', transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(99,102,241,0.2)' } : {})
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Era badge or Scratch badge */}
      <div>
        {isScratch ? (
          <span style={S.badge('#818CF8')}>✦ Blank Canvas</span>
        ) : template.historical_period ? (
          <span style={S.badge(eraColor(template.historical_period))}>
            {template.historical_period}
          </span>
        ) : null}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ ...S.cardTitle, flex: 1 }}>{template.name}</h3>
        {!isScratch && template.usage_count !== undefined && (
          <span style={{
            background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
            borderRadius: '6px', color: 'rgba(0,255,136,0.9)',
            fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.45rem',
            whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '0.5rem'
          }}>
            {template.usage_count} uses
          </span>
        )}
      </div>
      <p style={S.cardDesc}>{template.description}</p>

      {!isScratch && template.expertise_domain && (
        <span style={{ ...S.expertise, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {/* Diamond-dot domain mark — no external icon dependency */}
          <svg width='10' height='10' viewBox='0 0 10 10' fill='none'>
            <rect x='5' y='0.5' width='6.36' height='6.36'
              rx='0.8' transform='rotate(45 5 0.5)'
              fill='rgba(99,102,241,0.25)' stroke='#6366F1' strokeWidth='1'/>
            <circle cx='5' cy='5' r='1.2' fill='#818CF8'/>
          </svg>
          {template.expertise_domain}
        </span>
      )}

      {!isScratch && template.usage_count !== undefined && (
        <span style={{
          display: 'inline-block',
          background: 'rgba(0,255,136,0.08)',
          border: '1px solid rgba(0,255,136,0.25)',
          borderRadius: '6px',
          color: 'rgba(0,255,136,0.85)',
          fontSize: '0.68rem', fontWeight: 600,
          padding: '0.15rem 0.45rem'
        }}>
          {template.usage_count} uses
        </span>
      )}

      <button
        style={S.useBtn(isScratch)}
        onClick={() => onSelect(template)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = isScratch
            ? '0 4px 14px rgba(99,102,241,0.25)'
            : '0 8px 20px rgba(79,70,229,0.75)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isScratch ? 'none' : '0 4px 14px rgba(79,70,229,0.55)';
        }}
      >
        {isScratch ? 'Start from Scratch →' : 'Use Template'}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
const TemplateGallery = ({ onSelectTemplate, onClose }) => {
  const { user } = useUser();
  const [templates, setTemplates]           = useState([]);
  const [templateGroups, setTemplateGroups] = useState({});
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedArchetype, setSelectedArchetype] = useState('all');
  const [showAll, setShowAll]               = useState(false);

  // Load templates
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        if (user) {
          try {
            const res = await fetch(`${API_BASE}/api/premium/templates?per_page=100`, {
              method: 'GET', credentials: 'include',
              signal: AbortSignal.timeout(10000)
            });
            if (res.ok) {
              const data = await res.json();
              if (data.status === 'success') {
                setTemplates(data.templates || []);
                setTemplateGroups(data.template_groups || {});
                setAvailableCategories(data.available_categories || []);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.warn('Template API failed, using fallback:', e);
          }
        }

        // Fallback
        const flat = Object.values(FALLBACK_TEMPLATES).flat();
        setTemplates(flat);
        setTemplateGroups(FALLBACK_TEMPLATES);
        setAvailableCategories(Object.keys(FALLBACK_TEMPLATES));
      } catch (e) {
        console.error('Template load failed:', e);
        setError('Unable to load templates. Using basic templates.');
        const flat = Object.values(FALLBACK_TEMPLATES).flat();
        setTemplates(flat);
        setTemplateGroups(FALLBACK_TEMPLATES);
        setAvailableCategories(Object.keys(FALLBACK_TEMPLATES));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Reset showAll when archetype filter changes
  useEffect(() => { setShowAll(false); }, [selectedArchetype]);

  const archetypes = ['all', ...availableCategories];
  const allFiltered = selectedArchetype === 'all'
    ? templates
    : (templateGroups[selectedArchetype] || []);

  // Slice to VISIBLE_COUNT unless expanded
  const visibleTemplates = showAll ? allFiltered : allFiltered.slice(0, VISIBLE_COUNT);
  const hiddenCount = allFiltered.length - VISIBLE_COUNT;

  const handleSelect = (template) => {
    if (!template.id) return;

    // Scratch bypasses confirm bar — goes straight to builder
    if (template.isScratch) {
      onSelectTemplate(template);
      return;
    }

    setSelectedTemplate(template);
  };

  const handleConfirm = () => {
    if (selectedTemplate?.id) onSelectTemplate(selectedTemplate);
  };

  // ── Loading ──
  if (loading) return (
    <div style={{ ...S.overlay, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: '36px', height: '36px',
        border: '3px solid rgba(99,102,241,0.25)', borderTop: '3px solid #6366F1',
        borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem'
      }} />
      <p style={{ color: '#F1F5F9', fontSize: '1rem', margin: 0 }}>Loading templates...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Empty ──
  if (!loading && templates.length === 0) return (
    <div style={{ ...S.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: '#141B2E', border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '16px', padding: '2rem', textAlign: 'center', maxWidth: '480px'
      }}>
        <h2 style={{ color: '#6366F1', margin: '0 0 1rem 0', fontFamily: "'Syne', sans-serif" }}>
          Service Temporarily Unavailable
        </h2>
        <p style={{ color: '#94A3B8', margin: '0 0 1.5rem 0' }}>
          Template service is currently down. You can still create from scratch.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={() => onSelectTemplate(SCRATCH_TEMPLATE)}
            style={{ ...S.useBtn(true), width: 'auto', padding: '0.65rem 1.5rem' }}
          >
            Create from Scratch
          </button>
          <button onClick={onClose} style={S.closeBtn}>Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.overlay}>

      {/* Header */}
      <div style={S.header}>
        <div style={S.headerInner}>
          <div>
            <h1 style={S.title}>Character Templates</h1>
            <p style={S.subtitle}>
              Choose a starting point — or build from scratch ({templates.length} templates available)
            </p>
          </div>
          <button style={S.closeBtn} onClick={onClose}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.3)'; }}
          >
            × Close
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)',
          borderRadius: '8px', padding: '0.75rem 1rem',
          margin: '0.75rem 2rem', color: '#ff6b6b', fontSize: '0.85rem', textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Filter bar */}
      <div style={S.filterBar}>
        <div style={S.filterInner}>
          <span style={S.filterLabel}>Filter:</span>
          {archetypes.map(a => (
            <button key={a} style={S.filterBtn(selectedArchetype === a)}
              onClick={() => setSelectedArchetype(a)}
              onMouseEnter={(e) => { if (selectedArchetype !== a) e.currentTarget.style.borderColor = '#6366F1'; }}
              onMouseLeave={(e) => { if (selectedArchetype !== a) e.currentTarget.style.borderColor = 'rgba(148,163,184,0.25)'; }}
            >
              {a === 'all' ? 'All' : a}
            </button>
          ))}
        </div>
      </div>

      {/* Template grid */}
      <div style={S.grid}>
        {/* Scratch card — always first */}
        <TemplateCard
          template={SCRATCH_TEMPLATE}
          selected={false}
          onSelect={handleSelect}
        />

        {/* Template cards */}
        {visibleTemplates.map(t => (
          <TemplateCard
            key={t.id}
            template={t}
            selected={selectedTemplate?.id === t.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Show more / show less */}
      {hiddenCount > 0 && (
        <button
          style={S.expandBtn}
          onClick={() => setShowAll(v => !v)}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.14)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.28)'; }}
        >
          {showAll ? '↑ Show fewer templates' : `↓ Show ${hiddenCount} more templates`}
        </button>
      )}

      {/* Padding so confirm bar doesn't overlap */}
      {selectedTemplate && <div style={{ height: '80px' }} />}

      {/* Confirm bar */}
      {selectedTemplate && (
        <div style={S.confirmBar}>
          <div style={S.confirmInner}>
            <div>
              <p style={S.confirmName}>Selected: {selectedTemplate.name}</p>
              <p style={S.confirmSub}>Ready to customise this template</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button style={S.closeBtn} onClick={() => setSelectedTemplate(null)}>Cancel</button>
              <button
                onClick={handleConfirm}
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #4f46e5)', border: 'none',
                  borderRadius: '8px', color: '#fff', fontSize: '0.875rem',
                  fontWeight: 700, padding: '0.65rem 1.5rem', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                  fontFamily: "'Inter', system-ui, sans-serif", transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(79,70,229,0.7)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.4)'; }}
              >
                Use This Template →
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default TemplateGallery;