// src/pages/WorldCupPage.jsx
/**
 * World Cup 2026 — Legends Carousel Generator
 * Social media carousel tool: fixtures → AI legends → fal.ai image comparison
 *
 * Pattern: mirrors QuizPage.jsx structure
 * - Fixed header + footer, scrollable content
 * - Awakeverse tokens bound as CSS vars
 * - Defensive async with try/catch everywhere
 * - Calls /api/worldcup/* on the Awakeverse backend
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import theme from '../design-system/tokens';
import styles from './WorldCupPage.module.css';

// ── Constants ──────────────────────────────────────────────────────────────

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

const OUR_TEAMS = [
  'England', 'Brazil', 'France', 'Argentina', 'Portugal',
  'Ghana', 'Senegal', 'Germany', 'United States', 'Mexico', 'Japan', 'South Korea',
];

const TEAM_META = {
  'England':       { tag: 'Three Lions',       color: '#C8102E', symbol: '🦁', era: 'Medieval England' },
  'Brazil':        { tag: 'Samba Warriors',     color: '#009C3B', symbol: '🐆', era: 'Ancient Amazon' },
  'France':        { tag: 'The Gallic Rooster', color: '#002395', symbol: '🐓', era: 'Gaulish France' },
  'Argentina':     { tag: 'La Albiceleste',     color: '#74ACDF', symbol: '☀️', era: 'Colonial Argentina' },
  'Portugal':      { tag: 'The Navigators',     color: '#006600', symbol: '⚓', era: 'Age of Discovery' },
  'Ghana':         { tag: 'The Black Stars',    color: '#006B3F', symbol: '⭐', era: 'Ancient Ghana Empire' },
  'Senegal':       { tag: 'Lions of Teranga',   color: '#00853F', symbol: '🦁', era: 'Mali Empire' },
  'Germany':       { tag: 'Die Mannschaft',     color: '#333333', symbol: '🦅', era: 'Holy Roman Empire' },
  'United States': { tag: 'Stars & Stripes',    color: '#002868', symbol: '🦅', era: 'Revolutionary America' },
  'Mexico':        { tag: 'Aztec Eagles',       color: '#006847', symbol: '🦅', era: 'Aztec Empire' },
  'Japan':         { tag: 'Samurai Blue',       color: '#BC002D', symbol: '⚔️', era: 'Feudal Japan' },
  'South Korea':   { tag: 'Tigers of Asia',     color: '#003478', symbol: '🐯', era: 'Joseon Dynasty' },
};

const FAL_MODELS = [
  { id: 'fal-ai/flux/dev',     label: 'FLUX Dev',      note: 'Best quality' },
  { id: 'fal-ai/flux/schnell', label: 'FLUX Schnell',  note: 'Fastest' },
  { id: 'fal-ai/flux-realism', label: 'FLUX Realism',  note: 'Photorealistic' },
];

const TABS = ['fixtures', 'legends', 'carousel', 'fixture-card', 'pathway'];

// ── Helpers ────────────────────────────────────────────────────────────────

function normalizeTeam(name = '') {
  if (name.includes('United States') || name === 'USA') return 'United States';
  if (name.includes('Korea')) return 'South Korea';
  return name;
}

function getTeamMeta(name) {
  return TEAM_META[normalizeTeam(name)] || {
    tag: name, color: '#6366F1', symbol: '⚽', era: 'Ancient Times',
  };
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getFallbackFixtures() {
  const today = getTodayStr();
  const next  = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  return [
    { team1: 'England',   team2: 'Senegal',       date: today, time: '19:00', round: 'Group E', group: 'Group E' },
    { team1: 'Brazil',    team2: 'Mexico',         date: today, time: '22:00', round: 'Group D', group: 'Group D' },
    { team1: 'France',    team2: 'Japan',          date: next,  time: '16:00', round: 'Group F', group: 'Group F' },
    { team1: 'Argentina', team2: 'Ghana',          date: next,  time: '20:00', round: 'Group C', group: 'Group C' },
    { team1: 'Portugal',  team2: 'South Korea',    date: next,  time: '18:00', round: 'Group H', group: 'Group H' },
    { team1: 'Germany',   team2: 'United States',  date: next,  time: '21:00', round: 'Group E', group: 'Group E' },
  ];
}

function getFallbackLegends(team) {
  const defaults = {
    England: [
      { name: 'King Arthur',  era: '5th century myth',  role: 'Once and Future King',  oneliner: 'The sleeping king who rises in England\'s darkest hour.',   visual: 'armored medieval king, Excalibur sword, golden crown, misty Camelot' },
      { name: 'Boudicca',     era: '1st century AD',    role: 'Celtic Warrior Queen',  oneliner: 'She burned Roman Londinium and made an empire tremble.',     visual: 'fierce red-haired queen, red war paint, iron spear, burning city' },
      { name: 'Robin Hood',   era: '12th century myth', role: 'Outlaw Hero',           oneliner: 'The arrow of justice never misses its mark.',                visual: 'hooded archer, forest green, longbow drawn, dark Sherwood Forest' },
    ],
    Brazil: [
      { name: 'Iara',           era: 'Tupi mythology', role: 'River Goddess',        oneliner: 'Mother of waters who guards the Amazon\'s eternal secrets.',  visual: 'indigenous goddess, green hair, Amazon river, bioluminescent fish' },
      { name: 'Zumbi',          era: '1655–1695',      role: 'Warrior King',         oneliner: 'He built a free nation and died before surrendering it.',     visual: 'powerful African warrior king, ceremonial armor, jungle fortress' },
      { name: 'Saci-Pererê',    era: 'Brazilian folk', role: 'Trickster Spirit',     oneliner: 'One-legged boy who rides whirlwinds and cannot be caught.',   visual: 'one-legged boy, red cap, whirlwind of leaves, jungle backdrop' },
    ],
  };
  return defaults[team] || [
    { name: 'The Ancient Warrior', era: 'Ancient times',    role: 'Champion', oneliner: 'A legend whose deeds echo through eternity.', visual: 'ancient warrior in battle armor, dramatic lighting' },
    { name: 'The Mystic Sage',     era: 'Classical period', role: 'Sage',     oneliner: 'Wisdom older than the mountains themselves.',  visual: 'wise elder, flowing robes, mystical aura' },
    { name: 'The Sacred Guardian', era: 'Ancient myth',     role: 'Guardian', oneliner: 'Guardian spirit of the nation\'s eternal soul.', visual: 'mythological creature, glowing eyes, sacred aura' },
  ];
}

// ── Main Component ─────────────────────────────────────────────────────────

const WorldCupPage = () => {
  const [tab, setTab]                     = useState('fixtures');
  const [fixtures, setFixtures]           = useState([]);
  const [fixtureError, setFixtureError]   = useState(null);
  const [loadingFixtures, setLoadingFixtures] = useState(true);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [legends, setLegends]               = useState({});
  const [loadingLegends, setLoadingLegends] = useState(false);
  const [legendError, setLegendError]       = useState(null);
  const [images, setImages]                 = useState({});
  const [loadingImages, setLoadingImages]   = useState(false);
  const [imageError, setImageError]         = useState(null);
  const [carousel, setCarousel]             = useState(null);   // { card: base64, team1_scene_url, team2_scene_url }
  const [loadingCarousel, setLoadingCarousel] = useState(false);
  const [carouselError, setCarouselError]   = useState(null);
  const [fixtureCard, setFixtureCard]       = useState(null);   // base64 PNG
  const [loadingFixtureCard, setLoadingFixtureCard] = useState(false);
  const [fixtureCardError, setFixtureCardError]     = useState(null);
  const [pathwayCard, setPathwayCard]       = useState(null);
  const [loadingPathway, setLoadingPathway] = useState(false);
  const [pathwayError, setPathwayError]     = useState(null);

  const todayStr = getTodayStr();

  // ── Fetch fixtures ──────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setLoadingFixtures(true);
      setFixtureError(null);
      try {
        const res = await fetch(`${API_BASE}/api/worldcup/fixtures`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const all = data.matches || [];
        const filtered = all.filter(m => {
          const t1 = normalizeTeam(m.team1 || '');
          const t2 = normalizeTeam(m.team2 || '');
          return OUR_TEAMS.includes(t1) || OUR_TEAMS.includes(t2);
        });
        setFixtures(filtered.slice(0, 40));
      } catch (e) {
        console.warn('Fixture API failed, using fallback:', e.message);
        setFixtureError(e.message);
        setFixtures(getFallbackFixtures());
      } finally {
        setLoadingFixtures(false);
      }
    };
    load();
  }, []);

  // ── Generate legends via Claude (server-side Anthropic call) ───────────

  const generateLegends = useCallback(async (fixture) => {
    if (!fixture) return;
    setLoadingLegends(true);
    setLegendError(null);
    setLegends({});
    setImages({});

    const t1 = normalizeTeam(fixture.team1 || '');
    const t2 = normalizeTeam(fixture.team2 || '');

    const fetchLegends = async (team) => {
      const meta = getTeamMeta(team);
      const res  = await fetch(`${API_BASE}/api/worldcup/generate-legends`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team, tag: meta.tag, era: meta.era, opponent: t1 === team ? t2 : t1, round: selectedFixture.round || selectedFixture.group || 'Group Stage' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data.legends?.length) throw new Error('No legends returned');
      return data.legends;
    };

    try {
      const [l1, l2] = await Promise.all([
        fetchLegends(t1),
        fetchLegends(t2),
      ]);
      setLegends({ [t1]: l1, [t2]: l2 });
      setTab('legends');
    } catch (e) {
      console.warn('Legend generation failed:', e.message);
      setLegendError(e.message);
      // Do NOT fall back to generic legends — show error and let user retry
    } finally {
      setLoadingLegends(false);
    }
  }, []);

  // ── Generate images via Awakeverse proxy ───────────────────────────────

  const generateImages = useCallback(async () => {
    if (!selectedFixture || !Object.keys(legends).length) return;
    setLoadingImages(true);
    setImageError(null);
    setImages({});

    const t1 = normalizeTeam(selectedFixture.team1 || '');
    const t2 = normalizeTeam(selectedFixture.team2 || '');

    // Test: 1st legend per team only = 2 characters × 3 models = 6 images
    const testPairs = [
      { legend: (legends[t1] || [])[0], team: t1 },
      { legend: (legends[t2] || [])[0], team: t2 },
    ].filter(p => p.legend);

    for (const { legend, team } of testPairs) {
      try {
        const res = await fetch(`${API_BASE}/api/worldcup/generate-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            legend,
            team,
            team_color: getTeamMeta(team).color,
            models: FAL_MODELS.map(m => m.id),
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
          throw new Error(err.message || `HTTP ${res.status}`);
        }

        const data = await res.json();

        const newImgs = {};
        for (const r of (data.results || [])) {
          newImgs[`${legend.name}__${r.model}`] = {
            url:         r.url || null,
            model_label: r.model_label,
            error:       r.error || null,
          };
        }
        setImages(prev => ({ ...prev, ...newImgs }));

      } catch (e) {
        console.warn(`Image generation failed for ${legend.name}:`, e.message);
        setImageError(`Failed for ${legend.name}: ${e.message}`);
        const failImgs = {};
        for (const m of FAL_MODELS) {
          failImgs[`${legend.name}__${m.id}`] = { url: null, model_label: m.label, error: e.message };
        }
        setImages(prev => ({ ...prev, ...failImgs }));
      }
    }

    setLoadingImages(false);
    setTab('images');
  }, [selectedFixture, legends]);

  // ── Generate carousel card (legends battle) ─────────────────────────────

  const generateCarousel = useCallback(async () => {
    if (!selectedFixture || !Object.keys(legends).length) return;
    setLoadingCarousel(true);
    setCarouselError(null);
    setCarousel(null);

    const t1  = normalizeTeam(selectedFixture.team1 || '');
    const t2  = normalizeTeam(selectedFixture.team2 || '');
    const mt1 = getTeamMeta(t1);
    const mt2 = getTeamMeta(t2);

    try {
      const res = await fetch(`${API_BASE}/api/worldcup/generate-carousel`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team1: t1, team2: t2,
          team1_color: mt1.color, team2_color: mt2.color,
          team1_tag: mt1.tag,    team2_tag: mt2.tag,
          team1_legends: legends[t1] || [],
          team2_legends: legends[t2] || [],
          model: 'fal-ai/flux/dev',
          fixture: {
            round: selectedFixture.round || selectedFixture.group || 'Group Stage',
            date:  selectedFixture.date  || '',
            time:  selectedFixture.time  || '',
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data.card) throw new Error('No card returned');
      setCarousel(data);
      setTab('carousel');
    } catch (e) {
      console.warn('Carousel generation failed:', e.message);
      setCarouselError(e.message);
    } finally {
      setLoadingCarousel(false);
    }
  }, [selectedFixture, legends]);

  // ── Generate fixture card (Card 1) ──────────────────────────────────────

  const generateFixtureCard = useCallback(async () => {
    if (!selectedFixture) return;
    setLoadingFixtureCard(true);
    setFixtureCardError(null);
    setFixtureCard(null);

    const t1  = normalizeTeam(selectedFixture.team1 || '');
    const t2  = normalizeTeam(selectedFixture.team2 || '');
    const mt1 = getTeamMeta(t1);
    const mt2 = getTeamMeta(t2);

    try {
      const res = await fetch(`${API_BASE}/api/worldcup/generate-fixture-card`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team1: t1, team2: t2,
          team1_color: mt1.color, team2_color: mt2.color,
          team1_tag: mt1.tag,    team2_tag: mt2.tag,
          team1_symbol: mt1.symbol, team2_symbol: mt2.symbol,
          round:  selectedFixture.round || selectedFixture.group || 'Group Stage',
          date:   selectedFixture.date  || '',
          time:   selectedFixture.time  || '',
          score:  selectedFixture.score || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data.card) throw new Error('No card returned');
      setFixtureCard(data.card);
      setTab('fixture-card');
    } catch (e) {
      console.warn('Fixture card failed:', e.message);
      setFixtureCardError(e.message);
    } finally {
      setLoadingFixtureCard(false);
    }
  }, [selectedFixture]);

  // ── Download helper ──────────────────────────────────────────────────────

  function downloadCard(base64, filename) {
    const link = document.createElement('a');
    link.href = base64;
    link.download = filename;
    link.click();
  }

  // ── Build team fixture nodes from full fixture list ──────────────────────

  function buildTeamFixtures(team, allFixtures, currentMatchup) {
    const teamMatches = allFixtures
      .filter(m => {
        const t1 = normalizeTeam(m.team1 || '');
        const t2 = normalizeTeam(m.team2 || '');
        return t1 === team || t2 === team;
      })
      .slice(0, 3);

    return teamMatches.map(m => {
      const t1      = normalizeTeam(m.team1 || '');
      const t2      = normalizeTeam(m.team2 || '');
      const isHome  = t1 === team;
      const opponent = isHome ? t2 : t1;

      // openfootball format: score.ft = [2, 0] or absent
      const ft      = m.score?.ft || null;
      let scoreStr  = null;
      let result    = null;

      if (ft && Array.isArray(ft) && ft.length === 2) {
        const myGoals  = isHome ? ft[0] : ft[1];
        const oppGoals = isHome ? ft[1] : ft[0];
        scoreStr = `${myGoals}-${oppGoals}`;
        result   = myGoals > oppGoals ? 'W' : myGoals < oppGoals ? 'L' : 'D';
      }

      // Format date short e.g. "Jun 22"
      let dateShort = m.date || '';
      try {
        const d = new Date(m.date);
        dateShort = d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      } catch {}

      return { opponent, date: dateShort, score: scoreStr, result };
    });
  }

  // ── Generate pathway card ────────────────────────────────────────────────

  const generatePathwayCard = useCallback(async () => {
    if (!selectedFixture) return;
    setLoadingPathway(true);
    setPathwayError(null);
    setPathwayCard(null);

    const t1  = normalizeTeam(selectedFixture.team1 || '');
    const t2  = normalizeTeam(selectedFixture.team2 || '');
    const mt1 = getTeamMeta(t1);
    const mt2 = getTeamMeta(t2);

    const team1Fixtures = buildTeamFixtures(t1, fixtures, selectedFixture);
    const team2Fixtures = buildTeamFixtures(t2, fixtures, selectedFixture);

    const matchDate = selectedFixture.date || '';
    const isToday   = matchDate === getTodayStr();

    try {
      const res = await fetch(`${API_BASE}/api/worldcup/generate-pathway-card`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team1: t1, team2: t2,
          team1_color: mt1.color, team2_color: mt2.color,
          team1_tag: mt1.tag,    team2_tag: mt2.tag,
          team1_symbol: mt1.symbol, team2_symbol: mt2.symbol,
          round:    selectedFixture.round || selectedFixture.group || 'Group Stage',
          date:     matchDate,
          time:     selectedFixture.time || '',
          is_today: isToday,
          team1_fixtures: team1Fixtures,
          team2_fixtures: team2Fixtures,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.card) throw new Error('No card returned');
      setPathwayCard(data.card);
      setTab('pathway');
    } catch (e) {
      console.warn('Pathway card failed:', e.message);
      setPathwayError(e.message);
    } finally {
      setLoadingPathway(false);
    }
  }, [selectedFixture, fixtures]);

  // ── Derived data ────────────────────────────────────────────────────────

  const grouped = useMemo(() => {
    const today = [], upcoming = [], past = [];
    fixtures.forEach(m => {
      const d = m.date || '';
      if (d === todayStr)    today.push(m);
      else if (d > todayStr) upcoming.push(m);
      else                   past.push(m);
    });
    return { today, upcoming, past };
  }, [fixtures, todayStr]);

  const selectedTeams = useMemo(() => {
    if (!selectedFixture) return [];
    return [
      normalizeTeam(selectedFixture.team1 || ''),
      normalizeTeam(selectedFixture.team2 || ''),
    ];
  }, [selectedFixture]);

  // Group images by legend name for display
  const imagesByLegend = useMemo(() => {
    const grouped = {};
    for (const [key, data] of Object.entries(images)) {
      const [legendName] = key.split('__');
      if (!grouped[legendName]) grouped[legendName] = [];
      grouped[legendName].push(data);
    }
    return grouped;
  }, [images]);

  // ── CSS vars (mirrors QuizPage pattern) ────────────────────────────────

  const cssVars = {
    '--wc-bg0':     theme.colors.background.canvas,
    '--wc-surface': theme.colors.background.surface,
    '--wc-inter':   theme.colors.background.interactive,
    '--wc-line':    theme.colors.border?.subtle || 'rgba(148,163,184,0.1)',
    '--wc-ivory':   theme.colors.brand?.ivory   || theme.colors.text.primary,
    '--wc-muted':   theme.colors.text.secondary,
    '--wc-accent':  theme.colors.accent.primary,
    '--wc-hover':   theme.colors.accent.hover,
    '--wc-ok':      theme.colors.semantic.success,
    '--wc-warn':    theme.colors.semantic.warning,
    '--wc-err':     theme.colors.semantic.error,
    '--wc-font':    theme.typography.fonts.body,
    '--wc-display': theme.typography.fonts.display,
  };

  // ── Sub-components ─────────────────────────────────────────────────────

  const FixtureCard = ({ m }) => {
    const t1   = normalizeTeam(m.team1 || '');
    const t2   = normalizeTeam(m.team2 || '');
    const mt1  = getTeamMeta(t1);
    const mt2  = getTeamMeta(t2);
    const isSelected = selectedFixture === m;
    const isToday    = (m.date || '') === todayStr;
    const score      = m.score?.ft || null;

    return (
      <button
        className={[styles.fixtureCard, isSelected ? styles.fixtureSelected : ''].join(' ')}
        onClick={() => { setSelectedFixture(m); setLegends({}); setImages({}); }}
        type="button"
      >
        <div className={styles.fixtureMeta}>
          <span className={styles.fixtureRound}>{m.round || m.group || 'Group Stage'} · {m.time || ''}</span>
          <div className={styles.fixtureBadges}>
            {isToday && <span className={styles.badgeToday}>TODAY</span>}
            {score   && <span className={styles.badgeScore}>{score[0]}–{score[1]}</span>}
          </div>
        </div>
        <div className={styles.fixtureTeams}>
          <div className={styles.fixtureTeam}>
            <span className={styles.fixtureSymbol}>{mt1.symbol}</span>
            <span className={styles.fixtureName}>{t1}</span>
            <span className={styles.fixtureTag}>{mt1.tag}</span>
          </div>
          <span className={styles.fixtureVs}>VS</span>
          <div className={[styles.fixtureTeam, styles.fixtureTeamRight].join(' ')}>
            <span className={styles.fixtureSymbol}>{mt2.symbol}</span>
            <span className={styles.fixtureName}>{t2}</span>
            <span className={styles.fixtureTag}>{mt2.tag}</span>
          </div>
        </div>
      </button>
    );
  };

  const LegendCard = ({ legend, team }) => {
    const meta        = getTeamMeta(team);
    const legendImgs  = FAL_MODELS.map(m => ({
      model: m,
      data:  images[`${legend.name}__${m.id}`],
    }));
    const hasImages = legendImgs.some(i => i.data?.url);

    return (
      <div className={styles.legendCard}>
        <div className={styles.legendHeader}>
          <div className={styles.legendIcon} style={{ background: meta.color + '33', border: `1px solid ${meta.color}66` }}>
            {meta.symbol}
          </div>
          <div className={styles.legendInfo}>
            <p className={styles.legendName}>{legend.name}</p>
            <p className={styles.legendRole}>{legend.role} · {legend.era}</p>
            <p className={styles.legendOneliner}>"{legend.oneliner}"</p>
          </div>
        </div>

        {hasImages && (
          <div className={styles.imageGrid}>
            {legendImgs.map(({ model, data }) => (
              <div key={model.id} className={styles.imageBox}>
                {data?.url ? (
                  <>
                    <img src={data.url} alt={`${legend.name} — ${model.label}`} className={styles.generatedImage} />
                    <span className={styles.imageLabel}>{model.label}</span>
                  </>
                ) : data?.error ? (
                  <div className={styles.imageError}>
                    <span>⚠</span>
                    <span>{model.label} failed</span>
                  </div>
                ) : (
                  <div className={styles.imageLoading}>
                    <div className={styles.spinner} />
                    <span>{model.label}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <details className={styles.promptDetails}>
          <summary className={styles.promptSummary}>View image prompt</summary>
          <p className={styles.promptText}>{legend.visual}</p>
        </details>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className={styles.page} style={cssVars}>
      <div className={styles.appFrame}>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerRow}>
            <div className={styles.brand}>
              <h1 className={styles.h1}>LEGENDS OF 2026</h1>
              <p className={styles.tag}>Where football meets history — Awakeverse × FIFA World Cup</p>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            {TABS.map(t => (
              <button
                key={t}
                className={[styles.tabBtn, tab === t ? styles.tabActive : ''].join(' ')}
                onClick={() => setTab(t)}
                type="button"
              >
                {t === 'fixtures'     ? '⚽ Fixtures'
             : t === 'legends'      ? '⚔️ Legends'
             : t === 'carousel'     ? '🃏 Carousel'
             : t === 'fixture-card' ? '📋 Match Card'
             : t === 'pathway'      ? '🗺️ Pathway'
             : t}
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <main className={styles.content}>

          {/* ── FIXTURES TAB ─────────────────────────────────────────── */}
          {tab === 'fixtures' && (
            <div className={styles.tabContent}>
              {loadingFixtures && (
                <div className={styles.centered}>
                  <div className={styles.spinner} />
                  <p>Loading fixtures...</p>
                </div>
              )}

              {fixtureError && !loadingFixtures && (
                <div className={styles.notice}>
                  ⚠ Live API unavailable — showing demo fixtures
                </div>
              )}

              {!loadingFixtures && (
                <>
                  {grouped.today.length > 0 && (
                    <section className={styles.fixtureGroup}>
                      <h2 className={styles.groupLabel}>🔥 Today</h2>
                      {grouped.today.map((m, i) => <FixtureCard key={i} m={m} />)}
                    </section>
                  )}
                  {grouped.upcoming.length > 0 && (
                    <section className={styles.fixtureGroup}>
                      <h2 className={styles.groupLabel}>📅 Upcoming</h2>
                      {grouped.upcoming.map((m, i) => <FixtureCard key={i} m={m} />)}
                    </section>
                  )}
                  {grouped.past.length > 0 && (
                    <section className={styles.fixtureGroup}>
                      <h2 className={styles.groupLabel}>📜 Recent</h2>
                      {grouped.past.map((m, i) => <FixtureCard key={i} m={m} />)}
                    </section>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── LEGENDS TAB ──────────────────────────────────────────── */}
          {tab === 'legends' && (
            <div className={styles.tabContent}>
              {!selectedFixture && (
                <div className={styles.emptyState}>
                  <p>Select a fixture first to generate legends.</p>
                  <button className={styles.ghostBtn} onClick={() => setTab('fixtures')} type="button">
                    Go to Fixtures
                  </button>
                </div>
              )}

              {selectedFixture && Object.keys(legends).length === 0 && !loadingLegends && (
                <div className={styles.emptyState}>
                  <p className={styles.matchupLabel}>
                    {selectedTeams[0]} <span>vs</span> {selectedTeams[1]}
                  </p>
                  <button
                    className={styles.primaryBtn}
                    onClick={() => generateLegends(selectedFixture)}
                    type="button"
                  >
                    ⚔️ Summon Historical Legends
                  </button>
                </div>
              )}

              {loadingLegends && (
                <div className={styles.centered}>
                  <div className={styles.spinner} />
                  <p>Summoning legends from history...</p>
                </div>
              )}

              {legendError && (
                <div className={styles.notice}>
                  ⚠ {legendError}
                  <button
                    className={styles.ghostBtn}
                    onClick={() => generateLegends(selectedFixture)}
                    style={{ marginLeft: '12px' }}
                    type="button"
                  >
                    Retry
                  </button>
                </div>
              )}

              {Object.keys(legends).length > 0 && selectedTeams.map(team => (
                legends[team] && (
                  <section key={team} className={styles.teamSection}>
                    <div className={styles.teamHeader}>
                      <span className={styles.teamSymbol}>{getTeamMeta(team).symbol}</span>
                      <div>
                        <p className={styles.teamName}>{team}</p>
                        <p className={styles.teamTag}>{getTeamMeta(team).tag}</p>
                      </div>
                    </div>
                    {legends[team].map((legend, i) => (
                      <LegendCard key={i} legend={legend} team={team} />
                    ))}
                  </section>
                )
              ))}
            </div>
          )}

          {/* ── IMAGES TAB ───────────────────────────────────────────── */}
          {tab === 'images' && (
            <div className={styles.tabContent}>
              {Object.keys(images).length === 0 && !loadingImages && (
                <div className={styles.emptyState}>
                  <p>Generate legends first, then compare model outputs here.</p>
                  <button className={styles.ghostBtn} onClick={() => setTab('legends')} type="button">
                    Go to Legends
                  </button>
                </div>
              )}

              {loadingImages && (
                <div className={styles.centered}>
                  <div className={styles.spinner} />
                  <p>Generating across 3 models...</p>
                  <p className={styles.smallNote}>Each image takes 10–30s</p>
                </div>
              )}

              {imageError && (
                <div className={styles.notice}>⚠ {imageError}</div>
              )}

              {Object.entries(imagesByLegend).map(([legendName, results]) => (
                <section key={legendName} className={styles.imageSection}>
                  <h3 className={styles.imageLegendName}>{legendName}</h3>
                  <div className={styles.imageGrid}>
                    {results.map((r, i) => (
                      <div key={i} className={styles.imageBox}>
                        {r.url ? (
                          <>
                            <img src={r.url} alt={`${legendName} — ${r.model_label}`} className={styles.generatedImage} />
                            <span className={styles.imageLabel}>{r.model_label}</span>
                          </>
                        ) : (
                          <div className={styles.imageError}>
                            <span>⚠</span>
                            <span>{r.model_label} failed</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              {Object.keys(imagesByLegend).length > 0 && (
                <p className={styles.modelNote}>
                  Pick your preferred model above — that becomes the default for the full carousel generator.
                </p>
              )}
            </div>
          )}

          {/* ── CAROUSEL TAB ─────────────────────────────────────────── */}
          {tab === 'carousel' && (
            <div className={styles.tabContent}>
              {!selectedFixture && (
                <div className={styles.emptyState}>
                  <p>Select a fixture and generate legends first.</p>
                  <button className={styles.ghostBtn} onClick={() => setTab('fixtures')} type="button">Go to Fixtures</button>
                </div>
              )}

              {selectedFixture && !Object.keys(legends).length && !loadingCarousel && (
                <div className={styles.emptyState}>
                  <p>Generate legends first to build the carousel card.</p>
                  <button className={styles.ghostBtn} onClick={() => setTab('legends')} type="button">Go to Legends</button>
                </div>
              )}

              {loadingCarousel && (
                <div className={styles.centered}>
                  <div className={styles.spinner} style={{ width: '36px', height: '36px' }} />
                  <p>Generating scenes + compositing card...</p>
                  <p className={styles.smallNote}>Two fal.ai scenes + WeasyPrint render · ~60–90s</p>
                </div>
              )}

              {carouselError && (
                <div className={styles.notice}>⚠ {carouselError}</div>
              )}

              {carousel?.card && !loadingCarousel && (
                <div className={styles.carouselResult}>
                  <img
                    src={carousel.card}
                    alt="Legends Carousel Card"
                    className={styles.carouselImage}
                  />
                  <div className={styles.carouselActions}>
                    <button
                      className={styles.primaryBtn}
                      onClick={() => downloadCard(carousel.card, `${selectedTeams[0]}_vs_${selectedTeams[1]}_legends.png`)}
                      type="button"
                    >
                      ⬇ Download Card
                    </button>
                    <button
                      className={styles.ghostBtn}
                      onClick={() => { setCarousel(null); generateCarousel(); }}
                      disabled={loadingCarousel}
                      type="button"
                    >
                      ↺ Regenerate
                    </button>
                  </div>
                  <div className={styles.sceneLinks}>
                    <a href={carousel.team1_scene_url} target="_blank" rel="noreferrer" className={styles.sceneLink}>
                      {selectedTeams[0]} scene ↗
                    </a>
                    <a href={carousel.team2_scene_url} target="_blank" rel="noreferrer" className={styles.sceneLink}>
                      {selectedTeams[1]} scene ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── FIXTURE CARD TAB ─────────────────────────────────────── */}
          {tab === 'fixture-card' && (
            <div className={styles.tabContent}>
              {!selectedFixture && (
                <div className={styles.emptyState}>
                  <p>Select a fixture first.</p>
                  <button className={styles.ghostBtn} onClick={() => setTab('fixtures')} type="button">Go to Fixtures</button>
                </div>
              )}

              {loadingFixtureCard && (
                <div className={styles.centered}>
                  <div className={styles.spinner} style={{ width: '36px', height: '36px' }} />
                  <p>Generating match card...</p>
                  <p className={styles.smallNote}>WeasyPrint render · ~5s</p>
                </div>
              )}

              {fixtureCardError && (
                <div className={styles.notice}>⚠ {fixtureCardError}</div>
              )}

              {fixtureCard && !loadingFixtureCard && (
                <div className={styles.carouselResult}>
                  <img
                    src={fixtureCard}
                    alt="Fixture Card"
                    className={styles.carouselImage}
                  />
                  <div className={styles.carouselActions}>
                    <button
                      className={styles.primaryBtn}
                      onClick={() => downloadCard(fixtureCard, `${selectedTeams[0]}_vs_${selectedTeams[1]}_matchcard.png`)}
                      type="button"
                    >
                      ⬇ Download Card
                    </button>
                    <button
                      className={styles.ghostBtn}
                      onClick={() => { setFixtureCard(null); generateFixtureCard(); }}
                      disabled={loadingFixtureCard}
                      type="button"
                    >
                      ↺ Regenerate
                    </button>
                  </div>
                </div>
              )}

              {selectedFixture && !fixtureCard && !loadingFixtureCard && (
                <div className={styles.emptyState}>
                  <button className={styles.primaryBtn} onClick={generateFixtureCard} type="button">
                    📋 Generate Match Card
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── PATHWAY TAB ──────────────────────────────────────────── */}
          {tab === 'pathway' && (
            <div className={styles.tabContent}>
              {!selectedFixture && (
                <div className={styles.emptyState}>
                  <p>Select a fixture first.</p>
                  <button className={styles.ghostBtn} onClick={() => setTab('fixtures')} type="button">
                    Go to Fixtures
                  </button>
                </div>
              )}

              {loadingPathway && (
                <div className={styles.centered}>
                  <div className={styles.spinner} style={{ width: '36px', height: '36px' }} />
                  <p>Building pathway card...</p>
                  <p className={styles.smallNote}>WeasyPrint render · ~5s</p>
                </div>
              )}

              {pathwayError && (
                <div className={styles.notice}>⚠ {pathwayError}</div>
              )}

              {pathwayCard && !loadingPathway && (
                <div className={styles.carouselResult}>
                  <img
                    src={pathwayCard}
                    alt="Pathway Card"
                    className={styles.carouselImage}
                  />
                  <div className={styles.carouselActions}>
                    <button
                      className={styles.primaryBtn}
                      onClick={() => downloadCard(pathwayCard, `${selectedTeams[0]}_vs_${selectedTeams[1]}_pathway.png`)}
                      type="button"
                    >
                      ⬇ Download Card
                    </button>
                    <button
                      className={styles.ghostBtn}
                      onClick={() => { setPathwayCard(null); generatePathwayCard(); }}
                      disabled={loadingPathway}
                      type="button"
                    >
                      ↺ Regenerate
                    </button>
                  </div>
                </div>
              )}

              {selectedFixture && !pathwayCard && !loadingPathway && (
                <div className={styles.emptyState}>
                  <button className={styles.primaryBtn} onClick={generatePathwayCard} type="button">
                    🗺️ Generate Pathway Card
                  </button>
                </div>
              )}
            </div>
          )}

        </main>

        {/* Footer */}
        <footer className={styles.footer}>
          {tab === 'fixtures' && selectedFixture && (
            <button className={styles.primaryBtn} onClick={() => generateLegends(selectedFixture)}
              disabled={loadingLegends} type="button">
              {loadingLegends ? 'Summoning...' : '⚔️ Generate Legends'}
            </button>
          )}

          {tab === 'legends' && Object.keys(legends).length > 0 && (
            <button className={styles.primaryBtn} onClick={generateCarousel}
              disabled={loadingCarousel} type="button">
              {loadingCarousel ? 'Building carousel...' : '🃏 Generate Carousel Card'}
            </button>
          )}

          {tab === 'fixtures' && selectedFixture && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className={styles.ghostBtn} onClick={generateFixtureCard}
                disabled={loadingFixtureCard} type="button">
                {loadingFixtureCard ? 'Building...' : '📋 Match Card'}
              </button>
              <button className={styles.ghostBtn} onClick={generatePathwayCard}
                disabled={loadingPathway} type="button">
                {loadingPathway ? 'Building...' : '🗺️ Pathway'}
              </button>
            </div>
          )}

          {tab === 'carousel' && Object.keys(legends).length > 0 && !carousel && !loadingCarousel && (
            <button className={styles.primaryBtn} onClick={generateCarousel} type="button">
              🃏 Generate Carousel Card
            </button>
          )}

          {tab === 'fixture-card' && selectedFixture && !fixtureCard && !loadingFixtureCard && (
            <button className={styles.primaryBtn} onClick={generateFixtureCard} type="button">
              📋 Generate Match Card
            </button>
          )}

          {tab === 'pathway' && selectedFixture && !pathwayCard && !loadingPathway && (
            <button className={styles.primaryBtn} onClick={generatePathwayCard} type="button">
              🗺️ Generate Pathway Card
            </button>
          )}
        </footer>

      </div>
    </div>
  );
};

export default WorldCupPage;