// src/pages/SourcesLicences.js
import React from 'react';

export default function SourcesLicences() {
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
        code { background: #f3f5fa; padding: 2px 5px; border-radius: 6px; font-size: 0.9rem; }
      `}</style>

      <header className="document-header">
        <nav className="site-nav">
          <a href="/">Home</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/community-guidelines">Community</a>
        </nav>
        <h1>Awakeverse — Sources & Licences</h1>
        <p className="meta">Effective: 19 August 2025 • Last updated: 19 August 2025</p>
        <div className="intro-card">
          This page lists the open source software, training data sources, and third-party licences used by Awakeverse.
        </div>
      </header>

      <main className="document-main">
        <h2>1) Training Data Sources</h2>
        <ul>
          <li><strong>Project Gutenberg:</strong> Public domain literary works used in the training of our AI models. All Project Gutenberg materials are in the public domain and freely usable.</li>
          <li><strong>Model Training:</strong> Our AI characters are powered by Mistral models trained on publicly available datasets.</li>
        </ul>

        <h2>2) AI Models & Services</h2>
        <ul>
          <li><strong>Mistral Small:</strong> Used for character responses and conversation generation</li>
          <li><strong>Llama 3.2:</strong> Used for specific reasoning and analysis tasks</li>
          <li><strong>Sentence Transformers:</strong> Used for text embeddings and semantic search (v2.2.2)</li>
          <li><strong>Ollama:</strong> Local AI model serving infrastructure</li>
        </ul>

        <h2>3) Open Source Dependencies</h2>
        <p>Awakeverse uses numerous open source libraries. Key dependencies include:</p>
        
        <h3>Backend (Python)</h3>
        <ul>
          <li><strong>Flask:</strong> Web framework (v2.3.2) - BSD License</li>
          <li><strong>SQLAlchemy:</strong> Database ORM (v1.4.53) - MIT License</li>
          <li><strong>Redis:</strong> Caching and session storage (v6.2.0) - BSD License</li>
          <li><strong>Haystack:</strong> NLP framework (v1.21.1) - Apache 2.0 License</li>
          <li><strong>spaCy:</strong> Natural language processing (v3.5.x) - MIT License</li>
          <li><strong>FAISS:</strong> Vector similarity search (v1.7.4) - MIT License</li>
          <li><strong>Transformers:</strong> HuggingFace models (v4.25.1) - Apache 2.0 License</li>
          <li><strong>PyJWT:</strong> JSON Web Token implementation - MIT License</li>
          <li><strong>Flask-SocketIO:</strong> Real-time communication - MIT License</li>
        </ul>

        <h3>Frontend (JavaScript/React)</h3>
        <ul>
          <li><strong>React:</strong> UI framework - MIT License</li>
          <li><strong>React Router:</strong> Client-side routing - MIT License</li>
          <li><strong>Lucide React:</strong> Icon library - ISC License</li>
          <li><strong>Tailwind CSS:</strong> Utility-first CSS framework - MIT License</li>
        </ul>

        <h2>4) Third-Party Services</h2>
        <ul>
          <li><strong>Vercel:</strong> Frontend hosting and deployment</li>
          <li><strong>Digital Ocean:</strong> Backend server hosting</li>
          <li><strong>Neon:</strong> PostgreSQL database hosting</li>
          <li><strong>SendGrid:</strong> Email delivery service</li>
          <li><strong>Cloudflare:</strong> CDN and DNS management</li>
          <li><strong>Hostinger:</strong> Domain registration</li>
        </ul>

        <h2>5) Attribution Requirements</h2>
        <p>Where required by licence terms, we provide the following attributions:</p>
        <ul>
          <li>This software includes components licensed under the MIT, BSD, Apache 2.0, and ISC licenses.</li>
          <li>Complete source code for open source components is available from their respective repositories.</li>
          <li>Training data from Project Gutenberg is used under public domain terms.</li>
        </ul>

        <h2>6) Licence Compliance</h2>
        <p>We maintain compliance with all applicable open source licences. For questions about specific licence terms or to request source code where required, contact <a href="mailto:legal@awakeverse.com">legal@awakeverse.com</a>.</p>
      </main>

      <footer className="document-footer">
        <p>© {currentYear} Awakeverse Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}