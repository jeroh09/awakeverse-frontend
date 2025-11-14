import PremiumCharacterCard from './PremiumCharacterCard';
import ScrollShell from './ScrollShell';
import PublishToHubButton from './CreatorHub/PublishToHubButton'; // ← SAME IMPORT PATH

const MobileCharacterGrid = ({ characters, onCharacterSelect, showStatusIndicator = false, onCharacterPublishToggle }) => {
  return (
    <ScrollShell maxHeight="calc(100vh - 350px)" fadeHeight="15px">
      <div style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        padding: '0.5rem'
      }}>
        {characters.map((character, index) => (
          <div key={character.key || index} style={{ position: 'relative' }}>
            {/* Status Badge Over Card */}
            {showStatusIndicator && character.status && character.status !== 'approved' && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                zIndex: 10,
                background: character.status === 'pending' ? '#FFA500' : '#ff6b6b',
                color: '#fff',
                fontSize: '9px',
                fontWeight: 600,
                padding: '3px 6px',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                border: '2px solid rgba(0, 0, 0, 0.3)'
              }}>
                <span style={{ fontSize: '7px' }}>
                  {character.status === 'pending' ? '⏳' : '❌'}
                </span>
              </div>
            )}
            
            {/* Premium Character Card */}
            <PremiumCharacterCard
              character={character}
              onClick={() => onCharacterSelect(character)}
              isMobile={true}
              showBadge={false}
            />

            {/* Publish Button for Mobile */}
            <div 
              onClick={(e) => e.stopPropagation()} 
              style={{ 
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                right: '8px',
                pointerEvents: 'auto',
                zIndex: 5
              }}
            >
              <PublishToHubButton
                character={{
                  id: character.id,
                  character_key: character.key,
                  display_name: character.name,
                  status: character.status,
                  is_market_featured: character.is_market_featured
                }}
                onPublishSuccess={(updatedChar) => {
                  console.log('Character publish state changed:', updatedChar);
                  onCharacterPublishToggle?.(updatedChar);
                }}
                onPublishError={(error) => {
                  console.error('Publish error:', error);
                }}
                compact={true}
              />
            </div>
          </div>
        ))}
      </div>
    </ScrollShell>
  );
};

export default MobileCharacterGrid;