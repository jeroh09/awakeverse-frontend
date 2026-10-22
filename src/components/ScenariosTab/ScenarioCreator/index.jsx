// src/components/ScenariosTab/ScenarioCreator/index.jsx
// Full-page split layout: category sidebar + character grid (left) | form (right)
// position:fixed covers the screen — works from both ScenariosTab and TemplateDetailModal
// onClose → returns to wherever the caller came from (no internal navigation needed)

import React, { useState, useEffect, useMemo } from 'react';
import { createScenario } from '../../../api';
import { characterCategories } from '../../../data/characterCategories';
import usePremiumCharacters from '../../../hooks/usePremiumCharacters';
import { getDisplayNameFromKey } from '../../../utils/characterUtils';
import QuestionEditor from './QuestionEditor';
import './ScenarioCreatorPage.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

// ─── Category label helper ────────────────────────────────────
function getCategoryLabel(key) {
  if (key === 'all') return 'All Characters';
  if (key === 'my_characters') return '⭐ My Characters';
  const cat = characterCategories.find(c => c.key === key);
  return cat?.title || key.charAt(0).toUpperCase() + key.slice(1);
}

// ─── Character Avatar ─────────────────────────────────────────
function CharAvatar({ char }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div className="scp-char-avatar">
      {char.thumbnailUrl && !imgFailed ? (
        <img
          src={char.thumbnailUrl}
          alt={char.name}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="scp-char-initial">
          {char.name.charAt(0).toUpperCase()}
        </div>
      )}
      {char.type === 'custom' && <span className="scp-custom-badge">⭐</span>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function ScenarioCreator({
  template            = null,
  onClose,
  onSuccess,
  currentScenarioCount = 0,
  // isOpen kept for backward compat — parent guards rendering so this is
  // usually unnecessary, but we respect an explicit false
  isOpen              = true,
}) {
  // ── Mobile detection ──
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Form state ──
  const [title,             setTitle]             = useState('');
  const [description,       setDescription]       = useState('');
  const [scenarioCategory,  setScenarioCategory]  = useState('general');
  const [selectedChars,     setSelectedChars]     = useState([]);
  const [starterQuestions,  setStarterQuestions]  = useState([]);
  const [sceneSetting, setSceneSetting] = useState('');
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState(null);

  // ── Character browser state ──
  const [searchQuery,    setSearchQuery]    = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // ── Custom characters ──
  const {
    userCharacters = [],
    loading: charsLoading,
    fetchUserCharacters
  } = usePremiumCharacters();

  // Force fresh data on mount
  useEffect(() => { fetchUserCharacters?.(); }, [fetchUserCharacters]);

  // ── Initialise from template ──
  useEffect(() => {
    if (template) {
      setTitle(template.title || '');
      setDescription(template.description || '');
      setScenarioCategory(template.category || 'general');
      const chars = template.suggested_characters || template.character_keys || [];
      setSelectedChars(chars.slice(0, 4));
      const qs = template.starter_questions || [];
      setStarterQuestions(qs.length > 0 ? [...qs] : []);
      setSceneSetting(template.scene_setting || '');
    }
  }, [template]);

  // ── Build combined character list ──
  const allCharacters = useMemo(() => {
    const chars = [];
    const seen  = new Set();

    // Static characters from categories
    characterCategories.forEach(cat => {
      if (cat.key === 'my_characters') return;
      (cat.characters || []).forEach(char => {
        if (!seen.has(char.key)) {
          seen.add(char.key);
          chars.push({
            key:          char.key,
            name:         char.name,
            description:  char.description || char.tagline || '',
            category:     cat.key,
            categoryTitle:cat.title,
            type:         'static',
            thumbnailUrl: char.thumbnailUrl || `${API_BASE}/character_images/${char.key}.jpg`,
          });
        }
      });
    });

    // Custom (approved) characters
    if (!charsLoading && Array.isArray(userCharacters)) {
      userCharacters
        .filter(c => c?.character_key && c?.status === 'approved')
        .forEach(char => {
          if (!seen.has(char.character_key)) {
            seen.add(char.character_key);
            chars.push({
              key:          char.character_key,
              name:         char.display_name || getDisplayNameFromKey(char.character_key),
              description:  char.short_description || 'Custom character',
              category:     'my_characters',
              categoryTitle:'My Characters',
              type:         'custom',
              thumbnailUrl: char.avatar_url || `/images/${char.character_key}.jpg`,
            });
          }
        });
    }

    return chars;
  }, [userCharacters, charsLoading]);

  // ── Category list for sidebar ──
  const categories = useMemo(() => {
    const cats = [...new Set(allCharacters.map(c => c.category))].sort((a, b) => {
      if (a === 'my_characters') return -1;
      if (b === 'my_characters') return 1;
      return a.localeCompare(b);
    });
    return ['all', ...cats];
  }, [allCharacters]);

  // ── Filtered characters for active category + search ──
  const filteredCharacters = useMemo(() => {
    let list = allCharacters;
    if (activeCategory !== 'all') {
      list = list.filter(c => c.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allCharacters, activeCategory, searchQuery]);

  // ── Character toggle ──
  const toggleChar = (key) => {
    setSelectedChars(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      if (prev.length >= 4) return prev;
      return [...prev, key];
    });
  };

  // ── Validation ──
  const canSave = (
    selectedChars.length >= 2 &&
    selectedChars.length <= 4 &&
    title.trim().length > 0 &&
    description.trim().length > 0
  );
  const atScenarioLimit = currentScenarioCount >= 5;

  // ── Submit ──
  const handleSave = async () => {
    if (!canSave) {
      setError('Select 2–4 characters and complete the title and description.');
      return;
    }
    if (atScenarioLimit) {
      setError('Maximum of 5 scenarios reached. Delete one to create a new scenario.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await createScenario({
        title:             title.trim(),
        description:       description.trim(),
        category:          scenarioCategory || 'general',
        character_keys:    selectedChars,
        starter_questions: starterQuestions.filter(q => q.trim()),
        scenario_type:     'debate',
        max_simultaneous:  Math.min(selectedChars.length, 4),
        template_id:       template?.id || null,
        scene_setting: sceneSetting.trim() || null,
      });
      if (result.status === 'success') {
        onSuccess(result.scenario);
        onClose();
      } else {
        throw new Error(result.error || 'Failed to create scenario');
      }
    } catch (err) {
      setError(err.message || 'Failed to create scenario. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Backward compat: respect explicit isOpen=false ──
  if (isOpen === false) return null;

  return (
    <div className="scp-root">

      {/* ══ Header ══ */}
      <div className="scp-header">
        <button className="scp-back" onClick={onClose} disabled={loading}>
          ← Back to Scenarios
        </button>

        <div className="scp-header-center">
          <h1 className="scp-title">Create Scenario</h1>
          {template && (
            <span className="scp-template-badge">From: {template.title}</span>
          )}
        </div>

        <div className="scp-header-right">
          <span className="scp-selection-count">
            {selectedChars.length}/4 selected
          </span>
        </div>
      </div>

      {/* ══ Body ══ */}
      <div className="scp-body">

        {/* ── LEFT PANEL: category sidebar + character grid ── */}
        <div className="scp-left">

          {/* Category sidebar */}
          <div className="scp-categories">
            {categories.map(cat => (
              <button
                key={cat}
                className={`scp-cat-tab${activeCategory === cat ? ' active' : ''}`}
                onClick={() => { setActiveCategory(cat); setSearchQuery(''); }}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* Search + scrollable character grid */}
          <div className="scp-char-panel">
            <div className="scp-search-wrap">
              <input
                className="scp-search"
                placeholder="Search characters…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="scp-char-grid">
              {charsLoading && allCharacters.length === 0 ? (
                <div className="scp-state-msg">Loading characters…</div>
              ) : filteredCharacters.length === 0 ? (
                <div className="scp-state-msg">
                  No characters found.
                  {searchQuery && (
                    <><br /><button
                      style={{ marginTop: '0.5rem', background: 'none', border: 'none',
                               color: '#6366F1', cursor: 'pointer', fontSize: '0.8rem' }}
                      onClick={() => setSearchQuery('')}
                    >Clear search</button></>
                  )}
                </div>
              ) : (
                filteredCharacters.map(char => {
                  const selected = selectedChars.includes(char.key);
                  const disabled = !selected && selectedChars.length >= 4;
                  return (
                    <div
                      key={char.key}
                      className={`scp-char-card${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
                      onClick={() => !disabled && toggleChar(char.key)}
                      title={char.name}
                    >
                      <CharAvatar char={char} />

                      <div className="scp-char-info">
                        <div className="scp-char-name">{char.name}</div>
                        <div className="scp-char-desc">{char.description}</div>
                      </div>

                      {selected && <div className="scp-check">✓</div>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: form ── */}
        <div className="scp-right">

          {/* Banners */}
          {error && <div className="scp-error">⚠️ {error}</div>}
          {atScenarioLimit && !error && (
            <div className="scp-warning">
              🚫 Maximum of 5 scenarios reached. Delete one to create a new scenario.
            </div>
          )}

          {/* Selected characters */}
          <div className="scp-section">
            <label className="scp-label">
              Characters
              <span className="scp-req"> *</span>
              <span className="scp-optional">(2–4 required · {selectedChars.length}/4)</span>
            </label>
            <div className="scp-chips">
              {selectedChars.length === 0 ? (
                <span className="scp-no-selection">
                  ← Choose characters from the left panel
                </span>
              ) : (
                selectedChars.map(key => {
                  const char = allCharacters.find(c => c.key === key);
                  return (
                    <div key={key} className="scp-chip">
                      <span>{char?.name || getDisplayNameFromKey(key)}</span>
                      <button
                        className="scp-chip-remove"
                        onClick={() => toggleChar(key)}
                        aria-label={`Remove ${char?.name || key}`}
                      >×</button>
                    </div>
                  );
                })
              )}
            </div>
            {selectedChars.length === 1 && (
              <p className="scp-hint">Add at least one more character</p>
            )}
          </div>

          {/* Title */}
          <div className="scp-section">
            <label className="scp-label" htmlFor="scp-title">
              Title<span className="scp-req">*</span>
            </label>
            <input
              id="scp-title"
              className="scp-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., The Future of AI Ethics"
              maxLength={100}
            />
            <div className="scp-char-count">{title.length}/100</div>
          </div>

          {/* Description */}
          <div className="scp-section">
            <label className="scp-label" htmlFor="scp-desc">
              Description<span className="scp-req">*</span>
            </label>
            <textarea
              id="scp-desc"
              className="scp-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this scenario about? Set the stage for the debate."
              maxLength={500}
              rows={isMobile ? 3 : 4}
            />
          <div className="scp-char-count">{description.length}/500</div> 
          {/* Scene Setting — optional, feeds screenplay generation */}
          <div className="scp-section">
            <label className="scp-label" htmlFor="scp-scene">
              Scene Setting
              <span className="scp-optional"> (optional)</span>
            </label>
            <input
              id="scp-scene"
              className="scp-input"
              value={sceneSetting}
              onChange={e => setSceneSetting(e.target.value)}
              placeholder="e.g. A living room in South London, evening"
              maxLength={200}
            />
            <div className="scp-hint">
              Helps the script generator place your characters in the right environment.
            </div>
          </div>
          </div>

          {/* Category */}
          <div className="scp-section">
            <label className="scp-label" htmlFor="scp-cat">Category</label>
            <select
              id="scp-cat"
              className="scp-select"
              value={scenarioCategory}
              onChange={e => setScenarioCategory(e.target.value)}
            >
              <option value="philosophy">Philosophy</option>
              <option value="technology">Technology</option>
              <option value="business">Business</option>
              <option value="ethics">Ethics</option>
              <option value="fiction">Fiction</option>
              <option value="relationships">Relationships</option>
              <option value="science">Science</option>
              <option value="warfare">Warfare</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Starter questions */}
          <div className="scp-section">
            <label className="scp-label">
              Starter Questions
              <span className="scp-optional">(optional)</span>
            </label>
            <QuestionEditor
              questions={starterQuestions}
              onChange={setStarterQuestions}
            />
          </div>

          {/* Save */}
          <div className="scp-save-row">
            <button
              className="scp-save-btn"
              onClick={handleSave}
              disabled={!canSave || loading || atScenarioLimit}
            >
              {loading ? 'Creating…' : 'Create Scenario ▶'}
            </button>
          </div>

        </div>{/* /scp-right */}
      </div>{/* /scp-body */}
    </div>
  );
}