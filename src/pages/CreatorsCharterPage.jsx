// CreatorsCharterPage.jsx - FINAL VERSION
// Location: src/pages/CreatorsCharterPage.jsx
// All fixes applied - Ready for production

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CreatorsCharterPage.module.css';

const CreatorsCharterPage = () => {
  const navigate = useNavigate();
  
  // Video refs for programmatic control
  const chatVideoRef = useRef(null);
  const storyVideoRef = useRef(null);
  const debateVideoRef = useRef(null);

  useEffect(() => {
    // Ensure videos loop and autoplay
    const videos = [chatVideoRef.current, storyVideoRef.current, debateVideoRef.current];
    videos.forEach(video => {
      if (video) {
        video.play().catch(err => console.log('Video autoplay prevented:', err));
      }
    });
  }, []);

  const handleJoinCharter = () => {
    navigate('/register?source=charter');
  };

  const handleLearnMore = () => {
    document.getElementById('benefits-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDownloadSample = () => {
    window.open('/api/ip-certificates/sample', '_blank');
  };

  return (
    <div className={styles.charterPage}>
      
      {/* ===================================================================
          SECTION 1: HERO - SPLIT SCREEN
          =================================================================== */}
      <section className={styles.heroSection}>
        <div className={styles.heroBackground}></div>
        
        <div className={styles.heroContent}>
          <h1 className={styles.heroHeadline}>
            Stop <span className={styles.highlight}>Renting</span> Your Character.<br />
            Own Your Future.
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
              <p className={styles.panelDescription}>
                On other platforms, you're just renting space. 
                They control your character, keep most revenue, and can 
                remove you anytime. No rights, no protection.
              </p>
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
              <p className={styles.panelDescription}>
                With AwakeVerse, you own your original characters completely. 
                Platform certification, 80% revenue share, cross-platform rights, 
                and creative control. Protected forever.
              </p>
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
          SECTION 2: THREE MODES (WITH YOUR MP4s) - PERFECT, DON'T TOUCH!
          =================================================================== */}
      <section className={styles.threeModesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Character, Three Powerful Ways</h2>
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
            <p className={styles.modeDescription}>
              One-on-one conversations. Deep discussions, 
              Q&A sessions, personalized interactions with your characters.
            </p>
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
            <p className={styles.modeDescription}>
              Narrative experiences. Interactive tales, 
              branching storylines, immersive adventures with your creations.
            </p>
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
            <p className={styles.modeDescription}>
              Multi-character interactions. Historical debates, 
              panel discussions, collaborative analysis across personas.
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 3: CHARTER BENEFITS
          =================================================================== */}
      <section id="benefits-section" className={styles.benefitsSection}>
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
              Keep 80% of all revenue your characters generate. Your work, your earnings. 
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
          SECTION 4: PLACEHOLDER (Steps 5-6)
          =================================================================== */}
      <section className={styles.finalCtaSection}>
        <div className={styles.placeholder}>
          <p>Final CTA Section - Coming in Steps 5-6</p>
        </div>
      </section>

    </div>
  );
};

export default CreatorsCharterPage;