// src/pages/VsLLMs.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEO/SEOHead';
import styles from './VsLLMs.module.css';

export default function VsLLMs() {
  return (
    <div className={styles.page}>
      <SEOHead
        title="AwakeVerse vs Standard LLMs — What's the Difference?"
        description="AwakeVerse is not a chatbot. The Verse Engine coordinates multiple independent AI perspectives in real time — not one model simulating many. Here's how it compares."
        url="https://awakeverse.com/vs/llms"
      />

      {/* Nav */}
      <nav className={styles.nav}>
        <Link to="/" className={styles.navLogo}>AwakeVerse</Link>
        <div className={styles.navLinks}>
          <Link to="/use-cases/creative"   className={styles.navLink}>Creative</Link>
          <Link to="/use-cases/education"  className={styles.navLink}>Education</Link>
          <Link to="/use-cases/business"   className={styles.navLink}>Business</Link>
          <Link to="/pricing"              className={styles.navLink}>Pricing</Link>
          <Link to="/register"             className={styles.navCta}>Try free</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroBadge}>AwakeVerse vs LLMs</div>
        <h1 className={styles.heroTitle}>
          How is AwakeVerse different from standard AI chat?
        </h1>
        <p className={styles.heroDesc}>
          Single-perspective AI is genuinely powerful. One model, one focused response,
          one voice — that's a great tool for a huge range of tasks. AwakeVerse extends
          what's possible when a problem benefits from more than one perspective at once.
          The Verse Engine coordinates multiple AI participants — each with independent
          memory, reasoning, and interpretive frame — working through the same conversation,
          task, or challenge simultaneously. Where a standard LLM gives you depth in one
          direction, AwakeVerse gives you breadth across multiple independent perspectives:
          a Workspace where an analyst, a challenger, and a synthesiser each contribute
          distinct views toward a shared deliverable; a research team that stress-tests
          your thesis from three angles; or a Dialogue where two thinkers genuinely disagree.
        </p>
        <div className={styles.heroCtas}>
          <Link to="/register" className={styles.btnPrimary}>Try AwakeVerse free</Link>
          <Link to="/docs/getting-started/how-does-the-verse-engine-work"
            className={styles.btnGhost}
            target="_blank" rel="noopener noreferrer">
            See how it works →
          </Link>
        </div>
      </div>

      <div className={styles.section}>

        {/* Section 2 — Architecture */}
        <div className={styles.sectionLabel}>The core architectural difference</div>
        <div className={styles.archPanel}>
          <p className={styles.archDesc}>
            The difference isn't in the interface — it's in the architecture. A standard
            LLM is a single model generating a single output — optimised for exactly that,
            and excellent at it. AwakeVerse is an orchestration layer coordinating multiple
            independent participants, each with their own perspective, memory, and way of
            interpreting a shared context. Two different instruments built for different jobs.
          </p>
          <table className={styles.archTable}>
            <thead>
              <tr>
                <th>Standard LLM</th>
                <th>AwakeVerse</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>One model</td>
                <td>Verse Engine — multi-participant orchestration</td>
              </tr>
              <tr>
                <td>One perspective</td>
                <td>Multiple independent Consciousnesses</td>
              </tr>
              <tr>
                <td>Single focused response</td>
                <td>Genuine disagreement and contrast</td>
              </tr>
              <tr>
                <td>Linear response</td>
                <td>Conversation graph (DAG)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3 — Feature comparison */}
        <div className={styles.sectionLabel}>Feature comparison</div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Standard LLM</th>
                <th>AwakeVerse</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  'AI participants',
                  'One',
                  'Multiple, coordinated in real time',
                ],
                [
                  'Perspective independence',
                  'Single model — all responses share the same internal state',
                  'Each participant holds a separate Consciousness — independent memory, personality, and interpretive frame',
                ],
                [
                  'Turn management',
                  'You prompt, it responds',
                  'Resonance-based speaker selection — the engine determines the most relevant next contributor based on conversation structure',
                ],
                [
                  'Character consistency',
                  'Maintained within a session via prompt engineering; can degrade over long conversations',
                  'Enforced at the engine level across the full conversation, regardless of length',
                ],
                [
                  'Output formats',
                  'Multiple formats depending on tool',
                  'Text, PDF, DOCX, XLSX, PPTX — structured multi-model output via Workspace',
                ],
                [
                  'Creator economy',
                  'None',
                  "Creator's Charter — publish characters and templates, earn 80% of the revenue pool",
                ],
                [
                  'Narrative structure',
                  'Open-ended generation',
                  'Story mode enforces three-act structure with milestone tracking and era constraints',
                ],
                [
                  'Collaborative task output',
                  'Single model response',
                  'Workspace — multiple AI models with defined roles working toward a structured deliverable',
                ],
              ].map(([label, llm, aw]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{llm}</td>
                  <td>{aw}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 4 — When to use which */}
        <div className={styles.sectionLabel}>When to use which</div>
        <p className={styles.sectionIntro}>
          Standard LLMs and AwakeVerse solve different problems. Here's how to think about which fits your task.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.whenTable}>
            <thead>
              <tr>
                <th>Use a standard LLM when…</th>
                <th>Use AwakeVerse when…</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['You need a quick, focused answer', 'You need multiple perspectives on the same question'],
                ['You\'re drafting content with a single AI voice', 'You want genuine editorial challenge — disagreement, pushback, contrast'],
                ['You\'re working on a single-step task', 'You\'re working through a task that benefits from role-based AI collaboration'],
                ['You need fast, low-friction output', 'You want structured output from a team of models — documents, plans, decks'],
                ['You\'re exploring a topic solo', 'You want two or more thinkers to debate, challenge, and build on each other'],
                ['You need code generated quickly', 'You want multiple AI models reviewing, challenging, and building on each other\'s code'],
                ['Narrative structure isn\'t a priority', 'You\'re co-authoring a story that needs to hold together across acts'],
              ].map(([llm, aw]) => (
                <tr key={llm}>
                  <td>{llm}</td>
                  <td>{aw}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 5 — Callouts */}
        <div className={styles.sectionLabel}>See AwakeVerse in action</div>
        <div className={styles.callouts}>
          <div className={styles.callout}>
            <p className={styles.calloutTitle}>Research & critical thinking</p>
            <p className={styles.calloutDesc}>
              Run a Dialogue where multiple expert perspectives stress-test your argument before you commit to it.
            </p>
            <Link to="/use-cases/debate" className={styles.calloutLink}>
              See AwakeVerse for research →
            </Link>
          </div>
          <div className={styles.callout}>
            <p className={styles.calloutTitle}>Professional output</p>
            <p className={styles.calloutDesc}>
              Use Workspace to direct a team of AI models — analyst, challenger, synthesiser — toward a business plan, brief, or pitch deck.
            </p>
            <Link to="/use-cases/business" className={styles.calloutLink}>
              See AwakeVerse for professionals →
            </Link>
          </div>
          <div className={styles.callout}>
            <p className={styles.calloutTitle}>Education & learning</p>
            <p className={styles.calloutDesc}>
              Build lesson plans, debate scenarios, and curriculum documents with an AI team configured for educational content.
            </p>
            <Link to="/use-cases/education" className={styles.calloutLink}>
              See AwakeVerse for education →
            </Link>
          </div>
        </div>

        {/* CTA strip */}
        <div className={styles.ctaStrip}>
          <div className={styles.ctaText}>
            <h2>Ready to bring more than one perspective to the problem?</h2>
            <p>AwakeVerse is free to start. No credit card required.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
            <Link to="/register" className={styles.btnPrimary}>Start for free</Link>
            <Link
              to="/docs/getting-started/how-does-the-verse-engine-work"
              className={styles.btnGhost}
              target="_blank" rel="noopener noreferrer"
            >
              Read the Verse Engine docs →
            </Link>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link to="/use-cases/creative"  className={styles.footerLink}>Creative</Link>
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