// src/components/ProfileMenuConfig.js - FIXED VERSION
import {
  LogIn,
  UserPlus,
  Settings,
  ImagePlus,
  Mail,
  Moon,
  LogOut,
  CreditCard, // Standard billing icon
} from 'lucide-react';

export const defaultProfileMenu = [
  { type: 'link',   label: 'Login',            to: '/login',         icon: LogIn,     visible: user => !user },
  { type: 'link',   label: 'Register',         to: '/register',      icon: UserPlus,  visible: user => !user },

  { type: 'separator' },

  // FIXED: Icon is now always CreditCard component, label changes dynamically
  { 
    type: 'link',   
    label: (darkMode, user) => {
      // Dynamic label based on subscription tier
      const tier = user?.subscription_tier || 'free';
      if (tier === 'free') return 'Billing';
      if (tier === 'starter') return 'Billing • Explorer';
      if (tier === 'pro') return 'Billing • Creator';
      if (tier === 'unlimited') return 'Billing • Professional';
      return 'Billing';
    },          
    to: '/billing',       
    icon: CreditCard,  // ✅ FIXED: Always a component, not a function
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