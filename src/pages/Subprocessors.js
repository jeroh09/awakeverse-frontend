// src/pages/Subprocessors.js
import React from 'react';

export default function Subprocessors() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="legal-document">
      <style jsx>{`
        .legal-document {
          --ink: #0c1222; --muted: #4b587c; --link: #1b73e8; --bg: #ffffff; --card: #f6f8fc;
          background: var(--bg); color: var(--ink);
          font: 16px/1.6 system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial;
          margin: 0; padding: 0;
        }
        .document-header, .document-main { max-width: 900px; margin: auto; padding: 24px; }
        .document-header h1 { margin: 0 0 4px 0; font-size: 2rem; font-weight: bold; }
        .document-header .meta { color: var(--muted); font-size: 0.95rem; }
        .site-nav { margin-bottom: 20px; }
        .site-nav a { color: var(--link); text-decoration: none; margin-right: 14px; }
        .site-nav a:hover { text-decoration: underline; }
        .intro-card { background: var(--card); padding: 16px; border-radius: 10px; margin-top: 16px; }
        .document-main h2 { margin-top: 32px; font-size: 1.5rem; font-weight: 600; }
        .document-main ul { padding-left: 20px; }
        .document-main a { color: var(--link); }
        .document-main a:hover { text-decoration: underline; }
        .document-footer { max-width: 900px; margin: auto; padding: 24px; color: var(--muted); font-size: 0.9rem; border-top: 1px solid #e8ecf5; margin-top: 40px; }
        strong { font-weight: 600; }
        table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        td, th { border: 1px solid #e8ecf5; padding: 8px; text-align: left; vertical-align: top; }
        .updated { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 10px; border-radius: 8px; margin: 16px 0; }
      `}</style>

      <header className="document-header">
        <nav className="site-nav">
          <a href="/">Home</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/security">Security</a>
        </nav>
        <h1>AwakeVerse — Subprocessors</h1>
        <p className="meta">Effective: 19 August 2025 • Last updated: 19 August 2025</p>
        <div className="intro-card">
          This page lists the third-party subprocessors that AwakeVerse uses to provide our services, 
          as referenced in our Privacy Policy and Security & Data Protection Policy.
        </div>
      </header>

      <main className="document-main">
        <div className="updated">
          <strong>GDPR Compliance:</strong> All subprocessors listed below operate under Data Processing Agreements (DPAs) 
          and appropriate safeguards for international data transfers where applicable.
        </div>

        <h2>1) Infrastructure & Hosting</h2>
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Service</th>
              <th>Data Processed</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Vercel Inc.</strong></td>
              <td>Frontend hosting, analytics</td>
              <td>Web traffic data, performance metrics</td>
              <td>Global (US-based)</td>
            </tr>
            <tr>
              <td><strong>DigitalOcean LLC</strong></td>
              <td>Backend server hosting</td>
              <td>Application data, user sessions</td>
              <td>Global data centers</td>
            </tr>
            <tr>
              <td><strong>Neon</strong></td>
              <td>PostgreSQL database hosting</td>
              <td>User data, chat logs, account information</td>
              <td>Global (US-based)</td>
            </tr>
            <tr>
              <td><strong>Cloudflare Inc.</strong></td>
              <td>CDN, security, DNS</td>
              <td>Web traffic, IP addresses, security logs</td>
              <td>Global network</td>
            </tr>
            <tr>
              <td><strong>Hostinger</strong></td>
              <td>Domain registration</td>
              <td>Domain registration data</td>
              <td>Lithuania (EU)</td>
            </tr>
          </tbody>
        </table>

        <h2>2) Communication Services</h2>
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Service</th>
              <th>Data Processed</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>SendGrid (Twilio)</strong></td>
              <td>Email delivery</td>
              <td>Email addresses, message content</td>
              <td>Global (US-based)</td>
            </tr>
            <tr>
              <td><strong>Zoho Corporation</strong></td>
              <td>Business email services</td>
              <td>Business communications</td>
              <td>Global (India-based)</td>
            </tr>
          </tbody>
        </table>

        <h2>3) AI & Analytics Services</h2>
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Service</th>
              <th>Data Processed</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Mistral AI</strong></td>
              <td>AI model inference</td>
              <td>User prompts, conversation context</td>
              <td>France (EU)</td>
            </tr>
            <tr>
              <td><strong>Meta (Llama)</strong></td>
              <td>AI model inference (via Ollama)</td>
              <td>User prompts, conversation context</td>
              <td>Self-hosted on our infrastructure</td>
            </tr>
            <tr>
              <td><strong>HuggingFace</strong></td>
              <td>Sentence Transformers models</td>
              <td>Text embeddings, semantic analysis</td>
              <td>Self-hosted on our infrastructure</td>
            </tr>
            <tr>
              <td><strong>Appsmith</strong></td>
              <td>Internal admin tools</td>
              <td>Administrative data, usage analytics</td>
              <td>Global (India-based)</td>
            </tr>
          </tbody>
        </table>

        <h2>4) Data Processing Purposes</h2>
        <p>Our subprocessors process personal data for the following purposes:</p>
        <ul>
          <li><strong>Service Delivery:</strong> Hosting, database management, content delivery</li>
          <li><strong>Communication:</strong> Transactional emails, customer support</li>
          <li><strong>AI Processing:</strong> Generating responses, natural language understanding</li>
          <li><strong>Security:</strong> Fraud detection, abuse prevention, security monitoring</li>
          <li><strong>Analytics:</strong> Performance monitoring, usage analytics (anonymized where possible)</li>
        </ul>

        <h2>5) Data Protection Measures</h2>
        <ul>
          <li>All subprocessors are contractually bound by Data Processing Agreements (DPAs)</li>
          <li>International transfers use appropriate safeguards (UK Addendum to EU SCCs)</li>
          <li>Regular security assessments and vendor reviews</li>
          <li>Data minimization and purpose limitation principles applied</li>
          <li>Encryption in transit and at rest where technically feasible</li>
        </ul>

        <h2>6) Changes to Subprocessors</h2>
        <p>
          We may change our subprocessors from time to time as our business needs evolve. 
          Material changes affecting data processing will be communicated through updates to this page 
          and our Privacy Policy.
        </p>

        <h2>7) Contact</h2>
        <p>
          For questions about our subprocessors or data processing arrangements, contact our Data Protection Officer at 
          <a href="mailto:privacy@awakeverse.com">privacy@awakeverse.com</a>.
        </p>
      </main>

      <footer className="document-footer">
        <p>© {currentYear} AwakeVerse Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}