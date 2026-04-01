// src/landing/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/header.css';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Track scroll position for header background effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMobileMenuOpen && !e.target.closest('.header-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Skip link for keyboard users */}
      <a href="#hero" className="skip-link">
        Skip to main content
      </a>

      <header className={`landing-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-container">

          {/* Logo */}
          <Link to="/" className="header-logo">
            AwakeVerse
          </Link>

          {/* Desktop Navigation */}
          <nav className="header-nav desktop-nav">
            <a
              href="https://blog.awakeverse.com/blog/"
              className="nav-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Blog
            </a>
            <Link to="/terms" className="nav-link">Terms</Link>
            <Link to="/privacy" className="nav-link">Privacy</Link>
            <Link to="/contact-us" className="nav-link">Contact</Link>
          </nav>

          {/* Auth Buttons */}
          <div className="header-auth">
            <Link to="/login" className="auth-button sign-in">
              Sign In
            </Link>
            <Link to="/register" className="auth-button sign-up">
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="header-nav mobile-nav">
            <a
              href="https://blog.awakeverse.com/blog/"
              className="nav-link"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Blog
            </a>
            <Link
              to="/terms"
              className="nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className="nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Privacy
            </Link>
            <Link
              to="/contact-us"
              className="nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="mobile-nav-divider"></div>
            <Link
              to="/login"
              className="nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="nav-link primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sign Up
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}