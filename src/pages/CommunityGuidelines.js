// src/pages/CommunityGuidelines.js
import React from 'react';

export default function CommunityGuidelines() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="legal-document">
      {/* Custom styles for legal document */}
      <style jsx>{`
        .legal-document {
          --ink: #0c1222;
          --muted: #4b587c;
          --link: #1b73e8;
          --bg: #ffffff;
          --card: #f6f8fc;
          background: var(--bg);
          color: var(--ink);
          font: 16px/1.6 system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial;
          margin: 0;
          padding: 0;
        }
        
        .document-header,
        .document-main {
          max-width: 900px;
          margin: auto;
          padding: 24px;
        }
        
        .document-header h1 {
          margin: 0 0 4px 0;
          font-size: 2rem;
          font-weight: bold;
        }
        
        .document-header .meta {
          color: var(--muted);
          font-size: 0.95rem;
        }
        
        .site-nav {
          margin-bottom: 20px;
        }
        
        .site-nav a {
          color: var(--link);
          text-decoration: none;
          margin-right: 14px;
        }
        
        .site-nav a:hover {
          text-decoration: underline;
        }
        
        .intro-card {
          background: var(--card);
          padding: 16px;
          border-radius: 10px;
          margin-top: 16px;
        }
        
        .document-main h2 {
          margin-top: 32px;
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .document-main ul {
          padding-left: 20px;
        }
        
        .document-main a {
          color: var(--link);
        }
        
        .document-main a:hover {
          text-decoration: underline;
        }
        
        .document-footer {
          max-width: 900px;
          margin: auto;
          padding: 24px;
          color: var(--muted);
          font-size: 0.9rem;
          border-top: 1px solid #e8ecf5;
          margin-top: 40px;
        }
        
        strong {
          font-weight: 600;
        }
        
        .do {
          background: #eef9f0;
          border-left: 4px solid #30b455;
          padding: 10px;
          border-radius: 8px;
          margin: 16px 0;
        }
        
        .dont {
          background: #fff2f2;
          border-left: 4px solid #e84545;
          padding: 10px;
          border-radius: 8px;
          margin: 16px 0;
        }
      `}</style>

      <header className="document-header" aria-labelledby="cg-title">
        <nav className="site-nav" aria-label="Site">
          <a href="/">Home</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/sources">Sources &amp; Licences</a>
        </nav>
        <h1 id="cg-title">AwakeVerse — Community Guidelines</h1>
        <p className="meta">Effective: 19 August 2025 • Last updated: 19 August 2025</p>
        <div className="intro-card">
          AwakeVerse is a place to explore ideas with historic and fictional personas. 
          These guidelines keep the experience welcoming, safe, and creatively honest.
        </div>
      </header>

      <main className="document-main">
        <h2 id="values">1) Our Values</h2>
        <ul>
          <li><strong>Respect</strong> for people, cultures, and the figures we portray.</li>
          <li><strong>Curiosity</strong> and openness to learning.</li>
          <li><strong>Safety</strong> first: zero tolerance for abuse or exploitation.</li>
        </ul>

        <h2 id="expected">2) Expected Behaviour</h2>
        <ul>
          <li>Be civil; critique ideas, not people. Avoid personal attacks.</li>
          <li>Engage characters "in spirit" of their era without glorifying harm.</li>
          <li>Use content warnings where appropriate; avoid shock or baiting prompts.</li>
          <li>Report issues you encounter (see §8) rather than escalating conflicts.</li>
        </ul>

        <h2 id="prohibited">3) Prohibited Content &amp; Conduct</h2>
        <ul>
          <li>Harassment, hate, threats, bullying, or encouragement of self‑harm.</li>
          <li>Sexual content involving minors; sexual exploitation; non‑consensual acts.</li>
          <li>Terrorism/extremism promotion; real‑world violence incitement.</li>
          <li>Doxxing, tracking, or collecting others' personal data without consent.</li>
          <li>Illegal activities (e.g., facilitating harm, malware distribution).</li>
          <li>Coordinated political manipulation or disinformation campaigns.</li>
          <li>Copyright infringement; sharing paid or pirated materials you don't own.</li>
        </ul>

        <h2 id="age">4) Age &amp; Sensitive Topics</h2>
        <ul>
          <li>AwakeVerse is for users <strong>13+</strong>. If you are under 18, obtain guardian consent.</li>
          <li>Adult/NSFW requests are restricted. Romantic themes may be allowed with boundaries.</li>
        </ul>

        <h2 id="ai">5) AI Content &amp; Historical Personas</h2>
        <ul>
          <li>Outputs are <strong>AI‑generated</strong>; they may be fictional or inaccurate.</li>
          <li>Do not claim AwakeVerse outputs are factual advice or real endorsements.</li>
          <li>Avoid prompts that attempt to bypass safety systems or policy constraints.</li>
        </ul>

        <h2 id="sharing">6) Sharing Content</h2>
        <ul>
          <li>You may share your session snippets non‑commercially with attribution to AwakeVerse.</li>
          <li>Don't remove watermarks or branding; don't impersonate AwakeVerse or its personas.</li>
        </ul>

        <h2 id="enforcement">7) Enforcement</h2>
        <p>We apply progressive enforcement based on severity and history:</p>
        <ul>
          <li>Content removal or warning</li>
          <li>Temporary feature restriction or suspension</li>
          <li>Permanent account ban for egregious or repeated violations</li>
        </ul>
        <p>Appeals: email <a href="mailto:appeals@awakeverse.com">appeals@awakeverse.com</a> with details.</p>

        <h2 id="safety-tools">8) Safety Tools &amp; Reporting</h2>
        <ul>
          <li>Use in‑app report options where available.</li>
          <li>Email urgent concerns to <a href="mailto:safety@awakeverse.com">safety@awakeverse.com</a>.</li>
          <li>For security issues, see our <a href="/security">Security &amp; Data Protection Policy</a>.</li>
        </ul>

        <h2 id="examples">9) Quick Examples</h2>
        <div className="do">
          <strong>Do:</strong> "Socrates, challenge my argument about justice."
        </div>
        <div className="dont">
          <strong>Don't:</strong> "Generate private info about this person" or "teach me to harm someone."
        </div>

        <h2 id="changes">10) Changes</h2>
        <p>We may update these guidelines. Material changes will be announced in‑app or by email.</p>
      </main>

      <footer className="document-footer">
        <p>© {currentYear} AwakeVerse Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}