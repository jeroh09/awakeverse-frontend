// src/components/MarketHub/LeaderboardSection.jsx
import React, { useState } from 'react';
import { Trophy, TrendingUp, Calendar, Award, Eye, Heart, Crown } from 'lucide-react';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import styles from './LeaderboardSection.module.css';

const LeaderboardSection = ({ compact = false }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  
  const { 
    rankings, 
    loading, 
    error, 
    period,
    totalEntries,
    refetch 
  } = useLeaderboard({ 
    period: selectedPeriod, 
    limit: compact ? 5 : 10 
  });

  const periods = [
    { value: 'week', label: 'This Week', icon: Calendar },
    { value: 'month', label: 'This Month', icon: TrendingUp },
    { value: 'all_time', label: 'All Time', icon: Award }
  ];

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '👑';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const getRankClass = (rank) => {
    switch (rank) {
      case 1: return styles.firstPlace;
      case 2: return styles.secondPlace;
      case 3: return styles.thirdPlace;
      default: return '';
    }
  };

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Trophy className={styles.headerIcon} size={20} />
          <h3>Leaderboard</h3>
        </div>
        <div className={styles.errorState}>
          <p>Unable to load leaderboard</p>
          <button onClick={refetch} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Trophy className={styles.headerIcon} size={20} />
        <h3>Leaderboard</h3>
      </div>

      {/* Period Selector */}
      <div className={styles.periodSelector}>
        {periods.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            className={`${styles.periodButton} ${
              selectedPeriod === value ? styles.active : ''
            }`}
            onClick={() => setSelectedPeriod(value)}
          >
            <Icon size={14} />
            {compact ? value : label}
          </button>
        ))}
      </div>

      {/* Rankings */}
      <div className={styles.rankings}>
        {loading ? (
          <div className={styles.loadingState}>
            {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
              <div key={i} className={styles.loadingRank} />
            ))}
          </div>
        ) : rankings.length > 0 ? (
          <>
            {rankings.map((character, index) => (
              <div 
                key={character.character_id || index}
                className={`${styles.rankItem} ${getRankClass(character.rank)}`}
              >
                <div className={styles.rankNumber}>
                  {getRankIcon(character.rank) || `#${character.rank}`}
                </div>
                
                <img
                  src={character.avatar_url}
                  alt={character.display_name}
                  className={styles.avatar}
                  onError={(e) => {
                    e.target.src = '/images/default-character.jpg';
                  }}
                />
                
                <div className={styles.characterInfo}>
                  <h4 className={styles.characterName}>
                    {character.display_name}
                  </h4>
                  <p className={styles.creatorName}>
                    {character.creator_name}
                  </p>
                  
                  <div className={styles.stats}>
                    <div className={styles.stat}>
                      <Eye size={12} />
                      <span>{character.period_views || 0}</span>
                    </div>
                    <div className={styles.stat}>
                      <Heart size={12} />
                      <span>{character.period_likes || 0}</span>
                    </div>
                  </div>
                </div>

                {character.creator_level && (
                  <div className={styles.creatorLevel}>
                    {character.creator_level === 'veteran_creator' && <Crown size={12} />}
                    <span>{character.creator_level.replace('_', ' ')}</span>
                  </div>
                )}
              </div>
            ))}

            {totalEntries > rankings.length && (
              <div className={styles.moreInfo}>
                <p>+{totalEntries - rankings.length} more creators</p>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <Trophy className={styles.emptyIcon} size={32} />
            <p>No rankings available</p>
            <span>Check back soon!</span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {!compact && rankings.length > 0 && (
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Rankings update every hour based on engagement metrics
          </p>
        </div>
      )}
    </div>
  );
};

export default LeaderboardSection;