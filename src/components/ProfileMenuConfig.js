// src/components/ProfileMenuConfig.js
import {
  LogIn,
  UserPlus,
  Settings,
  ImagePlus,
  Mail,
  Moon,
  LogOut
} from 'lucide-react';

export const defaultProfileMenu = [
  { type: 'link',   label: 'Login',            to: '/login',         icon: LogIn,     visible: user => !user },
  { type: 'link',   label: 'Register',         to: '/register',      icon: UserPlus,  visible: user => !user },

  { type: 'separator' },

  { type: 'link',   label: 'Profile Settings', to: '/settings',       icon: Settings,   visible: user => !!user },
  { type: 'link',   label: 'Upload Avatar',    to: '/upload-avatar', icon: ImagePlus, visible: user => !!user },

  { type: 'separator' },

  { type: 'link',   label: 'Contact Us',       to: '/contact',       icon: Mail,      visible: ()   => true },

  { type: 'separator' },

  { type: 'action', label: dm => dm ? 'Light Mode' : 'Dark Mode', onClick: 'toggleDarkMode', icon: Moon,    visible: ()   => true },
  { type: 'action', label: 'Logout',           onClick: 'logout',     icon: LogOut,   visible: user => !!user },
];
