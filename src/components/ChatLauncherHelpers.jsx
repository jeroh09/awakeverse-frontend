// src/components/ChatLauncherHelpers.jsx
// Helper components for ChatLauncherPage (decentralized: NO status modal here)
import React from 'react';

/* ------------------------------ Assets Map ------------------------------ */
export const categoryRepresentatives = {
  sleuths: '/images/sherlock.jpg',
  stargazers: '/images/nostradamus.jpg',
  truthweavers: '/images/dante.jpg',
  veilwalkers: '/images/rasputin.jpg',
  goldhands: '/images/mansa_musa.jpg',
  heartstrings: '/images/shakespeare.jpg',
  thinkers: '/images/socrates.jpg',
  makers: '/images/da_vinci.jpg',
  warlords: '/images/sun_tzu.jpg',
  pathfinders: '/images/christopher_columbus.jpg',
  performers: '/images/harry_houdini.jpg',
  my_characters: '/images/default-character.jpg'
};

/* --- injected visual skin (CSS-only) --- */
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
.awv-badge {
  font-size: 11px; padding: 4px 8px; border-radius: 999px;
  border: 1px solid var(--av-line); color: var(--av-ink-dim);
  background: color-mix(in hsl, var(--av-bg-2) 92%, transparent);
}
`;

/* ------------------------------ StatusBadge ----------------------------- */
export const StatusBadge = ({ status, size = 'normal' }) => {
  const statusConfig = {
    pending:  { color: '#FFA500', text: 'Pending',  icon: '⏳' },
    rejected: { color: '#FF6B6B', text: 'Rejected', icon: '❌' },
    approved: { color: '#00D084', text: 'Approved', icon: '✅' }
  };

  const cfg = statusConfig[status] || statusConfig.pending;
  const small = size === 'small';

  return (
    <div className="awv-skin" style={{ display: 'inline-flex', alignItems: 'center' }}>
      <style>{LAUNCHER_SKIN_CSS}</style>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: small ? '2px 6px' : '4px 8px',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.06)',
        color: cfg.color,
        fontSize: small ? '10px' : '12px',
        fontWeight: 800
      }}>
        <span>{cfg.icon}</span>
        <span>{cfg.text}</span>
      </span>
    </div>
  );
};

/* ------------------------------ CategoryCard ---------------------------- */
export const CategoryCard = ({
  category,           // { key, title, characters?, characterCount?, pendingCount?, rejectedCount?, approvedCount? }
  onClick,
  index = 0,
  isMobile,
  onCreateCharacter
}) => {
  const isMyCharacters = category.key === 'my_characters';

  const handleClick = () => {
    if (isMyCharacters && (category.characterCount || 0) === 0) {
      onCreateCharacter?.();
    } else {
      onClick?.();
    }
  };

  const Pill = ({ children }) => (
    <span className="awv-badge" style={{
      padding: '4px 8px',
      borderRadius: 999,
      fontSize: 11,
      letterSpacing: '.3px'
    }}>{children}</span>
  );

  const Counts = () => {
    const { characterCount = 0, pendingCount = 0, rejectedCount = 0, approvedCount = 0 } = category;
    if (!isMyCharacters) {
      return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Pill>{(category.characters || []).length} guides</Pill>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Pill>{characterCount} total</Pill>
        {approvedCount > 0 && <Pill>✅ {approvedCount}</Pill>}
        {pendingCount > 0 && <Pill>⏳ {pendingCount}</Pill>}
        {rejectedCount > 0 && <Pill>❌ {rejectedCount}</Pill>}
      </div>
    );
  };

  return (
    <div
      className="awv-skin awv-card"
      onClick={handleClick}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: isMyCharacters
          ? '1px solid rgba(255, 215, 0, 0.4)'
          : '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: 16,
        padding: '14px 14px 16px',
        cursor: 'pointer',
        transition: 'transform .2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '.55rem',
        position: 'relative',
        minHeight: isMobile ? 120 : 140,
        justifyContent: 'center'
      }}
      title={category.title}
    >
      <style>{LAUNCHER_SKIN_CSS}</style>
      {isMyCharacters && (
        <div style={{
          position: 'absolute',
          top: 8, right: 8,
          fontSize: 12,
          color: '#FFD700'
        }}>
          ★
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 58, height: 58, borderRadius: '50%',
          border: '3px solid rgba(255,215,0,.5)',
          background:
            'radial-gradient(circle at 30% 30%, rgba(255,215,0,.35), transparent 50%),' +
            'radial-gradient(circle at 70% 70%, rgba(88,101,242,.25), transparent 50%),' +
            'linear-gradient(180deg, #0e1830, #121f3d)',
          flex: '0 0 auto'
        }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="awv-title" style={{
            fontSize: 15, letterSpacing: '.6px'
          }}>{category.title}</div>
          <div style={{ color: 'rgba(233,238,251,.78)', fontSize: 12 }}>
            {isMyCharacters ? 'Your custom creations' : 'Curated legends'}
          </div>
        </div>
      </div>
      <Counts />
    </div>
  );
};

/* ------------------------------ CharacterCard --------------------------- */
export const CharacterCard = ({
  character,
  onClick
}) => {
  const status = character.status;
  const blocked = String(character.key || '').startsWith('user_') && status && status !== 'approved';

  return (
    <div
      className="awv-skin awv-card"
      onClick={() => onClick?.(character)}
      style={{
        position: 'relative',
        padding: 16,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,.18)',
        background: 'rgba(255,255,255,.06)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '.7rem',
        minHeight: 200
      }}
      title={character.name}
    >
      <style>{LAUNCHER_SKIN_CSS}</style>
      {blocked && (
        <div style={{
          position: 'absolute', right: -6, top: -6,
          borderRadius: 8, padding: '2px 6px', fontSize: 11,
          fontWeight: 800, color: '#fff', border: '2px solid #0b1426',
          background: status === 'pending' ? '#ffa500' : '#ff6b6b'
        }}>
          {status === 'pending' ? 'Pending ⏳' : 'Rejected ❌'}
        </div>
      )}

      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        border: '3px solid rgba(255,215,0,.45)',
        display: 'grid', placeItems: 'center',
        fontWeight: 900, color: '#fff',
        backgroundImage: 'linear-gradient(145deg,#1f2a4a,#0e1832)'
      }}>
        {(character.name || 'A V').split(' ').slice(0,2).map(s=>s[0]).join('')}
      </div>

      <div style={{ fontWeight: 800, color: '#FFD700', textAlign: 'center' }}>
        {character.name}
      </div>
      <div style={{
        color: 'rgba(233,238,251,.9)', textAlign: 'center',
        fontSize: 13, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
      }}>
        {character.description}
      </div>
    </div>
  );
};

/* ------------------------------ PersonalizedSection --------------------- */
export const PersonalizedSection = ({
  interactedCharacters = [],
  startCreateCharacter,
  onStartChat
}) => {
  return (
    <div className="awv-skin" style={{ width: '100%', maxWidth: 560 }}>
      <style>{LAUNCHER_SKIN_CSS}</style>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        margin: '.3rem 2px'
      }}>
        <h3 className="awv-title" style={{ margin: 0, fontSize: 15, letterSpacing: '.6px' }}>For You</h3>
        <span style={{
          fontSize: 12, padding: '.2rem .6rem', borderRadius: 12,
          color: '#FFD700', border: '1px solid rgba(255,215,0,.35)', background: 'rgba(255,215,0,.12)'
        }}>
          Recent
        </span>
      </div>
      <div style={{ display: 'flex', gap: '.8rem', overflow: 'auto', padding: '.5rem 2px' }}>
        {interactedCharacters?.slice(0,6).map((r,i) => (
          <div key={i} onClick={() => onStartChat?.(r.key)} style={{
            minWidth: 140, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 14, padding: '.6rem', display: 'flex', gap: '.5rem', alignItems: 'center', cursor: 'pointer'
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%', border: '2px solid rgba(255,215,0,.35)',
              display: 'grid', placeItems: 'center', fontWeight: 900, color: '#fff',
              backgroundImage: 'linear-gradient(145deg,#1f2a4a,#0e1832)'
            }}>
              {(r.name || 'A V').split(' ').slice(0,2).map(s=>s[0]).join('')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 800, color: '#FFD700', fontSize: 14 }}>{(r.name||'').split(' ')[0]}</span>
              <span style={{ fontSize: 11, letterSpacing: '.3px', color: 'rgba(255,215,0,.8)', textTransform: 'uppercase' }}>Recent</span>
            </div>
          </div>
        ))}
        <button onClick={startCreateCharacter} className="awv-btn primary" style={{ border: 'none' }}>
          Create Character
        </button>
      </div>
    </div>
  );
};

/* ------------------------------ MyCharactersPanel ----------------------- */
export const MyCharactersPanel = ({
  userCharacters = [],
  onSelect
}) => {
  return (
    <div className="awv-skin" style={{ width: '100%' }}>
      <style>{LAUNCHER_SKIN_CSS}</style>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
        gap: '1rem'
      }}>
        {userCharacters.map((ch) => (
          <CharacterCard key={ch.key || ch.name} character={ch} onClick={onSelect} />
        ))}
      </div>
    </div>
  );
};

/* ------------------------------ Headers --------------------------------- */
export const CategoryHeader = ({ category, onBack }) => (
  <div className="awv-skin" style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '1.2rem', borderBottom: '2px solid rgba(255,215,0,.24)', paddingBottom: '.8rem'
  }}>
    <style>{LAUNCHER_SKIN_CSS}</style>
    <h2 className="awv-title" style={{ margin: 0, letterSpacing: '1.2px' }}>{category.title}</h2>
    <button onClick={onBack} style={{
      appearance: 'none', border: '2px solid rgba(255,215,0,.45)', background: 'rgba(255,215,0,.12)',
      color: '#FFD700', padding: '.45rem .9rem', borderRadius: 10, fontWeight: 800, cursor: 'pointer', letterSpacing: '.3px'
    }}>← Back</button>
  </div>
);

export const CategoryListHeader = () => (
  <div className="awv-skin" style={{ marginBottom: '1rem' }}>
    <style>{LAUNCHER_SKIN_CSS}</style>
    <h2 className="awv-title" style={{ margin: 0, fontSize: 18, letterSpacing: '1.2px' }}>Browse Categories</h2>
  </div>
);

export const SectionHeader = ({ title }) => (
  <div className="awv-skin" style={{ width: '100%', maxWidth: 560, margin: '0.6rem 0' }}>
    <style>{LAUNCHER_SKIN_CSS}</style>
    <h3 className="awv-title" style={{ margin: 0, fontSize: 15, letterSpacing: '.6px' }}>{title}</h3>
  </div>
);
