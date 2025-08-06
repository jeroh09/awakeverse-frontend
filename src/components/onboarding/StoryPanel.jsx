import React from 'react';
import './Onboarding.css';

const data = {
  grid: [
    'sherlock', 'georgy_zhukov', 'mami_wata', 'lilith',
    'socrates', 'cleopatra', 'baba_yaga', 'nostradamus'
  ],
  chat: [
    { speaker: 'Mami Wata', text: "You've awakened me! Mortal." },
    { speaker: 'Georgy Zhukov', text: 'All conversations are permanent, comrade. No deletes or redos.' },
    { speaker: 'Huck Finn', text: 'Aww, so you wanna dance with us at the river banks?' },
    { speaker: 'Sherlock Holmes', text: 'Welcome! The conversation is afoot!' },
  ],
  invite: [
    { speaker: 'User', text: 'So Sancho Panza, what do you know about war?' },
    { speaker: 'Sancho Panza', text:
      `War! a dreadful discussion to bring to my village, old chap.\n
      'When the dogs bark, Sancho, it means we are riding.'\n
      But if you really want to talk war… shall I invite Strategos like Sun Tzu or Subutai?`
    }
  ]
};

export default function StoryPanel({ slide }) {
  switch (slide.type) {
    case 'grid':
      return (
        <div className="grid-panel">
          <div className="avatars-wrap">
            {data.grid.map(key => (
              <div key={key} className="avatar-circle">
                <img src={`/images/${key}.jpg`} alt={key} />
                <span className="avatar-name">{key.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'chat':
      return (
        <div className="tablet-panel glossy">
          {data.chat.map((m, i) => (
            <div key={i} className="chat-row">
              <img
                className="chat-avatar"
                src={`/images/${m.speaker.replace(/\s+/g, '_').toLowerCase()}.jpg`}
                alt={m.speaker}
              />
              <div className="chat-bubble ai">
                <strong>{m.speaker}:</strong> {m.text}
              </div>
            </div>
          ))}
        </div>
      );

    case 'invite':
      return (
        <div className="tablet-panel glossy invite-panel">
          {data.invite.map((m, i) => (
            <div key={i} className={`chat-row ${m.speaker==='User'?'user-row':''}`}>
              {m.speaker!=='User' && (
                <img
                  className="chat-avatar"
                  src={`/images/${m.speaker.replace(/\s+/g, '_').toLowerCase()}.jpg`}
                  alt={m.speaker}
                />
              )}
              <div className={`chat-bubble ${m.speaker==='User'?'user':'ai'}`}>
                <strong>{m.speaker}:</strong> {m.text}
              </div>
            </div>
          ))}
          <div className="invite-actions">
            <button className="invite-btn">Invite Sun Tzu</button>
            <button className="invite-btn">Invite Subutai</button>
          </div>
        </div>
      );

    case 'placeholder':
      return (
        <div className="placeholder-panel glossy">
          <p>Panel 4: Your guide to navigating Awakeverse (coming soon!)</p>
        </div>
      );

    default:
      return null;
  }
}