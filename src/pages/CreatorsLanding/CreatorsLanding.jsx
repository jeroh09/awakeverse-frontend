// src/pages/CreatorsLanding/CreatorsLanding.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Zap, 
  Users, 
  Trophy, 
  Star, 
  TrendingUp,
  Eye,
  Heart,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import styles from './CreatorsLanding.module.css';

const CreatorsLanding = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleStartCreating = () => {
    try {
      navigate('/register');
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/register';
    }
  };

  const handleLearnMore = () => {
    try {
      navigate('/pricing');
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/pricing';
    }
  };

  return (
    <div className={styles.container}>
      <HeroSection 
        onStartCreating={handleStartCreating}
        onLearnMore={handleLearnMore}
      />
      <CreatorSpotlight />
      <HowItWorks />
      <AchievementCards />
      <FinalCTA onStartCreating={handleStartCreating} />
    </div>
  );
};

// Placeholder components - will be filled in Step 2
  // HERO SECTION - Replace the placeholder
  const HeroSection = ({ onStartCreating, onLearnMore }) => {
    return (
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Turn Your Characters Into Income
          </h1>
          <p className={styles.heroSubtitle}>
            Join 500+ creators earning $50-$500/month by publishing AI characters to our thriving marketplace
          </p>

          <div className={styles.heroCTAs}>
            <button 
              className={styles.primaryCTA}
              onClick={onStartCreating}
            >
              Start Creating
              <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </button>

            <button 
              className={styles.secondaryCTA}
              onClick={onLearnMore}
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <Eye size={24} className={styles.statIcon} />
            <div className={styles.statValue}>12.4K+</div>
            <div className={styles.statLabel}>Monthly Views</div>
          </div>

          <div className={styles.statItem}>
            <Users size={24} className={styles.statIcon} />
            <div className={styles.statValue}>500+</div>
            <div className={styles.statLabel}>Active Creators</div>
          </div>

          <div className={styles.statItem}>
            <DollarSign size={24} className={styles.statIcon} />
            <div className={styles.statValue}>$0.42</div>
            <div className={styles.statLabel}>Avg Per Chat</div>
          </div>

          <div className={styles.statItem}>
            <Heart size={24} className={styles.statIcon} />
            <div className={styles.statValue}>847</div>
            <div className={styles.statLabel}>Favorites</div>
          </div>
        </div>
      </section>
    );
  };

    // CREATOR SPOTLIGHT CAROUSEL - Replace the existing CreatorSpotlight
  const CreatorSpotlight = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const creators = [
      {
        name: 'Rachael Chen',
        image: '/images/rachael.jpg',
        category: 'Philosophy Characters',
        earnings: '$247/month',
        characters: '8 characters',
        badge: 'Rising Star',
        quote: 'My Socrates character reached 10K chats in the first month'
      },
      {
        name: 'Alexandra Torres',
        image: '/images/alexandra.jpg',
        category: 'Science Educators',
        earnings: '$389/month',
        characters: '5 characters',
        badge: 'Veteran Creator',
        quote: 'Creating Marie Curie has become my creative passion project'
      },
      {
        name: 'Simon Blackwell',
        image: '/images/simon.jpg',
        category: 'Historical Figures',
        earnings: '$156/month',
        characters: '3 characters',
        badge: 'Trending',
        quote: 'I earned my first $100 in just 3 weeks'
      },
      {
        name: 'Maya Patel',
        image: '/images/maya.jpg',
        category: 'Literary Characters',
        earnings: '$312/month',
        characters: '6 characters',
        badge: 'Top Creator',
        quote: 'Building Shakespeare and Austen characters has been incredibly rewarding'
      },
      {
        name: 'James Morrison',
        image: '/images/james.jpg',
        category: 'Business Mentors',
        earnings: '$198/month',
        characters: '4 characters',
        badge: 'Rising Star',
        quote: 'My entrepreneur characters help thousands learn business skills'
      },
      {
        name: 'Sofia Rodriguez',
        image: '/images/sofia.jpg',
        category: 'Art & Culture',
        earnings: '$425/month',
        characters: '9 characters',
        badge: 'Elite Creator',
        quote: 'From Da Vinci to Frida Kahlo, bringing art history to life'
      }
    ];

    // Auto-advance carousel
    useEffect(() => {
      if (!isAutoPlaying) return;

      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % creators.length);
      }, 5000);

      return () => clearInterval(interval);
    }, [isAutoPlaying, creators.length]);

    const nextSlide = () => {
      setIsAutoPlaying(false);
      setCurrentIndex((prev) => (prev + 1) % creators.length);
    };

    const prevSlide = () => {
      setIsAutoPlaying(false);
      setCurrentIndex((prev) => (prev - 1 + creators.length) % creators.length);
    };

    const goToSlide = (index) => {
      setIsAutoPlaying(false);
      setCurrentIndex(index);
    };

    return (
      <section className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionHeader}>
            <Star size={28} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Meet Our Top Creators</h2>
          </div>
          <p className={styles.sectionSubtext}>
            Real people building successful character portfolios
          </p>

          <div className={styles.carouselContainer}>
            {/* Previous Button */}
            <button 
              className={styles.carouselButton + ' ' + styles.carouselButtonPrev}
              onClick={prevSlide}
              aria-label="Previous creator"
            >
              ‹
            </button>

            {/* Carousel Track */}
            <div className={styles.carouselTrack}>
              <div 
                className={styles.carouselSlides}
                style={{ 
                  transform: `translateX(-${currentIndex * 100}%)`,
                  transition: 'transform 0.5s ease-in-out'
                }}
              >
                {creators.map((creator, index) => (
                  <div key={index} className={styles.carouselSlide}>
                    <div className={styles.creatorCard}>
                      <div className={styles.creatorImageWrapper}>
                        <img
                          src={creator.image}
                          alt={creator.name}
                          className={styles.creatorImage}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120"%3E%3Crect fill="%23334155" width="120" height="120"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23fff" font-size="14"%3ECreator%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <div className={styles.creatorBadge}>{creator.badge}</div>
                      </div>

                      <div className={styles.creatorInfo}>
                        <h3 className={styles.creatorName}>{creator.name}</h3>
                        <p className={styles.creatorCategory}>{creator.category}</p>

                        <div className={styles.creatorStats}>
                          <span className={styles.creatorEarnings}>{creator.earnings}</span>
                          <span className={styles.creatorDivider}>•</span>
                          <span className={styles.creatorCharacters}>{creator.characters}</span>
                        </div>

                        <p className={styles.creatorQuote}>"{creator.quote}"</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Button */}
            <button 
              className={styles.carouselButton + ' ' + styles.carouselButtonNext}
              onClick={nextSlide}
              aria-label="Next creator"
            >
              ›
            </button>
          </div>

          {/* Carousel Indicators */}
          <div className={styles.carouselIndicators}>
            {creators.map((_, index) => (
              <button
                key={index}
                className={`${styles.carouselDot} ${
                  index === currentIndex ? styles.carouselDotActive : ''
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Auto-play toggle */}
          <button 
            className={styles.autoPlayToggle}
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          >
            {isAutoPlaying ? 'Pause' : 'Play'} Auto-scroll
          </button>
        </div>
      </section>
    );
  };

  // HOW IT WORKS - Replace the placeholder
  const HowItWorks = () => {
    const steps = [
      {
        icon: Zap,
        title: 'Create & Publish',
        description: 'Design your character with our intuitive tools, get approved by our quality team, and publish to the marketplace where thousands of users discover new characters daily.'
      },
      {
        icon: Search,
        title: 'Users Discover & Chat',
        description: 'Community members find your character through search, recommendations, and featured placements. Each conversation showcases your creative work.'
      },
      {
        icon: Users,
        title: 'Earn Per Interaction',
        description: 'Get paid for every meaningful engagement with your characters. Track your earnings in real-time and withdraw monthly. The more engaging your character, the more you earn.'
      }
    ];

    return (
      <section className={styles.sectionAlt}>
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <p className={styles.sectionSubtext}>
            Three simple steps to start earning
          </p>

          <div className={styles.stepsGrid}>
            {steps.map((step, index) => (
              <div key={index} className={styles.stepCard}>
                <div className={styles.stepNumber}>{index + 1}</div>
                <div className={styles.stepIconWrapper}>
                  <step.icon size={32} className={styles.stepIcon} />
                </div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // ACHIEVEMENT CARDS - Replace the placeholder
  const AchievementCards = () => {
    const achievements = [
      {
        icon: Trophy,
        title: 'First 1,000 Chats',
        description: 'Unlock trending badge and featured placement',
        color: 'gold'
      },
      {
        icon: Star,
        title: '5 Characters Published',
        description: 'Veteran Creator status and priority support',
        color: 'purple'
      },
      {
        icon: TrendingUp,
        title: 'Top 10 Leaderboard',
        description: 'Featured spotlight and exclusive creator tools',
        color: 'gold'
      },
      {
        icon: Users,
        title: '10K Total Views',
        description: 'Elite creator badge and premium analytics',
        color: 'purple'
      }
    ];

    return (
      <section className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionHeader}>
            <Trophy size={28} className={styles.sectionIconGold} />
            <h2 className={styles.sectionTitle}>Level Up As a Creator</h2>
          </div>
          <p className={styles.sectionSubtext}>
            Earn recognition, unlock features, and build your reputation
          </p>

          <div className={styles.achievementGrid}>
            {achievements.map((achievement, index) => (
              <div key={index} className={styles.achievementCard}>
                <div className={`${styles.achievementIconWrapper} ${
                  achievement.color === 'gold' ? styles.achievementIconGold : styles.achievementIconPurple
                }`}>
                  <achievement.icon size={32} className={styles.achievementIcon} />
                </div>
                <h3 className={styles.achievementTitle}>{achievement.title}</h3>
                <p className={styles.achievementDescription}>{achievement.description}</p>
              </div>
            ))}
          </div>

          {/* Progress Bar Example */}
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>Your Progress</span>
              <span className={styles.progressValue}>Rising Star → Veteran Creator</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill}></div>
            </div>
            <p className={styles.progressSubtext}>
              65% complete • 350 more chats to reach Veteran status
            </p>
          </div>
        </div>
      </section>
    );
  };

  // FINAL CTA - Replace the placeholder
  const FinalCTA = ({ onStartCreating }) => {
    return (
      <section className={styles.finalCTA}>
        <div className={styles.ctaContent}>
          <div className={styles.ctaBadge}>
            <Star size={16} />
            <span>Join 500+ Creators</span>
          </div>

          <h2 className={styles.ctaTitle}>Ready to Start Earning?</h2>
          <p className={styles.ctaSubtext}>
            Create your first character today and join our thriving creator community. 
            No upfront costs, just your creativity and our platform.
          </p>

          <div className={styles.ctaStats}>
            <div className={styles.ctaStat}>
              <div className={styles.ctaStatValue}>$247</div>
              <div className={styles.ctaStatLabel}>Avg Monthly Earnings</div>
            </div>
            <div className={styles.ctaStat}>
              <div className={styles.ctaStatValue}>3 weeks</div>
              <div className={styles.ctaStatLabel}>Avg First Payout</div>
            </div>
            <div className={styles.ctaStat}>
              <div className={styles.ctaStatValue}>92%</div>
              <div className={styles.ctaStatLabel}>Creator Satisfaction</div>
            </div>
          </div>

          <button className={styles.ctaButton} onClick={onStartCreating}>
            Create Your Account
            <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </button>

          <p className={styles.ctaFootnote}>
            Free to start • No credit card required • Get paid monthly
          </p>
        </div>
      </section>
    );
  };
export default CreatorsLanding;