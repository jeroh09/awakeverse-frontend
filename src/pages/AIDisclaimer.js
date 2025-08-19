// src/pages/AIDisclaimer.js
import React from 'react';

export default function AIDisclaimer() {
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
        
        .section {
          margin-bottom: 2rem;
        }
      `}</style>

      <header className="document-header">
        <nav className="site-nav">
          <a href="/">Home</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/security">Security</a>
        </nav>
        <h1>Awakeverse — AI Disclaimer</h1>
        <p className="meta">Effective: August 2025 • Last updated: August 2025</p>
        <div className="intro-card">
          Awakeverse provides access to interactive conversations with AI-generated characters.
          These characters are designed for educational, entertainment, and exploratory purposes.
          By using our platform, you acknowledge and agree to the following:
        </div>
      </header>

      <main className="document-main">
        <section className="section">
          <h2>1. No Professional Advice</h2>
          <p>
            AI-generated responses are not a substitute for professional advice of any kind,
            including but not limited to medical, legal, financial, psychological, or educational guidance.
            Do not rely on AI outputs for decisions that may impact your health, finances, legal status,
            or safety. Always consult a qualified human professional where appropriate.
          </p>
        </section>

        <section className="section">
          <h2>2. Accuracy &amp; Reliability</h2>
          <p>
            While we take care to train and configure our AI responsibly, responses may sometimes be
            inaccurate, outdated, biased, or misleading. Awakeverse makes no guarantee that
            AI-generated content is factually correct or complete. Historical characters in particular
            may include creative interpretation for immersive experience.
          </p>
        </section>

        <section className="section">
          <h2>3. Intellectual Property</h2>
          <p>
            AI outputs may reference publicly available data (such as Project Gutenberg or Wikipedia).
            Any resemblance to copyrighted works is unintentional. Awakeverse claims no ownership
            of third-party materials surfaced by the AI and provides attribution where required.
          </p>
        </section>

        <section className="section">
          <h2>4. User Responsibility</h2>
          <p>
            You are responsible for how you use, interpret, and share AI-generated responses.
            By continuing to use Awakeverse, you agree not to misuse AI content for unlawful,
            harmful, or misleading purposes.
          </p>
        </section>

        <section className="section">
          <h2>5. Data Usage &amp; Privacy</h2>
          <p>
            Conversations may be logged, summarized, and analyzed to improve system performance
            and contextual recall. We comply with the <strong>UK Data Protection Act 2018</strong> and 
            <strong>EU General Data Protection Regulation (GDPR)</strong>. Personal data is processed
            only as outlined in our <a href="/privacy">Privacy &amp; Data Protection Policy</a>.
            You may request deletion of your data at any time by contacting us.
          </p>
        </section>

        <section className="section">
          <h2>6. Limitation of Liability</h2>
          <p>
            Awakeverse is not liable for decisions, actions, or outcomes taken on the basis of
            AI-generated responses. Use of the service is at your own risk. The platform is provided
            on an "as is" and "as available" basis without warranties of any kind.
          </p>
        </section>

        <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #e8ecf5' }} />
        
        <p>
          <em>Last updated: August 2025</em><br/>
          For questions about this disclaimer, contact us at{' '}
          <a href="mailto:support@awakeverse.com">support@awakeverse.com</a>.
        </p>
      </main>

      <footer className="document-footer">
        <p>© {currentYear} Awakeverse Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}