import React, { useState } from 'react';
import './Onboarding.css';

// Configuration
const USER_AVATAR = '/images/user-avatar.jpg';
const ARCHEYPES = [
  { id: 'sherlock', name: 'Sherlock Holmes' },
  { id: 'georgy_zhukov', name: 'Georgy Zhukov' },
  { id: 'mami_wata', name: 'Mami Wata' },
  { id: 'socrates', name: 'Socrates' },
  { id: 'cleopatra', name: 'Cleopatra' },
  { id: 'nostradamus', name: 'Nostradamus' },
  { id: 'sancho_panza', name: 'Sancho Panza' },
  { id: 'loki', name: 'Loki' },
  { id: 'lilith', name: 'Lilith' },
  { id: 'queen_amina', name: 'Queen Amina of Zazzau' },
  { id: 'harriet_tubman', name: 'Harriet Tubman' },
  { id: 'boudica', name: 'Boudica' }
];

export default function OnboardingApp() {
  const [view, setView] = useState('grid');
  const [selectedArchetype, setSelectedArchetype] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showInviteOptions, setShowInviteOptions] = useState(false);

  const handleArchetypeSelect = (archetype) => {
    setSelectedArchetype(archetype);
    setShowInviteOptions(false);
    
    const initialMessages = [];
    
    // Special conversation flow for Sancho Panza
    if (archetype.id === 'sancho_panza') {
      initialMessages.push({
        sender: 'ai',
        text: getInitialGreeting(archetype.id),
        avatar: `${archetype.id}.jpg`
      });
    } 
    // Standard flow for other characters
    else {
      initialMessages.push(
        {
          sender: 'ai',
          text: getInitialGreeting(archetype.id),
          avatar: `${archetype.id}.jpg`
        },
        {
          sender: 'user',
          text: getDefaultQuestion(archetype.id),
          avatar: USER_AVATAR
        },
        {
          sender: 'ai',
          text: getArchetypeResponse(archetype.id),
          avatar: `${archetype.id}.jpg`
        }
      );
    }
    
    setMessages(initialMessages);
    setView('chat');
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const newMessage = {
      sender: 'user',
      text: currentMessage,
      avatar: USER_AVATAR
    };
    
    setMessages([...messages, newMessage]);
    setCurrentMessage('');
    
    // Special handling for Sancho's war question
    if (currentMessage.toLowerCase().includes('war') && selectedArchetype.id === 'sancho_panza') {
      setTimeout(() => {
        setMessages(prev => [
          ...prev, 
          {
            sender: 'ai',
            text: "War you say? We know nothin' of such diabolical acts in La Mancha. Should I invite Sun Tzu or Subutai?",
            avatar: `${selectedArchetype.id}.jpg`
          }
        ]);
        setShowInviteOptions(true);
      }, 1000);
    } 
    // Standard AI response for others
    else {
      setTimeout(() => {
        setMessages(prev => [
          ...prev, 
          {
            sender: 'ai',
            text: getRandomResponse(selectedArchetype.id),
            avatar: `${selectedArchetype.id}.jpg`
          }
        ]);
      }, 1000);
    }
  };

  const handleInvite = (strategist) => {
    setShowInviteOptions(false);
    setMessages(prev => [
      ...prev,
      {
        sender: 'ai',
        text: `Very well! I shall send for ${strategist}. They'll join us shortly...`,
        avatar: `${selectedArchetype.id}.jpg`
      }
    ]);
  };

  // Helper function to format text as lowercase with first letter capitalized
  const formatChatText = (text) => {
    const lowerText = text.toLowerCase();
    return lowerText.charAt(0).toUpperCase() + lowerText.slice(1);
  };

  return (
    <div className="device-frame">
      <div className="device-screen">
        <div className="app-header">
          {view === 'grid' ? (
            'Choose Your Archetype'
          ) : (
            <>
              <button className="back-button" onClick={() => setView('grid')}>
                &larr;
              </button>
              <span>{selectedArchetype.name}</span>
            </>
          )}
        </div>

        <div className="app-content">
          {view === 'grid' ? (
            <div className="avatars-grid">
              {ARCHEYPES.map(archetype => (
                <div 
                  key={archetype.id}
                  className={`avatar-card ${selectedArchetype?.id === archetype.id ? 'selected' : ''}`}
                  onClick={() => handleArchetypeSelect(archetype)}
                >
                  <div className="avatar-frame">
                    <img
                      src={`/images/${archetype.id}.jpg`}
                      alt={archetype.name}
                      className="avatar-image"
                    />
                    <div className="avatar-glow"></div>
                  </div>
                  <span className="avatar-label">{archetype.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="chat-view">
              <div className="chat-messages">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`chat-row ${message.sender === 'user' ? 'user-row' : ''}`}
                  >
                    {message.sender === 'ai' && (
                      <img
                        className="chat-avatar"
                        src={`/images/${message.avatar}`}
                        alt={selectedArchetype.name}
                      />
                    )}
                    
                    <div 
                      className={`chat-bubble ${message.sender}`}
                      style={{ textTransform: 'none' }}
                    >
                      {message.text.split('\n').map((line, i) => {
                        const formattedLine = formatChatText(line.trim());
                        return (
                          <p key={i} style={{ textTransform: 'none', margin: 0 }}>
                            {formattedLine}
                          </p>
                        );
                      })}
                    </div>
                    
                    {message.sender === 'user' && (
                      <img
                        className="user-avatar"
                        src={message.avatar}
                        alt="You"
                      />
                    )}
                  </div>
                ))}

                {showInviteOptions && (
                  <div className="invite-options">
                    <button onClick={() => handleInvite('Sun Tzu')}>Invite Sun Tzu</button>
                    <button onClick={() => handleInvite('Subutai')}>Invite Subutai</button>
                  </div>
                )}
              </div>

              <div className="chat-input-area">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button onClick={handleSendMessage}>
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Response functions
function getInitialGreeting(archetype) {
  const greetings = {
    sherlock: "Ah, excellent! Another mind to engage. What mystery shall we unravel today?",
    georgy_zhukov: "Comrade! The battlefield of ideas awaits. What strategic discussion brings you here?",
    mami_wata: "The waters ripple with your arrival... What secrets do you seek from the depths?",
    socrates: "Ah, a new dialogue partner! Let us question together and find wisdom.",
    cleopatra: "You stand before royalty. State your purpose clearly.",
    nostradamus: "I foresaw your coming in the stars. What future shall we divine?",
    sancho_panza: "Ho there, friend! What brings you to this humble corner of La Mancha?",
    loki: "Well, well... what mischief brings you before the God of Stories?",
    lilith: "You dare summon the first who said no? Speak your purpose, child of clay.",
    queen_amina: "You stand before the Queen of Zazzau. What brings you to my court?",
    harriet_tubman: "Freedom calls to all who have ears to hear. What chains seek breaking today?",
    boudica: "The fire of rebellion burns eternal. What wrongs demand justice?"
  };
  return greetings[archetype] || "You've awakened me. Speak your mind.";
}

function getDefaultQuestion(archetype) {
  const questions = {
    loki: "What's your greatest trick?",
    lilith: "What knowledge do you possess that was hidden from Adam?",
    queen_amina: "How did you build such a powerful kingdom?",
    harriet_tubman: "What drove you to risk everything for freedom?",
    boudica: "What made you lead the rebellion against Rome?",
    // Others use generic question
    default: `Tell me about ${archetype.replace(/_/g, ' ')}`
  };
  return questions[archetype] || questions.default;
}

function getArchetypeResponse(archetype) {
  const responses = {
    sherlock: "The key to any mystery lies in the details others overlook. Train yourself to see what others merely observe.",
    georgy_zhukov: "Victory requires three things: preparation, opportunity, and the will to act decisively when the moment comes.",
    mami_wata: "The river's song carries forgotten truths. To hear them, you must first learn to listen with more than just your ears...",
    socrates: "True wisdom begins with recognizing how little we truly know. The unexamined life is not worth living.",
    cleopatra: "Power is never given, only taken. But to hold it requires both the lion's fierceness and the serpent's cunning.",
    nostradamus: "The future is not fixed, but flows like mercury. What appears certain may yet change, and what seems impossible may come to pass.",
    loki: "The greatest trick? Convincing the universe there's only one of me. Though between us... I might be you right now.",
    lilith: "I know the taste of freedom, and the price it demands. The Creator gave Adam dominion, but I took my own.",
    queen_amina: "Trade routes are the arteries of power. Control the roads, and you control the wealth. My walls still stand because commerce flows through them.",
    harriet_tubman: "I never ran my train off the track, and I never lost a passenger. The North Star was my compass, but courage was my fuel.",
    boudica: "They burned my lands and dishonored my daughters. Rome learned that a mother's rage can topple empires when it carries a righteous blade."
  };
  return responses[archetype] || "This archetype has much wisdom to share with you.";
}

function getRandomResponse(archetype) {
  const responseSets = {
    sancho_panza: [
      "By my beard! That's a matter for wiser heads than mine.",
      "Don Quixote would have a fine speech about that, but me? I stick to wine and cheese.",
      "In La Mancha, we settle disputes with a good meal and better wine!"
    ],
    loki: [
      "Oh, that's precious. Let me tell you what really happened...",
      "You mortals and your simple questions. The truth is always more... fluid.",
      "Why settle for one answer when we can have seven contradictory ones?"
    ],
    lilith: [
      "You seek knowledge that was forbidden even to angels.",
      "The first rebellion echoes in every woman's 'no' throughout history.",
      "The garden's walls were meant to keep things in as much as keep you out."
    ],
    sherlock: [
      "Elementary! The solution reveals itself to those who observe carefully.",
      "The game is afoot, and every detail matters.",
      "When you eliminate the impossible, whatever remains must be the truth."
    ],
    georgy_zhukov: [
      "Strategy without logistics is merely wishful thinking.",
      "The enemy's weakness is often found in their greatest strength.",
      "Victory belongs to the side that adapts fastest to changing conditions."
    ],
    mami_wata: [
      "The currents speak of ancient wisdom flowing beneath surface thoughts.",
      "Water finds its way around every obstacle, yet shapes the hardest stone.",
      "In the depths lie truths that surface dwellers fear to acknowledge."
    ],
    socrates: [
      "Your question reveals more about wisdom than any answer I could give.",
      "Let us examine this assumption together, shall we?",
      "The wisest person knows that they know nothing at all."
    ],
    cleopatra: [
      "Kingdoms rise and fall, but strategic thinking endures through ages.",
      "Power without wisdom is mere tyranny; wisdom without power is mere philosophy.",
      "The Nile taught me patience - all things flow toward their destiny."
    ],
    nostradamus: [
      "The stars whisper of possibilities, not certainties.",
      "Time flows in circles, not lines - what was will be again.",
      "The future is written in symbols that only the prepared mind can read."
    ],
    queen_amina: [
      "Every fortress I built was a promise to my people - that prosperity and protection go hand in hand.",
      "The Sahara taught me patience, but trade taught me power. Both are necessary for a queen.",
      "My cavalry charges ahead, but my architects build for centuries. Which legacy will you choose?"
    ],
    harriet_tubman: [
      "The Underground Railroad had no schedule, only determination. When freedom calls, you answer.",
      "I carried a pistol not to harm, but to ensure no one turned back. Sometimes mercy means being firm.",
      "Moses led his people out of Egypt. I led mine out of bondage. The Promised Land is wherever we make it."
    ],
    boudica: [
      "Rome thought they could break our spirit with their chains. They learned that some fires burn brighter under pressure.",
      "My daughters' tears became war cries that echoed across Britain. A mother's love is the fiercest weapon.",
      "They called me barbarian, yet I united tribes Rome couldn't conquer separately. Who was truly civilized?"
    ]
  };
  
  const responses = responseSets[archetype] || [
    "Indeed, you raise an interesting point.",
    "Let me reflect on that...",
    "There is deeper wisdom here we should explore."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}