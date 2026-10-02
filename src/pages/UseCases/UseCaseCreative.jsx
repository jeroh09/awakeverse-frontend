// src/pages/UseCases/UseCaseCreative.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../../components/SEO/SEOHead';
import styles from './UseCaseCreative.module.css';

// ── Sidebar icons (copied from Header.js — no import needed) ──
const StoriesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M7 5h8.5A2.5 2.5 0 0 1 18 7.5V18l-3.5-2L11 18l-4-2.5V7.5A2.5 2.5 0 0 1 9.5 5H11"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

const ScenariosIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 4c-4 0-7 2-7 6v2c0 4 3 6 7 6s7-2 7-6v-2c0-4-3-6-7-6z"
      stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
    />
    <path
      d="M9 12c0-1 .8-1.5 1.5-1.5S12 11 12 12M15 12c0-1-.8-1.5-1.5-1.5S12 11 12 12"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    />
  </svg>
);

const ChatIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M5 6.5C5 5.12 6.12 4 7.5 4h9c1.38 0 2.5 1.12 2.5 2.5v6c0 1.38-1.12 2.5-2.5 2.5H10l-3.5 3v-3H7.5C6.12 15 5 13.88 5 12.5v-6z"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
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

// ── Hero portrait data ────────────────────────────────────────
const HERO_CHARACTERS = [
  { key: 'shakespeare',    name: 'Shakespeare',  src: '/images/shakespeare.jpg' },
  { key: 'edgar_allan_poe', name: 'Poe',         src: '/images/edgar_allan_poe.jpg' },
  { key: 'mark_twain',     name: 'Twain',         src: '/images/mark_twain.jpg' },
  { key: 'sherlock',       name: 'Holmes',        src: '/images/sherlock.jpeg' },
];

// ── Dialogue toggle data ──────────────────────────────────────
const DIALOGUE_PLATFORM = {
  avatars: [
    { initials: 'WS', src: '/images/shakespeare.jpg',    label: 'Shakespeare' },
    { initials: 'EP', src: '/images/edgar_allan_poe.jpg', label: 'Poe' },
    { initials: 'MT', src: '/images/mark_twain.jpg',     label: 'Twain' },
  ],
  desc: 'Three literary giants — classical structure, gothic darkness, and frontier wit — debate what makes a story worth telling. Watch them disagree.',
  cta: 'Launch this Dialogue →',
};

const DIALOGUE_CUSTOM = {
  avatars: [
    { initials: 'CW', src: null, label: 'Creative Wizard' },
    { initials: 'SD', src: null, label: 'Structural Dwarf' },
    { initials: 'NM', src: null, label: 'Narrative Monk' },
  ],
  desc: 'Build your own creative panel — characters shaped around your process and ideas. They debate your work, not someone else\'s.',
  cta: 'Build your panel →',
};

// ── Avatar component ──────────────────────────────────────────
function Avatar({ initials, src }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <div className={styles.avatar}>
        <img src={src} alt={initials} onError={() => setFailed(true)} />
      </div>
    );
  }
  return <div className={styles.avatar}>{initials}</div>;
}

// ── Dialogue card ─────────────────────────────────────────────
function DialogueCard() {
  const [usePlatform, setUsePlatform] = useState(true);
  const data = usePlatform ? DIALOGUE_PLATFORM : DIALOGUE_CUSTOM;

  return (
    <div className={styles.card}>
      <div className={styles.cardIconWrap}><ScenariosIcon /></div>
      <div className={styles.cardMode}>Dialogue</div>
      <div className={styles.cardTitle}>
        {usePlatform
          ? 'Shakespeare, Poe & Twain debate narrative structure'
          : 'Your own creative panel debates your ideas'}
      </div>

      <div className={styles.toggle}>
        <button
          className={`${styles.toggleBtn} ${usePlatform ? styles.toggleBtnActive : ''}`}
          onClick={() => setUsePlatform(true)}
        >
          Platform characters
        </button>
        <button
          className={`${styles.toggleBtn} ${!usePlatform ? styles.toggleBtnActive : ''}`}
          onClick={() => setUsePlatform(false)}
        >
          Bring your own
        </button>
      </div>

      <div className={styles.toggleContent}>
        <div className={styles.avatarRow}>
          {data.avatars.map((av) => (
            <Avatar key={av.label} initials={av.initials} src={av.src} />
          ))}
        </div>
        <p className={styles.cardDesc}>{data.desc}</p>
      </div>

      <Link to="/register" className={styles.cardCta}>{data.cta}</Link>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function UseCaseCreative() {
  return (
    <div className={styles.page}>
      <SEOHead
        title="AwakeVerse for Creatives — Writers, Storytellers & Bloggers"
        description="Co-author stories with AI characters, get your work critiqued by literary giants, and generate creative content with a team of AI models. For writers, storytellers, bloggers, and dreamers."
        url="https://awakeverse.com/use-cases/creative"
      />

      {/* Nav */}
      <nav className={styles.nav}>
        <Link to="/" className={styles.navLogo}>AwakeVerse</Link>
        <div className={styles.navLinks}>
          <Link to="/use-cases/education" className={styles.navLink}>Education</Link>
          <Link to="/use-cases/business"  className={styles.navLink}>Business</Link>
          <Link to="/use-cases/debate"    className={styles.navLink}>Debate</Link>
          <Link to="/pricing"             className={styles.navLink}>Pricing</Link>
          <Link to="/register"            className={styles.navCta}>Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className={styles.heroWrapper}>
        <div className={styles.heroGlow} />

        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>Creative</div>
          <h1 className={styles.heroTitle}>How does AwakeVerse help Creatives?</h1>
          <p className={styles.heroSubtitle}>
            For writers, storytellers, bloggers, and anyone with a story to tell.
          </p>
          <p className={styles.heroDesc}>
            Most AI tools give you one voice and one perspective. AwakeVerse gives you
            characters that stay in character, stories with real structure, and a creative
            panel that will actually push back on your ideas — not just validate them.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/register" className={styles.btnPrimary}>Try it free</Link>
            <Link to="/app"      className={styles.btnGhost}>See an example →</Link>
          </div>
        </div>

        {/* Character portraits */}
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
            <p className={styles.panelTitle}>What standard AI chat gives you</p>
            {[
              'One voice, one perspective — feedback that always agrees with you',
              'Characters that drift out of voice as the conversation continues',
              'Open-ended generation with no narrative structure or destination',
              'No sense of era — a Victorian story can reference modern concepts',
              'Content that sounds like AI, not like the character you asked for',
            ].map((t) => (
              <div key={t} className={`${styles.bullet} ${styles.bulletMuted}`}>
                <div className={styles.dotMuted} /><span>{t}</span>
              </div>
            ))}
          </div>
          <div className={styles.panelAccent}>
            <p className={styles.panelTitle}>What AwakeVerse gives you</p>
            {[
              'Multiple characters with genuinely distinct perspectives on your work',
              'Story mode with three-act structure, milestones, and narrative momentum',
              'Era constraints — your Victorian mystery stays Victorian throughout',
              'Characters that hold their voice and personality from first message to last',
              'Workspace mode to generate full content — stories, blogs, scripts, campaigns',
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

          {/* Story */}
          <div className={styles.card}>
            <div className={styles.cardIconWrap}><StoriesIcon /></div>
            <div className={styles.cardMode}>Story Mode</div>
            <div className={styles.cardTitle}>
              Co-author a Victorian mystery with Sherlock Holmes
            </div>
            <div className={styles.avatarRow}>
              <Avatar initials="SH" src="/images/sherlock.jpeg" />
            </div>
            <p className={styles.cardDesc}>
              Set the scene, define the crime, and let Sherlock drive the investigation —
              in character, in era, from the first scene to the resolution. Era constraints
              keep 1880s London coherent throughout. Your choices shape the plot. The
              narrative has structure and momentum.
            </p>
            <Link to="/register" className={styles.cardCta}>Start this story →</Link>
          </div>

          {/* Dialogue toggle */}
          <DialogueCard />

          {/* Critique */}
          <div className={styles.card}>
            <div className={styles.cardIconWrap}><ChatIcon /></div>
            <div className={styles.cardMode}>One-on-One Chat</div>
            <div className={styles.cardTitle}>
              Get your protagonist or ideas critiqued by Edgar Allan Poe
            </div>
            <div className={styles.avatarRow}>
              <Avatar initials="EP" src="/images/edgar_allan_poe.jpg" />
            </div>
            <p className={styles.cardDesc}>
              Poe understood darkness, tension, and the weight of a single word. Bring
              him your protagonist, your opening chapter, or your concept — and get
              feedback from a perspective that will not soften the blow. He holds his
              opinions and he will tell you exactly what is wrong.
            </p>
            <Link to="/register" className={styles.cardCta}>Get your work critiqued →</Link>
          </div>

          {/* Workspace */}
          <div className={styles.card}>
            <div className={styles.cardIconWrap}><VerseStudioIcon /></div>
            <div className={styles.cardMode}>Workspace</div>
            <div className={styles.cardTitle}>
              Generate stories, blogs, social content, and campaigns with an AI team
            </div>
            <div className={styles.avatarRow}>
              <div className={styles.avatar} style={{ fontSize: 14 }}>✦</div>
              <div className={styles.avatar} style={{ fontSize: 14 }}>✦</div>
              <div className={styles.avatar} style={{ fontSize: 14 }}>✦</div>
            </div>
            <p className={styles.cardDesc}>
              Choose the Creator Studio template. Define your brief — a short story, a
              blog series, a social media campaign, or a full content strategy. Your AI
              team reviews, challenges, and refines it together. You get structured
              output: scripts, posts, articles, campaign documents.
            </p>
            <Link to="/register" className={styles.cardCta}>Open Creator Studio →</Link>
          </div>

        </div>

        {/* CTA strip */}
        <div className={styles.ctaStrip}>
          <div className={styles.ctaText}>
            <h2>Start creating with AwakeVerse</h2>
            <p>Free to start. All four modes available immediately.</p>
          </div>
          <Link to="/register" className={styles.btnPrimary}>Get started free</Link>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link to="/use-cases/education" className={styles.footerLink}>Education</Link>
          <Link to="/use-cases/business"  className={styles.footerLink}>Business</Link>
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