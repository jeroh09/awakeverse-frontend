// src/pages/ChatLauncherPage.jsx - Complete implementation with character status handling
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import useInteractedCharacters from '../hooks/useInteractedCharacters';
import CharacterDetailPanel from '../components/CharacterDetailPanel/CharacterDetailPanel';
import TemplateGallery from '../components/TemplateGallery';
import CharacterBuilder from '../components/CharacterBuilder';
import CharacterStatusModal from '../components/CharacterStatusModal';
import CharacterCreationSuccess from '../components/CharacterCreationSuccess';


// Import helper components
import {
  CategoryCard,
  CharacterCard,
  PersonalizedSection,
  MyCharactersPanel,
  CategoryHeader,
  CategoryListHeader,
  SectionHeader
} from '../components/ChatLauncherHelpers';

import { characterCategories } from '../data/characterCategories';

const ORACLE_PROMPTS = [
  "Who do you want to talk to?",
  "Seek wisdom from…",
  "Which guide calls to you?",
  "Who would you counsel with?",
  "Find your mentor…"
];

// --- injected visual skin (CSS-only) ---
const LAUNCHER_SKIN_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Playfair+Display:wght@600;700&display=swap');
:root {
  --av-bg: #0b1426;
  --av-bg-2: #0f1a2e;
  --av-card: #101a30;
  --av-ink: #e9eefb;
  --av-ink-dim: rgba(233,238,251,.78);
  --av-gold: #ffd700;
  --av-gold-2: #ffb800;
  --av-line: rgba(255,255,255,.12);
  --av-line-strong: rgba(255,215,0,.32);
  --av-glass: rgba(255,255,255,.06);
  --av-radius: 16px;
  --av-shadow: 0 16px 40px rgba(0,0,0,.45);
  --av-focus: 0 0 0 3px rgba(255,215,0,.35);
}
.awv-skin, .awv-skin * { box-sizing: border-box; }
.awv-skin {
  color: var(--av-ink);
  background:
    radial-gradient(1200px 600px at 80% -10%, rgba(255,215,0,.06), transparent 60%),
    radial-gradient(800px 400px at -10% 20%, rgba(88,101,242,.09), transparent 60%),
    linear-gradient(180deg, var(--av-bg) 0%, var(--av-bg-2) 100%);
}
.awv-title {
  font-family: "Playfair Display", serif;
  font-weight: 700;
  letter-spacing: .3px;
  background: linear-gradient(135deg,var(--av-gold),var(--av-gold-2),var(--av-gold));
  -webkit-background-clip: text; background-clip: text; color: transparent;
  text-shadow: 0 0 18px rgba(255,215,0,.30);
}
.awv-search-input {
  border-radius: 999px !important;
  border: 2px solid rgba(255,215,0,.28) !important;
  background: rgba(255,255,255,.08) !important;
  color: var(--av-gold) !important;
  outline: none !important;
  padding-right: 40px !important;
}
.awv-card {
  background: linear-gradient(180deg, color-mix(in hsl, var(--av-card) 94%, transparent), transparent 140%);
  border: 1px solid var(--av-line);
  border-radius: var(--av-radius);
  transition: transform .18s ease, border-color .18s ease, background .18s ease;
}
.awv-card:hover {
  transform: translateY(-4px);
  border-color: var(--av-line-strong);
  box-shadow: 0 18px 36px rgba(255,215,0,.18);
}
.awv-chip {
  appearance: none;
  border: 1px solid var(--av-line);
  background: #0f1a2e;
  color: var(--av-ink);
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}
.awv-chip.is-active {
  border-color: var(--av-line-strong);
  background: linear-gradient(180deg, #1f2c4a, transparent 120%);
  color: var(--av-gold);
  box-shadow: 0 6px 18px rgba(255,215,0,.08) inset;
}
.awv-btn {
  appearance: none;
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  font-weight: 800;
  letter-spacing: .2px;
  cursor: pointer;
}
.awv-btn.primary {
  background: linear-gradient(180deg, var(--av-gold), var(--av-gold-2));
  color: #000;
  box-shadow: 0 6px 24px rgba(255,215,0,.25);
}
`;

const FALLBACK_TEMPLATES = {
  core: [
    { id: 1, name: 'Ancient Philosopher', description: 'Wise thinker seeking truth through dialogue.', personality_archetype: 'Scholar', historical_period: 'Ancient', usage_count: 128 },
    { id: 2, name: 'Renaissance Artist', description: 'Creative mind fascinated by beauty and science.', personality_archetype: 'Artist', historical_period: 'Renaissance', usage_count: 76 },
  ],
  custom: [
    { id: 100, name: 'Your Detective', description: 'A private eye based on your preferences.', personality_archetype: 'Leader', historical_period: 'Modern', usage_count: 3 },
  ]
};

const ChatLauncherPage = ({ onStartChat }) => {
  const { token } = useAuth();
  const { user } = useUser();
  const { interactedCharacters } = useInteractedCharacters();

  // Core local state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusInfo, setStatusInfo] = useState({ status: 'pending', message: '' });

  // Premium character flow
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Templates state
  const [templates, setTemplates] = useState([]);
  const [templateGroups, setTemplateGroups] = useState({});
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search & layout
  const [inputValue, setInputValue] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Rotate placeholder text
  useEffect(() => {
    const interval = setInterval(
      () => setPlaceholderIndex(prev => (prev + 1) % ORACLE_PROMPTS.length),
      4000
    );
    return () => clearInterval(interval);
  }, []);

  // NEW: Load user's custom characters
  const loadUserCharacters = useCallback(async () => {
    if (!token) return;

    try {
      setCharactersLoading(true);
      setCharactersError(null);

      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/premium/characters`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User characters loaded:', data);
        setUserCharacters(data.characters || []);
      } else {
        const errText = await response.text();
        throw new Error(errText || 'Failed to load user characters');
      }
    } catch (err) {
      console.error(err);
      setCharactersError('Could not load your custom characters.');
    } finally {
      setCharactersLoading(false);
    }
  }, [token]);

  const [userCharacters, setUserCharacters] = useState([]);
  const [charactersLoading, setCharactersLoading] = useState(false);
  const [charactersError, setCharactersError] = useState(null);

  useEffect(() => {
    loadUserCharacters();
  }, [loadUserCharacters]);

  const enhancedCategories = useMemo(() => {
    // Map base categories and enrich with user-specific counts
    const baseCategories = characterCategories.map(cat => {
      if (cat.key === 'my_characters') {
        const pendingCount = userCharacters.filter(c => c.status === 'pending').length;
        const rejectedCount = userCharacters.filter(c => c.status === 'rejected').length;
        const approvedCount = userCharacters.filter(c => c.status === 'approved').length;
        return {
          ...cat,
          characterCount: userCharacters.length,
          pendingCount,
          rejectedCount,
          approvedCount
        };
      }
      return cat;
    });

    // Example of additional derived counts (if needed)
    if (userCharacters && userCharacters.length > 0) {
      baseCategories.find(c => c.key === 'my_characters').characterCount = userCharacters.length;
      baseCategories.find(c => c.key === 'my_characters').pendingCount = userCharacters.filter(c => c.status === 'pending').length;
      baseCategories.find(c => c.key === 'my_characters').rejectedCount = userCharacters.filter(c => c.status === 'rejected').length;
      baseCategories.find(c => c.key === 'my_characters').approvedCount = userCharacters.filter(c => c.status === 'approved').length;
    }
    
    return baseCategories;
  }, [userCharacters]);

  // Search functionality
  const performSemanticSearch = useMemo(() => {
    return (query) => {
      if (!query.trim()) return [];
      const searchTerm = query.toLowerCase().trim();
      const results = [];

      enhancedCategories.forEach(category => {
        category.characters.forEach(character => {
          const nameMatch = character.name.toLowerCase().includes(searchTerm);
          const descMatch = character.description.toLowerCase().includes(searchTerm);
          const nameParts = character.name.toLowerCase().split(' ');
          const partialNameMatch = nameParts.some(part =>
            part.includes(searchTerm) || searchTerm.includes(part)
          );

          if (nameMatch || descMatch || partialNameMatch) {
            results.push({
              ...character,
              category: category.title,
              categoryKey: category.key,
              relevance: nameMatch ? 100 : (partialNameMatch ? 90 : 80)
            });
          }
        });
      });

      return results.sort((a, b) => b.relevance - a.relevance).slice(0, 8);
    };
  }, [enhancedCategories]);

  useEffect(() => {
    if (inputValue.trim().length >= 2) {
      setSearchResults(performSemanticSearch(inputValue));
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [inputValue, performSemanticSearch]);

  // Templates loading
  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_BASE}/api/templates`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch templates');
        const data = await res.json();
        setTemplates(data.templates || []);
        setTemplateGroups(data.groups || {});
        setAvailableCategories(Object.keys(data.groups || {}));
      } catch (error) {
        console.error('All template loading methods failed:', error);
        setError('Unable to load templates. Using basic templates.');
        setTemplates(Object.values(FALLBACK_TEMPLATES).flat());
        setTemplateGroups(FALLBACK_TEMPLATES);
        setAvailableCategories(Object.keys(FALLBACK_TEMPLATES));
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [token]);

  // FIXED: Build archetypes list from availableCa
  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    setShowResults(false);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSearchResults([]);
    setShowResults(false);
  };

  const onCharacterSelect = (character) => {
    if (String(character.key).startsWith('user_')) {
      if (!character.status || character.status === 'approved') {
        setSelectedCharacter(character);
        setShowDetail(true);
      } else {
        setStatusInfo({
          status: character.status,
          message: character.status === 'pending'
            ? 'Your custom character is awaiting approval.'
            : 'This character was rejected. Please edit and resubmit.'
        });
        setShowStatusModal(true);
      }
    } else {
      setSelectedCharacter(character);
      setShowDetail(true);
    }
  };

  const onCloseDetail = () => {
    setShowDetail(false);
    setSelectedCharacter(null);
  };

  const onStart = () => {
    if (selectedCharacter) {
      onStartChat?.(selectedCharacter.key || selectedCharacter.name);
      setShowDetail(false);
    }
  };

  const startCreateCharacter = () => setShowTemplates(true);
  const handleTemplateSelect = (tpl) => { setSelectedTemplate(tpl); setShowTemplates(false); setShowBuilder(true); };
  const handleCharacterCreationComplete = () => { setShowBuilder(false); setShowSuccess(true); };
  const handleCloseCreationFlow = () => {
    setShowTemplates(false);
    setShowBuilder(false);
    setShowSuccess(false);
    setSelectedTemplate(null);
  };

  const currentPlaceholder = ORACLE_PROMPTS[placeholderIndex];

  // Character Creation Flow Modals
  if (showSuccess) {
    return (
      <div className="awv-skin" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 4000,
        background: 'rgba(0, 0, 0, 0.95)'
      }}>
        <style>{LAUNCHER_SKIN_CSS}</style>
        <CharacterCreationSuccess onClose={handleCloseCreationFlow} />
      </div>
    );
  }

  if (showTemplates) {
    return (
      <div className="awv-skin" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 3000,
        background: 'rgba(0, 0, 0, 0.95)',
        overflowY: 'auto'
      }}>
        <style>{LAUNCHER_SKIN_CSS}</style>
        <TemplateGallery 
          onSelectTemplate={handleTemplateSelect}
          onClose={handleCloseCreationFlow}
        />
      </div>
    );
  }

  if (showBuilder && selectedTemplate) {
    return (
      <div className="awv-skin" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 3000,
        background: 'rgba(0, 0, 0, 0.95)'
      }}>
        <style>{LAUNCHER_SKIN_CSS}</style>
        <CharacterBuilder 
          template={selectedTemplate}
          onClose={handleCloseCreationFlow}
          onSuccess={handleCharacterCreationComplete}
        />
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="awv-skin" style={{
        width: '100%',
        minHeight: '100vh',
        padding: '1rem',
        fontFamily: "'Georgia', serif",
        background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <style>{LAUNCHER_SKIN_CSS}</style>
        {/* Header */}
        <div style={{ width: '100%', maxWidth: 520, borderBottom: '1px solid rgba(255, 215, 0, 0.3)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <h1 className="awv-title" style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.8rem',
            background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            margin: '0 0 1rem 0',
            textShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
            letterSpacing: '1px',
            fontWeight: 700
          }}>
            Welcome, {user?.displayName || 'Seeker'}
          </h1>
          
          <p style={{
            margin: 0,
            color: 'rgba(233, 238, 251, 0.85)',
            fontSize: '.9rem'
          }}>
            {ORACLE_PROMPTS[placeholderIndex]}
          </p>
        </div>

        {/* Search */}
        <div style={{ width: '100%', maxWidth: 520, position: 'relative', marginBottom: '1rem' }}>
          <input
            className="awv-search-input"
            type="text"
            placeholder="Search characters..."
            value={inputValue}
            onChange={(e) =>
              setInputValue(e.target.value)
            }
            style={{
              width: '100%',
              padding: '0.8rem 1rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 215, 0, 0.35)',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#FFD700',
              outline: 'none'
            }}
          />
          {showResults && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 'calc(100% + 6px)',
              maxHeight: 320,
              overflow: 'auto',
              borderRadius: 12,
              border: '1px solid rgba(255, 215, 0, 0.28)',
              background: 'rgba(11,20,38,0.94)',
              backdropFilter: 'blur(16px)',
              padding: '.7rem',
              zIndex: 10
            }}>
              {searchResults.map((item, idx) => (
                <div key={idx} onClick={() => onCharacterSelect(item)} style={{
                  display: 'flex',
                  gap: '.8rem',
                  padding: '.6rem .7rem',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,215,0,.18)',
                  cursor: 'pointer',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    border: '2px solid rgba(255,215,0,.35)',
                    display: 'grid', placeItems: 'center',
                    fontWeight: 900, backgroundImage: 'linear-gradient(145deg,#1f2a4a,#0e1832)',
                    color: '#fff'
                  }}>
                    {item.name.split(' ').slice(0,2).map(s=>s[0]).join('')}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: '#FFD700' }}>{item.name}</div>
                    <div style={{
                      fontSize: 11, letterSpacing: '.3px', color: 'rgba(255,215,0,.8)', textTransform: 'uppercase'
                    }}>{item.category}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personalized / Recents */}
        <PersonalizedSection
          interactedCharacters={interactedCharacters}
          startCreateCharacter={startCreateCharacter}
          onStartChat={onStartChat}
        />

        {/* Categories */}
        <SectionHeader title="Categories" />
        <div style={{
          width: '100%', maxWidth: 520,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.8rem'
        }}>
          {enhancedCategories.map((cat, idx) => (
            <CategoryCard
              key={cat.key}
              category={cat}
              index={idx}
              isMobile
              onCreateCharacter={startCreateCharacter}
              onClick={() => handleCategoryClick(cat)}
            />
          ))}
        </div>

        {/* Characters for selected category (mobile) */}
        {selectedCategory && (
          <div style={{ width: '100%', maxWidth: 520, marginTop: '1rem' }}>
            <CategoryHeader
              category={selectedCategory}
              onBack={handleBackToCategories}
            />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.8rem'
            }}>
              {selectedCategory.characters.map((ch, i) => (
                <CharacterCard
                  key={ch.key || ch.name}
                  character={ch}
                  onClick={onCharacterSelect}
                />
              ))}
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {showDetail && selectedCharacter && (
          <CharacterDetailPanel
            character={selectedCharacter}
            onClose={onCloseDetail}
            onStart={onStart}
          />
        )}

        {/* Status Modal */}
        {showStatusModal && (
          <CharacterStatusModal
            status={statusInfo.status}
            message={statusInfo.message}
            onClose={() => setShowStatusModal(false)}
          />
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="awv-skin" style={{ width:'100%', height:'100vh', display:'flex' }}>
      <style>{LAUNCHER_SKIN_CSS}</style>
      {/* Left Pane */}
      <div style={{
        width: '45%',
        minWidth: 420,
        maxWidth: 700,
        borderRight: '1px solid rgba(255, 215, 0, 0.25)',
        padding: '2rem 1.4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'center'
      }}>
        {/* Brand / Oracle */}
        <div style={{ width: '100%', maxWidth: 560 }}>
          <h1 className="awv-title" style={{
            margin: 0, fontSize: '2.2rem', letterSpacing: '1px', fontWeight: 700
          }}>
            AwakeVerse Launcher
          </h1>
          <p style={{ margin: 0, color: 'rgba(233,238,251,.78)' }}>
            {ORACLE_PROMPTS[placeholderIndex]}
          </p>
        </div>

        {/* Search */}
        <div style={{ width: '100%', maxWidth: 560, position: 'relative' }}>
          <input
            className="awv-search-input"
            type="text"
            placeholder="Search characters..."
            value={inputValue}
            onChange={(e) =>
              setInputValue(e.target.value)
            }
            style={{
              width: '100%',
              padding: '0.9rem 1.2rem',
              borderRadius: 12,
              border: '1px solid rgba(255,215,0,.35)',
              background: 'rgba(255,255,255,.08)',
              color: '#FFD700',
              outline: 'none'
            }}
          />
          {showResults && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 'calc(100% + 10px)',
              maxHeight: 320,
              overflow: 'auto',
              borderRadius: 16,
              border: '1px solid rgba(255, 215, 0, 0.28)',
              background: 'rgba(11,20,38,0.94)',
              backdropFilter: 'blur(16px)',
              padding: '.7rem',
              zIndex: 10
            }}>
              {searchResults.map((item, idx) => (
                <div key={idx} onClick={() => onCharacterSelect(item)} style={{
                  display: 'flex',
                  gap: '.8rem',
                  padding: '.6rem .7rem',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,215,0,.18)',
                  cursor: 'pointer',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    border: '2px solid rgba(255,215,0,.35)',
                    display: 'grid', placeItems: 'center',
                    fontWeight: 900, backgroundImage: 'linear-gradient(145deg,#1f2a4a,#0e1832)',
                    color: '#fff'
                  }}>
                    {item.name.split(' ').slice(0,2).map(s=>s[0]).join('')}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: '#FFD700' }}>{item.name}</div>
                    <div style={{
                      fontSize: 11, letterSpacing: '.3px', color: 'rgba(255,215,0,.8)', textTransform: 'uppercase'
                    }}>{item.category}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personalized */}
        <PersonalizedSection
          interactedCharacters={interactedCharacters}
          startCreateCharacter={startCreateCharacter}
          onStartChat={onStartChat}
        />
      </div>

      {/* Right Pane */}
      <div style={{ flex: 1, position: 'relative', padding: '1.4rem' }}>
        {!selectedCategory ? (
          <>
            <CategoryListHeader />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridAutoRows: 'minmax(140px,1fr)',
              gap: '1rem'
            }}>
              {enhancedCategories.map((cat, idx) => (
                <CategoryCard
                  key={cat.key}
                  category={cat}
                  index={idx}
                  onCreateCharacter={startCreateCharacter}
                  onClick={() => handleCategoryClick(cat)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <CategoryHeader category={selectedCategory} onBack={handleBackToCategories} />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
              gap: '1rem'
            }}>
              {selectedCategory.characters.map((ch) => (
                <CharacterCard
                  key={ch.key || ch.name}
                  character={ch}
                  onClick={onCharacterSelect}
                />
              ))}
            </div>
          </>
        )}

        {/* Detail Panel */}
        {showDetail && selectedCharacter && (
          <CharacterDetailPanel
            character={selectedCharacter}
            onClose={onCloseDetail}
            onStart={onStart}
          />
        )}

        {/* Status Modal */}
        {showStatusModal && (
          <CharacterStatusModal
            status={statusInfo.status}
            message={statusInfo.message}
            onClose={() => setShowStatusModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ChatLauncherPage;
