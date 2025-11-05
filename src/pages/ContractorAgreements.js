// src/pages/ContractorAgreements.js
import React from 'react';

export default function ContractorAgreements() {
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
        
        .placeholder-notice {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 16px;
          border-radius: 8px;
          margin: 24px 0;
        }
      `}</style>

      <header className="document-header">
        <nav className="site-nav">
          <a href="/">Home</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/community-guidelines">Community</a>
        </nav>
        <h1>AwakeVerse — Contractor Agreements</h1>
        <p className="meta">Coming Soon</p>
        <div className="intro-card">
          Terms and agreements for contractors, contributors, and third-party collaborators working with AwakeVerse.
        </div>
      </header>

      <main className="document-main">
        <div className="placeholder-notice">
          <strong>Notice:</strong> This page is under development. Contractor agreements and contributor terms will be published here soon.
        </div>

        <h2>1) Coming Soon</h2>
        <p>We are currently developing comprehensive contractor and contributor agreements that will cover:</p>
        <ul>
          <li>Contractor relationship terms</li>
          <li>Intellectual property assignments</li>
          <li>Confidentiality and non-disclosure requirements</li>
          <li>Payment terms and project deliverables</li>
          <li>Compliance and legal obligations</li>
        </ul>

        <h2>2) Current Inquiries</h2>
        <p>For partnership or contractor inquiries, please contact: <a href="mailto:partnerships@awakeverse.com">partnerships@awakeverse.com</a></p>
      </main>

      <footer className="document-footer">
        <p>© {currentYear} AwakeVerse Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}