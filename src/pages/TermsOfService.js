// src/pages/TermsOfService.js
import React from 'react';

export default function TermsOfService() {
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
      `}</style>

      <header className="document-header" aria-labelledby="tos-title">
        <nav className="site-nav" aria-label="Site">
          <a href="/">Home</a>
          <a href="/privacy">Privacy</a>
          <a href="/sources">Sources &amp; Licences</a>
        </nav>
        <h1 id="tos-title">AwakeVerse — Terms of Service</h1>
        <p className="meta">Effective: 19 August 2025 &nbsp;•&nbsp; Last updated: 19 August 2025</p>
        <div className="intro-card">
          Welcome to AwakeVerse, an AI platform for conversations with historical, cultural, and fictional personas. 
          By accessing or using our services, you agree to these Terms.
        </div>
      </header>

      <main className="document-main">
        <h2 id="overview">1) Overview</h2>
        <p>AwakeVerse is provided by <strong>AwakeVerse Ltd</strong> ("AwakeVerse," "we," "us"). Our services include web and mobile experiences that generate AI content for education and entertainment.</p>

        <h2 id="eligibility">2) Eligibility</h2>
        <ul>
          <li>You must be at least <strong>13</strong> years old to use AwakeVerse. If you are under 18, you must have consent from a parent/guardian.</li>
          <li>You represent that all registration information you submit is accurate and you will keep it up to date.</li>
        </ul>

        <h2 id="accounts">3) Accounts &amp; Security</h2>
        <ul>
          <li>You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.</li>
          <li>We may suspend or terminate accounts that violate these Terms or applicable law.</li>
        </ul>

        <h2 id="content-ownership">4) Content &amp; Ownership</h2>
        <ul>
          <li><strong>Your Inputs:</strong> You retain ownership of prompts, text, and other content you submit ("User Content"). You grant AwakeVerse a worldwide, royalty‑free, sublicensable licence to host, process, display, and use your User Content to operate, maintain, and improve the services (including safety and moderation).</li>
          <li><strong>Generated Outputs &amp; Platform IP:</strong> All AI outputs, system prompts, character definitions, avatars, animations, UI/UX, designs, and software are the exclusive intellectual property of AwakeVerse. You receive a revocable licence to use outputs within the service and to share them non‑commercially, provided you do not misrepresent them as factual advice.</li>
          <li><strong>Feedback:</strong> Ideas or suggestions you provide may be used without obligation to you.</li>
        </ul>

        <h2 id="acceptable-use">5) Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Harass, threaten, or defame others; generate hateful, extremist, or illegal content.</li>
          <li>Seek or disseminate personal data of others without consent.</li>
          <li>Use the service for political persuasion/manipulation or coordinated inauthentic behaviour.</li>
          <li>Upload or share content that infringes third‑party rights.</li>
          <li>Probe, scan, or test the vulnerability of any system or attempt to circumvent security.</li>
          <li>Scrape, index, or reverse engineer the services.</li>
        </ul>

        <h2 id="ai-disclaimer">6) AI Disclaimers</h2>
        <ul>
          <li>Responses are AI‑generated and may be fictional, inaccurate, or outdated.</li>
          <li>Content is for <strong>education and entertainment</strong> only; not legal, medical, financial, or professional advice.</li>
          <li>Characters are inspired by historical/cultural figures; they are not endorsed by estates or rights holders.</li>
        </ul>

        <h2 id="datasets">7) Datasets &amp; Attributions</h2>
        <p>We use public‑domain sources (e.g., Project Gutenberg) and Creative Commons materials (e.g., Wikipedia under CC BY‑SA). See our <a href="/sources">Sources &amp; Licences</a> page for attributions and links.</p>

        <h2 id="ip">8) Intellectual Property</h2>
        <ul>
          <li><strong>Trademarks:</strong> AwakeVerse™ name, logos, and taglines are protected. You may not use them without permission.</li>
          <li><strong>Copyright:</strong> All code, designs, assets, and content (other than User Content) are owned by AwakeVerse and protected by law.</li>
        </ul>

        <h2 id="third-parties">9) Third‑Party Services</h2>
        <p>We may integrate third‑party services (e.g., cloud hosting, email, AI inference). Their terms and privacy policies apply to their components.</p>

        <h2 id="termination">10) Suspension &amp; Termination</h2>
        <p>We may suspend or terminate your access if you breach these Terms or create risk of harm. You may stop using the services at any time.</p>

        <h2 id="disclaimers">11) Disclaimers &amp; Liability Limits</h2>
        <ul>
          <li>Services are provided "as is" and "as available." We disclaim all warranties to the fullest extent permitted by law.</li>
          <li>We are not liable for indirect, incidental, special, or consequential damages. Our aggregate liability for all claims shall not exceed the greater of £50 or the amount you paid to use the services in the 12 months preceding the claim.</li>
        </ul>

        <h2 id="infringement">12) Notices of Infringement</h2>
        <p>If you believe content on AwakeVerse infringes your rights, email <a href="mailto:legal@awakeverse.com">legal@awakeverse.com</a> with: (a) your contact details, (b) a description of the work, (c) the URL of the allegedly infringing material, and (d) a statement you have a good‑faith belief the use is not authorised.</p>

        <h2 id="governing-law">13) Governing Law &amp; Venue</h2>
        <p>These Terms are governed by the laws of England and Wales. Courts of England and Wales have exclusive jurisdiction.</p>

        <h2 id="changes">14) Changes to Terms</h2>
        <p>We may update these Terms. Material changes will be notified in‑app or by email. Continued use after changes means you accept the revised Terms.</p>

        <h2 id="contact">15) Contact</h2>
        <p>AwakeVerse Ltd • Support: <a href="mailto:support@awakeverse.com">support@awakeverse.com</a> • Legal: <a href="mailto:legal@awakeverse.com">legal@awakeverse.com</a></p>
      </main>

      <footer className="document-footer">
        <p>© {currentYear} AwakeVerse Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}