// src/pages/UseCases/UseCasesIndex.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../../components/SEO/SEOHead';
import styles from './UseCasesIndex.module.css';

const VERTICALS = [
  {
    label: 'Creative',
    title: 'Writers, storytellers & bloggers',
    desc: 'Co-author stories with characters that stay in character, get your work critiqued by literary giants, and generate content with an AI creative team.',
    modes: ['Story Mode', 'Dialogue', 'One-on-One', 'Workspace'],
    img: '/images/categories/performers.jpeg',
    href: '/use-cases/creative',
    cta: 'See Creative use cases →',
  },
  {
    label: 'Education',
    title: 'Educators & students',
    desc: 'Run classroom debates with historical figures, build immersive lesson experiences, and let students learn through genuine Socratic dialogue.',
    modes: ['Dialogue', 'Story Mode', 'One-on-One', 'Workspace'],
    img: '/images/categories/thinkers.jpeg',
    href: '/use-cases/education',
    cta: 'See Education use cases →',
  },
  {
    label: 'Business',
    title: 'Entrepreneurs & professionals',
    desc: "Pitch to a Dragon's Den panel of history's sharpest strategists, build specialist AI advisors for your field, and generate business plans with an AI team.",
    modes: ['Dialogue', 'Workspace', 'One-on-One', 'Story Mode'],
    img: '/images/categories/pathfinders.jpeg',
    href: '/use-cases/business',
    cta: 'See Business use cases →',
  },
  {
    label: 'Debate',
    title: 'Critical thinkers & debaters',
    desc: 'Run genuine multi-perspective debates, stress-test arguments with independent AI voices, and export scripts, audio, and video from every session.',
    modes: ['Dialogue', 'Workspace'],
    img: '/images/categories/goldhands.jpeg',
    href: '/use-cases/debate',
    cta: 'See Debate use cases →',
  },
];

export default function UseCasesIndex() {
  return (
    <div className={styles.page}>
      <SEOHead
        title="AwakeVerse Use Cases — Creative, Education, Business & Debate"
        description="AwakeVerse works across creative writing, education, business strategy, and debate. See how the Verse Engine's multi-perspective AI applies to your field."
        url="https://awakeverse.com/use-cases"
      />

      {/* Nav */}
      <nav className={styles.nav}>
        <Link to="/" className={styles.navLogo}>AwakeVerse</Link>
        <div className={styles.navLinks}>
          <Link to="/pricing"  className={styles.navLink}>Pricing</Link>
          <Link to="/vs/llms"  className={styles.navLink}>vs LLMs</Link>
          <Link to="/creators-charter" className={styles.navLink}>Creators</Link>
          <Link to="/register" className={styles.navCta}>Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroBadge}>Use Cases</div>
        <h1 className={styles.heroTitle}>
          How does AwakeVerse help across different fields?
        </h1>
        <p className={styles.heroDesc}>
          The Verse Engine's multi-perspective orchestration applies wherever
          genuine independent thinking produces better outcomes than a single
          AI voice. Writers, educators, entrepreneurs, researchers, and
          critical thinkers — each finds a different entry point.
        </p>
        <div className={styles.heroCtas}>
          <Link to="/register" className={styles.btnPrimary}>Try it free</Link>
          <Link to="/vs/llms"  className={styles.btnGhost}>How it compares →</Link>
        </div>
      </div>

      <div className={styles.section}>

        {/* Vertical cards */}
        <div className={styles.sectionLabel}>Choose your field</div>
        <div className={styles.grid}>
          {VERTICALS.map((v) => (
            <Link key={v.label} to={v.href} className={styles.card}>
              <div
                className={styles.cardImg}
                style={{ backgroundImage: `url(${v.img})` }}
              >
                <span className={styles.cardImgLabel}>{v.label}</span>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.cardTitle}>{v.title}</p>
                <p className={styles.cardDesc}>{v.desc}</p>
                <div className={styles.cardModes}>
                  {v.modes.map((m) => (
                    <span key={m} className={styles.modePill}>{m}</span>
                  ))}
                </div>
                <span className={styles.cardCta}>{v.cta}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Comparison callout */}
        <div className={styles.comparePanel}>
          <div className={styles.compareText}>
            <h3>Not sure how AwakeVerse compares to standard AI chat?</h3>
            <p>
              The Verse Engine is architecturally different from a single LLM.
              See exactly how — and when each is the right tool.
            </p>
          </div>
          <Link to="/vs/llms" className={styles.btnGhost}>
            AwakeVerse vs LLMs →
          </Link>
        </div>

        {/* CTA strip */}
        <div className={styles.ctaStrip}>
          <div className={styles.ctaText}>
            <h2>Start with the mode that fits your work</h2>
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
          <Link to="/use-cases/business"  className={styles.footerLink}>Business</Link>
          <Link to="/use-cases/debate"    className={styles.footerLink}>Debate</Link>
          <Link to="/vs/llms"             className={styles.footerLink}>vs LLMs</Link>
          <Link to="/pricing"             className={styles.footerLink}>Pricing</Link>
          <Link to="/privacy"             className={styles.footerLink}>Privacy</Link>
          <Link to="/terms"               className={styles.footerLink}>Terms</Link>
        </div>
        <p className={styles.footerCopy}>© 2025 AwakeVerse Ltd.</p>
      </footer>
    </div>
  );
}