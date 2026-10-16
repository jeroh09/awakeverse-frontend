// src/landing/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/footer.css';

export default function Footer() {
  return (
    <footer className="landing-footer">
      <div className="footer-container">

        <div className="footer-content">

          {/* Company */}
          <div className="footer-section">
            <h4 className="footer-title">Company</h4>
            <div className="footer-links">
              <Link to="/about"      className="footer-link">About Us</Link>
              <Link to="/contact-us" className="footer-link">Contact Us</Link>
              <Link to="/careers"    className="footer-link">Careers</Link>
            </div>
          </div>

          {/* Product */}
          <div className="footer-section">
            <h4 className="footer-title">Product</h4>
            <div className="footer-links">
              <Link to="/pricing"   className="footer-link">Pricing</Link>
              <Link to="/features"  className="footer-link">Features</Link>
              <Link to="/creators"  className="footer-link">Creators</Link>
              <a
                href="https://docs.awakeverse.com"
                className="footer-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation
              </a>
              {/* Enterprise cross-domain link */}
              <a
                href="https://enterprise.awakeverse.com"
                className="footer-link footer-link-enterprise"
                target="_blank"
                rel="noopener noreferrer"
              >
                Enterprise ↗
              </a>
            </div>
          </div>

          {/* Legal */}
          <div className="footer-section">
            <h4 className="footer-title">Legal</h4>
            <div className="footer-links">
              <Link to="/terms"                className="footer-link">Terms of Service</Link>
              <Link to="/privacy"              className="footer-link">Privacy Policy</Link>
              <Link to="/community-guidelines" className="footer-link">Community Guidelines</Link>
            </div>
          </div>

          {/* Use Cases */}
          <div className="footer-section">
            <h4 className="footer-title">Use Cases</h4>
            <div className="footer-links">
              <Link to="/use-cases/creative"  className="footer-link">Creative</Link>
              <Link to="/use-cases/education" className="footer-link">Education</Link>
              <Link to="/use-cases/business"  className="footer-link">Business</Link>
              <Link to="/use-cases/debate"    className="footer-link">Debate</Link>
            </div>
          </div>

          {/* Support */}
          <div className="footer-section">
            <h4 className="footer-title">Support</h4>
            <div className="footer-links">
              <Link to="/help"    className="footer-link">Help Center</Link>
              <Link to="/support" className="footer-link">Contact Support</Link>
              <a href="mailto:hello@awakeverse.com" className="footer-link">
                hello@awakeverse.com
              </a>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            © 2026 AwakeVerse Ltd. All rights reserved.
          </div>
          <div className="footer-extra">
            <span className="footer-tagline">Conversations without Limits</span>
          </div>
        </div>

      </div>
    </footer>
  );
}