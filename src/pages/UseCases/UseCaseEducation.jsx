// src/pages/UseCases/UseCaseEducation.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../../components/SEO/SEOHead';
import styles from './UseCaseEducation.module.css';

// ── Icons from Header.js ──────────────────────────────────
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

// ── Hero characters ───────────────────────────────────────
const HERO_CHARACTERS = [
  { key: 'socrates',   name: 'Socrates',   src: '/images/socrates.jpeg' },
  { key: 'harriet_tubman', name: 'Tubman', src: '/images/harriet_tubman.jpg' },
  { key: 'confucius',  name: 'Confucius',  src: '/images/confucius.jpg' },
  { key: 'ibn_sina',   name: 'Ibn Sina',   src: '/images/ibn_sina.jpg' },
];

// ── Card data ─────────────────────────────────────────────
const CHAT_DATA = {
  educator: {
    avatars: [
      { initials: 'SC', src: '/images/socrates.jpeg', label: 'Socrates' },
      { initials: 'DA', src: null, label: "Da Vinci's Apprentice" },
    ],
    desc: "Explore a topic from multiple angles before teaching it. Use Socrates to stress-test your lesson's assumptions, or Da Vinci's Apprentice to find connections across disciplines your curriculum might miss.",
    cta: 'Explore with a character →',
  },
  student: {
    avatars: [
      { initials: 'DA', src: null, label: "Da Vinci's Apprentice" },
      { initials: 'SC', src: '/images/socrates.jpeg', label: 'Socrates' },
    ],
    desc: "Work through an essay or problem with Da Vinci's Apprentice — trained to see connections between ideas, disciplines, and systems. Or bring Socrates your argument and let him question it until it holds.",
    cta: 'Start a study session →',
  },
};

const DIALOGUE_DATA = {
  educator: {
    avatars: [
      { initials: 'HT', src: '/images/harriet_tubman.jpg', label: 'Harriet Tubman' },
      { initials: 'FL', src: null, label: 'Frederick Douglass' },
    ],
    desc: 'Build a live classroom debate. Set the topic — civil rights, justice, leadership — and let historical figures argue the positions. Students observe real intellectual tension, not a scripted lecture.',
    cta: 'Build a classroom debate →',
  },
  student: {
    avatars: [
      { initials: 'SC', src: '/images/socrates.jpeg', label: 'Socrates' },
      { initials: 'CN', src: '/images/confucius.jpg', label: 'Confucius' },
    ],
    desc: 'Watch Socrates and Confucius debate the foundations of justice and social order. Then enter the conversation yourself — challenge either position, ask follow-up questions, and see where it leads.',
    cta: 'Join this dialogue →',
  },
};

const STORY_DATA = {
  educator: {
    avatars: [
      { initials: 'SC', src: '/images/socrates.jpeg', label: 'Socrates' },
    ],
    desc: "Build an immersive learning experience. Set the scene — Ancient Athens, 399 BC. Socrates is on trial. Students navigate the Socratic method firsthand, not as observers but as participants. Era constraints keep the world coherent.",
    cta: 'Build an immersive lesson →',
  },
  student: {
    avatars: [
      { initials: 'SC', src: '/images/socrates.jpeg', label: 'Socrates' },
    ],
    desc: "Live the history you're studying. You're a student in Ancient Athens. Socrates won't lecture you — he'll question you until you find the answer yourself. You don't read about the Socratic method. You experience it.",
    cta: 'Step into the story →',
  },
};

const WORKSPACE_DATA = {
  educator: {
    avatars: [
      { initials: '✦', src: null, label: 'AI Team' },
      { initials: '✦', src: null, label: 'AI Team' },
      { initials: '✦', src: null, label: 'AI Team' },
    ],
    desc: 'Use the Education Suite to generate lesson plans, classroom debate scenarios, IELTS study guides, and full course curricula. Define the subject, level, and objectives — your AI team produces structured output ready to use.',
    cta: 'Open Education Suite →',
  },
  student: {
    avatars: [
      { initials: '✦', src: null, label: 'AI Team' },
      { initials: '✦', src: null, label: 'AI Team' },
      { initials: '✦', src: null, label: 'AI Team' },
    ],
    desc: 'Use the Research & Citation workspace for essay support, thesis development, and literature review. Multiple AI models review your argument from different angles. Output includes structured drafts, citations, and feedback.',
    cta: 'Open Research Workspace →',
  },
};

// ── Avatar ────────────────────────────────────────────────
function Avatar({ initials, src }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <div className={styles.avatar}>
        <img src={src} alt={initials} onError={() => setFailed(true)} />
      </div>
    );
  }
  return (
    <div className={styles.avatar} style={initials === '✦' ? { fontSize: 14 } : {}}>
      {initials}
    </div>
  );
}

// ── Toggled card ──────────────────────────────────────────
function ToggledCard({ icon, mode, titles, data, bgImage }) {
  const [audience, setAudience] = useState('educator');
  const d = data[audience];

  const cardClass = bgImage
    ? `${styles.card} ${styles.cardBg}`
    : styles.card;

  const bgStyle = bgImage
    ? { backgroundImage: `url(${bgImage})` }
    : {};

  return (
    <div className={cardClass} style={bgStyle}>
      <div className={styles.cardIconWrap}>{icon}</div>
      <div className={styles.cardMode}>{mode}</div>
      <div className={styles.cardTitle}>{titles[audience]}</div>

      <div className={styles.toggle}>
        <button
          className={`${styles.toggleBtn} ${audience === 'educator' ? styles.toggleBtnActive : ''}`}
          onClick={() => setAudience('educator')}
        >
          For educators
        </button>
        <button
          className={`${styles.toggleBtn} ${audience === 'student' ? styles.toggleBtnActive : ''}`}
          onClick={() => setAudience('student')}
        >
          For students
        </button>
      </div>

      <div className={styles.toggleContent}>
        <div className={styles.avatarRow}>
          {d.avatars.map((av) => (
            <Avatar key={av.label} initials={av.initials} src={av.src} />
          ))}
        </div>
        <p className={styles.cardDesc}>{d.desc}</p>
      </div>

      <Link to="/register" className={styles.cardCta}>{d.cta}</Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function UseCaseEducation() {
  return (
    <div className={styles.page}>
      <SEOHead
        title="AwakeVerse for Education — Teachers, Tutors & Students"
        description="Run classroom debates with historical figures, build immersive lesson experiences, and let students learn through real conversation — not passive reading. AwakeVerse for educators and students."
        url="https://awakeverse.com/use-cases/education"
      />

      {/* Nav */}
      <nav className={styles.nav}>
        <Link to="/" className={styles.navLogo}>AwakeVerse</Link>
        <div className={styles.navLinks}>
          <Link to="/use-cases/creative"  className={styles.navLink}>Creative</Link>
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
          <div className={styles.heroBadge}>Education</div>
          <h1 className={styles.heroTitle}>How does AwakeVerse help Educators and Students?</h1>
          <p className={styles.heroSubtitle}>
            For teachers, tutors, learners, and anyone who thinks better through conversation.
          </p>
          <p className={styles.heroDesc}>
            Learning through genuine dialogue produces deeper understanding than passive reading.
            AwakeVerse puts historical figures, philosophers, and AI tutors in the same room as
            your students — each with their own perspective, each willing to push back.
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
            <p className={styles.panelTitle}>What standard AI gives education</p>
            {[
              'One voice answers questions — no genuine intellectual tension',
              'Students receive answers rather than developing understanding',
              'Historical figures become generic, personality-free responses',
              'No structure — sessions drift without learning objectives',
              'Feedback that encourages rather than challenges',
            ].map((t) => (
              <div key={t} className={`${styles.bullet} ${styles.bulletMuted}`}>
                <div className={styles.dotMuted} /><span>{t}</span>
              </div>
            ))}
          </div>
          <div className={styles.panelAccent}>
            <p className={styles.panelTitle}>What AwakeVerse gives education</p>
            {[
              'Characters who hold positions and defend them — real intellectual resistance',
              'Socratic dialogue that makes students find the answer, not receive it',
              'Historical figures with authentic voice, era, and perspective',
              'Story mode that puts students inside the history they are studying',
              'Workspace tools that generate lesson plans, debate scenarios, and curricula',
            ].map((t) => (
              <div key={t} className={`${styles.bullet} ${styles.bulletAccent}`}>
                <div className={styles.dotAccent} /><span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cards — thinkers.jpeg top-left, truthweavers.jpeg bottom-right */}
        <div className={styles.sectionLabel}>Ways to use it</div>
        <div className={styles.cards}>

          <ToggledCard
            icon={<ChatIcon />}
            mode="One-on-One Chat"
            titles={{
              educator: 'Explore ideas with Socrates or Da Vinci\'s Apprentice',
              student: 'Work through your essay or problem with Da Vinci\'s Apprentice',
            }}
            data={CHAT_DATA}
            bgImage="/images/categories/thinkers.jpeg"
          />

          <ToggledCard
            icon={<ScenariosIcon />}
            mode="Dialogue"
            titles={{
              educator: 'Run a live debate between historical figures for your class',
              student: 'Watch Socrates and Confucius debate — then join in',
            }}
            data={DIALOGUE_DATA}
            bgImage={null}
          />

          <ToggledCard
            icon={<StoriesIcon />}
            mode="Story Mode"
            titles={{
              educator: 'Build an immersive historical lesson your students step into',
              student: 'Live the history you\'re studying — not as a reader but as a participant',
            }}
            data={STORY_DATA}
            bgImage={null}
          />

          <ToggledCard
            icon={<VerseStudioIcon />}
            mode="Workspace"
            titles={{
              educator: 'Generate lesson plans, debate scenarios, and curricula',
              student: 'Build your essay, thesis, or research paper with an AI team',
            }}
            data={WORKSPACE_DATA}
            bgImage="/images/categories/truthweavers.jpeg"
          />

        </div>

        {/* CTA strip */}
        <div className={styles.ctaStrip}>
          <div className={styles.ctaText}>
            <h2>Start learning with AwakeVerse</h2>
            <p>Free to start — no credit card required. All four modes available immediately.</p>
          </div>
          <Link to="/register" className={styles.btnPrimary}>Get started free</Link>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link to="/use-cases/creative" className={styles.footerLink}>Creative</Link>
          <Link to="/use-cases/business" className={styles.footerLink}>Business</Link>
          <Link to="/use-cases/debate"   className={styles.footerLink}>Debate</Link>
          <Link to="/pricing"            className={styles.footerLink}>Pricing</Link>
          <Link to="/privacy"            className={styles.footerLink}>Privacy</Link>
          <Link to="/terms"              className={styles.footerLink}>Terms</Link>
        </div>
        <p className={styles.footerCopy}>© 2025 AwakeVerse Ltd.</p>
      </footer>
    </div>
  );
}