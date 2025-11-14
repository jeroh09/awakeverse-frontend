import React from 'react';
import theme from '../design-system/tokens';

const PremiumCategoryCard = ({
  category,
  onClick,
  isMobile = false
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      style={{
        height: isMobile ? '140px' : '180px',
        background: theme.colors.background.surface,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: theme.transitions.normal,
        boxShadow: isHovered ? theme.shadows.elevation03 : theme.shadows.elevation02,
        border: `1px solid ${
          isHovered 
            ? theme.colors.accent.primary + '33'
            : theme.colors.border.subtle
        }`,
        display: 'flex',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        position: 'relative'
      }}
    >
      {/* Scene Section - 55% */}
      <div style={{
        width: '55%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${category.sceneImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center left',
            transition: theme.transitions.normal,
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            filter: isHovered ? 'brightness(1.1)' : 'brightness(1)'
          }}
        />
      </div>

      {/* VERTICAL CATEGORY NAME - Acts as divider */}
      <div style={{
        width: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.background.interactive,
        borderLeft: `1px solid ${theme.colors.border.medium}`,
        borderRight: `1px solid ${theme.colors.border.medium}`,
        position: 'relative',
        zIndex: 2
      }}>
        <h3 style={{
          fontFamily: theme.typography.fonts.display,
          fontSize: isMobile ? '16px' : '18px',
          fontWeight: 700,
          color: theme.colors.text.primary,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          transform: 'rotate(-90deg)',
          whiteSpace: 'nowrap',
          margin: 0
        }}>
          {category.title}
        </h3>
      </div>

      {/* Info Section - Remaining space */}
      <div style={{
        flex: 1,
        padding: isMobile ? '16px 12px' : '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* CHARACTER COUNT */}
        <p style={{
          fontFamily: theme.typography.fonts.body,
          fontSize: isMobile ? '24px' : '32px',
          fontWeight: 700,
          color: theme.colors.text.primary,
          lineHeight: 1,
          marginBottom: theme.spacing.sm
        }}>
          {category.characterCount || category.characters?.length || 0}
        </p>
        
        <p style={{
          fontFamily: theme.typography.fonts.body,
          fontSize: isMobile ? '16px' : '20px', // Larger for icon
          color: theme.colors.text.tertiary,
          fontWeight: 500,
          lineHeight: 1
        }}>
          👤
        </p>
      </div>

      {/* Hover glow effect */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at center, ${theme.colors.accent.glow} 0%, transparent 70%)`,
          opacity: 0.3,
          pointerEvents: 'none'
        }} />
      )}
    </div>
  );
};

export default PremiumCategoryCard;