// src/pages/CookiePolicy.js
import React from 'react';

export default function CookiePolicy() {
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
        code { background: #f3f5fa; padding: 2px 5px; border-radius: 6px; }
      `}</style>

      <header className="document-header">
        <nav className="site-nav">
          <a href="/">Home</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/security">Security</a>
        </nav>
        <h1>Awakeverse — Cookie Policy</h1>
        <p className="meta">Effective: 19 August 2025 • Last updated: 19 August 2025</p>
        <div className="intro-card">
          This Cookie Policy explains how Awakeverse uses cookies and similar technologies to provide and improve our services.
        </div>
      </header>

      <main className="document-main">
        <h2>1) What Are Cookies?</h2>
        <p>
          Cookies are small text files stored on your device when you visit our website. They help us provide essential functionality, 
          improve performance, and understand how you use our service.
        </p>

        <h2>2) Cookies We Use</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Purpose</th>
              <th>Examples</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Essential Cookies</strong></td>
              <td>Required for basic site functionality and security</td>
              <td>JWT authentication tokens, session management</td>
              <td>Session or until logout</td>
            </tr>
            <tr>
              <td><strong>Performance Cookies</strong></td>
              <td>Monitor site performance and user experience</td>
              <td>Vercel Analytics, Appsmith analytics</td>
              <td>Up to 2 years</td>
            </tr>
            <tr>
              <td><strong>Functional Cookies</strong></td>
              <td>Remember your preferences and settings</td>
              <td>UI preferences, character selections</td>
              <td>Up to 1 year</td>
            </tr>
          </tbody>
        </table>

        <h2>3) Third-Party Cookies</h2>
        <ul>
          <li><strong>Vercel Analytics:</strong> Helps us understand site performance and usage patterns</li>
          <li><strong>Appsmith:</strong> Powers our admin dashboard and internal tools</li>
          <li><strong>Cloudflare:</strong> Provides security and performance optimization</li>
        </ul>

        <h2>4) Local Storage</h2>
        <p>
          We also use browser local storage and session storage to:
        </p>
        <ul>
          <li>Maintain your authentication state between sessions</li>
          <li>Store conversation context for improved AI responses</li>
          <li>Remember your UI preferences and settings</li>
          <li>Cache data for faster page loading</li>
        </ul>

        <h2>5) Managing Cookies</h2>
        <p>You can control cookies through:</p>
        <ul>
          <li><strong>Browser Settings:</strong> Most browsers allow you to block or delete cookies</li>
          <li><strong>Essential Cookies:</strong> Cannot be disabled as they are necessary for core functionality</li>
          <li><strong>Analytics:</strong> You can opt out of performance tracking in your browser settings</li>
        </ul>

        <div className="intro-card" style={{ margin: '20px 0' }}>
          <strong>Note:</strong> Disabling essential cookies may prevent proper authentication and core features from working.
        </div>

        <h2>6) Cookie Consent</h2>
        <p>
          By using Awakeverse, you consent to our use of essential cookies required for site functionality. 
          Optional analytics cookies are only used where permitted by your browser settings and applicable law.
        </p>

        <h2>7) Updates</h2>
        <p>
          We may update this Cookie Policy to reflect changes in our practices or applicable laws. 
          Material changes will be communicated through our service or by email.
        </p>

        <h2>8) Contact</h2>
        <p>
          For questions about our use of cookies, contact us at <a href="mailto:privacy@awakeverse.com">privacy@awakeverse.com</a>.
        </p>
      </main>

      <footer className="document-footer">
        <p>© {currentYear} Awakeverse Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}