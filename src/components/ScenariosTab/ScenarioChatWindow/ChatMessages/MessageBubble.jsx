// src/components/ScenariosTab/ScenarioChatWindow/ChatMessages/MessageBubble.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import SpeakerIndicator from './SpeakerIndicator';

// Smart emoticon mapper based on content analysis
const getContextualEmoticon = (text, elementType) => {
  const content = text?.toString().toLowerCase() || '';
  
  // Emotional/tonal analysis
  if (content.includes('!') || content.includes('amazing') || content.includes('wow') || content.includes('great')) {
    return '🎉';
  }
  if (content.includes('?') || content.includes('why') || content.includes('how') || content.includes('what')) {
    return '❓';
  }
  if (content.includes('important') || content.includes('key') || content.includes('critical')) {
    return '🔑';
  }
  if (content.includes('idea') || content.includes('think') || content.includes('thought')) {
    return '💡';
  }
  if (content.includes('money') || content.includes('cost') || content.includes('price') || content.includes('buy')) {
    return '💰';
  }
  if (content.includes('time') || content.includes('clock') || content.includes('schedule')) {
    return '⏰';
  }
  if (content.includes('love') || content.includes('heart') || content.includes('care')) {
    return '❤️';
  }
  if (content.includes('warning') || content.includes('danger') || content.includes('careful')) {
    return '⚠️';
  }
  if (content.includes('check') || content.includes('verify') || content.includes('confirm')) {
    return '✅';
  }
  if (content.includes('star') || content.includes('best') || content.includes('top')) {
    return '⭐';
  }
  if (content.includes('fire') || content.includes('hot') || content.includes('trending')) {
    return '🔥';
  }
  if (content.includes('cool') || content.includes('awesome') || content.includes('nice')) {
    return '😎';
  }
  
  // Default based on element type
  const defaults = {
    strong: '💪', // strength/emphasis
    li: '🔹',     // list items
    h1: '🎯',     // main heading
    h2: '📌',     // subheading
    h3: '👉',     // pointer
    blockquote: '💬', // quote
    code: '🤖',   // code/tech
    a: '🔗'       // link
  };
  
  return defaults[elementType] || '💫';
};

// Custom components with contextual emoticons
const MarkdownComponents = {
  // Convert **bold** to contextual emoticon + bold text
  strong: ({children}) => {
    const emoticon = getContextualEmoticon(children, 'strong');
    return (
      <>
        <span role="img" aria-label="emphasis">{emoticon}</span> {children} <span role="img" aria-label="emphasis">{emoticon}</span>
      </>
    );
  },
  
  // Convert * bullet points with contextual icons
  li: ({children}) => {
    const emoticon = getContextualEmoticon(children, 'li');
    return (
      <li style={{marginBottom: '4px'}}>
        <span role="img" aria-label="list item" style={{marginRight: '8px'}}>{emoticon}</span>
        {children}
      </li>
    );
  },
  
  // Headings with contextual icons
  h1: ({children}) => {
    const emoticon = getContextualEmoticon(children, 'h1');
    return <h1><span role="img" aria-label="main topic">{emoticon}</span> {children} <span role="img" aria-label="main topic">{emoticon}</span></h1>;
  },
  
  h2: ({children}) => {
    const emoticon = getContextualEmoticon(children, 'h2');
    return <h2><span role="img" aria-label="subtopic">{emoticon}</span> {children} <span role="img" aria-label="subtopic">{emoticon}</span></h2>;
  },
  
  h3: ({children}) => {
    const emoticon = getContextualEmoticon(children, 'h3');
    return <h3><span role="img" aria-label="point">👉</span> {children} <span role="img" aria-label="point">👈</span></h3>;
  },
  
  // Blockquotes with speech context
  blockquote: ({children}) => {
    const emoticon = getContextualEmoticon(children, 'blockquote');
    return (
      <blockquote style={{
        borderLeft: '3px solid #3498db', 
        paddingLeft: '12px',
        margin: '8px 0',
        fontStyle: 'italic'
      }}>
        <span role="img" aria-label="quote">{emoticon}</span> {children}
      </blockquote>
    );
  },
  
  // Code blocks with tech context
  code: ({children}) => {
    const emoticon = getContextualEmoticon(children, 'code');
    return (
      <code style={{
        background: 'rgba(52, 152, 219, 0.1)',
        padding: '2px 6px',
        borderRadius: '4px',
        fontFamily: 'monospace'
      }}>
        <span role="img" aria-label="code">{emoticon}</span> {children} <span role="img" aria-label="code">{emoticon}</span>
      </code>
    );
  },
  
  // Links with navigation context
  a: ({href, children}) => {
    const emoticon = getContextualEmoticon(children, 'a');
    return (
      <a href={href} style={{color: '#3498db', textDecoration: 'none'}}>
        <span role="img" aria-label="link">{emoticon}</span> {children} <span role="img" aria-label="external">➡️</span>
      </a>
    );
  }
};

export default function MessageBubble({
  message,
  userCharacters = [],
  theme = 'light'
}) {
  if (!message || typeof message.text !== 'string') {
    console.error('❌ MessageBubble: invalid message', message);
    return null;
  }

  const { user, text, speaker, display_name } = message;

  // User message
  if (user) {
    return (
      <div className="message-wrapper user-wrapper">
        <div className="message-bubble user-message">
          <div className="message-text">
            <ReactMarkdown components={MarkdownComponents}>
              {text}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  // Character message
  return (
    <div className="message-wrapper character-wrapper">
      <SpeakerIndicator
        characterKey={speaker}
        displayName={display_name}
        userCharacters={userCharacters}
        theme={theme}
      />
      
      <div className="message-bubble character-message">
        <div className="message-text">
          <ReactMarkdown components={MarkdownComponents}>
            {text}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}