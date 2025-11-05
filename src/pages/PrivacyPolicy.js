// src/pages/PrivacyPolicy.js
import React from 'react';

export default function PrivacyPolicy() {
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
        
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 12px 0;
        }
        
        td, th {
          border: 1px solid #e8ecf5;
          padding: 8px;
          text-align: left;
          vertical-align: top;
        }
        
        code {
          background: #f3f5fa;
          padding: 2px 5px;
          border-radius: 6px;
        }
      `}</style>

      <header className="document-header" aria-labelledby="pp-title">
        <nav className="site-nav" aria-label="Site">
          <a href="/">Home</a>
          <a href="/terms">Terms</a>
          <a href="/sources">Sources &amp; Licences</a>
          <a href="/cookie-policy">Cookie Policy</a>
        </nav>
        <h1 id="pp-title">AwakeVerse — Privacy Policy</h1>
        <p className="meta">Effective: 19 August 2025 &nbsp;•&nbsp; Last updated: 19 August 2025</p>
        <div className="intro-card">
          This Privacy Policy explains how <strong>AwakeVerse Ltd</strong> ("AwakeVerse," "we," "us") collects and processes personal data under the UK GDPR and the Data Protection Act 2018.
        </div>
      </header>

      <main className="document-main">
        <h2 id="controller">1) Data Controller &amp; Contact</h2>
        <p>AwakeVerse Ltd is the data controller. Contact our privacy team at <a href="mailto:privacy@awakeverse.com">privacy@awakeverse.com</a>. You can also contact our support team at <a href="mailto:support@awakeverse.com">support@awakeverse.com</a>.</p>

        <h2 id="what-we-collect">2) What We Collect</h2>
        <table aria-label="Data we collect">
          <thead>
            <tr>
              <th>Category</th>
              <th>Examples</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Account Data</td>
              <td>Email/username, display name, avatar</td>
              <td>Provided by you during registration or profile updates</td>
            </tr>
            <tr>
              <td>Chat &amp; Session Data</td>
              <td>Prompts, AI responses, timestamps, session/thread IDs, invite participation</td>
              <td>Generated during use of the service</td>
            </tr>
            <tr>
              <td>Technical Data</td>
              <td>IP address, device/browser info, cookies, diagnostic logs</td>
              <td>Collected automatically</td>
            </tr>
            <tr>
              <td>Communications</td>
              <td>Support requests, feedback, email correspondence</td>
              <td>Provided by you</td>
            </tr>
          </tbody>
        </table>

        <h2 id="how-we-use">3) How We Use Data &amp; Legal Bases</h2>
        <table aria-label="Purposes and legal bases">
          <thead>
            <tr>
              <th>Purpose</th>
              <th>Examples</th>
              <th>Legal Basis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Provide the service</td>
              <td>Authenticate via JWT; route messages; show chat history and memory</td>
              <td>Contract (Art. 6(1)(b))</td>
            </tr>
            <tr>
              <td>Improve features &amp; safety</td>
              <td>Summaries, entity extraction for preferences, anti‑abuse &amp; moderation</td>
              <td>Legitimate interests (Art. 6(1)(f))</td>
            </tr>
            <tr>
              <td>Communicate with you</td>
              <td>Onboarding/welcome emails, service notices</td>
              <td>Legitimate interests; Consent where required</td>
            </tr>
            <tr>
              <td>Comply with law</td>
              <td>Record‑keeping, responding to lawful requests</td>
              <td>Legal obligation (Art. 6(1)(c))</td>
            </tr>
          </tbody>
        </table>

        <div className="intro-card">
          <p><strong>Model training:</strong> We do not use your conversations to train third‑party foundation models. We may process conversation snippets internally to operate features (e.g., summarisation, memory, safety) and to improve product quality.</p>
        </div>

        <h2 id="sharing">4) Sharing &amp; International Transfers</h2>
        <ul>
          <li><strong>Service providers:</strong> cloud hosting, managed databases (e.g., Postgres), Redis, email delivery, and AI inference. They act under contract and only process data on our instructions.</li>
          <li><strong>Transfers outside the UK:</strong> Where data is transferred internationally, we use appropriate safeguards (UK Addendum to EU SCCs or equivalent).</li>
          <li><strong>Legal disclosures:</strong> We may disclose data if required by law or to protect safety and rights.</li>
        </ul>
        <p>We maintain a list of key subprocessors at <a href="/subprocessors">/subprocessors</a>.</p>

        <h2 id="retention">5) Retention</h2>
        <ul>
          <li><strong>Ephemeral chat buffers (Redis):</strong> short‑lived session storage (typically &lt; 24 hours) for performance and continuity.</li>
          <li><strong>Persistent chat logs &amp; summaries (database):</strong> retained while your account is active to provide memory features; deleted upon account deletion or your request (subject to legal holds).</li>
          <li><strong>Support communications:</strong> retained as needed to resolve issues and maintain records.</li>
        </ul>

        <h2 id="security">6) Security</h2>
        <ul>
          <li>Transport encryption (HTTPS/TLS) and access controls.</li>
          <li>Passwords stored using industry‑standard hashing.</li>
          <li>Role‑based access and logging for administrative functions.</li>
          <li>Report security concerns to <a href="mailto:security@awakeverse.com">security@awakeverse.com</a>.</li>
        </ul>

        <h2 id="cookies">7) Cookies &amp; Similar Technologies</h2>
        <p>We use essential cookies for authentication/session continuity and optional analytics (where enabled). See our <a href="/cookie-policy">Cookie Policy</a> for details and controls.</p>

        <h2 id="your-rights">8) Your Rights (UK GDPR)</h2>
        <ul>
          <li>Access, rectification, erasure, restriction, portability, and objection to processing based on legitimate interests.</li>
          <li>Withdraw consent where processing relies on consent.</li>
          <li>Lodge a complaint with the ICO: <a href="https://ico.org.uk">ico.org.uk</a>.</li>
        </ul>
        <p>To exercise your rights, email <a href="mailto:privacy@awakeverse.com">privacy@awakeverse.com</a>. We may need to verify your identity.</p>

        <h2 id="children">9) Children</h2>
        <p>AwakeVerse is not directed at children under 13. If we learn we have collected personal data from a child under 13, we will delete it.</p>

        <h2 id="automated">10) Automated Decision‑Making</h2>
        <p>AI features personalise and generate content. We do not use automated decision‑making that produces legal or similarly significant effects about you.</p>

        <h2 id="changes">11) Changes to this Policy</h2>
        <p>We may update this Policy. Material changes will be notified in‑app or by email. Your continued use after changes means you acknowledge the updates.</p>

        <h2 id="contact">12) Contact</h2>
        <p>Privacy enquiries: <a href="mailto:privacy@awakeverse.com">privacy@awakeverse.com</a> &nbsp;|&nbsp; General support: <a href="mailto:support@awakeverse.com">support@awakeverse.com</a></p>
      </main>

      <footer className="document-footer">
        <p>© {currentYear} AwakeVerse Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}