// src/utils/confettiUtils.js
import confetti from 'canvas-confetti';

export const triggerPublishConfetti = () => {
  const duration = 3000;
  const end = Date.now() + duration;
  const colors = ['#FFD700', '#1E90FF', '#FFFFFF']; // Gold, Blue, White

  const frame = () => {
    if (Date.now() > end) return;

    // Launch from left side
    confetti({
      particleCount: 8,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: colors,
      zIndex: 10000
    });

    // Launch from right side
    confetti({
      particleCount: 8,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: colors,
      zIndex: 10000
    });

    // Center burst
    confetti({
      particleCount: 5,
      spread: 80,
      origin: { y: 0.6 },
      colors: colors,
      zIndex: 10000
    });

    requestAnimationFrame(frame);
  };

  frame();

  // Big initial burst
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.6 },
    colors: colors,
    zIndex: 10000
  });
};