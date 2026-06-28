// src/components/CreatorHub/CreatorDashboard.jsx
// REDESIGN: Fixed viewport · floating panels · double-ring borders
// Canon: subscription gating at £29.99, PaymentRouter, modal creation flow preserved verbatim

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser }    from '../../contexts/UserContext';
import { useAppView } from '../../contexts/AppViewContext';
import BusinessModePanel from './BusinessModePanel';
import api from '../../api';
import {
  Eye, Heart, Bookmark, Share2, MessageCircle,
  TrendingUp, Users, BarChart3,
  Sparkles, BookOpen, Zap, Crown
} from 'lucide-react';

import TemplateGallery           from '../TemplateGallery';
import CharacterBuilder          from '../CharacterBuilder';
import CharacterCreationSuccess  from '../CharacterCreationSuccess';
import PaymentRouter             from '../../services/PaymentRouter';
import './CreatorDashboard.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'all',     label: 'All',       color: '#6366F1' },
  { key: 'live',    label: 'Published', color: '#10B981' },
  { key: 'paused',  label: 'Paused',    color: '#F59E0B' },
  { key: 'draft',   label: 'Draft',     color: '#475569' },
  { key: 'premium', label: 'Premium',   color: '#818CF8' },
];

const FILTERS = ['All', 'Most Viewed', 'Top Revenue', 'Recent', 'Chat Mode', 'Story Mode'];

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const Icon = ({ d, size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const RefreshIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"/><path d="M20.49 15A9 9 0 1 1 5.64 5.64L2 2"/>
  </svg>
);

const StarIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3 6.5 7 1-5 5 1.18 7L12 18l-6.18 3.5L7 14.5 2 9.5l7-1z"/>
  </svg>
);

const BizIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="15" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);

const Wordmark = () => (
  <span className="cd-wordmark">
    <span className="cd-wm-iv">A</span><span className="cd-wm-in">wake</span>
    <span className="cd-wm-iv">V</span><span className="cd-wm-in">erse</span>
  </span>
);

function fmt(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n ?? 0);
}

function statusColor(status) {
  if (status === 'active' || status === 'live') return '#10B981';
  if (status === 'paused')                      return '#F59E0B';
  return '#475569';
}

// ─── StatPill ─────────────────────────────────────────────────────────────────
function StatPill({ icon, label, value, delta, deltaDir }) {
  const cls = deltaDir === 'up' ? 'cd-delta-up'
    : deltaDir === 'down' ? 'cd-delta-down' : 'cd-delta-flat';
  const pre = deltaDir === 'up' ? '↑' : deltaDir === 'down' ? '↓' : '—';
  return (
    <div className="cd-stat-pill">
      <div className="cd-stat-pill-left">
        <div className="cd-stat-pill-icon">{icon}</div>
        <span className="cd-stat-pill-label">{label}</span>
      </div>
      <div className="cd-stat-pill-right">
        <span className="cd-stat-pill-value">{value}</span>
        {delta && <span className={`cd-delta ${cls}`}>{pre} {delta}</span>}
      </div>
    </div>
  );
}

// ─── CharCard ─────────────────────────────────────────────────────────────────
function CharCard({ char, onChat, onStory, onClick }) {
  const name     = char.display_name || 'Character';
  const initial  = name.charAt(0).toUpperCase();
  const status   = char.status        || 'draft';
  const level    = char.creator_level || 'newcomer';
  const eng      = char.engagement    || {};
  const views    = eng.total_views    ?? 0;
  const likes    = eng.total_likes    ?? 0;
  const isPremium = char.is_premium   || false;

  const levelClass = isPremium       ? 'cd-char-level-gold'
    : level === 'pro'                ? 'cd-char-level-indigo'
    : 'cd-char-level-silver';

  const levelLabel = isPremium ? 'Gold' : level === 'pro' ? 'Pro'
    : level === 'newcomer' ? 'New' : level;

  return (
    <div className="cd-char-card" tabIndex={0} role="article"
      aria-label={name} onClick={onClick}>
      {char.avatar_url ? (
        <img src={char.avatar_url} alt={name} className="cd-char-img"
          onError={e => { e.target.style.display = 'none'; }} />
      ) : (
        <div className="cd-char-fallback">
          <span className="cd-char-initial">{initial}</span>
        </div>
      )}
      <span className="cd-char-status" style={{ background: statusColor(status) }} />
      <div className="cd-char-overlay">
        <div className="cd-char-name">{name}</div>
        <div className="cd-char-stat-row">
          <span className={`cd-char-level ${levelClass}`}>{levelLabel}</span>
          {views > 0 && <span className="cd-char-stat">👁 {fmt(views)}</span>}
          {likes > 0 && <span className="cd-char-stat">♡ {fmt(likes)}</span>}
        </div>
        <div className="cd-char-actions">
          <button className="cd-char-action-btn"
            onClick={e => { e.stopPropagation(); onChat(char); }}>💬 Chat</button>
          <button className="cd-char-action-btn"
            onClick={e => { e.stopPropagation(); onStory(char); }}>📖 Story</button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const CreatorDashboard = () => {
  const { user } = useUser();
  const {
    switchView, VIEW_STATES,
    setActiveChatCharacter, setActiveStory, setActivePodcastContext,
    manualSync,
  } = useAppView();

  const [hubMode, setHubMode] = useState('creator');

  // ── Canon state ───────────────────────────────────────────────────────────
  const [dashboardData,    setDashboardData]    = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [selectedCharacter,setSelectedCharacter]= useState(null);
  const [requiresUpgrade,  setRequiresUpgrade]  = useState(false);
  const [showTemplates,    setShowTemplates]    = useState(false);
  const [showBuilder,      setShowBuilder]      = useState(false);
  const [showSuccess,      setShowSuccess]      = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showEducationalModal, setShowEducationalModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── New design state ──────────────────────────────────────────────────────
  const [activeCat,    setActiveCat]    = useState('all');
  const [activeFilter, setActiveFilter] = useState('All');
  const [refreshing,   setRefreshing]   = useState(false);

  // =========================================================================
  // DATA LOADING — canon endpoint + shape
  // =========================================================================
  const loadDashboardData = useCallback(async () => {
    if (!user) { setError('Authentication required'); setLoading(false); return; }
    try {
      setLoading(true); setError(null); setRequiresUpgrade(false);
      const response = await api.get('/creator-hub/analytics/dashboard');
      if (response.data?.status === 'success') {
        const dashboard = response.data.dashboard || {};
        setDashboardData({
          summary: dashboard.summary || {
            total_characters:0,total_views:0,total_likes:0,total_bookmarks:0,
            total_shares:0,total_chat_sessions:0,total_engagements:0,avg_engagement_rate:0,
          },
          characters:          dashboard.characters          || [],
          engagement_trends:   dashboard.engagement_trends   || [],
          recent_achievements: dashboard.recent_achievements || [],
          creator_info:        dashboard.creator_info        || {},
        });
      } else { throw new Error('Invalid dashboard response'); }
    } catch (err) {
      console.error('Dashboard load error:', err);
      if (err.response?.status === 403) setRequiresUpgrade(true);
      else setError(err.response?.data?.error || err.message || 'Failed to load dashboard');
      setDashboardData(null);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  // =========================================================================
  // HANDLERS — canon verbatim
  // =========================================================================
  const handleCreateCharacter = () => setShowTemplates(true);

  const handleTemplateSelect = useCallback((template) => {
    setSelectedTemplate(template); setShowTemplates(false); setShowBuilder(true);
  }, []);

  const handleCharacterCreationComplete = useCallback(() => {
    setShowBuilder(false); setShowSuccess(true); loadDashboardData();
  }, [loadDashboardData]);

  const handleCloseCreationFlow = useCallback(() => {
    setShowTemplates(false); setShowBuilder(false);
    setShowSuccess(false); setSelectedTemplate(null);
  }, []);

  const handleCreateStory    = () => switchView(VIEW_STATES.STORY_MODE);
  const handleCreateScenario = () => switchView(VIEW_STATES.SCENARIOS);
  const handleViewMarketHub  = () => switchView(VIEW_STATES.MARKET_HUB);
  const handleGoToCharacters = () => switchView(VIEW_STATES.CHAT);

  const handleUpgradeWithStripe = async () => {
    try {
      await PaymentRouter.redirectToCheckout({ tier:'unlimited', provider:'stripe', triggerSource:'creator_dashboard' });
    } catch (err) { console.error(err); alert('Unable to redirect to Stripe. Please try again.'); }
  };

  const handleUpgradeWithPayPal = async () => {
    try {
      await PaymentRouter.redirectToCheckout({ tier:'unlimited', provider:'paypal', triggerSource:'creator_dashboard' });
    } catch (err) { console.error(err); alert('Unable to redirect to PayPal. Please try again.'); }
  };

  const handleComparePlans    = () => handleUpgradeWithStripe();
  const handleViewInMarketHub = (key) => window.open(`/market-hub?character=${key}`, '_blank');

  // ── New navigation handlers ────────────────────────────────────────────────
  const goChat = useCallback((char) => {
    setActiveChatCharacter(char.character_key || char.character_id);
    switchView(VIEW_STATES.CHAT);
  }, [setActiveChatCharacter, switchView, VIEW_STATES]);

  const goStory = useCallback((char) => {
    setActiveStory({ character: char, characterKey: char.character_key || char.character_id });
    switchView(VIEW_STATES.STORY_MODE);
  }, [setActiveStory, switchView, VIEW_STATES]);

  const goPodcast = useCallback(() => {
    setActivePodcastContext({ character:null, characterKey:null, chatHistory:[], topic:null, preloadedLines:[] });
    switchView(VIEW_STATES.PODCAST_STUDIO);
  }, [setActivePodcastContext, switchView, VIEW_STATES]);

  const goWorkspace = () => switchView(VIEW_STATES.VERSE_STUDIO);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    await Promise.allSettled([loadDashboardData(), manualSync?.()]);
    setRefreshing(false);
  }, [refreshing, loadDashboardData, manualSync]);

  // =========================================================================
  // DERIVED DATA
  // =========================================================================
  const characters         = dashboardData?.characters          || [];
  const summary            = dashboardData?.summary             || {};
  const recent_achievements= dashboardData?.recent_achievements || [];
  const creator_info       = dashboardData?.creator_info        || {};
  const engagement_trends  = dashboardData?.engagement_trends   || [];

  const filteredChars = useMemo(() => {
    let list = [...characters];
    if (activeCat === 'live')    list = list.filter(c => c.status === 'active' || c.status === 'live');
    if (activeCat === 'paused')  list = list.filter(c => c.status === 'paused');
    if (activeCat === 'draft')   list = list.filter(c => c.status === 'draft');
    if (activeCat === 'premium') list = list.filter(c => c.is_premium);
    if (activeFilter === 'Most Viewed') list.sort((a,b) => (b.engagement?.total_views||0)-(a.engagement?.total_views||0));
    if (activeFilter === 'Top Revenue') list.sort((a,b) => (b.revenue||0)-(a.revenue||0));
    if (activeFilter === 'Recent')      list.sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
    return list;
  }, [characters, activeCat, activeFilter]);

  const catCounts = useMemo(() => ({
    all:     characters.length,
    live:    characters.filter(c => c.status==='active'||c.status==='live').length,
    paused:  characters.filter(c => c.status==='paused').length,
    draft:   characters.filter(c => c.status==='draft').length,
    premium: characters.filter(c => c.is_premium).length,
  }), [characters]);

  const revBars = useMemo(() => {
    if (!engagement_trends.length) return [30,55,45,70,50,80,100];
    const vals = engagement_trends.slice(-7).map(d => d.views || 0);
    const max  = Math.max(...vals, 1);
    return vals.map(v => Math.round((v/max)*100));
  }, [engagement_trends]);

  // =========================================================================
  // EARLY RETURNS — modal overlays (canon verbatim)
  // =========================================================================
  if (showSuccess) return (
    <div style={{position:'fixed',inset:0,zIndex:4000,background:'rgba(0,0,0,0.95)'}}>
      <CharacterCreationSuccess onClose={handleCloseCreationFlow} />
    </div>
  );

  if (showTemplates) return (
    <div style={{position:'fixed',inset:0,zIndex:3000,background:'rgba(0,0,0,0.95)',overflowY:'auto'}}>
      <TemplateGallery onSelectTemplate={handleTemplateSelect} onClose={handleCloseCreationFlow} />
    </div>
  );

  if (showBuilder && selectedTemplate) return (
    <div style={{position:'fixed',inset:0,zIndex:3000,background:'rgba(0,0,0,0.95)'}}>
      <CharacterBuilder template={selectedTemplate} onClose={handleCloseCreationFlow} onSuccess={handleCharacterCreationComplete} />
    </div>
  );

  if (loading) return (
    <div className="cd-root cd-root--centered">
      <div className="cd-loading"><div className="cd-spinner"/><span>Loading your Creator Hub…</span></div>
    </div>
  );

  if (requiresUpgrade) return (
    <div className="cd-root">
      <InteractiveLockedDashboard onUpgradeWithStripe={handleUpgradeWithStripe} onUpgradeWithPayPal={handleUpgradeWithPayPal}/>
      <EducationalUpgradeModal isOpen={showEducationalModal} onClose={()=>setShowEducationalModal(false)}
        onUpgradeWithStripe={handleUpgradeWithStripe} onUpgradeWithPayPal={handleUpgradeWithPayPal} onComparePlans={handleComparePlans}/>
    </div>
  );

  if (error) return (
    <div className="cd-root cd-root--centered">
      <div className="cd-error-state">
        <div className="cd-empty-icon">⚠️</div>
        <div className="cd-empty-title">Unable to Load Dashboard</div>
        <div className="cd-empty-sub">{error}</div>
        <button className="cd-btn-retry" onClick={loadDashboardData}>Try Again</button>
      </div>
    </div>
  );

  if (!dashboardData || characters.length === 0) return (
    <div className="cd-root">
      <EmptyDashboardState onLearnMore={()=>setShowEducationalModal(true)}
        onGoToCharacters={handleGoToCharacters} onCreateCharacter={handleCreateCharacter}/>
      <EducationalUpgradeModal isOpen={showEducationalModal} onClose={()=>setShowEducationalModal(false)}
        onUpgradeWithStripe={handleUpgradeWithStripe} onUpgradeWithPayPal={handleUpgradeWithPayPal} onComparePlans={handleComparePlans}/>
    </div>
  );

  // =========================================================================
  // MAIN RENDER
  // =========================================================================
  return (
    <div className="cd-root">

      <header className="cd-pill-header">
        <Wordmark />
        <div className="cd-pill-sep"/>
        <span className="cd-pill-page">Creator Hub</span>
        <div className="cd-pill-sep"/>
        <div className="cd-pill-modes">
          <button className={`cd-pill-mode${hubMode==='creator'?' cd-pill-mode--active':''}`} onClick={()=>setHubMode('creator')}>
            <StarIcon size={11}/> Creator
          </button>
          <button className={`cd-pill-mode${hubMode==='business'?' cd-pill-mode--active':''}`} onClick={()=>setHubMode('business')}>
            <BizIcon size={11}/> Business
          </button>
        </div>
        <div className="cd-pill-sep"/>
        <button className={`cd-pill-refresh${refreshing?' cd-pill-refresh--spinning':''}`}
          onClick={handleRefresh} disabled={refreshing} title="Refresh">
          <RefreshIcon/>
        </button>
      </header>

      {hubMode === 'business' ? (

        <div className="cd-canvas cd-canvas--business">
          <BusinessModePanel />
        </div>

      ) : (

        <div className="cd-canvas">

          {/* ══ LEFT — Stats + Category filters + Creator level ══ */}
          <div className="cd-panel cd-panel-left">
            <div className="cd-panel-head">
              <div className="cd-icon-badge"><Icon d="M3 3v18h18M18 9l-5 5-2-2-4 4"/></div>
              <span className="cd-panel-title">Overview</span>
              <span className="cd-badge cd-badge-live">Live</span>
            </div>
            <div className="cd-panel-body">
              <div className="cd-section-label">Your numbers</div>
              <StatPill icon={<Eye size={12}/>}          label="Total Views"    value={fmt(summary.total_views)}         delta={summary.views_delta}      deltaDir={summary.views_trend}/>
              <StatPill icon={<Heart size={12}/>}        label="Total Likes"    value={fmt(summary.total_likes)}         delta={summary.likes_delta}      deltaDir={summary.likes_trend}/>
              <StatPill icon={<Bookmark size={12}/>}     label="Bookmarks"      value={fmt(summary.total_bookmarks)}/>
              <StatPill icon={<Share2 size={12}/>}       label="Shares"         value={fmt(summary.total_shares)}/>
              <StatPill icon={<MessageCircle size={12}/>}label="Chat Sessions"  value={fmt(summary.total_chat_sessions)} delta={summary.sessions_delta}   deltaDir={summary.sessions_trend}/>
              <StatPill icon={<TrendingUp size={12}/>}   label="Engagement"     value={`${summary.avg_engagement_rate||0}%`} delta={summary.engagement_delta} deltaDir={summary.engagement_trend}/>
              <StatPill icon={<Users size={12}/>}        label="Characters"     value={summary.total_characters||characters.length}/>

              <div className="cd-cat-section">
                <div className="cd-section-label">Filter by type</div>
                <div className="cd-cat-pills">
                  {CATEGORIES.map(cat => (
                    <button key={cat.key}
                      className={`cd-cat-pill${activeCat===cat.key?' cd-cat-pill--active':''}`}
                      onClick={()=>setActiveCat(cat.key)}>
                      <span className="cd-cat-dot" style={{background:cat.color}}/>
                      {cat.label}
                      <span className="cd-cat-count">{catCounts[cat.key]??0}</span>
                    </button>
                  ))}
                </div>
              </div>

              {creator_info.level && (
                <div className="cd-creator-level">
                  <div className="cd-section-label" style={{marginTop:14}}>Creator Level</div>
                  <div className="cd-level-row">
                    <Crown size={14} color="#F59E0B"/>
                    <span className="cd-level-name">{creator_info.level}</span>
                  </div>
                  <div className="cd-level-bar-wrap">
                    <div className="cd-level-bar-fill" style={{width:`${creator_info.progress||45}%`}}/>
                  </div>
                  <span className="cd-level-pct">{creator_info.progress||45}% to next level</span>
                </div>
              )}
            </div>
          </div>

          {/* ══ CENTRE — Character cards ══ */}
          <div className="cd-panel cd-panel-centre">
            <div className="cd-panel-head cd-panel-head--tall">
              <div className="cd-panel-head-row">
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div className="cd-icon-badge">
                    <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
                  </div>
                  <span className="cd-panel-title">
                    Characters <span className="cd-panel-count">{characters.length}</span>
                  </span>
                </div>
                <button className="cd-btn-new-char" onClick={handleCreateCharacter}>
                  <Icon d="M12 5v14M5 12h14" size={10}/> New Character
                </button>
              </div>
              <div className="cd-filter-row">
                {FILTERS.map(f => (
                  <button key={f}
                    className={`cd-filter-pill${activeFilter===f?' cd-filter-pill--active':''}`}
                    onClick={()=>setActiveFilter(f)}>{f}</button>
                ))}
              </div>
            </div>
            <div className="cd-panel-body">
              <div className="cd-char-grid">
                {filteredChars.map(char => (
                  <CharCard key={char.character_id} char={char}
                    onChat={goChat} onStory={goStory}
                    onClick={()=>setSelectedCharacter(char)}/>
                ))}
                <button className="cd-char-card cd-char-card--add"
                  onClick={handleCreateCharacter} aria-label="Create new character">
                  <Icon d="M12 5v14M5 12h14" size={22}/>
                  <span>New</span>
                </button>
              </div>
            </div>
          </div>

          {/* ══ RIGHT — Revenue + Quick actions + Achievements ══ */}
          <div className="cd-panel cd-panel-right">
            <div className="cd-panel-head">
              <div className="cd-icon-badge"><Icon d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></div>
              <span className="cd-panel-title">Revenue</span>
              <span className="cd-badge cd-badge-running">This month</span>
            </div>
            <div className="cd-panel-body">

              <div className="cd-rev-block">
                <div className="cd-rev-amount">
                  £{Number(summary.revenue_total||0).toLocaleString('en-GB',{minimumFractionDigits:2})}
                </div>
                <div className="cd-rev-sub">
                  80% share → <strong style={{color:'#10B981'}}>£{(Number(summary.revenue_total||0)*0.8).toFixed(2)}</strong> yours
                </div>
                <div className="cd-mini-bars">
                  {revBars.map((h,i) => (
                    <div key={i}
                      className={`cd-mini-bar${i===revBars.length-1?' cd-mini-bar--current':''}`}
                      style={{height:`${h}%`}}/>
                  ))}
                </div>
              </div>

              <div className="cd-panel-divider"/>

              <div className="cd-section-label">Quick actions</div>
              <div className="cd-quick-actions">
                <button className="cd-quick-btn" onClick={handleCreateCharacter}>
                  <span className="cd-quick-icon"><Sparkles size={11}/></span>New Character
                </button>
                <button className="cd-quick-btn" onClick={handleCreateStory}>
                  <span className="cd-quick-icon"><BookOpen size={11}/></span>Create Story
                </button>
                <button className="cd-quick-btn" onClick={handleCreateScenario}>
                  <span className="cd-quick-icon"><Users size={11}/></span>Create Debate
                </button>
                <button className="cd-quick-btn" onClick={goPodcast}>
                  <span className="cd-quick-icon">
                    <Icon d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8" size={11}/>
                  </span>Create Podcast
                </button>
                <button className="cd-quick-btn" onClick={goWorkspace}>
                  <span className="cd-quick-icon"><BarChart3 size={11}/></span>Verse Studio
                </button>
                <button className="cd-quick-btn" onClick={handleViewMarketHub}>
                  <span className="cd-quick-icon"><TrendingUp size={11}/></span>Market Hub
                </button>
              </div>

              {recent_achievements.length > 0 && (
                <>
                  <div className="cd-panel-divider"/>
                  <div className="cd-section-label">Recent Achievements</div>
                  {recent_achievements.slice(0,3).map((a,i) => (
                    <div key={i} className="cd-activity-item">
                      <span className="cd-activity-pip" style={{background:'#F59E0B'}}/>
                      <div className="cd-activity-content">
                        <div className="cd-activity-text"><strong>{a.title}</strong></div>
                        <div className="cd-activity-time">{new Date(a.earned_at||a.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ── Modals (canon verbatim) ── */}
      {selectedCharacter && (
        <CharacterDetailModal character={selectedCharacter}
          onClose={()=>setSelectedCharacter(null)} onViewInHub={handleViewInMarketHub}/>
      )}
      <EducationalUpgradeModal isOpen={showEducationalModal} onClose={()=>setShowEducationalModal(false)}
        onUpgradeWithStripe={handleUpgradeWithStripe} onUpgradeWithPayPal={handleUpgradeWithPayPal} onComparePlans={handleComparePlans}/>
    </div>
  );
};

// =============================================================================
// SUB-COMPONENTS — canon verbatim
// =============================================================================

const CharacterDetailModal = ({ character, onClose, onViewInHub }) => {
  const eng = character.engagement || {};
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-header">
          <img src={character.avatar_url||'/images/default-character.jpg'} alt={character.display_name}/>
          <div><h2>{character.display_name}</h2><p>{character.short_description}</p></div>
        </div>
        <div className="modal-stats">
          <h3>Engagement Breakdown</h3>
          <div className="stats-grid-modal">
            <div className="stat-item"><Eye size={20}/><div><div className="stat-number">{eng.total_views||0}</div><div className="stat-label">Total Views</div></div></div>
            <div className="stat-item"><Heart size={20}/><div><div className="stat-number">{eng.total_likes||0}</div><div className="stat-label">Total Likes</div></div></div>
            <div className="stat-item"><Bookmark size={20}/><div><div className="stat-number">{eng.total_bookmarks||0}</div><div className="stat-label">Bookmarks</div></div></div>
            <div className="stat-item"><Share2 size={20}/><div><div className="stat-number">{eng.total_shares||0}</div><div className="stat-label">Shares</div></div></div>
            <div className="stat-item"><MessageCircle size={20}/><div><div className="stat-number">{eng.chat_sessions||0}</div><div className="stat-label">Chat Sessions</div></div></div>
          </div>
          <div className="engagement-rate-display">
            <TrendingUp size={24}/>
            <div><div className="rate-number">{eng.engagement_rate||0}%</div><div className="rate-label">Engagement Rate</div></div>
          </div>
        </div>
        <button className="view-hub-button" onClick={()=>onViewInHub(character.character_key)}>View in Market Hub</button>
      </div>
    </div>
  );
};

const EducationalUpgradeModal = ({ isOpen, onClose, onUpgradeWithStripe, onUpgradeWithPayPal, onComparePlans }) => {
  if (!isOpen) return null;
  const features = [
    {icon:'💎',title:'Full Creator Hub Access',description:'Publish unlimited characters and track detailed analytics'},
    {icon:'📊',title:'Advanced Analytics',description:'Real-time engagement metrics and performance insights'},
    {icon:'💰',title:'Earn Monthly Payouts',description:"Get paid based on your characters' popularity and usage"},
    {icon:'🚀',title:'Priority Featuring',description:'Your characters get promoted in Market Hub'},
    {icon:'🎭',title:'Scenarios Hub',description:'Create multi-AI conversations and dynamic storylines'},
    {icon:'⚡',title:'Unlimited Everything',description:'No limits on characters, messages, or features'},
  ];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content educational-modal" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="educational-header">
          <div className="educational-icon">🚀</div>
          <h2>Choose your plan and pay securely with Stripe or PayPal</h2>
          <p className="educational-subtitle">Upgrade to Professional tier and get access to powerful creator tools</p>
        </div>
        <div className="educational-features">
          {features.map((f,i)=>(
            <div key={i} className="feature-row">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-text"><h4>{f.title}</h4><p>{f.description}</p></div>
            </div>
          ))}
        </div>
        <div className="pricing-card">
          <div className="pricing-header">
            <h3>Professional Plan</h3>
            <div className="price"><span className="amount">£29.99</span><span className="period">/month</span></div>
          </div>
          <div className="pricing-features">
            <div className="pricing-feature">✓ Unlimited Characters</div>
            <div className="pricing-feature">✓ Unlimited Messages</div>
            <div className="pricing-feature">✓ Creator Hub Pro Tools</div>
            <div className="pricing-feature">✓ All Premium Templates</div>
            <div className="pricing-feature">✓ VIP Support</div>
            <div className="pricing-feature">✓ All Hub Access</div>
          </div>
          <div className="pricing-actions">
            <button onClick={onUpgradeWithStripe} className="upgrade-now-button">Pay with Stripe - £29.99/month</button>
            <button onClick={onUpgradeWithPayPal} className="upgrade-now-button secondary">Pay with PayPal - £29.99/month</button>
            <button className="compare-plans-button" onClick={onComparePlans}>Compare All Plans</button>
          </div>
        </div>
        <div className="educational-footer">
          <p>⭐ <strong>Secured by Stripe</strong> · 🅿️ <strong>PayPal Secure</strong> · Cancel anytime</p>
        </div>
      </div>
    </div>
  );
};

const InteractiveLockedDashboard = ({ onUpgradeWithStripe, onUpgradeWithPayPal }) => {
  const [selectedPreview, setSelectedPreview] = useState('engagement');
  const [selectedPayment, setSelectedPayment] = useState('stripe');
  const [isLocked,        setIsLocked]        = useState(true);

  const previewData = {
    engagement: { title:'Engagement Analytics', description:'With Pro: Track real-time engagement, user demographics, and conversation trends to optimize your characters.', image:'/images/creatorhub/engagement_analytics.jpg' },
    marketHub:  { title:'Market Hub Featuring',  description:'With Pro: Get featured in prime slots, reach 10x more users, and get priority in search results.', image:'/images/creatorhub/market_hub_featuring.jpg' },
    payouts:    { title:'Monthly Payouts',        description:'With Pro: Earn from every chat session, track revenue in real-time, and get monthly payouts via Stripe or PayPal.', image:'/images/creatorhub/payouts_earnings_dashboard.jpg' },
  };

  const handlePreviewSelect = (p) => { setSelectedPreview(p); if (isLocked) setIsLocked(false); };
  const handleUpgrade       = () => { selectedPayment==='stripe' ? onUpgradeWithStripe() : onUpgradeWithPayPal(); };
  const current = previewData[selectedPreview];

  return (
    <div className="locked-dashboard-preview">
      <div className="locked-dashboard-container">
        <div className="locked-dashboard-header">
          <button className="locked-close-button" onClick={()=>window.history.back()}>×</button>
          <h1>Creator Hub Pro Dashboard Preview</h1>
          <p>See what you're missing. Upgrade to unlock powerful analytics, higher earnings, and priority featuring.</p>
        </div>
        <div className="locked-dashboard-content">
          <div className="locked-preview-section">
            <div className="locked-preview-header">
              <h2>Locked Dashboard Preview</h2>
              <div className="locked-feature-tag"><span>🔒</span><span>Click panels to preview</span></div>
            </div>
            <div className="locked-main-preview">
              {isLocked && (
                <div className="preview-overlay">
                  <div className="locked-lock-icon">🔒</div>
                  <div className="locked-unlock-text">Pro Features Locked</div>
                  <p className="locked-preview-subtext">Click on the panels below to preview what you'll unlock with Creator Hub Pro</p>
                </div>
              )}
              <div className="preview-image-container">
                <img src={current.image} alt={current.title} className="preview-image"
                  onError={e=>{e.target.src='/images/default-dashboard-preview.jpg';}}/>
                <div className="image-description-overlay">
                  <h3>{current.title}</h3>
                  <div className="image-description"><h4>What you'll unlock:</h4><p>{current.description}</p></div>
                </div>
              </div>
            </div>
            <div className="locked-mini-panels">
              {[
                {key:'engagement',icon:'📊',title:'Engagement Analytics',desc:'Real-time views, likes, and chat session tracking with detailed breakdowns'},
                {key:'marketHub', icon:'🚀',title:'Market Hub Featuring', desc:'Get promoted in prime slots and reach 10x more users'},
                {key:'payouts',   icon:'💰',title:'Monthly Payouts',       desc:'Earn from character usage with transparent revenue tracking'},
              ].map(p=>(
                <div key={p.key} className={`locked-mini-panel${selectedPreview===p.key?' active':''}`} onClick={()=>handlePreviewSelect(p.key)}>
                  <div className="panel-header"><div className="panel-icon">{p.icon}</div><div className="panel-title">{p.title}</div></div>
                  <p className="panel-description">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="locked-upgrade-section">
            <div className="locked-pricing-header">
              <h3>Unlock Everything</h3>
              <div className="locked-pricing"><span className="locked-price-amount">£29.99</span><span className="locked-price-period">/month</span></div>
              <p className="locked-pricing-description">Cancel anytime. All features included.</p>
            </div>
            <div className="locked-payment-options">
              {[
                {key:'stripe',icon:'💳',name:'Pay with Stripe', sec:'⭐ Secured & Encrypted'},
                {key:'paypal',icon:'🅿️',name:'Pay with PayPal', sec:'🛡️ Buyer Protection'},
              ].map(p=>(
                <div key={p.key} className={`locked-payment-option${selectedPayment===p.key?' selected':''}`} onClick={()=>setSelectedPayment(p.key)}>
                  <div className="payment-icon">{p.icon}</div>
                  <div className="payment-details"><div className="payment-name">{p.name}</div><div className="payment-security">{p.sec}</div></div>
                </div>
              ))}
            </div>
            <div className="locked-upgrade-cta">
              <button className="locked-upgrade-button" onClick={handleUpgrade}><span>🔓</span><span>Unlock Creator Hub Pro</span></button>
            </div>
          </div>
        </div>
        <div className="locked-dashboard-footer">
          <div className="locked-security-badges">
            <div className="locked-security-badge"><span>⭐</span><span>Stripe Secure</span></div>
            <div className="locked-security-badge"><span>🅿️</span><span>PayPal Protected</span></div>
            <div className="locked-security-badge"><span>🔒</span><span>SSL Encrypted</span></div>
          </div>
          <div className="locked-cancel-info">Cancel anytime · 7-day support included</div>
        </div>
      </div>
    </div>
  );
};

const EmptyDashboardState = ({ onLearnMore, onGoToCharacters, onCreateCharacter }) => (
  <div className="empty-state">
    <div className="empty-state-content">
      <span className="es-hero-label">Creator Hub</span>
      <h2>Build Characters.<br/>Reach an Audience.</h2>
      <p>You haven't published any characters yet. Follow the path below to go from idea to Market Hub in five steps.</p>
      <div className="es-step-journey">
        <div className="es-step-item"><div className="es-step-node"><span className="es-step-badge">1</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="url(#es-g1)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <defs><linearGradient id="es-g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#818CF8"/><stop offset="100%" stopColor="#6366F1"/></linearGradient></defs>
            <circle cx="12" cy="8" r="3.5"/><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M17 4l1.5 1.5L17 7" stroke="#818CF8" strokeWidth="1.5"/><path d="M18.5 5.5h2" stroke="#818CF8" strokeWidth="1.5"/>
          </svg></div><span className="es-step-label">Design your<br/>Character</span>
        </div>
        <div className="es-step-item"><div className="es-step-node"><span className="es-step-badge">2</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="url(#es-g2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <defs><linearGradient id="es-g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#818CF8"/><stop offset="100%" stopColor="#6366F1"/></linearGradient></defs>
            <path d="M12 2l7 3.5v5C19 15 16 19.5 12 22 8 19.5 5 15 5 10.5V5.5L12 2z"/><polyline points="9 12 11.5 14.5 15 10" stroke="#A5B4FC" strokeWidth="1.8"/>
          </svg></div><span className="es-step-label">Team<br/>Review</span>
        </div>
        <div className="es-step-item"><div className="es-step-node"><span className="es-step-badge">3</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="url(#es-g3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <defs><linearGradient id="es-g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#818CF8"/><stop offset="100%" stopColor="#6366F1"/></linearGradient></defs>
            <circle cx="12" cy="12" r="8"/><path d="M12 4c-2 2-3 4-3 8s1 6 3 8"/><path d="M12 4c2 2 3 4 3 8s-1 6-3 8"/><line x1="4.5" y1="12" x2="19.5" y2="12"/><polyline points="10 7.5 12 4.5 14 7.5" stroke="#A5B4FC"/>
          </svg></div><span className="es-step-label">Publish to<br/>Market Hub</span>
        </div>
        <div className="es-step-item"><div className="es-step-node"><span className="es-step-badge">4</span>
          <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <defs><linearGradient id="es-g4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#818CF8"/><stop offset="100%" stopColor="#6366F1"/></linearGradient></defs>
            <circle cx="6.5" cy="5.5" r="2.2" stroke="url(#es-g4)" strokeWidth="1.6"/><circle cx="17.5" cy="5.5" r="2.2" stroke="url(#es-g4)" strokeWidth="1.6"/>
            <rect x="2" y="10" width="11" height="7" rx="2.5" stroke="url(#es-g4)" strokeWidth="1.6"/><path d="M5 17l-1.5 2.5 3-1" stroke="url(#es-g4)" strokeWidth="1.4"/>
            <rect x="11" y="12.5" width="11" height="7" rx="2.5" stroke="#A5B4FC" strokeWidth="1.6"/><path d="M19 19.5l1.5 2.5-3-1" stroke="#A5B4FC" strokeWidth="1.4"/>
            <circle cx="7" cy="13.5" r="0.8" fill="#818CF8"/><circle cx="9.5" cy="13.5" r="0.8" fill="#818CF8"/>
            <circle cx="15" cy="16" r="0.8" fill="#A5B4FC"/><circle cx="17.5" cy="16" r="0.8" fill="#A5B4FC"/>
          </svg></div><span className="es-step-label">Enter<br/>Dialogue</span>
        </div>
        <div className="es-step-item"><div className="es-step-node"><span className="es-step-badge">5</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="url(#es-g5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <defs><linearGradient id="es-g5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#818CF8"/><stop offset="100%" stopColor="#6366F1"/></linearGradient></defs>
            <rect x="3" y="14" width="4" height="7" rx="1"/><rect x="10" y="10" width="4" height="11" rx="1"/><rect x="17" y="6" width="4" height="15" rx="1"/>
            <polyline points="4 10 8.5 6 13 8 19 3" stroke="#A5B4FC" strokeWidth="1.6"/><circle cx="19" cy="3" r="1.5" fill="#818CF8" stroke="none"/>
          </svg></div><span className="es-step-label">Track &amp;<br/>Earn</span>
        </div>
      </div>
      <div className="es-divider"/>
      <div className="empty-state-actions">
        <button onClick={onCreateCharacter} className="es-btn es-btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
            <circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Create Character
        </button>
        <button onClick={onGoToCharacters} className="es-btn es-btn-secondary">My Characters</button>
        <button onClick={onLearnMore} className="es-btn es-btn-ghost">Professional Features →</button>
      </div>
    </div>
  </div>
);

export default CreatorDashboard;