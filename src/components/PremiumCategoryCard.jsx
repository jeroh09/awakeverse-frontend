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
            ? theme.colors.accent.primary + '33' // 20% opacity
            : theme.colors.border.subtle
        }`,
        display: 'flex',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        position: 'relative'
      }}
    >
      {/* Scene Section - 60% */}
      <div style={{
        width: '60%',
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
        
        {/* Gradient fade to text section */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '100px',
          background: `linear-gradient(90deg, transparent 0%, ${theme.colors.background.surface} 100%)`,
          pointerEvents: 'none'
        }} />
      </div>

      {/* Text Section - 40% */}
      <div style={{
        width: '40%',
        padding: isMobile ? '16px' : '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <h3 style={{
          fontFamily: theme.typography.fonts.display,
          fontSize: isMobile ? '18px' : '20px',
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.sm,
          lineHeight: 1.2
        }}>
          {category.name}
        </h3>

        <p style={{
          fontFamily: theme.typography.fonts.body,
          fontSize: isMobile ? '11px' : '13px',
          color: theme.colors.text.secondary,
          marginBottom: isMobile ? theme.spacing.sm : theme.spacing.md,
          lineHeight: 1.5,
          fontWeight: theme.typography.weights.medium
        }}>
          {category.characterCount || category.characters?.length || 0} characters
        </p>

        <p style={{
          fontFamily: theme.typography.fonts.body,
          fontSize: isMobile ? '11px' : '12px',
          color: theme.colors.text.tertiary,
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: isMobile ? 2 : 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {category.description}
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