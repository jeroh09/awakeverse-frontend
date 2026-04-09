// src/pages/UseCases/UseCaseBusiness.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../../components/SEO/SEOHead';
import styles from './UseCaseBusiness.module.css';

// ── Icons ─────────────────────────────────────────────────
const StoriesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M7 5h8.5A2.5 2.5 0 0 1 18 7.5V18l-3.5-2L11 18l-4-2.5V7.5A2.5 2.5 0 0 1 9.5 5H11"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ScenariosIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 4c-4 0-7 2-7 6v2c0 4 3 6 7 6s7-2 7-6v-2c0-4-3-6-7-6z"
      stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M9 12c0-1 .8-1.5 1.5-1.5S12 11 12 12M15 12c0-1-.8-1.5-1.5-1.5S12 11 12 12"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const ChatIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M5 6.5C5 5.12 6.12 4 7.5 4h9c1.38 0 2.5 1.12 2.5 2.5v6c0 1.38-1.12 2.5-2.5 2.5H10l-3.5 3v-3H7.5C6.12 15 5 13.88 5 12.5v-6z"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const VerseStudioIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8" opacity="0.7" />
    <circle cx="9" cy="9" r="1.7" fill="currentColor" opacity="0.95" />
    <circle cx="15" cy="10" r="1.5" fill="currentColor" opacity="0.85" />
    <circle cx="11" cy="15" r="1.4" fill="currentColor" opacity="0.85" />
    <path d="M9 9 L15 10 M15 10 L11 15 M11 15 L9 9"
      stroke="currentColor" strokeWidth="1" opacity="0.4" />
  </svg>
);

// ── Hero portraits ────────────────────────────────────────
const HERO_CHARACTERS = [
  { key: 'john_d_rockefeller', name: 'Rockefeller', src: '/images/john_d_rockefeller.jpg' },
  { key: 'andrew_carnegie',    name: 'Carnegie',    src: '/images/andrew_carnegie.jpg' },
  { key: 'niccolo_machiavelli', name: 'Machiavelli', src: '/images/niccolo_machiavelli.jpg' },
  { key: 'cleopatra',          name: 'Cleopatra',   src: '/images/cleopatra.jpg' },
];

// ── Card data ─────────────────────────────────────────────
const CHAT_DATA = {
  professional: {
    avatars: [
      { initials: 'AC', src: '/images/andrew_carnegie.jpg', label: 'Carnegie' },
      { initials: '⚙', src: null, label: 'The Inventor' },
      { initials: '£', src: null, label: 'The Accountant' },
    ],
    desc: "Build specialised characters tailored to your field — The Accountant who stress-tests your numbers, The Inventor who challenges your process, The Strategist who questions your positioning. Or consult Carnegie directly on scaling and operations.",
    cta: 'Build your expert character →',
  },
  entrepreneur: {
    avatars: [
      { initials: 'JR', src: '/images/john_d_rockefeller.jpg', label: 'Rockefeller' },
      { initials: 'CL', src: '/images/cleopatra.jpg', label: 'Cleopatra' },
    ],
    desc: "Bring your idea to Rockefeller — the man who built Standard Oil from nothing — and get feedback on scalability, competitive moats, and long-term vision. Or consult Cleopatra on navigating power, alliances, and strategic positioning.",
    cta: 'Start a strategy session →',
  },
};

const DIALOGUE_DATA = {
  professional: {
    avatars: [
      { initials: 'NM', src: '/images/niccolo_machiavelli.jpg', label: 'Machiavelli' },
      { initials: '⚖', src: null, label: 'The Strategist' },
      { initials: '📊', src: null, label: 'The Analyst' },
    ],
    desc: "Create your own advisory panel. Build characters representing different professional perspectives — the risk analyst, the creative director, the numbers person — and have them evaluate a client brief or project proposal together.",
    cta: 'Build your advisory panel →',
  },
  entrepreneur: {
    avatars: [
      { initials: 'JR', src: '/images/john_d_rockefeller.jpg', label: 'Rockefeller' },
      { initials: 'AC', src: '/images/andrew_carnegie.jpg', label: 'Carnegie' },
      { initials: 'NM', src: '/images/niccolo_machiavelli.jpg', label: 'Machiavelli' },
    ],
    desc: "Pitch your business to a Dragon's Den panel of history's sharpest minds. Rockefeller scrutinises your market position. Carnegie challenges your scaling plan. Machiavelli questions your competitive strategy. They won't be kind — but they'll be right.",
    cta: "Pitch to the panel →",
  },
};

const STORY_DATA = {
  professional: {
    avatars: [
      { initials: 'JR', src: '/images/john_d_rockefeller.jpg', label: 'Rockefeller' },
    ],
    desc: "Step into the mindset of the world's first billionaire. Walk through the decisions that built Standard Oil — the partnerships, the pivots, the ruthless focus. Use it as a thinking framework for your own professional challenges.",
    cta: 'Step into the story →',
  },
  entrepreneur: {
    avatars: [
      { initials: 'JR', src: '/images/john_d_rockefeller.jpg', label: 'Rockefeller' },
    ],
    desc: "Explore building an empire alongside John D. Rockefeller. You're in 1870s Cleveland. Oil is the new gold. Every decision you make shapes what Standard Oil becomes. Era constraints keep the world coherent. Your choices drive the narrative.",
    cta: 'Build an empire →',
  },
};

const WORKSPACE_DATA = {
  professional: {
    avatars: [
      { initials: '✦', src: null, label: 'AI Team' },
      { initials: '✦', src: null, label: 'AI Team' },
      { initials: '✦', src: null, label: 'AI Team' },
    ],
    desc: "Use the Business Builder workspace to generate proposals, client briefs, financial models, and strategy documents. Define the deliverable, work through it with your AI team in the discussion phase, and generate structured output ready to send.",
    cta: 'Open Business Builder →',
  },
  entrepreneur: {
    avatars: [
      { initials: '✦', src: null, label: 'AI Team' },
      { initials: '✦', src: null, label: 'AI Team' },
      { initials: '✦', src: null, label: 'AI Team' },
    ],
    desc: "Vibe-code your business plan into existence. Bring your idea to the Business Builder workspace — pitch decks, financial models, go-to-market strategies, investor briefs. Multiple AI models review and challenge the plan together. You ship the output.",
    cta: 'Build your business plan →',
  },
};

// ── Avatar ────────────────────────────────────────────────
function Avatar({ initials, src }) {
  const [failed, setFailed] = useState(false);
  const isSymbol = ['⚙', '£', '⚖', '📊', '✦'].includes(initials);
  if (src && !failed) {
    return (
      <div className={styles.avatar}>
        <img src={src} alt={initials} onError={() => setFailed(true)} />
      </div>
    );
  }
  return (
    <div className={styles.avatar} style={isSymbol ? { fontSize: 14 } : {}}>
      {initials}
    </div>
  );
}

// ── Toggled card ──────────────────────────────────────────
function ToggledCard({ icon, mode, titles, data, bgImage }) {
  const [audience, setAudience] = useState('entrepreneur');

  const cardClass = bgImage
    ? `${styles.card} ${styles.cardBg}`
    : styles.card;

  return (
    <div className={cardClass} style={bgImage ? { backgroundImage: `url(${bgImage})` } : {}}>
      <div className={styles.cardIconWrap}>{icon}</div>
      <div className={styles.cardMode}>{mode}</div>
      <div className={styles.cardTitle}>{titles[audience]}</div>

      <div className={styles.toggle}>
        <button
          className={`${styles.toggleBtn} ${audience === 'entrepreneur' ? styles.toggleBtnActive : ''}`}
          onClick={() => setAudience('entrepreneur')}
        >
          Entrepreneurs
        </button>
        <button
          className={`${styles.toggleBtn} ${audience === 'professional' ? styles.toggleBtnActive : ''}`}
          onClick={() => setAudience('professional')}
        >
          Professionals
        </button>
      </div>

      <div className={styles.toggleContent}>
        <div className={styles.avatarRow}>
          {data[audience].avatars.map((av) => (
            <Avatar key={av.label} initials={av.initials} src={av.src} />
          ))}
        </div>
        <p className={styles.cardDesc}>{data[audience].desc}</p>
      </div>

      <Link to="/register" className={styles.cardCta}>{data[audience].cta}</Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function UseCaseBusiness() {
  return (
    <div className={styles.page}>
      <SEOHead
        title="AwakeVerse for Business — Entrepreneurs and Professionals"
        description="Pitch your business to a Dragon's Den panel of historical strategists, build AI advisors for your field, and generate business plans with a team of AI models. AwakeVerse for entrepreneurs and professionals."
        url="https://awakeverse.com/use-cases/business"
      />

      {/* Nav */}
      <nav className={styles.nav}>
        <Link to="/" className={styles.navLogo}>AwakeVerse</Link>
        <div className={styles.navLinks}>
          <Link to="/use-cases/creative"   className={styles.navLink}>Creative</Link>
          <Link to="/use-cases/education"  className={styles.navLink}>Education</Link>
          <Link to="/use-cases/debate"     className={styles.navLink}>Debate</Link>
          <Link to="/pricing"              className={styles.navLink}>Pricing</Link>
          <Link to="/register"             className={styles.navCta}>Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className={styles.heroWrapper}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>Business</div>
          <h1 className={styles.heroTitle}>How does AwakeVerse help Business Minds?</h1>
          <p className={styles.heroSubtitle}>
            For entrepreneurs, freelancers, and professionals who think in systems.
          </p>
          <p className={styles.heroDesc}>
            The sharpest business decisions come from genuine stress-testing — not
            validation. AwakeVerse puts history's most formidable strategists and
            operators in the room with you, each with their own perspective and none
            of them inclined to tell you what you want to hear.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/register" className={styles.btnPrimary}>Try it free</Link>
            <Link to="/pricing"  className={styles.btnGhost}>See plans →</Link>
          </div>
        </div>

        {/* Portraits */}
        <div className={styles.heroPortraits}>
          <div className={styles.portraitRow}>
            {HERO_CHARACTERS.slice(0, 2).map((c) => (
              <div key={c.key} className={styles.portrait}>
                <img src={c.src} alt={c.name} />
                <div className={styles.portraitLabel}>{c.name}</div>
              </div>
            ))}
          </div>
          <div className={styles.portraitRow}>
            {HERO_CHARACTERS.slice(2).map((c) => (
              <div key={c.key} className={styles.portrait}>
                <img src={c.src} alt={c.name} />
                <div className={styles.portraitLabel}>{c.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Split */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>The difference</div>
        <div className={styles.split}>
          <div className={styles.panelMuted}>
            <p className={styles.panelTitle}>What standard AI gives business</p>
            {[
              'One agreeable voice — it finds merit in every idea you present',
              'Generic advice with no understanding of your specific context',
              'No genuine pushback on assumptions that could sink your plan',
              'Strategy output that sounds plausible but lacks real conviction',
              'No way to simulate a hostile investor, a sceptical partner, or a sharp competitor',
            ].map((t) => (
              <div key={t} className={`${styles.bullet} ${styles.bulletMuted}`}>
                <div className={styles.dotMuted} /><span>{t}</span>
              </div>
            ))}
          </div>
          <div className={styles.panelAccent}>
            <p className={styles.panelTitle}>What AwakeVerse gives business</p>
            {[
              'A Dragon\'s Den panel that will tear your pitch apart before investors do',
              'Create AI advisors shaped around your exact field — accountant, strategist, analyst',
              'Historical operators who built real empires and know what failure looks like',
              'Workspace tools that generate business plans, pitch decks, and financial models',
              'Story mode to think through decisions inside the mindset of the world\'s great builders',
            ].map((t) => (
              <div key={t} className={`${styles.bullet} ${styles.bulletAccent}`}>
                <div className={styles.dotAccent} /><span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className={styles.sectionLabel}>Ways to use it</div>
        <div className={styles.cards}>

          <ToggledCard
            icon={<ChatIcon />}
            mode="One-on-One Chat"
            titles={{
              entrepreneur: 'Consult Rockefeller or Cleopatra on your strategy',
              professional: 'Build your own expert character for your field',
            }}
            data={CHAT_DATA}
            bgImage="/images/categories/pathfinders.jpeg"
          />

          <ToggledCard
            icon={<ScenariosIcon />}
            mode="Dialogue"
            titles={{
              entrepreneur: "Pitch to a Dragon's Den panel of history's sharpest minds",
              professional: 'Build an advisory panel that evaluates your work',
            }}
            data={DIALOGUE_DATA}
            bgImage="/images/categories/goldhands.jpeg"
          />

          <ToggledCard
            icon={<StoriesIcon />}
            mode="Story Mode"
            titles={{
              entrepreneur: 'Explore building an empire alongside John D. Rockefeller',
              professional: 'Step inside the decisions that built Standard Oil',
            }}
            data={STORY_DATA}
            bgImage="/images/categories/creators.jpeg"

          />

          <ToggledCard
            icon={<VerseStudioIcon />}
            mode="Workspace"
            titles={{
              entrepreneur: 'Vibe-code your business plan with an AI team',
              professional: 'Generate proposals, briefs, and strategy documents',
            }}
            data={WORKSPACE_DATA}
            bgImage="/images/categories/makers.jpeg"
          />

        </div>

        {/* CTA strip */}
        <div className={styles.ctaStrip}>
          <div className={styles.ctaText}>
            <h2>Start building with AwakeVerse</h2>
            <p>Free to start — no credit card required. All four modes available immediately.</p>
          </div>
          <Link to="/register" className={styles.btnPrimary}>Get started free</Link>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link to="/use-cases/creative"  className={styles.footerLink}>Creative</Link>
          <Link to="/use-cases/education" className={styles.footerLink}>Education</Link>
          <Link to="/use-cases/debate"    className={styles.footerLink}>Debate</Link>
          <Link to="/pricing"             className={styles.footerLink}>Pricing</Link>
          <Link to="/privacy"             className={styles.footerLink}>Privacy</Link>
          <Link to="/terms"               className={styles.footerLink}>Terms</Link>
        </div>
        <p className={styles.footerCopy}>© 2025 AwakeVerse Ltd.</p>
      </footer>
    </div>
  );
}