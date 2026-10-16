// src/pages/SecurityPolicy.js
import React from 'react';

export default function SecurityPolicy() {
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

      <header className="document-header" aria-labelledby="sec-title">
        <nav className="site-nav" aria-label="Site">
          <a href="/">Home</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/cookie-policy">Cookie Policy</a>
        </nav>
        <h1 id="sec-title">AwakeVerse — Security &amp; Data Protection Policy</h1>
        <p className="meta">Effective: 19 August 2025 • Last updated: 19 August 2025</p>
        <div className="intro-card">
          This policy describes how we protect your data and comply with the UK GDPR and the Data Protection Act 2018.
        </div>
      </header>

      <main className="document-main">
        <h2 id="controller">1) Roles &amp; Scope</h2>
        <ul>
          <li><strong>Data Controller:</strong> AwakeVerse Ltd (UK)</li>
          <li><strong>Contact:</strong> <a href="mailto:privacy@awakeverse.com">privacy@awakeverse.com</a> (privacy), <a href="mailto:security@awakeverse.com">security@awakeverse.com</a> (security)</li>
          <li><strong>Sub‑processors:</strong> listed at <a href="/subprocessors">/subprocessors</a></li>
          <li>Scope: all personal data processed by AwakeVerse web/mobile services and support operations.</li>
        </ul>

        <h2 id="principles">2) GDPR Principles</h2>
        <ul>
          <li>Lawfulness, fairness, transparency</li>
          <li>Purpose limitation &amp; data minimisation</li>
          <li>Accuracy &amp; storage limitation</li>
          <li>Integrity &amp; confidentiality (security)</li>
          <li>Accountability (we keep records of processing activities)</li>
        </ul>

        <h2 id="lawful-basis">3) Lawful Bases &amp; Processing</h2>
        <table aria-label="Lawful bases">
          <thead>
            <tr>
              <th>Purpose</th>
              <th>Examples</th>
              <th>Lawful Basis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Provide the service</td>
              <td>Auth (JWT), chat delivery, conversation memory</td>
              <td>Contract (Art. 6(1)(b))</td>
            </tr>
            <tr>
              <td>Safety &amp; abuse prevention</td>
              <td>Rate limiting, moderation, fraud checks</td>
              <td>Legitimate interests (Art. 6(1)(f))</td>
            </tr>
            <tr>
              <td>Communications</td>
              <td>Onboarding emails, service notices</td>
              <td>Legitimate interests; Consent where required</td>
            </tr>
            <tr>
              <td>Compliance</td>
              <td>Responding to lawful requests</td>
              <td>Legal obligation (Art. 6(1)(c))</td>
            </tr>
          </tbody>
        </table>

        <h2 id="data-types">4) Data Types &amp; Retention</h2>
        <table aria-label="Retention">
          <thead>
            <tr>
              <th>Category</th>
              <th>Examples</th>
              <th>Typical Retention</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Account Data</td>
              <td>Email, display name, avatar URL</td>
              <td>Kept while account is active; deleted upon request/closure</td>
            </tr>
            <tr>
              <td>Chat Buffers (Redis)</td>
              <td>Recent session context</td>
              <td>Short‑lived (e.g., &lt; 24h) — ephemeral cache</td>
            </tr>
            <tr>
              <td>Chat Logs &amp; Summaries (DB)</td>
              <td>Messages, summaries for memory features</td>
              <td>Kept while account is active; purged upon account deletion (subject to legal holds)</td>
            </tr>
            <tr>
              <td>Telemetry &amp; Security Logs</td>
              <td>Error logs, access logs</td>
              <td>Typically 30–180 days unless needed longer for security/compliance</td>
            </tr>
            <tr>
              <td>Support Tickets</td>
              <td>Emails, chat with support</td>
              <td>As needed to resolve issues; then archived or deleted</td>
            </tr>
          </tbody>
        </table>

        <h2 id="security-controls">5) Security Controls</h2>
        <ul>
          <li><strong>Transport security:</strong> HTTPS/TLS for all traffic.</li>
          <li><strong>Authentication:</strong> JWT‑secured APIs; passwords hashed (e.g., bcrypt/argon2).</li>
          <li><strong>Access control:</strong> role‑based access; least privilege; admin actions logged.</li>
          <li><strong>Data at rest:</strong> managed DB storage with encryption at rest; secrets in environment vaults.</li>
          <li><strong>Pseudonymisation:</strong> where feasible in logs and analytics.</li>
          <li><strong>Backups &amp; DR:</strong> periodic encrypted backups and tested restore procedures.</li>
          <li><strong>Secure development:</strong> code review, dependency scanning, OWASP awareness.</li>
          <li><strong>Third‑party risk:</strong> DPAs with processors; vendor security review; minimal data sharing.</li>
        </ul>

        <h2 id="international">6) International Transfers</h2>
        <p>Where personal data leaves the UK, we use appropriate safeguards (UK Addendum to EU SCCs or equivalent) and assess vendor jurisdictions.</p>

        <h2 id="rights">7) Your Rights</h2>
        <ul>
          <li>Access, rectification, erasure, restriction, portability, and objection to processing based on legitimate interests.</li>
          <li>Withdraw consent where processing relies on consent.</li>
          <li>To exercise rights, email <a href="mailto:privacy@awakeverse.com">privacy@awakeverse.com</a>. We respond within one month (UK GDPR).</li>
        </ul>

        <h2 id="incident">8) Incident Response &amp; Breach Notification</h2>
        <ul>
          <li>We monitor for anomalies and suspected incidents.</li>
          <li>On confirming a personal‑data breach, we assess risk and, where required, notify the ICO <strong>within 72 hours</strong> and affected users without undue delay.</li>
          <li>Contact for security reports: <a href="mailto:security@awakeverse.com">security@awakeverse.com</a> (please include steps to reproduce and impact).</li>
        </ul>

        <h2 id="minimisation">9) Data Minimisation &amp; Privacy by Design</h2>
        <ul>
          <li>We collect only what is necessary to deliver the service.</li>
          <li>We run DPIAs (Data Protection Impact Assessments) for high‑risk features (e.g., new biometric or sensitive‑data features).</li>
          <li>Defaults favour privacy; optional analytics are opt‑in where required.</li>
        </ul>

        <h2 id="children">10) Children's Data</h2>
        <p>AwakeVerse is not directed at children under 13. We take steps to prevent collection from under‑13 users and delete such data if discovered.</p>

        <h2 id="cookies">11) Cookies &amp; Local Storage</h2>
        <p>We use essential cookies/local storage for authentication and session continuity, and optional analytics cookies where enabled. See our <a href="/cookie-policy">Cookie Policy</a>.</p>

        <h2 id="changes">12) Changes</h2>
        <p>We may update this policy. Material changes will be communicated in‑app or by email.</p>

        <h2 id="contact">13) Contact</h2>
        <p>Privacy: <a href="mailto:privacy@awakeverse.com">privacy@awakeverse.com</a> • Security: <a href="mailto:security@awakeverse.com">security@awakeverse.com</a></p>
      </main>

      <footer className="document-footer">
        <p>© {currentYear} AwakeVerse Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}