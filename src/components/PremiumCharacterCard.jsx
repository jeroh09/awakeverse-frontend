import React from 'react';
import theme from '../design-system/tokens';

const PremiumCharacterCard = ({
  character,
  onClick,
  isMobile = false,
  showBadge = false
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      style={{
        background: theme.colors.background.surface,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: theme.transitions.normal,
        boxShadow: isHovered ? theme.shadows.elevation03 : theme.shadows.elevation02,
        border: `1px solid ${
          isHovered 
            ? theme.colors.accent.primary + '40'
            : theme.colors.border.subtle
        }`,
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        position: 'relative'
      }}
    >
      {/* Badge (if featured/premium) */}
      {showBadge && character.is_market_featured && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: `linear-gradient(135deg, ${theme.colors.accent.primary}, ${theme.colors.accent.hover})`,
          color: 'white',
          fontSize: '10px',
          fontWeight: 600,
          padding: '4px 8px',
          borderRadius: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          zIndex: 3
        }}>
          Featured
        </div>
      )}

      {/* Character Image Container */}
      <div style={{
        width: '100%',
        height: isMobile ? '200px' : '280px',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${theme.colors.background.interactive}, ${theme.colors.background.peak})`
      }}>
        {/* Blurred Environment Background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${character.thumbnailUrl || character.avatar_url || '/images/default-character.jpg'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px) brightness(0.6)',
            transform: isHovered ? 'scale(1.15)' : 'scale(1.1)',
            transition: theme.transitions.normal
          }}
        />

        {/* Sharp Character Portrait */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${character.thumbnailUrl || character.avatar_url || '/images/default-character.jpg'})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 2,
            filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
            transition: theme.transitions.normal
          }}
        />

        {/* Vignette Effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 30%, rgba(10, 15, 26, 0.7) 100%)',
          zIndex: 1
        }} />
      </div>

      {/* Character Info */}
      <div style={{
        padding: isMobile ? '16px' : '20px',
        background: theme.colors.background.surface,
        position: 'relative'
      }}>
        {/* Divider line with gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '20px',
          right: '20px',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${theme.colors.accent.primary}40, transparent)`
        }} />

        {/* Character Name */}
        <h3 style={{
          fontFamily: theme.typography.fonts.display,
          fontSize: isMobile ? '18px' : '20px',
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.sm,
          letterSpacing: '-0.5px',
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {character.name || character.display_name}
        </h3>

        {/* Character Description/Title */}
        <p style={{
          fontFamily: theme.typography.fonts.body,
          fontSize: isMobile ? '12px' : '13px',
          color: theme.colors.text.secondary,
          fontWeight: 500,
          marginBottom: theme.spacing.sm,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.5
        }}>
          {character.description || character.short_description || 'Historical figure'}
        </p>

        {/* Era/Category Tag (optional) */}
        {character.category && (
          <div style={{
            fontFamily: theme.typography.fonts.body,
            fontSize: '11px',
            color: theme.colors.accent.primary,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: 600
          }}>
            {character.category}
          </div>
        )}
      </div>

      {/* Hover Glow Effect */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at center, ${theme.colors.accent.glow} 0%, transparent 70%)`,
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 4
        }} />
      )}
    </div>
  );
};

export default PremiumCharacterCard;