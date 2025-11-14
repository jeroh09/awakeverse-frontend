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
        height: isMobile ? '200px' : '240px',
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
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        position: 'relative'
      }}
    >
      {/* Full Scene Background */}
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${category.sceneImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: theme.transitions.normal,
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />

      {/* Bottom Blur + Dark Gradient Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(180deg, transparent 0%, rgba(10, 15, 26, 0.95) 100%)',
        backdropFilter: 'blur(4px)',
        zIndex: 1
      }} />

      {/* Text Overlay - Bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: isMobile ? '16px' : '20px',
        zIndex: 2,
        textAlign: 'center'
      }}>
        {/* Category Name */}
        <h3 style={{
          fontFamily: theme.typography.fonts.display,
          fontSize: isMobile ? '18px' : '22px',
          fontWeight: 700,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.sm,
          lineHeight: 1.2,
          letterSpacing: '-0.5px'
        }}>
          {category.title}
        </h3>

        {/* Character Count */}
        <p style={{
          fontFamily: theme.typography.fonts.body,
          fontSize: isMobile ? '12px' : '14px',
          color: theme.colors.text.secondary,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {category.characterCount || category.characters?.length || 0} 
          <span style={{ fontSize: '16px' }}>👤</span>
        </p>
      </div>

      {/* Hover glow effect */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at center, ${theme.colors.accent.glow} 0%, transparent 70%)`,
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 3
        }} />
      )}
    </div>
  );
};

export default PremiumCategoryCard;