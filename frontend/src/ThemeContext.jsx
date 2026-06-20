import { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌙',
    desc: 'Indigo & Violet',
    bg: '/themes/midnight.png',
    vars: {
      '--accent-primary': '#818cf8',
      '--accent-primary-light': '#a5b4fc',
      '--accent-secondary': '#22d3ee',
      '--accent-violet': '#c084fc',
      '--accent-glow': 'rgba(129, 140, 248, 0.25)',
      '--bg-primary': '#060912',
      '--bg-secondary': '#0d1117',
      '--gradient-btn': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      '--gradient-btn-hover': 'linear-gradient(135deg, #818cf8, #a78bfa)',
      '--gradient-accent': 'linear-gradient(135deg, #818cf8, #22d3ee)',
      '--shadow-btn': '0 4px 20px rgba(99, 102, 241, 0.35)',
      '--gradient-hero': 'linear-gradient(145deg, #060912 0%, #0a0f1e 45%, #070c18 100%)',
    },
    preview: ['#6366f1', '#8b5cf6', '#22d3ee'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    desc: 'Teal & Cyan',
    bg: '/themes/ocean.png',
    vars: {
      '--accent-primary': '#2dd4bf',
      '--accent-primary-light': '#5eead4',
      '--accent-secondary': '#38bdf8',
      '--accent-violet': '#67e8f9',
      '--accent-glow': 'rgba(45, 212, 191, 0.25)',
      '--bg-primary': '#020f0f',
      '--bg-secondary': '#051616',
      '--gradient-btn': 'linear-gradient(135deg, #0d9488, #0891b2)',
      '--gradient-btn-hover': 'linear-gradient(135deg, #2dd4bf, #38bdf8)',
      '--gradient-accent': 'linear-gradient(135deg, #2dd4bf, #38bdf8)',
      '--shadow-btn': '0 4px 20px rgba(13, 148, 136, 0.4)',
      '--gradient-hero': 'linear-gradient(145deg, #020f0f 0%, #061a1a 45%, #030c0c 100%)',
    },
    preview: ['#0d9488', '#2dd4bf', '#38bdf8'],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    emoji: '🌅',
    desc: 'Orange & Rose',
    bg: '/themes/sunset.png',
    vars: {
      '--accent-primary': '#fb923c',
      '--accent-primary-light': '#fdba74',
      '--accent-secondary': '#f43f5e',
      '--accent-violet': '#fbbf24',
      '--accent-glow': 'rgba(251, 146, 60, 0.25)',
      '--bg-primary': '#0f0703',
      '--bg-secondary': '#180e06',
      '--gradient-btn': 'linear-gradient(135deg, #ea580c, #e11d48)',
      '--gradient-btn-hover': 'linear-gradient(135deg, #fb923c, #f43f5e)',
      '--gradient-accent': 'linear-gradient(135deg, #fb923c, #f43f5e)',
      '--shadow-btn': '0 4px 20px rgba(234, 88, 12, 0.4)',
      '--gradient-hero': 'linear-gradient(145deg, #0f0703 0%, #1a0c04 45%, #100804 100%)',
    },
    preview: ['#ea580c', '#fb923c', '#f43f5e'],
  },
  {
    id: 'forest',
    name: 'Forest',
    emoji: '🌿',
    desc: 'Emerald & Green',
    bg: '/themes/forest.png',
    vars: {
      '--accent-primary': '#34d399',
      '--accent-primary-light': '#6ee7b7',
      '--accent-secondary': '#4ade80',
      '--accent-violet': '#a3e635',
      '--accent-glow': 'rgba(52, 211, 153, 0.25)',
      '--bg-primary': '#030a06',
      '--bg-secondary': '#061209',
      '--gradient-btn': 'linear-gradient(135deg, #059669, #16a34a)',
      '--gradient-btn-hover': 'linear-gradient(135deg, #34d399, #4ade80)',
      '--gradient-accent': 'linear-gradient(135deg, #34d399, #4ade80)',
      '--shadow-btn': '0 4px 20px rgba(5, 150, 105, 0.4)',
      '--gradient-hero': 'linear-gradient(145deg, #030a06 0%, #06150a 45%, #040c07 100%)',
    },
    preview: ['#059669', '#34d399', '#4ade80'],
  },
  {
    id: 'rose',
    name: 'Rose',
    emoji: '🌸',
    desc: 'Pink & Fuchsia',
    bg: '/themes/rose.png',
    vars: {
      '--accent-primary': '#f472b6',
      '--accent-primary-light': '#f9a8d4',
      '--accent-secondary': '#e879f9',
      '--accent-violet': '#c026d3',
      '--accent-glow': 'rgba(244, 114, 182, 0.25)',
      '--bg-primary': '#0d0509',
      '--bg-secondary': '#160812',
      '--gradient-btn': 'linear-gradient(135deg, #db2777, #a21caf)',
      '--gradient-btn-hover': 'linear-gradient(135deg, #f472b6, #e879f9)',
      '--gradient-accent': 'linear-gradient(135deg, #f472b6, #e879f9)',
      '--shadow-btn': '0 4px 20px rgba(219, 39, 119, 0.4)',
      '--gradient-hero': 'linear-gradient(145deg, #0d0509 0%, #180a10 45%, #0e0609 100%)',
    },
    preview: ['#db2777', '#f472b6', '#e879f9'],
  },
  {
    id: 'aurora',
    name: 'Aurora',
    emoji: '🌌',
    desc: 'Purple & Emerald',
    bg: '/themes/aurora.png',
    vars: {
      '--accent-primary': '#a78bfa',
      '--accent-primary-light': '#c4b5fd',
      '--accent-secondary': '#34d399',
      '--accent-violet': '#60a5fa',
      '--accent-glow': 'rgba(167, 139, 250, 0.25)',
      '--bg-primary': '#07040f',
      '--bg-secondary': '#0e0718',
      '--gradient-btn': 'linear-gradient(135deg, #7c3aed, #059669)',
      '--gradient-btn-hover': 'linear-gradient(135deg, #a78bfa, #34d399)',
      '--gradient-accent': 'linear-gradient(135deg, #a78bfa, #34d399)',
      '--shadow-btn': '0 4px 20px rgba(124, 58, 237, 0.4)',
      '--gradient-hero': 'linear-gradient(145deg, #07040f 0%, #0d0920 45%, #060310 100%)',
    },
    preview: ['#7c3aed', '#a78bfa', '#34d399'],
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    emoji: '💙',
    desc: 'Grey & Silver',
    bg: '/themes/obsidian.png',
    vars: {
      '--accent-primary': '#94a3b8',
      '--accent-primary-light': '#cbd5e1',
      '--accent-secondary': '#64748b',
      '--accent-violet': '#e2e8f0',
      '--accent-glow': 'rgba(148, 163, 184, 0.2)',
      '--bg-primary': '#050505',
      '--bg-secondary': '#0c0c0c',
      '--gradient-btn': 'linear-gradient(135deg, #374151, #6b7280)',
      '--gradient-btn-hover': 'linear-gradient(135deg, #6b7280, #94a3b8)',
      '--gradient-accent': 'linear-gradient(135deg, #94a3b8, #e2e8f0)',
      '--shadow-btn': '0 4px 20px rgba(55, 65, 81, 0.5)',
      '--gradient-hero': 'linear-gradient(145deg, #050505 0%, #0a0a0a 45%, #060606 100%)',
    },
    preview: ['#374151', '#6b7280', '#94a3b8'],
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    emoji: '🚀',
    desc: 'Magenta & Blue',
    bg: '/themes/cosmic.png',
    vars: {
      '--accent-primary': '#e879f9',
      '--accent-primary-light': '#f0abfc',
      '--accent-secondary': '#60a5fa',
      '--accent-violet': '#818cf8',
      '--accent-glow': 'rgba(232, 121, 249, 0.25)',
      '--bg-primary': '#07020d',
      '--bg-secondary': '#0d0418',
      '--gradient-btn': 'linear-gradient(135deg, #a21caf, #1d4ed8)',
      '--gradient-btn-hover': 'linear-gradient(135deg, #e879f9, #60a5fa)',
      '--gradient-accent': 'linear-gradient(135deg, #e879f9, #60a5fa)',
      '--shadow-btn': '0 4px 20px rgba(162, 28, 175, 0.4)',
      '--gradient-hero': 'linear-gradient(145deg, #07020d 0%, #0f0520 45%, #080210 100%)',
    },
    preview: ['#a21caf', '#e879f9', '#60a5fa'],
  },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem('smartattend-theme') || 'midnight';
  });

  useEffect(() => {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    const root = document.documentElement;

    // Apply CSS variable overrides
    Object.entries(theme.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    root.setAttribute('data-theme', themeId);
    localStorage.setItem('smartattend-theme', themeId);

    // Apply background image to body
    if (theme.bg) {
      document.body.style.backgroundImage = `url(${theme.bg})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center center';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundRepeat = 'no-repeat';
    }
  }, [themeId]);

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
