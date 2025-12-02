// src/components/ProfileMenuConfig.js - UPDATED
import {
  LogIn,
  UserPlus,
  Settings,
  ImagePlus,
  Mail,
  Moon,
  LogOut,
  CreditCard, // <-- Add this import
  Crown,      // <-- Optional: for pro badge in icon
  Zap         // <-- Optional: for unlimited tier
} from 'lucide-react';

export const defaultProfileMenu = [
  { type: 'link',   label: 'Login',            to: '/login',         icon: LogIn,     visible: user => !user },
  { type: 'link',   label: 'Register',         to: '/register',      icon: UserPlus,  visible: user => !user },

  { type: 'separator' },

  // Billing link - only for logged-in users
  { 
    type: 'link',   
    label: (darkMode, user) => {
      // Dynamic label based on subscription tier
      const tier = user?.subscription_tier || 'free';
      if (tier === 'free') return 'Billing';
      if (tier === 'starter') return 'Billing (Starter)';
      if (tier === 'pro') return 'Billing • Pro';
      if (tier === 'unlimited') return 'Billing • Unlimited';
      return 'Billing';
    },          
    to: '/billing',       
    icon: (darkMode, user) => {
      // Dynamic icon based on subscription tier
      const tier = user?.subscription_tier || 'free';
      if (tier === 'pro') return Crown;        // Crown for Pro
      if (tier === 'unlimited') return Zap;    // Zap for Unlimited
      return CreditCard;                       // CreditCard for Free/Starter
    },   
    visible: user => !!user  // Only show for logged-in users
  },
  { type: 'link',   label: 'Profile Settings', to: '/settings',       icon: Settings,   visible: user => !!user },
  { type: 'link',   label: 'Upload Avatar',    to: '/upload-avatar', icon: ImagePlus, visible: user => !!user },

  { type: 'separator' },

  { type: 'link',   label: 'Contact Us',       to: '/contact',       icon: Mail,      visible: ()   => true },

  { type: 'separator' },

  { type: 'action', label: dm => dm ? 'Light Mode' : 'Dark Mode', onClick: 'toggleDarkMode', icon: Moon,    visible: ()   => true },
  { type: 'action', label: 'Logout',           onClick: 'logout',     icon: LogOut,   visible: user => !!user },
];