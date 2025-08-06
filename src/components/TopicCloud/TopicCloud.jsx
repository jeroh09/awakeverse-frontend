import React, { useEffect, useState } from 'react';
import styles from './TopicCloud.module.css';

const TopicCloud = ({ topics, filterText, onSelect }) => {
  const [visible, setVisible] = useState(false);

  const getGlyphForTopic = (topic) => {
  const glyphMap = {
    'Detectives': '⌖', 
    'Astrologers': '☄',
    'Truthseekers': '⚭',
    'Mystics': '☯',
    'Entrepreneurs': '⚶',
    'Cupids': '❤',
    'Philosophers': 'Ψ',
    'Inventors': '⚙',
    'Strategos': '⚔'
  };
  return glyphMap[topic] || '✦';
};

  useEffect(() => {
    // trigger entry animation
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const filtered = topics.filter(t =>
    t.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className={`${styles.cloud} ${visible ? styles.enter : ''}`}>      
      {filtered.map(topic => (
        <div
          key={topic}
          className={styles.bubble}
          onClick={() => onSelect(topic)}
          data-glyph={getGlyphForTopic(topic)}
        >
          {topic}
        </div>
      ))}
    </div>
  );
};

export default TopicCloud;