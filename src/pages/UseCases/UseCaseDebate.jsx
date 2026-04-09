// src/pages/UseCases/UseCaseDebate.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../../components/SEO/SEOHead';
import styles from './UseCaseDebate.module.css';

// ── Icons ─────────────────────────────────────────────────
const ScenariosIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 4c-4 0-7 2-7 6v2c0 4 3 6 7 6s7-2 7-6v-2c0-4-3-6-7-6z"
      stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M9 12c0-1 .8-1.5 1.5-1.5S12 11 12 12M15 12c0-1-.8-1.5-1.5-1.5S12 11 12 12"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const VerseStudioIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
  { key: 'socrates',      name: 'Socrates',    src: '/images/socrates.jpeg' },
  { key: 'harriet_tubman', name: 'Tubman',     src: '/images/harriet_tubman.jpg' },
  { key: 'diogenes',      name: 'Diogenes',    src: '/images/diogenes.jpg' },
  { key: 'queen_amina',   name: 'Queen Amina', src: '/images/queen_amina.jpg' },
];

// ── Avatar ────────────────────────────────────────────────
function Avatar({ initials, src, size = 28 }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size, minWidth: size };
  if (src && !failed) {
    return (
      <div className={styles.avatar} style={style}>
        <img src={src} alt={initials} onError={() => setFailed(true)} />
      </div>
    );
  }
  return <div className={styles.avatar} style={{ ...style, fontSize: size * 0.38 }}>{initials}</div>;
}

// ── Page ──────────────────────────────────────────────────
export default function UseCaseDebate() {
  return (
    <div className={styles.page}>
      <SEOHead
        title="AwakeVerse for Debate — Multi-Character AI Dialogue & Workspace"
        description="Run genuine multi-character debates with independent AI perspectives, generate debate content with collaborative AI teams, and export scripts, audio, and video from every session."
        url="https://awakeverse.com/use-cases/debate"
      />

      {/* Nav */}
      <nav className={styles.nav}>
        <Link to="/" className={styles.navLogo}>AwakeVerse</Link>
        <div className={styles.navLinks}>
          <Link to="/use-cases/creative"   className={styles.navLink}>Creative</Link>
          <Link to="/use-cases/education"  className={styles.navLink}>Education</Link>
          <Link to="/use-cases/business"   className={styles.navLink}>Business</Link>
          <Link to="/pricing"              className={styles.navLink}>Pricing</Link>
          <Link to="/register"             className={styles.navCta}>Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className={styles.heroWrapper}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>Debate</div>
          <h1 className={styles.heroTitle}>
            What makes AwakeVerse different for debate and multi-perspective thinking?
          </h1>
          <p className={styles.heroSubtitle}>
            For debaters, critical thinkers, students, and educators.
          </p>
          <p className={styles.heroDesc}>
            Most AI tools give you one perspective. AwakeVerse gives you
            genuinely independent ones — characters that disagree with each
            other, not just with you, and a workspace that stress-tests ideas
            from multiple angles simultaneously.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/register" className={styles.btnPrimary}>Try it free</Link>
            <Link to="/pricing"  className={styles.btnGhost}>See plans →</Link>
          </div>
        </div>

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

      <div className={styles.section}>

        {/* ── Dialogue deep dive ──────────────────────────── */}
        <div className={styles.sectionLabel}>Dialogue — multi-character conversations</div>
        <div
          className={`${styles.deepDive} ${styles.deepDiveBg}`}
          style={{ backgroundImage: 'url(/images/categories/thinkers.jpeg)' }}
        >
          <div className={styles.deepDiveHeader}>
            <div className={styles.deepDiveIcon}><ScenariosIcon /></div>
            <div>
              <p className={styles.deepDiveTitle}>Dialogue</p>
              <p className={styles.deepDiveDesc}>
                2–4 AI characters with genuinely independent perspectives engaging with each other and with you in real time.
              </p>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th></th>
                  <th>Standard AI chat</th>
                  <th>AwakeVerse Dialogue</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Perspectives</td>
                  <td>One model, one voice</td>
                  <td>2–4 independent characters, each with their own worldview</td>
                </tr>
                <tr>
                  <td>Disagreement</td>
                  <td>Simulated — one model switching tone</td>
                  <td>Structural — separate Consciousnesses, genuine conflict</td>
                </tr>
                <tr>
                  <td>Turn management</td>
                  <td>User prompts each response</td>
                  <td>Resonance-based auto selection or full manual control</td>
                </tr>
                <tr>
                  <td>Character consistency</td>
                  <td>Drifts over long conversations</td>
                  <td>Maintained from first message to last</td>
                </tr>
                <tr>
                  <td>User participation</td>
                  <td>One-on-one only</td>
                  <td>Observe, moderate, or join as a participant</td>
                </tr>
                <tr>
                  <td>Templates</td>
                  <td><span className={styles.checkNo}>—</span></td>
                  <td>Pre-built debate structures across philosophy, ethics, business, history</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* By-products */}
          <div className={styles.tableWrap} style={{ paddingTop: 0 }}>
            <p className={styles.sectionLabel}>What you can generate from a completed Dialogue</p>
          </div>
          <div className={styles.byProducts}>
            <div className={styles.byProduct}>
              <p className={styles.byProductTitle}>Formatted script</p>
              <p className={styles.byProductDesc}>Every Dialogue exports as a clean, formatted script with speaker labels and full turn history.</p>
            </div>
            <div className={styles.byProduct}>
              <p className={styles.byProductTitle}>Audio with character voices</p>
              <p className={styles.byProductDesc}>Generate audio from your Dialogue with distinct voices per character — ready for podcasts, lessons, or playback.</p>
            </div>
            <div className={styles.byProduct}>
              <p className={styles.byProductTitle}>Video with storyboards</p>
              <p className={styles.byProductDesc}>Generate a video from your Dialogue — AI-generated scene images, character voiceover, and composed output.</p>
            </div>
          </div>
        </div>

        {/* ── Workspace deep dive ─────────────────────────── */}
        <div className={styles.sectionLabel} style={{ marginTop: 40 }}>Workspace — collaborative AI output</div>
        <div
          className={`${styles.deepDive} ${styles.deepDiveBg}`}
          style={{ backgroundImage: 'url(/images/categories/makers.jpeg)' }}
        >
          <div className={styles.deepDiveHeader}>
            <div className={styles.deepDiveIcon}><VerseStudioIcon /></div>
            <div>
              <p className={styles.deepDiveTitle}>Workspace</p>
              <p className={styles.deepDiveDesc}>
                Multiple AI models collaborating on a task — reviewing, challenging, and building on each other's contributions toward structured output.
              </p>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th></th>
                  <th>Single AI model</th>
                  <th>AwakeVerse Workspace</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Models involved</td>
                  <td>One</td>
                  <td>Multiple — each with a defined task role</td>
                </tr>
                <tr>
                  <td>Output quality</td>
                  <td>One perspective on the task</td>
                  <td>Reviewed and challenged by multiple models before output</td>
                </tr>
                <tr>
                  <td>Process</td>
                  <td>Single prompt → single response</td>
                  <td>Discussion phase → refinement → generate phase</td>
                </tr>
                <tr>
                  <td>Output formats</td>
                  <td>Multiple</td>
                  <td>PDF, DOCX, XLSX, PPTX, Markdown — depending on template</td>
                </tr>
                <tr>
                  <td>Templates</td>
                  <td><span className={styles.checkNo}>—</span></td>
                  <td>Research & Citation, Education Suite, Business Builder, Creator Studio, Coding Team, Professional Training</td>
                </tr>
                <tr>
                  <td>Debate use cases</td>
                  <td>Can generate a single argument</td>
                  <td>Generates debate briefs, research papers, structured arguments, counter-arguments, and full position documents</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Mode comparison ─────────────────────────────── */}
        <div className={styles.sectionLabel} style={{ marginTop: 40 }}>Dialogue vs Workspace — which to use</div>
        <div className={styles.modeCompare}>
          <div className={styles.modePanel}>
            <p className={styles.modePanelTitle}>Dialogue</p>
            <p className={styles.modePanelSub}>Characters with independent perspectives</p>
            {[
              'You want to watch genuine disagreement unfold',
              'You want multiple worldviews on the same question',
              'You want to participate in a multi-character exchange',
              'The output is the conversation itself',
              'You want to export a script, audio, or video',
            ].map((t) => (
              <div key={t} className={styles.modeItem}>
                <div className={styles.modeDot} /><span>{t}</span>
              </div>
            ))}
          </div>

          <div className={styles.vsLabel}>vs</div>

          <div className={styles.modePanel}>
            <p className={styles.modePanelTitle}>Workspace</p>
            <p className={styles.modePanelSub}>LLMs collaborating on a task</p>
            {[
              'You want a structured document or deliverable',
              'You want multiple models to review and stress-test an argument',
              'You need a debate brief, research paper, or position document',
              'The conversation is a means to a deliverable, not the end',
              'You want PDF, DOCX, XLSX, or PPTX output',
            ].map((t) => (
              <div key={t} className={styles.modeItem}>
                <div className={styles.modeDot} /><span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Example scenarios ───────────────────────────── */}
        <div className={styles.sectionLabel}>Example debates</div>
        <div className={styles.scenarios}>

          <div className={styles.scenarioCard}>
            <div className={styles.scenarioMode}>Dialogue</div>
            <div className={styles.scenarioTitle}>Socrates and Diogenes debate the value of society</div>
            <div className={styles.avatarRow}>
              <Avatar initials="SC" src="/images/socrates.jpeg" />
              <Avatar initials="DG" src="/images/diogenes.jpg" />
            </div>
            <p className={styles.scenarioDesc}>
              One questions everything through structured dialogue. The other rejects the premise entirely. Neither will concede easily.
            </p>
            <Link to="/register" className={styles.scenarioCta}>Launch this debate →</Link>
          </div>

          <div className={styles.scenarioCard}>
            <div className={styles.scenarioMode}>Dialogue</div>
            <div className={styles.scenarioTitle}>Harriet Tubman and Queen Amina on freedom and power</div>
            <div className={styles.avatarRow}>
              <Avatar initials="HT" src="/images/harriet_tubman.jpg" />
              <Avatar initials="QA" src="/images/queen_amina.jpg" />
            </div>
            <p className={styles.scenarioDesc}>
              Two leaders who built freedom through completely different means — one through resistance, one through conquest. Their definitions of power clash.
            </p>
            <Link to="/register" className={styles.scenarioCta}>Launch this debate →</Link>
          </div>

          <div className={styles.scenarioCard}>
            <div className={styles.scenarioMode}>Workspace</div>
            <div className={styles.scenarioTitle}>Generate a structured debate brief on any topic</div>
            <div className={styles.avatarRow}>
              <Avatar initials="✦" src={null} />
              <Avatar initials="✦" src={null} />
              <Avatar initials="✦" src={null} />
            </div>
            <p className={styles.scenarioDesc}>
              Define your topic and position. Your AI team produces a full debate brief — arguments, counter-arguments, evidence structure, and rebuttal points.
            </p>
            <Link to="/register" className={styles.scenarioCta}>Open Workspace →</Link>
          </div>

        </div>

        {/* CTA strip */}
        <div className={styles.ctaStrip}>
          <div className={styles.ctaText}>
            <h2>Start debating with AwakeVerse</h2>
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
          <Link to="/pricing"             className={styles.footerLink}>Pricing</Link>
          <Link to="/privacy"             className={styles.footerLink}>Privacy</Link>
          <Link to="/terms"               className={styles.footerLink}>Terms</Link>
        </div>
        <p className={styles.footerCopy}>© 2025 AwakeVerse Ltd.</p>
      </footer>
    </div>
  );
}