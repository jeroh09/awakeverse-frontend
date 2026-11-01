// src/pages/CopyrightPolicy.js
import React from 'react';

export default function CopyrightPolicy() {
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
        
        code {
          background: #f3f5fa;
          padding: 2px 5px;
          border-radius: 6px;
        }
      `}</style>

      <header className="document-header" aria-labelledby="ip-title">
        <nav className="site-nav" aria-label="Site">
          <a href="/">Home</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/sources">Sources &amp; Licences</a>
        </nav>
        <h1 id="ip-title">AwakeVerse — Copyright &amp; IP Policy</h1>
        <p className="meta">Effective: 19 August 2025 • Last updated: 19 August 2025</p>
        <div className="intro-card">
          This policy explains what you can do with AwakeVerse content, what we can do with your content, and how to report infringement.
        </div>
      </header>

      <main className="document-main">
        <h2 id="ours">1) Our IP</h2>
        <ul>
          <li>Trademarks: the AwakeVerse™ name, logos, and taglines.</li>
          <li>Copyright: site code, UI/UX, animations, avatars, persona definitions, prompts, generative text and images produced by AwakeVerse.</li>
          <li>Patents/Trade Secrets: proprietary algorithms (contextual memory, invite logic, etc.).</li>
        </ul>
        <p>You receive a limited, revocable, non‑exclusive licence to view and share non‑commercial snippets of outputs with attribution to AwakeVerse. No sublicensing or resale. Don't remove branding or watermarks.</p>

        <h2 id="yours">2) Your Content</h2>
        <ul>
          <li><strong>You own your inputs</strong> (prompts, text, uploads). By using the service, you grant AwakeVerse a worldwide, royalty‑free licence to host, process, display, and use your inputs to operate, maintain, secure, and improve the platform.</li>
          <li>If you submit feedback, you grant us permission to use it without obligation.</li>
        </ul>

        <h2 id="ai-outputs">3) AI Outputs &amp; Responsibility</h2>
        <ul>
          <li>AI outputs may resemble existing works; AwakeVerse does not guarantee non‑infringement.</li>
          <li>For commercial use of outputs outside AwakeVerse, you are responsible for ensuring rights clearance where applicable.</li>
        </ul>

        <h2 id="third-party">4) Third‑Party Content &amp; Licences</h2>
        <ul>
          <li><strong>Public Domain</strong> sources (e.g., Project Gutenberg) are freely usable.</li>
          <li>Open‑source components used by AwakeVerse remain under their original licences.</li>
        </ul>

        <h2 id="use-restrictions">5) Use Restrictions</h2>
        <ul>
          <li>No scraping, bulk downloading, or automated harvesting of content or prompts.</li>
          <li>No framing, cloning, or confusingly similar uses of our brand.</li>
          <li>No reverse engineering or attempts to extract proprietary datasets or prompts.</li>
        </ul>

        <h2 id="trademarks">6) Trademark Guidelines</h2>
        <ul>
          <li>Do not use our marks in a way that suggests sponsorship or endorsement.</li>
          <li>Descriptive or nominative fair use is allowed (e.g., "compatible with AwakeVerse").</li>
        </ul>

        <h2 id="notice">7) Alleged Infringement (Notice &amp; Takedown)</h2>
        <p>Email <a href="mailto:legal@awakeverse.com">legal@awakeverse.com</a> with:</p>
        <ul>
          <li>Your contact details.</li>
          <li>Description of the work and its ownership.</li>
          <li>URL(s) of the allegedly infringing content.</li>
          <li>A statement of good‑faith belief and authority to act.</li>
        </ul>
        <p>We may remove or restrict content while we investigate. Counter‑notices can be sent to the same address with evidence of rights.</p>

        <h2 id="changes">8) Changes</h2>
        <p>We may update this policy from time to time. Material changes will be notified in‑app or by email.</p>
      </main>

      <footer className="document-footer">
        <p>© {currentYear} AwakeVerse Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}