// CreatorsCharterPage.jsx - FINAL VERSION WITH BULLETED LISTS
// Location: src/pages/CreatorsCharterPage.jsx

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CreatorsCharterPage.module.css';

const CreatorsCharterPage = () => {
  const navigate = useNavigate();
  
  // Video refs for programmatic control
  const chatVideoRef = useRef(null);
  const storyVideoRef = useRef(null);
  const debateVideoRef = useRef(null);

  // Scroll spy state for navigation dots
  const [activeSection, setActiveSection] = React.useState('hero');

  useEffect(() => {
    // Ensure videos loop and autoplay
    const videos = [chatVideoRef.current, storyVideoRef.current, debateVideoRef.current];
    videos.forEach(video => {
      if (video) {
        video.play().catch(err => console.log('Video autoplay prevented:', err));
      }
    });

    // Scroll spy - detect which section is in view
    const handleScroll = () => {
      const sections = ['hero', 'modes', 'benefits', 'certificate'];
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleJoinCharter = () => {
    navigate('/register?source=charter');
  };

  const handleLearnMore = () => {
    document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDownloadSample = () => {
    window.open('/api/ip-certificates/sample', '_blank');
  };

  return (
    <div className={styles.charterPage}>
      
      {/* ===================================================================
          HEADER NAVIGATION
          =================================================================== */}
      <header className={styles.charterHeader}>
        <div className={styles.headerContainer}>
          {/* Left: AwakeVerse Branding */}
          <div className={styles.branding}>
            <a href="/" className={styles.brandLink}>
              <span className={styles.brandName}>AwakeVerse</span>
            </a>
          </div>

          {/* Right: Auth Buttons */}
          <div className={styles.headerAuth}>
            <button 
              onClick={() => navigate('/register')} 
              className={styles.headerBtnSignup}
            >
              Sign Up
            </button>
            <button 
              onClick={() => navigate('/login')} 
              className={styles.headerBtnSignin}
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================
          SCROLL NAVIGATION DOTS
          =================================================================== */}
      <nav className={styles.scrollNav}>
        <button
          className={`${styles.navDot} ${activeSection === 'hero' ? styles.active : ''}`}
          onClick={() => scrollToSection('hero')}
          aria-label="Navigate to Hero section"
        >
          <span className={styles.navLabel}>Hero</span>
        </button>
        <button
          className={`${styles.navDot} ${activeSection === 'modes' ? styles.active : ''}`}
          onClick={() => scrollToSection('modes')}
          aria-label="Navigate to Modes section"
        >
          <span className={styles.navLabel}>Modes</span>
        </button>
        <button
          className={`${styles.navDot} ${activeSection === 'benefits' ? styles.active : ''}`}
          onClick={() => scrollToSection('benefits')}
          aria-label="Navigate to Benefits section"
        >
          <span className={styles.navLabel}>Benefits</span>
        </button>
        <button
          className={`${styles.navDot} ${activeSection === 'certificate' ? styles.active : ''}`}
          onClick={() => scrollToSection('certificate')}
          aria-label="Navigate to Certificate section"
        >
          <span className={styles.navLabel}>Certificate</span>
        </button>
      </nav>
      
      {/* ===================================================================
          SECTION 1: HERO - SPLIT SCREEN WITH BULLETED LISTS
          =================================================================== */}
      <section id="hero" className={styles.heroSection}>
        <div className={styles.heroBackground}></div>
        
        <div className={styles.heroContent}>
          <h1 className={styles.heroHeadline}>
            Stop <span className={styles.highlight}>Renting</span> Your Character.<br />
            Own Its Future.
          </h1>
          
          <p className={styles.heroSubheadline}>
            Join the Creator's Charter and get platform-certified ownership, 
            80% revenue share, and full creative control. Your original characters, your rights, forever.
          </p>

          {/* Split Screen Comparison */}
          <div className={styles.splitScreen}>
            {/* LEFT: Renting (Faded) */}
            <div 
              className={`${styles.splitPanel} ${styles.renting}`}
              style={{
                backgroundImage: 'url(/images/charter/hero/background-renting.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <h3 className={styles.panelLabel}>Not Yours</h3>
              <ul className={styles.bulletList}>
                <li>You're renting platform space</li>
                <li>They control your character rights</li>
                <li>Platform keeps most revenue</li>
                <li>No ownership protection</li>
              </ul>
            </div>

            {/* RIGHT: Owning (Glowing) */}
            <div 
              className={`${styles.splitPanel} ${styles.owning}`}
              style={{
                backgroundImage: 'url(/images/charter/hero/background-owning.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className={styles.certificationBadge}>✓ Certified</div>
              <h3 className={styles.panelLabel}>Truly Yours</h3>
              <ul className={styles.bulletList}>
                <li>Platform-certified ownership</li>
                <li>80% revenue share forever</li>
                <li>Cross-platform character rights</li>
              </ul>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className={styles.heroCta}>
            <button onClick={handleJoinCharter} className={styles.btnPrimary}>
              Join the Charter
            </button>
            <button onClick={handleLearnMore} className={styles.btnSecondary}>
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 2: THREE MODES WITH BULLETED LISTS
          =================================================================== */}
      <section id="modes" className={styles.threeModesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Character, Three Powerful Interactive Modes</h2>
          <p className={styles.sectionSubtitle}>
            From intimate conversations to epic debates—your characters come alive across multiple interaction modes.
          </p>
        </div>

        <div className={styles.modeStations}>
          {/* Mode 1: Single Chat */}
          <div className={styles.modeStation}>
            <div className={styles.modeVideo}>
              <video
                ref={chatVideoRef}
                src="/videos/charter/sherlock-study.mp4"
                className={styles.videoLoop}
                loop
                muted
                autoPlay
                playsInline
                poster="/images/charter/three-modes/chat-poster.jpg"
              >
                Your browser does not support video playback.
              </video>
            </div>
            <div className={styles.modeIcon}>💬</div>
            <h3 className={styles.modeName}>Single Chat</h3>
            <ul className={styles.modeBulletList}>
              <li>One-on-one conversations</li>
              <li>Deep character discussions</li>
              <li>Personalized interactions</li>
              <li>Intimate character moments</li>
            </ul>
          </div>

          {/* Mode 2: Story Mode */}
          <div className={styles.modeStation}>
            <div className={styles.modeVideo}>
              <video
                ref={storyVideoRef}
                src="/videos/charter/sherlock-crime-scene.mp4"
                className={styles.videoLoop}
                loop
                muted
                autoPlay
                playsInline
                poster="/images/charter/three-modes/story-poster.jpg"
              >
                Your browser does not support video playback.
              </video>
            </div>
            <div className={styles.modeIcon}>📖</div>
            <h3 className={styles.modeName}>Story Mode</h3>
            <ul className={styles.modeBulletList}>
              <li>Narrative experiences</li>
              <li>Interactive branching tales</li>
              <li>Immersive adventures</li>
              <li>Character-driven stories</li>
            </ul>
          </div>

          {/* Mode 3: Debate Scenarios */}
          <div className={styles.modeStation}>
            <div className={styles.modeVideo}>
              <video
                ref={debateVideoRef}
                src="/videos/charter/girl-pitching-debate.mp4"
                className={styles.videoLoop}
                loop
                muted
                autoPlay
                playsInline
                poster="/images/charter/three-modes/debate-poster.jpg"
              >
                Your browser does not support video playback.
              </video>
            </div>
            <div className={styles.modeIcon}>⚔️</div>
            <h3 className={styles.modeName}>Debate Scenarios</h3>
            <ul className={styles.modeBulletList}>
              <li>Multi-character interactions</li>
              <li>Deep analysis discussions</li>
              <li>Panel-style conversations</li>
              <li>Collaborative analysis</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 3: CHARTER BENEFITS
          =================================================================== */}
      <section id="benefits" className={styles.benefitsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Creator Benefits</h2>
          <p className={styles.sectionSubtitle}>
            Join the Creator's Charter and unlock platform-certified ownership with real protections and control.
          </p>
        </div>

        <div className={styles.benefitsGrid}>
          {/* Benefit 1: Breaking Free */}
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}>🦅</div>
            <h3 className={styles.benefitTitle}>Breaking Free</h3>
            <p className={styles.benefitDescription}>
              Escape the constraints of traditional platforms. No more arbitrary rules, 
              sudden policy changes, or losing access to your own creations.
            </p>
          </div>

          {/* Benefit 2: Golden Harvest */}
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}>🌾</div>
            <h3 className={styles.benefitTitle}>Golden Harvest</h3>
            <p className={styles.benefitDescription}>
              Publish to Market Hub, let others discover, 
              keep 80% of all engagement revenue. 
              Your work, your earnings. 
              We only take what's fair to maintain the platform.
            </p>
          </div>

          {/* Benefit 3: Fortress Protection */}
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}>🏰</div>
            <h3 className={styles.benefitTitle}>Fortress Protection</h3>
            <p className={styles.benefitDescription}>
              Platform-certified ownership ensures your original characters are protected. 
              Your creations remain yours, with documented proof of authorship.
            </p>
          </div>

          {/* Benefit 4: Bridge to Everywhere */}
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}>🌉</div>
            <h3 className={styles.benefitTitle}>Bridge to Everywhere</h3>
            <p className={styles.benefitDescription}>
              Use your certified characters across multiple platforms. 
              True portability means your creations travel with you wherever you go.
            </p>
          </div>

          {/* Benefit 5: Strings Cut Free */}
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}>✂️</div>
            <h3 className={styles.benefitTitle}>Strings Cut Free</h3>
            <p className={styles.benefitDescription}>
              Complete creative control over your characters. Update, evolve, 
              and direct their development without platform interference.
            </p>
          </div>

          {/* Benefit 6: Lighthouse Clarity */}
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}>🗼</div>
            <h3 className={styles.benefitTitle}>Lighthouse Clarity</h3>
            <p className={styles.benefitDescription}>
              Full transparency in every transaction and policy. No hidden fees, 
              no surprise changes. Clear terms that respect your work and rights.
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 4: FINAL CTA + CERTIFICATE PREVIEW
          =================================================================== */}
      <section id="certificate" className={styles.finalCtaSection}>
        <div className={styles.finalCtaContainer}>
          
          {/* LEFT: Certificate Showcase - Featured + Peek */}
          <div className={styles.certificateShowcase}>
            {/* Featured: Queen Sheba (Large) */}
            <div className={`${styles.certificateCard} ${styles.featured}`}>
              <img 
                src="/images/charter/certificates/queen-sheba-certificate.png" 
                alt="Queen Sheba - Historical Character Certificate"
                className={styles.certificateImage}
              />
            </div>
            
            {/* Peek: Aeliana (Smaller, Behind) */}
            <div className={`${styles.certificateCard} ${styles.peek}`}>
              <img 
                src="/images/charter/certificates/aeliana-certificate.png" 
                alt="Aeliana the Shadowbound - Fantasy Character Certificate"
                className={styles.certificateImage}
              />
            </div>
          </div>

          {/* RIGHT: CTA Content */}
          <div className={styles.ctaContent}>
            <h2 className={styles.finalCtaTitle}>Claim Your Certificate Today</h2>
            
            {/* Key Benefits - Minimal */}
            <ul className={styles.benefitsList}>
              <li>✓ Platform-certified ownership</li>
              <li>✓ 80% revenue share forever</li>
              <li>✓ Cross-platform character rights</li>
            </ul>

            {/* £20 Bonus Callout - Conspicuous */}
            <div className={styles.bonusCallout}>
              <div className={styles.bonusHeader}>
                <span className={styles.bonusIcon}>🎁</span>
                <span className={styles.bonusAmount}>£20 BONUS</span>
              </div>
              <p className={styles.bonusText}>
                Limited offer: £20 bonus for first 500 certified characters
              </p>
              <button 
                className={styles.infoButton}
                onClick={() => alert('Terms & Conditions: First 100 creators who successfully migrate and certify an original character receive a £20 bonus. One bonus per creator. Character must meet platform quality standards. Offer subject to availability.')}
                aria-label="Terms and conditions"
              >
                ⓘ Terms & Conditions Apply
              </button>
            </div>

            {/* CTA Buttons */}
            <div className={styles.finalCtaButtons}>
              <button onClick={handleJoinCharter} className={styles.btnPrimary}>
                Join the Charter
              </button>
              <button onClick={handleDownloadSample} className={styles.btnSecondary}>
                Download Sample Certificate
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default CreatorsCharterPage;