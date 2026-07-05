import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, FileText, CheckCircle,
  LogOut, Menu, X, User as UserIcon, Sun, Moon, Clock, Gamepad2, MessageCircle, Bell, Code, Trophy, Calendar, Monitor,
  Briefcase, ChevronDown, ChevronRight, Palette, Network, ShieldCheck, Activity, Sparkles, Lock
} from 'lucide-react';
import { io } from 'socket.io-client';
import Swal from 'sweetalert2';
import { soundManager } from '../utils/soundManager';
import Loader from './Loader';

const getBorderPreviewClass = (value) => {
  const map = {
    'bronze-glow': 'border-amber-700 shadow-[0_0_12px_rgba(180,83,9,0.5)]',
    'silver-pulse': 'border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.6)] animate-pulse',
    'gold-shimmer': 'border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.9)] bg-transparent',
    'diamond-sparkle': 'border-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.8)] animate-pulse duration-700',
    'fire-ring': 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.9)] bg-gradient-to-tr from-orange-500 to-red-600 animate-pulse',
    'lightning-arc': 'border-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.95)] bg-gradient-to-tr from-violet-600 to-indigo-600 animate-pulse duration-500',
    'galaxy-swirl': 'border-pink-500 shadow-[0_0_35px_rgba(236,72,153,1)] bg-gradient-to-tr from-fuchsia-600 via-pink-600 to-purple-600 animate-pulse duration-[2000ms]',
    'rainbow-spin': 'border-transparent shadow-[0_0_25px_rgba(16,185,129,0.8)] bg-gradient-to-r from-red-500 via-green-500 via-blue-500 to-yellow-500 animate-spin',
    'emerald-pulse': 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.8)] animate-pulse duration-1000',
    'ruby-fire': 'border-rose-600 shadow-[0_0_30px_rgba(225,29,72,0.9)] animate-ping duration-[2000ms]',
    'nebula-cloud': 'border-indigo-400 shadow-[0_0_30px_rgba(129,140,248,0.9)] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 animate-pulse',
    'placement-ready': 'border-double border-4 border-yellow-400 shadow-[0_0_35px_rgba(250,204,21,1)] animate-bounce duration-[2000ms]',
    'top-10-border': 'border-transparent bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 shadow-[0_0_30px_rgba(6,182,212,0.9)] animate-pulse',
    'frozen-frost': 'border-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.8)] animate-pulse bg-gradient-to-tr from-sky-400 to-blue-500',
    'shadow-assassin': 'border-purple-950 shadow-[0_0_20px_rgba(88,28,135,0.7)] bg-gradient-to-tr from-zinc-950 via-purple-950 to-zinc-900 animate-pulse duration-[3000ms]',
    'weekly-warrior-shield': 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] border-dashed animate-pulse',
    'legend-league-crown': 'border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,1)] bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 animate-pulse'
  };
  return map[value] || 'border-slate-500';
};

const themeDisplayNames = {
  Emerald: 'Emerald Green',
  Amethyst: 'Master Purple',
  Crimson: 'Ruby Sovereign',
  Ocean: 'Ocean Blue',
  Amber: 'Legendary Gold',
  Rose: 'Rose Red',
  Midnight: 'Midnight',
  Sakura: 'Sakura Pink',
  Mint: 'Forest Sovereign',
  Slate: 'Slate',
  Coral: 'Coral',
  Cyber: 'Cosmic Diamond'
};

const PET_EMOJIS = {
  Cat: '🐱',
  Dog: '🐶',
  Robot: '🤖',
  Dragon: '🐲',
  Panda: '🐼',
  Tiger: '🐯',
  Alien: '👽',
  Phoenix: '🔥',
  'Weekly Warrior Owl': '🦉'
};

const getEffectStyles = (effectName) => {
  switch (effectName) {
    case 'fire-aura':
      return 'ring-2 ring-orange-500 ring-offset-1 shadow-[0_0_12px_#f97316] animate-pulse';
    case 'lightning-aura':
      return 'ring-2 ring-violet-500 ring-offset-1 shadow-[0_0_12px_#a855f7] animate-pulse';
    case 'galaxy-aura':
      return 'ring-2 ring-pink-500 ring-offset-1 shadow-[0_0_12px_#ec4899]';
    case 'sparkles':
      return 'ring-2 ring-yellow-400 ring-offset-1 shadow-[0_0_8px_#eab308]';
    case 'snowstorm':
      return 'ring-2 ring-sky-300 ring-offset-1 shadow-[0_0_8px_#38bdf8]';
    case 'heartbeat':
      return 'ring-2 ring-rose-500 ring-offset-1 shadow-[0_0_10px_#f43f5e]';
    case 'cyber-grid':
      return 'ring-2 ring-cyan-400 ring-offset-1 shadow-[0_0_12px_#22d3ee]';
    case 'perfect-attendance-aura':
      return 'ring-2 ring-amber-400 ring-offset-1 shadow-[0_0_15px_#f59e0b]';
    default:
      return '';
  }
};

const getNamecolorClass = (value) => {
  const classes = {
    'text-green-500': 'text-green-500',
    'text-blue-500': 'text-blue-500',
    'text-purple-500': 'text-purple-500',
    'text-amber-500': 'text-amber-500',
    'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-green-500 to-blue-500 font-extrabold': 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-green-500 to-blue-500 font-extrabold',
    'text-emerald-600 font-extrabold': 'text-emerald-600 font-extrabold',
    'text-red-500 font-bold animate-pulse': 'text-red-500 font-bold animate-pulse',
    'text-cyan-400 font-black animate-pulse': 'text-cyan-400 font-black animate-pulse',
    'text-indigo-400 font-extrabold': 'text-indigo-400 font-extrabold',
    'text-yellow-400 font-extrabold animate-bounce duration-[2000ms]': 'text-yellow-400 font-extrabold animate-bounce duration-[2000ms]'
  };
  return classes[value] || value || '';
};

const Layout = () => {
  const { user, logout, socket } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Collapsible sidebar sections state
  const [expandedSections, setExpandedSections] = useState(() => {
    try {
      const saved = localStorage.getItem('expandedSections');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      Overview: false,
      Academic: false,
      Management: false,
      Operations: false,
      Account: false,
      Main: false,
      Learning: false,
      Performance: false,
      'Batches & Chat': false
    };
  });

  // Pinned sections state (clicked sections that stay open and styled dark)
  const [pinnedSections, setPinnedSections] = useState(() => {
    try {
      const saved = localStorage.getItem('pinnedSections');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      Overview: false,
      Academic: false,
      Management: false,
      Operations: false,
      Account: false,
      Main: false,
      Learning: false,
      Performance: false,
      'Batches & Chat': false
    };
  });

  const toggleSection = (label) => {
    setPinnedSections(prev => {
      const isPinned = !prev[label];
      const updatedPinned = { ...prev, [label]: isPinned };
      try {
        localStorage.setItem('pinnedSections', JSON.stringify(updatedPinned));
      } catch (e) {}
      
      // Sync expanded state with pin state
      setExpandedSections(prevExpanded => {
        const updatedExpanded = { ...prevExpanded, [label]: isPinned };
        try {
          localStorage.setItem('expandedSections', JSON.stringify(updatedExpanded));
        } catch (e) {}
        return updatedExpanded;
      });

      return updatedPinned;
    });
  };

  const openSection = (label) => {
    setExpandedSections(prev => {
      if (prev[label]) return prev;
      const updated = { ...prev, [label]: true };
      try {
        localStorage.setItem('expandedSections', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const closeSection = (label) => {
    if (pinnedSections[label]) return; // If pinned, do not collapse on mouse leave
    setExpandedSections(prev => {
      if (!prev[label]) return prev;
      const updated = { ...prev, [label]: false };
      try {
        localStorage.setItem('expandedSections', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // --- HSL Shade Generator for Custom Colors ---
  const hexToHSL = (hex) => {
    let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
    let h = 0, s = 0, l = (max+min)/2;
    if (d !== 0) { s = l > 0.5 ? d/(2-max-min) : d/(max-min); h = max===r ? ((g-b)/d+(g<b?6:0))*60 : max===g ? ((b-r)/d+2)*60 : ((r-g)/d+4)*60; }
    return { h: Math.round(h), s: Math.round(s*100), l: Math.round(l*100) };
  };
  const hslToHex = (h,s,l) => {
    s/=100; l/=100;
    const a = s*Math.min(l,1-l);
    const f = n => { const k=(n+h/30)%12; return Math.round(255*(l-a*Math.max(Math.min(k-3,9-k,1),-1))); };
    return '#'+[f(0),f(8),f(4)].map(x=>x.toString(16).padStart(2,'0')).join('');
  };
  const generateThemeFromHex = (hex) => {
    const { h, s } = hexToHSL(hex);
    const shades = {
      50: hslToHex(h, Math.min(s,30), 97), 100: hslToHex(h, Math.min(s,40), 94),
      200: hslToHex(h, Math.min(s,50), 86), 300: hslToHex(h, Math.min(s,55), 74),
      400: hslToHex(h, s, 60), 500: hex,
      600: hslToHex(h, s, 42), 700: hslToHex(h, s, 34),
      800: hslToHex(h, s, 26), 900: hslToHex(h, s, 20)
    };
    const accent = hslToHex((h+20)%360, s, 50);
    return {
      name: 'Custom', primary: hex, accent,
      shades,
      bgLight: { start: shades[100], middle: shades[50], end: '#ffffff' },
      bgDark: { start: hslToHex(h, Math.min(s,50), 6), middle: hslToHex(h, Math.min(s,40), 3), end: '#010101' }
    };
  };

  const themes = [
    {
      name: 'Emerald',
      primary: '#10b981',
      accent: '#14b8a6',
      shades: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b' },
      bgLight: { start: '#dcfce7', middle: '#f0fdf4', end: '#ffffff' },
      bgDark: { start: '#052217', middle: '#02120c', end: '#010604' },
      font: "'Inter', sans-serif",
      radius: '24px',
      btnRadius: '12px',
      glow: '0 8px 30px rgba(16, 185, 129, 0.15)',
      speedMultiplier: '1.0'
    },
    {
      name: 'Amethyst',
      primary: '#8b5cf6',
      accent: '#6366f1',
      shades: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95' },
      bgLight: { start: '#ede9fe', middle: '#f5f3ff', end: '#ffffff' },
      bgDark: { start: '#120d2b', middle: '#070512', end: '#020106' },
      font: "'Outfit', sans-serif",
      radius: '16px',
      btnRadius: '10px',
      glow: '0 0 20px rgba(139, 92, 246, 0.5)',
      speedMultiplier: '0.8'
    },
    {
      name: 'Crimson',
      primary: '#e11d48',
      accent: '#f43f5e',
      shades: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#e11d48', 600: '#be123c', 700: '#9f1239', 800: '#881337', 900: '#4c0519' },
      bgLight: { start: '#ffe4e6', middle: '#fff1f2', end: '#ffffff' },
      bgDark: { start: '#1c0309', middle: '#0e0104', end: '#040001' },
      font: "'Outfit', sans-serif",
      radius: '20px',
      btnRadius: '14px',
      glow: '0 0 30px rgba(244, 63, 94, 0.45), 0 0 60px rgba(225, 29, 72, 0.15)',
      speedMultiplier: '0.7'
    },
    {
      name: 'Ocean',
      primary: '#0ea5e9',
      accent: '#3b82f6',
      shades: { 50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e' },
      bgLight: { start: '#e0f2fe', middle: '#f0f9ff', end: '#ffffff' },
      bgDark: { start: '#041727', middle: '#010911', end: '#000306' },
      font: "'Outfit', sans-serif",
      radius: '24px',
      btnRadius: '12px',
      glow: '0 8px 30px rgba(14, 165, 233, 0.15)',
      speedMultiplier: '1.0'
    },
    {
      name: 'Amber',
      primary: '#f59e0b',
      accent: '#eab308',
      shades: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f' },
      bgLight: { start: '#fef3c7', middle: '#fffbeb', end: '#ffffff' },
      bgDark: { start: '#1a1000', middle: '#0d0800', end: '#050200' },
      font: "'Cinzel', serif",
      radius: '20px',
      btnRadius: '14px',
      glow: '0 0 30px rgba(245, 158, 11, 0.45), 0 0 60px rgba(234, 179, 8, 0.15)',
      speedMultiplier: '0.7'
    },
    {
      name: 'Rose',
      primary: '#f43f5e',
      accent: '#d946ef',
      shades: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337' },
      bgLight: { start: '#ffe4e6', middle: '#fff1f2', end: '#ffffff' },
      bgDark: { start: '#22040b', middle: '#0e0104', end: '#040001' },
      font: "'Playfair Display', serif",
      radius: '32px',
      btnRadius: '16px',
      glow: '0 0 25px rgba(244, 63, 94, 0.5)',
      speedMultiplier: '0.7'
    },
    {
      name: 'Midnight',
      primary: '#6366f1',
      accent: '#818cf8',
      shades: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81' },
      bgLight: { start: '#e0e7ff', middle: '#eef2ff', end: '#ffffff' },
      bgDark: { start: '#0c0a2a', middle: '#050419', end: '#010106' },
      font: "'Cinzel', serif",
      radius: '12px',
      btnRadius: '6px',
      glow: '0 0 18px rgba(99, 102, 241, 0.5)',
      speedMultiplier: '1.4'
    },
    {
      name: 'Sakura',
      primary: '#ec4899',
      accent: '#f472b6',
      shades: { 50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843' },
      bgLight: { start: '#fce7f3', middle: '#fdf2f8', end: '#ffffff' },
      bgDark: { start: '#200716', middle: '#0e030a', end: '#040002' },
      font: "'Playfair Display', serif",
      radius: '28px',
      btnRadius: '14px',
      glow: '0 0 22px rgba(236, 72, 153, 0.5)',
      speedMultiplier: '0.8'
    },
    {
      name: 'Mint',
      primary: '#2dd4bf',
      accent: '#10b981',
      shades: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a' },
      bgLight: { start: '#ccfbf1', middle: '#f0fdfa', end: '#ffffff' },
      bgDark: { start: '#00140c', middle: '#000704', end: '#000201' },
      font: "'Space Grotesk', sans-serif",
      radius: '20px',
      btnRadius: '14px',
      glow: '0 0 30px rgba(45, 212, 191, 0.45), 0 0 60px rgba(16, 185, 129, 0.15)',
      speedMultiplier: '0.8'
    },
    {
      name: 'Slate',
      primary: '#64748b',
      accent: '#94a3b8',
      shades: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
      bgLight: { start: '#f1f5f9', middle: '#f8fafc', end: '#ffffff' },
      bgDark: { start: '#0a0f18', middle: '#05080e', end: '#020305' },
      font: "'Inter', sans-serif",
      radius: '8px',
      btnRadius: '6px',
      glow: '0 0 10px rgba(100, 116, 139, 0.3)',
      speedMultiplier: '1.5'
    },
    {
      name: 'Coral',
      primary: '#fb7185',
      accent: '#f97316',
      shades: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337' },
      bgLight: { start: '#ffe4e6', middle: '#fff1f2', end: '#ffffff' },
      bgDark: { start: '#220812', middle: '#0e0308', end: '#040002' },
      font: "'Space Grotesk', sans-serif",
      radius: '14px',
      btnRadius: '8px',
      glow: '0 0 18px rgba(251, 113, 133, 0.4)',
      speedMultiplier: '0.7'
    },
    {
      name: 'Cyber',
      primary: '#22d3ee',
      accent: '#a78bfa',
      shades: { 50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63' },
      bgLight: { start: '#cffafe', middle: '#ecfeff', end: '#ffffff' },
      bgDark: { start: '#061320', middle: '#030910', end: '#010305' },
      font: "'Share Tech Mono', monospace",
      radius: '20px',
      btnRadius: '14px',
      glow: '0 0 30px rgba(34, 211, 238, 0.45), 0 0 60px rgba(167, 139, 250, 0.15)',
      speedMultiplier: '0.9'
    }
  ];

  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('theme-color') || 'Ocean';
  });
  const [customColor, setCustomColor] = useState(() => {
    return localStorage.getItem('custom-theme-color') || '#6366f1';
  });
  const [customFont, setCustomFont] = useState(() => {
    return localStorage.getItem('custom-theme-font') || 'Inter';
  });
  const [customFontSize, setCustomFontSize] = useState(() => {
    return localStorage.getItem('custom-theme-fontsize') || '100%';
  });

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef(null);

  const applyThemeColor = (themeName) => {
    let selected;
    if (themeName === 'Custom') {
      const savedCustom = localStorage.getItem('custom-theme-color') || customColor;
      selected = generateThemeFromHex(savedCustom);
    } else {
      selected = themes.find(t => t.name === themeName) || themes[0];
    }
    document.documentElement.style.setProperty('--color-theme-primary', selected.primary);
    document.documentElement.style.setProperty('--color-theme-accent', selected.accent);
    
    // Inject custom fonts and parameters
    if (themeName === 'Custom') {
      const fontVal = localStorage.getItem('custom-theme-font') || customFont;
      const sizeVal = localStorage.getItem('custom-theme-fontsize') || customFontSize;
      document.documentElement.style.setProperty('--font-family-theme', `'${fontVal}', sans-serif`);
      document.documentElement.style.setProperty('--theme-font-size-adjust', sizeVal);
      document.documentElement.style.setProperty('--theme-border-radius', '24px');
      document.documentElement.style.setProperty('--theme-button-border-radius', '12px');
      document.documentElement.style.setProperty('--theme-glow-shadow', 'none');
      document.documentElement.style.setProperty('--theme-speed-multiplier', '1.0');
    } else {
      document.documentElement.style.setProperty('--font-family-theme', selected.font || "'Inter', sans-serif");
      document.documentElement.style.setProperty('--theme-font-size-adjust', '100%');
      document.documentElement.style.setProperty('--theme-border-radius', selected.radius || '24px');
      document.documentElement.style.setProperty('--theme-button-border-radius', selected.btnRadius || '12px');
      document.documentElement.style.setProperty('--theme-glow-shadow', selected.glow || 'none');
      document.documentElement.style.setProperty('--theme-speed-multiplier', selected.speedMultiplier || '1.0');
    }

    // Inject all 10 shades for the selected theme dynamically
    document.documentElement.style.setProperty('--color-primary-50', selected.shades[50]);
    document.documentElement.style.setProperty('--color-primary-100', selected.shades[100]);
    document.documentElement.style.setProperty('--color-primary-200', selected.shades[200]);
    document.documentElement.style.setProperty('--color-primary-300', selected.shades[300]);
    document.documentElement.style.setProperty('--color-primary-400', selected.shades[400]);
    document.documentElement.style.setProperty('--color-primary-500', selected.shades[500]);
    document.documentElement.style.setProperty('--color-primary-600', selected.shades[600]);
    document.documentElement.style.setProperty('--color-primary-700', selected.shades[700]);
    document.documentElement.style.setProperty('--color-primary-800', selected.shades[800]);
    document.documentElement.style.setProperty('--color-primary-900', selected.shades[900]);

    // Inject the gradient background variables dynamically
    document.documentElement.style.setProperty('--bg-gradient-start', selected.bgLight.start);
    document.documentElement.style.setProperty('--bg-gradient-middle', selected.bgLight.middle);
    document.documentElement.style.setProperty('--bg-gradient-end', selected.bgLight.end);
    document.documentElement.style.setProperty('--dark-bg-gradient-start', selected.bgDark.start);
    document.documentElement.style.setProperty('--dark-bg-gradient-middle', selected.bgDark.middle);
    document.documentElement.style.setProperty('--dark-bg-gradient-end', selected.bgDark.end);
    
    localStorage.setItem('theme-color', themeName);
    setThemeColor(themeName);
  };

  const handleCustomColorChange = (hex) => {
    setCustomColor(hex);
    localStorage.setItem('custom-theme-color', hex);
    localStorage.setItem('theme-color', 'Custom');
    setThemeColor('Custom');
    setGamificationData(prev => prev ? { ...prev, currentTheme: 'Custom' } : { currentTheme: 'Custom' });
    
    // Save custom theme selection to backend database if not already set
    if (gamificationData?.currentTheme !== 'Custom') {
      axios.post('/gamification/shop/equip', { category: 'theme', value: 'Custom' })
        .then(() => {
          if (socket) socket.emit('equip_change', { category: 'theme', value: 'Custom' });
        })
        .catch(err => console.error('Failed to equip Custom theme on backend:', err));
    }
    const custom = generateThemeFromHex(hex);
    document.documentElement.style.setProperty('--color-theme-primary', custom.primary);
    document.documentElement.style.setProperty('--color-theme-accent', custom.accent);
    
    // Inject default values for custom color
    document.documentElement.style.setProperty('--font-family-theme', `'${customFont}', sans-serif`);
    document.documentElement.style.setProperty('--theme-font-size-adjust', customFontSize);
    document.documentElement.style.setProperty('--theme-border-radius', '24px');
    document.documentElement.style.setProperty('--theme-button-border-radius', '12px');
    document.documentElement.style.setProperty('--theme-glow-shadow', 'none');
    document.documentElement.style.setProperty('--theme-speed-multiplier', '1.0');

    Object.entries(custom.shades).forEach(([k,v]) => document.documentElement.style.setProperty(`--color-primary-${k}`, v));
    document.documentElement.style.setProperty('--bg-gradient-start', custom.bgLight.start);
    document.documentElement.style.setProperty('--bg-gradient-middle', custom.bgLight.middle);
    document.documentElement.style.setProperty('--bg-gradient-end', custom.bgLight.end);
    document.documentElement.style.setProperty('--dark-bg-gradient-start', custom.bgDark.start);
    document.documentElement.style.setProperty('--dark-bg-gradient-middle', custom.bgDark.middle);
    document.documentElement.style.setProperty('--dark-bg-gradient-end', custom.bgDark.end);
  };

  const handleCustomFontChange = (font) => {
    setCustomFont(font);
    localStorage.setItem('custom-theme-font', font);
    if (themeColor === 'Custom') {
      document.documentElement.style.setProperty('--font-family-theme', `'${font}', sans-serif`);
    }
  };

  const handleCustomFontSizeChange = (size) => {
    setCustomFontSize(size);
    localStorage.setItem('custom-theme-fontsize', size);
    if (themeColor === 'Custom') {
      document.documentElement.style.setProperty('--theme-font-size-adjust', size);
    }
  };

  const isThemeUnlocked = (themeName) => {
    if (user?.role !== 'student') return true;
    if (themeName === 'Emerald') return true;
    
    const currentEquipped = gamificationData?.currentTheme || '';
    if (currentEquipped === themeName) return true;
    
    const unlocked = gamificationData?.unlockedThemes || [];
    if (unlocked.includes(themeName)) return true;
    
    // Check badge requirements for achievement-locked themes
    const userBadges = gamificationData?.badges || [];
    console.log('[ThemeLockCheck] name:', themeName, 'current:', currentEquipped, 'unlocked:', unlocked, 'badges:', userBadges.map(b => typeof b === 'object' ? b.name : b));
    
    if (themeName === 'Amethyst') {
      return userBadges.some(b => b && (b.name === 'Coding Legend' || b === 'Coding Legend'));
    }
    if (themeName === 'Amber') {
      return userBadges.some(b => b && (b.name === 'Millionaire' || b === 'Millionaire'));
    }
    if (themeName === 'Cyber') {
      return userBadges.some(b => b && (b.name === 'Legend League' || b === 'Legend League'));
    }
    if (themeName === 'Crimson') {
      return userBadges.some(b => b && (b.name === 'Coding Titan' || b === 'Coding Titan'));
    }
    if (themeName === 'Mint') {
      return userBadges.some(b => b && (b.name === 'Perfect Attendance' || b === 'Perfect Attendance'));
    }
    return false;
  };

  const isCustomColorAllowed = () => {
    if (user?.role !== 'student') return true;
    if (gamificationData?.isRankOne) return true;
    
    // Unlocks as achievement reward (Coding Master or Legend League badge)
    const userBadges = gamificationData?.badges || [];
    return userBadges.some(b => b.name === 'Coding Master' || b.name === 'Legend League');
  };

  useEffect(() => {
    applyThemeColor(themeColor);
  }, [themeColor]);

  // Close theme menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark';
    } catch {
      return false;
    }
  });

  const [sessionActive, setSessionActive] = useState(() => {
    try {
      return localStorage.getItem('sessionActive') === 'true';
    } catch {
      return false;
    }
  });
  const [attendanceId, setAttendanceId] = useState(() => {
    try {
      return localStorage.getItem('attendanceId') || null;
    } catch {
      return null;
    }
  });
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isSyncing, setIsSyncing] = useState(user?.role === 'student');
  const [userCoins, setUserCoins] = useState(0);
  const [gamificationData, setGamificationData] = useState(null);
  const sessionSecondsRef = useRef(0);
  useEffect(() => { sessionSecondsRef.current = sessionSeconds; }, [sessionSeconds]);
  const attendanceIdRef = useRef(null);

  useEffect(() => {
    if (gamificationData?.currentTheme) {
      applyThemeColor(gamificationData.currentTheme);
    } else if (gamificationData) {
      applyThemeColor('Emerald');
    }
  }, [gamificationData?.currentTheme, gamificationData]);

  useEffect(() => {
    localStorage.setItem('sessionActive', sessionActive ? 'true' : 'false');
  }, [sessionActive]);

  useEffect(() => {
    if (attendanceId) {
      localStorage.setItem('attendanceId', attendanceId);
      attendanceIdRef.current = attendanceId;
    } else {
      localStorage.removeItem('attendanceId');
      attendanceIdRef.current = null;
    }
  }, [attendanceId]);

  // Notification count state
  const [pendingCount, setPendingCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [leavesCount, setLeavesCount] = useState(0);
  const [joinsCount, setJoinsCount] = useState(0);
  const [onlineStudentsCount, setOnlineStudentsCount] = useState(0);

  const [activeLeaveStatus, setActiveLeaveStatus] = useState({ isOnLeave: false, message: '' });

  // Header Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Persisted cleared notifications
  const [clearedNotifs, setClearedNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('clearedNotifs')) || []; } catch { return []; }
  });

  // Track seen badge counts to hide red dots permanently until new updates arrive
  const [seenCounts, setSeenCounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('seenBadgeCounts')) || {}; } catch { return {}; }
  });

  const notifLengthRef = useRef(0);
  useEffect(() => {
    notifLengthRef.current = notifications.length;
  }, [notifications.length]);

  // Clear badge when visiting the route
  useEffect(() => {
    const updateSeen = (key, count) => {
      if (count > 0 && seenCounts[key] !== count) {
        setSeenCounts(prev => {
          const next = { ...prev, [key]: count };
          localStorage.setItem('seenBadgeCounts', JSON.stringify(next));
          return next;
        });
      }
    };
    if (location.pathname.startsWith('/student/tasks')) updateSeen('tasks', pendingCount);
    if (location.pathname.startsWith('/student/chat')) updateSeen('chats', chatCount);
    if (location.pathname.startsWith('/reviews')) updateSeen('reviews', pendingCount);
    if (location.pathname.startsWith('/enrollments')) updateSeen('joins', joinsCount);
    if (location.pathname.startsWith('/leaves')) updateSeen('leaves', leavesCount);
  }, [location.pathname, pendingCount, chatCount, joinsCount, leavesCount, seenCounts]);

  // Global Click Sound & Particle Effect Listener
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const isClickable = e.target.closest('button, a, select, input[type="submit"]');
      if (isClickable) {
        soundManager.init(); // Init context if needed
        soundManager.playClick();
      }

      // Dynamic cursor click particle effects
      const activeEffect = gamificationData?.equippedEffect || user?.equippedEffect;
      if (activeEffect) {
        const getEffectParticles = (eff) => {
          switch (eff) {
            case 'sparkles':
              return ['✨', '⭐', '🌟'];
            case 'fire-aura':
              return ['🔥', '💥', '✨'];
            case 'lightning-aura':
              return ['⚡', '🌀', '✨'];
            case 'galaxy-aura':
              return ['🪐', '✨', '☄️'];
            case 'snowstorm':
              return ['❄️', '❄️', '⛄'];
            case 'heartbeat':
              return ['❤️', '💖', '💗', '💘'];
            case 'cyber-grid':
              return ['0', '1', '👾'];
            case 'perfect-attendance-aura':
              return ['👑', '⭐', '✨'];
            default:
              return [];
          }
        };

        const items = getEffectParticles(activeEffect);
        if (items.length > 0) {
          const particleCount = 8;
          for (let i = 0; i < particleCount; i++) {
            const el = document.createElement('span');
            el.className = 'click-particle';
            el.textContent = items[Math.floor(Math.random() * items.length)];

            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 60;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            const rotate = -180 + Math.random() * 360;
            const fontSize = 10 + Math.random() * 14;

            el.style.left = `${e.clientX}px`;
            el.style.top = `${e.clientY}px`;
            el.style.fontSize = `${fontSize}px`;
            el.style.setProperty('--x', `${x}px`);
            el.style.setProperty('--y', `${y}px`);
            el.style.setProperty('--r', `${rotate}deg`);

            document.body.appendChild(el);
            setTimeout(() => el.remove(), 700);
          }
        }
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [gamificationData?.equippedEffect, user?.equippedEffect]);

  // Initialize Dark/Light Mode & Close Notifications on Outside Click
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        setDarkMode(true);
      } else {
        document.documentElement.classList.remove('dark');
        setDarkMode(false);
      }
    } catch (e) {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    }

    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
      try {
        localStorage.setItem('theme', 'light');
      } catch (e) {}
    } else {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
      try {
        localStorage.setItem('theme', 'dark');
      } catch (e) {}
    }
  };

  // Student Attendance Tracking
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const checkingInRef = useRef(false);
  const timerIntervalRef = useRef(null);

  const startSession = async () => {
    if (checkingInRef.current || sessionActive) return;
    checkingInRef.current = true;
    setIsCheckingIn(true);
    try {
      const { data } = await axios.post('/attendance/checkin');
      setAttendanceId(data._id);
      attendanceIdRef.current = data._id;
      setSessionActive(true);
      localStorage.setItem('sessionActive', 'true');
      await syncAttendanceSession();
    } catch (error) {
      console.error('Checkin failed:', error);
      Swal.fire({
        title: 'Check-in Failed',
        text: error.response?.data?.message || 'Unable to check in at this time.',
        icon: 'error',
        confirmButtonText: 'Understood'
      });
    } finally {
      checkingInRef.current = false;
      setIsCheckingIn(false);
    }
  };

  useEffect(() => {
    if (sessionActive) {
      if (!timerIntervalRef.current) {
        let lastTick = Date.now();
        timerIntervalRef.current = setInterval(() => {
          const now = Date.now();
          const delta = Math.floor((now - lastTick) / 1000);
          if (delta > 0) {
            setSessionSeconds(prev => prev + delta);
            lastTick = now;
          }
        }, 1000);
      }
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [sessionActive]);

  // Sync attendance session and active leave state (run on mount & checked state updates)
  const syncAttendanceSession = useCallback(async () => {
    if (!user || user.role !== 'student') return;
    try {
      try {
        const { data: leaveData } = await axios.get('/leaves/active-status');
        setActiveLeaveStatus({ isOnLeave: leaveData.isOnLeave, message: leaveData.message });
      } catch (leaveErr) {
        console.error('Failed to fetch active leave status:', leaveErr);
      }

      // Restore today's attendance session state
      const summaryRes = await axios.get('/attendance/my-summary');
      const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      const todayRecords = summaryRes.data.filter(r => {
        const rDate = r.date || (r.firstCheckIn ? new Date(r.firstCheckIn).toISOString().split('T')[0] : '');
        return rDate === todayStr;
      });

      if (todayRecords.length > 0) {
        const totalTodaySeconds = todayRecords.reduce((acc, curr) => acc + (curr.totalSeconds || 0), 0);
        const activeRecord = todayRecords.find(r => r.isActive);

        let additionalSeconds = 0;
        if (activeRecord && activeRecord.lastCheckInTime) {
          const now = Date.now();
          const lastCheckIn = new Date(activeRecord.lastCheckInTime).getTime();
          if (now > lastCheckIn) {
            additionalSeconds = Math.floor((now - lastCheckIn) / 1000);
          }
        }

        setSessionSeconds(totalTodaySeconds + additionalSeconds);

        if (activeRecord) {
          setSessionActive(true);
          setAttendanceId(activeRecord._id);
          attendanceIdRef.current = activeRecord._id;
        } else {
          setSessionActive(false);
          setAttendanceId(null);
          attendanceIdRef.current = null;
          localStorage.removeItem('sessionActive');
        }
      } else {
        setSessionActive(false);
        setAttendanceId(null);
        attendanceIdRef.current = null;
        setSessionSeconds(0);
      }
    } catch (attErr) {
      console.error('Failed to restore attendance session:', attErr);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  // Fetch pending notifications count – extracted to component scope so child pages can call it
  const fetchCounts = useCallback(async () => {
    try {
      const { data: onlineData } = await axios.get('/attendance/active-count');
      setOnlineStudentsCount(onlineData.activeCount || 0);

      if (user?.role === 'admin') {
        const { data } = await axios.get('/analytics/dashboard');
        setPendingCount(data.pendingReviews || 0);
        setLeavesCount(data.pendingLeavesCount || 0);
        setJoinsCount(data.joinRequestsCount || 0);

        const newNotifs = (data.notifications || []).filter(n => !clearedNotifs.includes(n.id));
        if (newNotifs.length > notifLengthRef.current && notifLengthRef.current > 0) {
          soundManager.playNotification();
        }
        setNotifications(newNotifs);
      } else if (user?.role === 'student') {
        const [analyticsRes, gamificationRes] = await Promise.all([
          axios.get(`/analytics/student/${user._id}?mini=true`),
          axios.get('/gamification/status')
        ]);
        const data = analyticsRes.data;
        const gamification = gamificationRes.data;
        
        setPendingCount(data.pendingTasks || 0);
        setChatCount(data.recentChats || 0);
        setUserCoins(gamification.coins || 0);
        setGamificationData(gamification);

        const newNotifs = (data.notifications || []).filter(n => !clearedNotifs.includes(n.id));
        if (newNotifs.length > notifLengthRef.current && notifLengthRef.current > 0) {
          soundManager.playNotification();
        }
        setNotifications(newNotifs);
      }
    } catch (e) {
      console.error('Failed to fetch counts');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCounts();
      syncAttendanceSession();
      
      let intervalId;
      const startInterval = (ms) => {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(fetchCounts, ms);
      };

      // Default active polling: 30 seconds
      startInterval(30000);

      const handleVisibilityChange = () => {
        if (document.hidden) {
          // Throttle background polling to 3 minutes to optimize free backend nodes
          startInterval(180000);
        } else {
          // Resume normal 30s polling on tab focus
          fetchCounts();
          startInterval(30000);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        if (intervalId) clearInterval(intervalId);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user, fetchCounts, syncAttendanceSession]); // Re-fetch or clear if user changes

  // Listen for real-time administrator force-checkout events
  useEffect(() => {
    if (socket && user?.role === 'student') {
      const handleForceCheckout = (data) => {
        console.log('Force-checkout event received via socket:', data);
        setSessionActive(false);
        setAttendanceId(null);
        attendanceIdRef.current = null;
        localStorage.removeItem('sessionActive');
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        Swal.fire({
          icon: 'warning',
          title: 'Session Checked Out',
          text: 'Your active attendance session has been ended by the administrator.',
          confirmButtonColor: '#f97316'
        });
      };

      socket.on('force-checkout', handleForceCheckout);

      return () => {
        socket.off('force-checkout', handleForceCheckout);
      };
    }
  }, [socket, user]);



  const endSession = async (overrideSeconds) => {
    if (checkingInRef.current) return;
    if (user?.role === 'student' && attendanceIdRef.current) {
      checkingInRef.current = true;
      setIsCheckingIn(true);
      try {
        const finalSeconds = typeof overrideSeconds === 'number' ? overrideSeconds : sessionSecondsRef.current;
        await axios.post(`/attendance/checkout/${attendanceIdRef.current}`, {
          totalSeconds: finalSeconds
        });
        
        setSessionActive(false);
        setAttendanceId(null);
        attendanceIdRef.current = null;
        localStorage.removeItem('sessionActive');

        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        // Fetch fresh aggregated total
        try {
          await syncAttendanceSession();
        } catch (e) { console.error('Failed to sync summary:', e); }

        Swal.fire({
          icon: 'success',
          title: 'Checked Out Successfully',
          text: 'Have a great day! Your attendance session has been ended.',
          confirmButtonColor: '#10b981',
          timer: 3500
        });

      } catch (e) {
        console.error('Checkout failed:', e);
        Swal.fire({
          icon: 'error',
          title: 'Check-out Failed',
          text: e.response?.data?.message || 'Unable to check out. Please verify your internet connection and try again.',
          confirmButtonColor: '#ef4444'
        });
      } finally {
        checkingInRef.current = false;
        setIsCheckingIn(false);
      }
    } else {
      setSessionActive(false);
      localStorage.removeItem('sessionActive');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      Swal.fire({
        icon: 'warning',
        title: 'Check-out Resynced',
        text: 'The active session could not be verified on the server, but your local session has been cleared.',
        confirmButtonColor: '#f59e0b'
      });
    }
  };

  const handleLogout = async () => {
    if (sessionActive) {
      Swal.fire({
        icon: 'warning',
        title: 'Please Check Out First',
        text: 'You must check out from your current attendance session before logging out.',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    localStorage.removeItem('sessionActive');
    localStorage.removeItem('attendanceId');
    await logout();
    navigate('/login');
  };

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const clearNotification = (id) => {
    const updatedCleared = [...clearedNotifs, id];
    setClearedNotifs(updatedCleared);
    localStorage.setItem('clearedNotifs', JSON.stringify(updatedCleared));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    const allIds = notifications.map(n => n.id);
    const updatedCleared = [...clearedNotifs, ...allIds];
    setClearedNotifs(updatedCleared);
    localStorage.setItem('clearedNotifs', JSON.stringify(updatedCleared));
    setNotifications([]);
    setShowNotifications(false);
  };

  const getBadge = (key, count) => {
    // If current count is greater than the seen count, show the new total count
    return count > (seenCounts[key] || 0) ? count : 0;
  };

  const adminSections = [
    {
      label: 'Overview',
      links: [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
      ]
    },
    {
      label: 'Academic',
      links: [
        { name: 'Task Management', path: '/tasks', icon: <FileText size={20} /> },
        { name: 'Review Submissions', path: '/reviews', icon: <CheckCircle size={20} />, badge: getBadge('reviews', pendingCount) },
        { name: 'LeetCode Challenges', path: '/leetcode', icon: <Code size={20} /> },
        { name: 'Mock Drives', path: '/mock-drives', icon: <Briefcase size={20} /> },
        { name: 'Leaderboard', path: '/student/leaderboard', icon: <Trophy size={20} /> },
      ]
    },
    {
      label: 'Management',
      links: [
        { name: 'Student Directory', path: '/students', icon: <Users size={20} /> },
        { name: 'Task Tracker', path: '/batch-tracker', icon: <BookOpen size={20} /> },
      ]
    },
    {
      label: 'Operations',
      links: [
        { name: 'Attendance', path: '/attendance-logs', icon: <Clock size={20} /> },
        { name: 'Check-In Permissions', path: '/checkin-permissions', icon: <ShieldCheck size={20} /> },
        { name: 'Attendance Tracker', path: '/attendance-tracker', icon: <Clock size={20} /> },
        { name: 'Leave Requests', path: '/leaves', icon: <Calendar size={20} />, badge: getBadge('leaves', leavesCount) },
        { name: 'Batch Chat', path: '/chat', icon: <MessageCircle size={20} /> },
        { name: 'Traffic Control', path: '/traffic', icon: <Network size={20} /> },
        { name: 'Activity Logs', path: '/activity-logs', icon: <Activity size={20} /> },
      ]
    },
    {
      label: 'Account',
      links: [
        { name: 'Admin Profile', path: '/profile', icon: <UserIcon size={20} /> },
      ]
    }
  ];

  const studentSections = [
    {
      label: 'Main',
      links: [
        { name: 'Dashboard', path: '/student', icon: <LayoutDashboard size={20} /> },
        { name: 'Gamification Hub', path: '/student/wardrobe', icon: <Gamepad2 size={20} /> },
      ]
    },
    {
      label: 'Learning',
      links: [
        { name: 'My Tasks', path: '/student/tasks', icon: <FileText size={20} />, badge: getBadge('tasks', pendingCount) },
        { name: 'LeetCode', path: '/student/leetcode', icon: <Code size={20} /> },
      ]
    },
    {
      label: 'Performance',
      links: [
        { name: 'My Grades', path: '/student/grades', icon: <CheckCircle size={20} /> },
        { name: 'Mock Drives', path: '/student/grades?tab=mockDrives', icon: <Briefcase size={20} /> },
        { name: 'Leaderboard', path: '/student/leaderboard', icon: <Trophy size={20} /> },
        { name: 'Attendance Tracker', path: '/attendance-tracker', icon: <Clock size={20} /> },
      ]
    },
    {
      label: 'Batches & Chat',
      links: [
        { name: 'My Batches', path: '/student/my-batches', icon: <Users size={20} /> },
        { name: 'Available Batches', path: '/student/available-batches', icon: <BookOpen size={20} /> },
        { name: 'Batch Chat', path: '/student/chat', icon: <MessageCircle size={20} />, badge: getBadge('chats', chatCount) },
      ]
    },
    {
      label: 'Account',
      links: [
        { name: 'Login Activity', path: '/student/attendance', icon: <Clock size={20} /> },
        { name: 'Leave Application', path: '/student/leaves', icon: <Calendar size={20} /> },
        { name: 'My Profile', path: '/student/profile', icon: <UserIcon size={20} /> },
      ]
    }
  ];

  const sections = user?.role === 'admin' ? adminSections : studentSections;

  // Auto-expand section containing the active path on mount and navigation
  useEffect(() => {
    if (!sections) return;
    const activeSection = sections.find(section => 
      section.links.some(link => 
        location.pathname === link.path || 
        (link.path !== '/' && link.path !== '/student' && location.pathname.startsWith(link.path))
      )
    );
    if (activeSection) {
      setExpandedSections(prev => {
        if (prev[activeSection.label]) return prev;
        const updated = { ...prev, [activeSection.label]: true };
        try {
          localStorage.setItem('expandedSections', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      setPinnedSections(prev => {
        if (prev[activeSection.label]) return prev;
        const updated = { ...prev, [activeSection.label]: true };
        try {
          localStorage.setItem('pinnedSections', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }
  }, [location.pathname, sections]);

  if (user?.role === 'student' && isMobile) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
          <Monitor size={40} className="text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Desktop Access Required</h1>
        <p className="text-slate-400 max-w-md mx-auto mb-8">
          The student portal is optimized for laptop and desktop browsers. Please log in from a computer to access your classes, tasks, and materials.
        </p>
        <button
          onClick={logout}
          className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-500 flex bg-transparent relative">
      {/* Premium Theme Card Shimmer & Legibility Style Overrides */}
      {['Amber', 'Cyber', 'Crimson', 'Mint'].includes(themeColor) && (() => {
        let cardBgDark, cardBgLight, borderColor, borderColorLight, shimmerColor, highlightDark, highlightLight, glassBgDark, glassBgLight, buttonGradient, glowShadow;
        
        if (themeColor === 'Amber') {
          cardBgDark = 'linear-gradient(135deg, rgba(24, 16, 4, 0.8) 0%, rgba(13, 8, 2, 0.9) 100%)';
          cardBgLight = 'linear-gradient(135deg, rgba(255, 252, 245, 0.9) 0%, rgba(254, 243, 205, 0.8) 100%)';
          borderColor = 'rgba(245, 158, 11, 0.3)';
          borderColorLight = 'rgba(217, 119, 6, 0.35)';
          shimmerColor = 'rgba(251, 191, 36, 0.2)';
          highlightDark = '#fbbf24';
          highlightLight = '#b45309';
          glassBgDark = 'rgba(20, 13, 3, 0.55)';
          glassBgLight = 'rgba(254, 243, 202, 0.45)';
          buttonGradient = 'linear-gradient(135deg, #f59e0b, #d97706)';
          glowShadow = '0 0 30px rgba(245, 158, 11, 0.45), 0 0 60px rgba(234, 179, 8, 0.15)';
        } else if (themeColor === 'Cyber') {
          cardBgDark = 'linear-gradient(135deg, rgba(4, 16, 24, 0.8) 0%, rgba(2, 8, 13, 0.9) 100%)';
          cardBgLight = 'linear-gradient(135deg, rgba(245, 253, 255, 0.9) 0%, rgba(207, 250, 254, 0.8) 100%)';
          borderColor = 'rgba(34, 211, 238, 0.3)';
          borderColorLight = 'rgba(8, 145, 178, 0.35)';
          shimmerColor = 'rgba(34, 211, 238, 0.2)';
          highlightDark = '#22d3ee';
          highlightLight = '#0891b2';
          glassBgDark = 'rgba(3, 13, 20, 0.55)';
          glassBgLight = 'rgba(207, 250, 254, 0.45)';
          buttonGradient = 'linear-gradient(135deg, #22d3ee, #0891b2)';
          glowShadow = '0 0 30px rgba(34, 211, 238, 0.45), 0 0 60px rgba(167, 139, 250, 0.15)';
        } else if (themeColor === 'Crimson') {
          cardBgDark = 'linear-gradient(135deg, rgba(24, 4, 10, 0.8) 0%, rgba(13, 2, 5, 0.9) 100%)';
          cardBgLight = 'linear-gradient(135deg, rgba(255, 245, 247, 0.9) 0%, rgba(254, 228, 232, 0.8) 100%)';
          borderColor = 'rgba(225, 29, 72, 0.3)';
          borderColorLight = 'rgba(225, 29, 72, 0.35)';
          shimmerColor = 'rgba(244, 63, 94, 0.2)';
          highlightDark = '#f43f5e';
          highlightLight = '#be123c';
          glassBgDark = 'rgba(20, 3, 10, 0.55)';
          glassBgLight = 'rgba(254, 228, 232, 0.45)';
          buttonGradient = 'linear-gradient(135deg, #f43f5e, #be123c)';
          glowShadow = '0 0 30px rgba(244, 63, 94, 0.45), 0 0 60px rgba(225, 29, 72, 0.15)';
        } else if (themeColor === 'Mint') {
          cardBgDark = 'linear-gradient(135deg, rgba(4, 24, 16, 0.8) 0%, rgba(2, 13, 8, 0.9) 100%)';
          cardBgLight = 'linear-gradient(135deg, rgba(240, 253, 250, 0.9) 0%, rgba(204, 251, 241, 0.8) 100%)';
          borderColor = 'rgba(45, 212, 191, 0.3)';
          borderColorLight = 'rgba(13, 148, 136, 0.35)';
          shimmerColor = 'rgba(45, 212, 191, 0.2)';
          highlightDark = '#2dd4bf';
          highlightLight = '#0d9488';
          glassBgDark = 'rgba(3, 20, 13, 0.55)';
          glassBgLight = 'rgba(204, 251, 241, 0.45)';
          buttonGradient = 'linear-gradient(135deg, #2dd4bf, #0d9488)';
          glowShadow = '0 0 30px rgba(45, 212, 191, 0.45), 0 0 60px rgba(16, 185, 129, 0.15)';
        }

        return (
          <style>{`
            /* Dark Mode: Make premium cards look beautiful glassmorphic */
            .dark [class*="bg-gradient-to-br"][class*="from-primary-"],
            .dark [class*="bg-gradient-to-br"][class*="from-amber-500"],
            .dark [class*="bg-gradient-to-br"][class*="from-emerald-"] {
              background: ${cardBgDark} !important;
              border: 1px solid ${borderColor} !important;
              box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 25px ${borderColor.replace('0.3', '0.12')} !important;
              position: relative !important;
              overflow: hidden !important;
            }

            /* Light Mode: Make premium cards look beautiful glassmorphic */
            [class*="bg-gradient-to-br"][class*="from-primary-"],
            [class*="bg-gradient-to-br"][class*="from-amber-500"],
            [class*="bg-gradient-to-br"][class*="from-emerald-"] {
              background: ${cardBgLight} !important;
              border: 1px solid ${borderColorLight} !important;
              box-shadow: 0 10px 30px -10px rgba(180, 83, 9, 0.08), 0 0 20px ${borderColor.replace('0.3', '0.08')} !important;
              position: relative !important;
              overflow: hidden !important;
            }

            /* Ensure text color inside light-mode cards has maximum contrast */
            [class*="bg-gradient-to-br"][class*="from-primary-"] h3,
            [class*="bg-gradient-to-br"][class*="from-primary-"] p,
            [class*="bg-gradient-to-br"][class*="from-primary-"] span,
            [class*="bg-gradient-to-br"][class*="from-primary-"] div,
            [class*="bg-gradient-to-br"][class*="from-amber-500"] h3,
            [class*="bg-gradient-to-br"][class*="from-amber-500"] p,
            [class*="bg-gradient-to-br"][class*="from-amber-500"] span,
            [class*="bg-gradient-to-br"][class*="from-amber-500"] div,
            [class*="bg-gradient-to-br"][class*="from-emerald-"] h3,
            [class*="bg-gradient-to-br"][class*="from-emerald-"] p,
            [class*="bg-gradient-to-br"][class*="from-emerald-"] span,
            [class*="bg-gradient-to-br"][class*="from-emerald-"] div {
              color: #1e293b !important;
            }

            /* Reset text colors in Dark Mode */
            .dark [class*="bg-gradient-to-br"][class*="from-primary-"] h3,
            .dark [class*="bg-gradient-to-br"][class*="from-primary-"] p,
            .dark [class*="bg-gradient-to-br"][class*="from-primary-"] span,
            .dark [class*="bg-gradient-to-br"][class*="from-primary-"] div,
            .dark [class*="bg-gradient-to-br"][class*="from-amber-500"] h3,
            .dark [class*="bg-gradient-to-br"][class*="from-amber-500"] p,
            .dark [class*="bg-gradient-to-br"][class*="from-amber-500"] span,
            .dark [class*="bg-gradient-to-br"][class*="from-amber-500"] div,
            .dark [class*="bg-gradient-to-br"][class*="from-emerald-"] h3,
            .dark [class*="bg-gradient-to-br"][class*="from-emerald-"] p,
            .dark [class*="bg-gradient-to-br"][class*="from-emerald-"] span,
            .dark [class*="bg-gradient-to-br"][class*="from-emerald-"] div {
              color: #ffffff !important;
            }

            /* Style labels/subtext in Light Mode */
            [class*="bg-gradient-to-br"][class*="from-primary-"] [class*="text-primary-"],
            [class*="bg-gradient-to-br"][class*="from-primary-"] [class*="text-emerald-"],
            [class*="bg-gradient-to-br"][class*="from-primary-"] [class*="text-indigo-"],
            [class*="bg-gradient-to-br"][class*="from-primary-"] [class*="text-teal-"],
            [class*="bg-gradient-to-br"][class*="from-primary-"] [class*="text-purple-"],
            [class*="bg-gradient-to-br"][class*="from-amber-500"] [class*="text-primary-"],
            [class*="bg-gradient-to-br"][class*="from-emerald-"] [class*="text-indigo-"] {
              color: ${highlightLight} !important;
            }

            /* Style labels/subtext in Dark Mode */
            .dark [class*="bg-gradient-to-br"][class*="from-primary-"] [class*="text-primary-"],
            .dark [class*="bg-gradient-to-br"][class*="from-primary-"] [class*="text-emerald-"],
            .dark [class*="bg-gradient-to-br"][class*="from-primary-"] [class*="text-indigo-"],
            .dark [class*="bg-gradient-to-br"][class*="from-primary-"] [class*="text-teal-"],
            .dark [class*="bg-gradient-to-br"][class*="from-primary-"] [class*="text-purple-"],
            .dark [class*="bg-gradient-to-br"][class*="from-amber-500"] [class*="text-primary-"],
            .dark [class*="bg-gradient-to-br"][class*="from-emerald-"] [class*="text-indigo-"] {
              color: ${highlightDark} !important;
            }

            /* Individual components shine effect */
            [class*="bg-gradient-to-br"][class*="from-primary-"]::after,
            [class*="bg-gradient-to-br"][class*="from-amber-500"]::after,
            [class*="bg-gradient-to-br"][class*="from-emerald-"]::after {
              content: '';
              position: absolute;
              top: 0;
              left: -150%;
              width: 50%;
              height: 100%;
              background: linear-gradient(
                90deg,
                rgba(255, 255, 255, 0) 0%,
                ${shimmerColor} 50%,
                rgba(255, 255, 255, 0) 100%
              );
              transform: skewX(-25deg);
              animation: card-sweeping-shine 7s infinite ease-in-out;
              pointer-events: none;
              z-index: 5;
            }

            @keyframes card-sweeping-shine {
              0% { left: -150%; }
              30% { left: 150%; }
              100% { left: 150%; }
            }

            /* Dark Mode Premium overrides for General Glass Panels */
            .dark .glass-panel {
              background: ${glassBgDark} !important;
              border-color: ${borderColor} !important;
              box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4), 0 0 20px ${borderColor.replace('0.3', '0.08')} !important;
            }
            
            /* Light Mode Premium overrides for General Glass Panels */
            .glass-panel {
              background: ${glassBgLight} !important;
              border-color: ${borderColorLight} !important;
              box-shadow: 0 8px 32px 0 rgba(180, 83, 9, 0.08), 0 0 20px ${borderColor.replace('0.3', '0.1')} !important;
            }

            /* Primary buttons styling: Dynamic gradient */
            .btn-primary {
              background: ${buttonGradient} !important;
              border-color: ${borderColorLight} !important;
              box-shadow: 0 4px 15px ${borderColor.replace('0.3', '0.4')} !important;
              color: #ffffff !important;
            }
            .btn-primary:hover {
              box-shadow: 0 6px 20px ${borderColor.replace('0.3', '0.6')} !important;
            }
          `}</style>
        );
      })()}
      {/* Background Animated Dots */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Large blurry spots */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-theme-primary/5 dark:bg-theme-primary/3 rounded-full blur-[100px] animate-float-slow"></div>
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-theme-accent/5 dark:bg-theme-accent/3 rounded-full blur-[80px] animate-float-medium"></div>
        <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-theme-primary/4 dark:bg-theme-primary/3 rounded-full blur-[60px] animate-float-fast"></div>
        {/* Floating Tech Logos */}
        {/* Python */}
        <svg className="absolute w-10 h-10 opacity-20 dark:opacity-35 animate-bubble-1 top-[12%] left-[8%]" viewBox="0 0 24 24" fill="var(--color-theme-primary)">
          <path d="M12.012 2c-1.38 0-2.613.11-3.413.298-.8.187-1.488.528-1.927.994-.439.466-.63 1.045-.63 1.932v1.547h6.087v.867H6.042c-1.38 0-2.613.11-3.413.298-.8.187-1.488.528-1.927.994-.439.466-.63 1.045-.63 1.932v3.743c0 .887.19 1.466.63 1.932.44.466 1.127.807 1.927.994.8.188 2.033.298 3.413.298h.813v-1.127c0-1.173.498-2.26 1.378-3.003.88-.743 2.062-1.123 3.325-1.123h3.565c.887 0 1.466-.191 1.932-.63.466-.44.807-1.127.994-1.927.188-.8.298-2.033.298-3.413V6.042c0-1.38-.11-2.613-.298-3.413-.187-.8-.528-1.488-.994-1.927-.466-.439-1.045-.63-1.932-.63h-4.329zm-3.127 1.585a.738.738 0 1 1 0 1.476.738.738 0 0 1 0-1.476zm6.245 4.773v1.127c0 1.173-.498 2.26-1.378 3.003-.88.743-2.062 1.123-3.325 1.123H6.862c-.887 0-1.466.191-1.932.63-.466.44-.807 1.127-.994 1.927-.188.8-.298 2.033-.298 3.413v4.329c0 1.38.11 2.613.298 3.413.187.8.528 1.488.994 1.927.466.439 1.045.63 1.932.63h4.329c1.38 0 2.613-.11 3.413-.298.8-.187 1.488-.528 1.927-.994.439-.466.63-1.045.63-1.932v-1.547h-6.087v-.867h6.087c1.38 0 2.613-.11 3.413-.298.8-.187 1.488-.528 1.927-.994.439-.466.63-1.045.63-1.932v-3.743c0-.887-.19-1.466-.63-1.932-.44-.466-1.127-.807-1.927-.994-.8-.188-2.033-.298-3.413-.298h-.813zm3.127 10.772a.738.738 0 1 1 0 1.476.738.738 0 0 1 0-1.476z"/>
        </svg>
        {/* React / MERN */}
        <svg className="absolute w-10 h-10 opacity-20 dark:opacity-35 animate-bubble-2 top-[40%] left-[12%]" viewBox="0 0 24 24" fill="var(--color-theme-primary)">
          <circle cx="12" cy="12" r="2"/>
          <ellipse cx="12" cy="12" rx="10" ry="3.5" fill="none" stroke="var(--color-theme-primary)" strokeWidth="1.2"/>
          <ellipse cx="12" cy="12" rx="10" ry="3.5" fill="none" stroke="var(--color-theme-primary)" strokeWidth="1.2" transform="rotate(60 12 12)"/>
          <ellipse cx="12" cy="12" rx="10" ry="3.5" fill="none" stroke="var(--color-theme-primary)" strokeWidth="1.2" transform="rotate(120 12 12)"/>
        </svg>
        {/* Java */}
        <svg className="absolute w-11 h-11 opacity-15 dark:opacity-30 animate-bubble-3 top-[72%] left-[22%]" viewBox="0 0 24 24" fill="none" stroke="var(--color-theme-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
          <line x1="6" y1="2" x2="6" y2="4"/>
          <line x1="10" y1="2" x2="10" y2="4"/>
          <line x1="14" y1="2" x2="14" y2="4"/>
        </svg>
        {/* Docker */}
        <svg className="absolute w-11 h-11 opacity-20 dark:opacity-35 animate-bubble-4 top-[20%] right-[12%]" viewBox="0 0 24 24" fill="none" stroke="var(--color-theme-accent)" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M2 13.5c0-1.8 1-3.5 3-4.5 3-1.5 6-1 9 1 1.5 1 3 .5 4.5-.5.5-.3 1-.5 1.5-.5s.8.3.8.8c0 1.2-.5 2.5-1.5 3.5S16 16.5 13.5 16.5H5.5C3.5 16.5 2 15.3 2 13.5z"/>
          <path d="M12.5 8h2v2h-2zM9.5 8h2v2h-2zM6.5 8h2v2h-2zM9.5 5h2v2h-2z"/>
        </svg>
        {/* Node.js */}
        <svg className="absolute w-11 h-11 opacity-15 dark:opacity-30 animate-bubble-5 top-[60%] right-[18%]" viewBox="0 0 24 24" fill="none" stroke="var(--color-theme-primary)" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M12 2L3.5 7v10L12 22l8.5-5V7L12 2z"/>
          <path d="M12 22V12"/>
        </svg>
        {/* C */}
        <svg className="absolute w-9 h-9 opacity-20 dark:opacity-35 animate-bubble-6 top-[32%] right-[32%]" viewBox="0 0 24 24" fill="none" stroke="var(--color-theme-accent)" strokeWidth="2" strokeLinecap="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M14.5 9.5a3 3 0 1 0 0 5" stroke="var(--color-theme-accent)" strokeWidth="2.5"/>
        </svg>
        {/* C++ */}
        <svg className="absolute w-10 h-10 opacity-20 dark:opacity-35 animate-bubble-7 top-[82%] right-[38%]" viewBox="0 0 24 24" fill="none" stroke="var(--color-theme-primary)" strokeWidth="2" strokeLinecap="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M11 9.5a2 2 0 1 0 0 5" stroke="var(--color-theme-primary)" strokeWidth="2"/>
          <path d="M14 12h3M15.5 10.5v3"/>
        </svg>
        {/* GitHub */}
        <svg className="absolute w-9 h-9 opacity-15 dark:opacity-30 animate-bubble-8 top-[50%] left-[42%]" viewBox="0 0 24 24" fill="var(--color-theme-accent)">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
        </svg>
        {/* Redis */}
        <svg className="absolute w-9 h-9 opacity-15 dark:opacity-30 animate-bubble-1 top-[88%] left-[55%]" style={{animationDelay: '3s'}} viewBox="0 0 24 24" fill="none" stroke="var(--color-theme-primary)" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 12l10 5 10-5"/>
          <path d="M2 17l10 5 10-5"/>
        </svg>
        {/* Nginx */}
        <svg className="absolute w-8 h-8 opacity-20 dark:opacity-35 animate-bubble-3 top-[5%] left-[55%]" style={{animationDelay: '5s'}} viewBox="0 0 24 24" fill="none" stroke="var(--color-theme-accent)" strokeWidth="1.5" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="1.5"/>
          <path d="M8 7v10l8-10v10" strokeWidth="2"/>
        </svg>
        {/* MySQL */}
        <svg className="absolute w-10 h-10 opacity-15 dark:opacity-30 animate-bubble-5 top-[40%] right-[80%]" viewBox="0 0 24 24" fill="none" stroke="var(--color-theme-primary)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 12c4-6 10-8 15-4 1.5 1.2 2 3.2 2.5 5 .5 1.8-1 2.5-2.5 2s-3.5-2-6.5-1-6 3.5-8.5 3c-1.5-.3-2.5-2-2.5-5z"/>
        </svg>
        {/* Ubuntu */}
        <svg className="absolute w-9 h-9 opacity-20 dark:opacity-35 animate-bubble-7 top-[75%] right-[85%]" viewBox="0 0 24 24" fill="none" stroke="var(--color-theme-accent)" strokeWidth="1.5">
          <circle cx="12" cy="12" r="8"/>
          <circle cx="12" cy="4" r="1.5" fill="currentColor"/>
          <circle cx="5.07" cy="16" r="1.5" fill="currentColor"/>
          <circle cx="18.93" cy="16" r="1.5" fill="currentColor"/>
        </svg>
        {/* Slack */}
        <svg className="absolute w-9 h-9 opacity-15 dark:opacity-30 animate-bubble-2 top-[20%] left-[85%]" viewBox="0 0 24 24" fill="var(--color-theme-primary)">
          <rect x="4" y="9" width="6" height="2" rx="1"/>
          <rect x="8" y="5" width="2" height="10" rx="1"/>
          <rect x="14" y="13" width="6" height="2" rx="1"/>
          <rect x="14" y="9" width="2" height="10" rx="1"/>
        </svg>
        {/* DB (Database stack) */}
        <svg className="absolute w-8 h-8 opacity-20 dark:opacity-35 animate-bubble-3 top-[5%] left-[30%]" viewBox="0 0 24 24" fill="none" stroke="var(--color-theme-accent)" strokeWidth="1.5">
          <ellipse cx="12" cy="5" rx="8" ry="3"/>
          <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/>
          <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/>
        </svg>
        {/* HTML5 */}
        <svg className="absolute w-10 h-10 opacity-15 dark:opacity-30 animate-bubble-5 top-[52%] left-[2%]" viewBox="0 0 24 24" fill="var(--color-theme-primary)">
          <path d="M5 2l1.5 15L12 20l5.5-3L19 2H5zm10 6H8.5l.2 2H15l-.6 6.5-2.4 1-2.4-1-.1-1.5h1.8l.1.5.6.2.6-.2V12H8.1l-.5-5H15l-.1 1z"/>
        </svg>
        {/* CSS3 */}
        <svg className="absolute w-10 h-10 opacity-15 dark:opacity-30 animate-bubble-2 top-[62%] right-[5%]" viewBox="0 0 24 24" fill="var(--color-theme-accent)">
          <path d="M5 2h14l-1.5 15L12 20l-5.5-3L5 2zm10 5H8.5l-.2-2h6.9v-2H6.3l.6 6h6.1l-.3 3.5-1.7.5-1.7-.5-.1-1.5H7.2l.2 3.5 4.6 1.3 4.6-1.3.4-6.5z"/>
        </svg>
        {/* JavaScript (JS) */}
        <svg className="absolute w-20 h-20 opacity-20 dark:opacity-35 animate-bubble-6 top-[22%] left-[50%]" viewBox="0 0 24 24" fill="var(--color-theme-primary)">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <text x="7" y="16" fontSize="10" fontWeight="bold" fill="white" fontFamily="sans-serif">JS</text>
        </svg>
        {/* TypeScript (TS) */}
        <svg className="absolute w-20 h-20 opacity-20 dark:opacity-35 animate-bubble-8 top-[78%] left-[70%]" viewBox="0 0 24 24" fill="var(--color-theme-accent)">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <text x="7" y="16" fontSize="10" fontWeight="bold" fill="white" fontFamily="sans-serif">TS</text>
        </svg>
        {/* Postman */}
        <svg className="absolute w-10 h-10 opacity-15 dark:opacity-30 animate-bubble-4 top-[85%] right-[22%]" viewBox="0 0 24 24" fill="none" stroke="var(--color-theme-primary)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 2s4 4 4 9v6c0 1-1 2-2 2h-4c-1 0-2-1-2-2v-6c0-5 4-9 4-9zm-2 19h4v2h-4z"/>
        </svg>
      </div>
      {isSyncing && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
          <Loader text="Syncing Attendance..." />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ fontFamily: "'ALEXANDER', 'Alexandria', sans-serif" }}
        className={`fixed z-50 flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${
          user?.role === 'admin'
            ? `${sidebarOpen ? 'translate-y-0' : 'translate-y-full'} bottom-0 left-0 right-0 w-full h-[75vh] rounded-t-[2rem] border-t border-slate-200/10 bg-slate-900/95 dark:bg-slate-950/95 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl lg:inset-y-4 lg:left-4 lg:w-64 lg:h-auto lg:rounded-2xl lg:border-none lg:translate-y-0 lg:glass-panel lg:shadow-none lg:bg-transparent`
            : `inset-y-4 left-4 w-64 glass-panel ${sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'} lg:translate-x-0`
        }`}
      >
        {user?.role === 'admin' && (
          <div className="lg:hidden w-12 h-1.5 bg-slate-400/20 rounded-full mx-auto mt-3 mb-1 animate-pulse" />
        )}
        <div className="h-20 lg:h-24 flex items-center px-6 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-black/10">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-theme-primary/20 blur-xl rounded-full scale-150 group-hover:bg-theme-primary/30 transition-all duration-500"></div>
              <div className="relative w-14 h-14 rounded-xl bg-white shadow-[0_8px_15px_-3px_rgba(0,0,0,0.5)] border-t border-white/80 border-b-[4px] border-slate-300 dark:border-b-slate-900/80 dark:border-x-black/20 p-0.1 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-active:translate-y-0.5 group-active:border-b-[1px] overflow-hidden">
                <img src="/logo.png" alt="SSMS Logo" className="w-full h-full object-contain rounded-lg" />
              </div>
            </div>
            <div className="flex flex-col relative z-10">
              <span className="font-extrabold text-[22px] leading-none tracking-tight bg-gradient-to-b from-slate-700 to-slate-900 dark:from-white dark:to-slate-300 text-transparent bg-clip-text drop-shadow-md mb-1 transition-all group-hover:drop-shadow-lg">SSMS 3.0</span>
              <span className="text-[9px] font-black tracking-widest text-theme-primary uppercase leading-[1.1] drop-shadow-sm">Saran Students <br /> Management</span>
            </div>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-3 custom-scrollbar pr-2">
          {sections.map((section, sIdx) => {
            return (
              <div key={section.label} className="mb-2">
                {sIdx > 0 && (
                  <div className="mx-3 my-2 border-t border-slate-100 dark:border-white/5"></div>
                )}
                
                {/* Collapsible Section Header */}
                <button
                  onClick={() => toggleSection(section.label)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer border-l-[3px] border-transparent"
                >
                  <span>{section.label}</span>
                  {expandedSections[section.label] ? (
                    <ChevronDown size={12} className="text-slate-400 dark:text-slate-500" />
                  ) : (
                    <ChevronRight size={12} className="text-slate-400 dark:text-slate-500" />
                  )}
                </button>

                {/* Section Links */}
                {expandedSections[section.label] && (
                  <div className="space-y-1 mt-1 animate-in slide-in-from-top-1 duration-150">
                    {section.links.map((link) => {
                      const [linkPathname, linkSearch] = link.path.split('?');
                      const isActive = linkSearch 
                        ? (location.pathname === linkPathname && location.search.includes(linkSearch))
                        : (!location.search.includes('tab=') && (
                            location.pathname === linkPathname || 
                            (linkPathname !== '/' && linkPathname !== '/student' && location.pathname.startsWith(linkPathname))
                          ));
                      return (
                        <Link
                          key={link.name}
                          to={link.path}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 text-[13px] border-l-4 ${
                            isActive
                              ? 'bg-gradient-to-r from-theme-primary/10 to-theme-accent/5 text-theme-primary font-bold border-theme-primary shadow-[0_2px_10px_-3px_var(--color-theme-primary)]'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/40 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 font-medium border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`transition-transform duration-250 ${isActive ? 'text-theme-primary scale-105' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600'}`}>
                              {link.icon}
                            </span>
                            <span>{link.name}</span>
                          </div>
                          {link.badge > 0 && !isActive && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                              {link.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 text-[13px] font-bold"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-[280px] relative">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-4 lg:px-8 mt-4 mx-4 lg:mx-8 z-30 transition-colors duration-300">
          {user?.role === 'admin' ? (
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 p-0.5 shadow-md flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-base tracking-tight dark:text-white">SSMS 3.0 Admin</span>
            </div>
          ) : (
            <button
              className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 p-2 glass-panel"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
          )}

          <div className="ml-auto flex items-center gap-4 glass-panel px-2 py-1.5 h-14">

             {/* Online Students Count */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200 dark:border-slate-700">
              <div className="w-2 h-2 rounded-full bg-theme-primary animate-pulse"></div>
              <span>{onlineStudentsCount} Online</span>
            </div>

            {/* Student Timer */}
            {user?.role === 'student' && sessionActive && (
              <div className="hidden sm:flex items-center gap-2 bg-theme-primary/10 text-theme-primary px-3 py-1.5 rounded-full text-sm font-medium border border-theme-primary/20">
                <Clock size={16} className="animate-pulse" />
                <span>{formatTime(sessionSeconds)}</span>
              </div>
            )}

            {/* Student Coins Display */}
            {user?.role === 'student' && (
              <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full text-sm font-extrabold border border-amber-500/20">
                <span className="text-base">🪙</span>
                <span>{userCoins} Coins</span>
              </div>
            )}

            {/* Notifications Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-md animate-in zoom-in">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 origin-top-right animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white leading-none">Notifications</h3>
                      <span className="text-[10px] text-slate-500 font-medium">{notifications.length} Unread</span>
                    </div>
                    {notifications.length > 0 && (
                      <button onClick={clearAllNotifications} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <div key={notif.id} className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors relative group">
                          <button
                            onClick={() => clearNotification(notif.id)}
                            className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Mark as read"
                          >
                            <X size={14} />
                          </button>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-0.5 pr-6">{notif.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 pr-4">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-2 font-medium">{new Date(notif.time).toLocaleString()}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                        <CheckCircle size={24} className="text-emerald-500 mb-2 opacity-50" />
                        <p className="text-sm font-medium">All caught up!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Selector Toggle */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Select theme color"
              >
                <Palette size={18} />
              </button>

              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-[280px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 origin-top-right">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white leading-none">Theme Colors</h3>
                    <span className="text-[10px] text-slate-400 font-medium">{themes.length + 1} themes</span>
                  </div>
                  <div className="p-3 grid grid-cols-4 gap-2">
                    {themes.map((t) => (
                      <button
                        key={t.name}
                        onClick={() => {
                          if (!isThemeUnlocked(t.name)) {
                            Swal.fire({
                              title: 'Theme Locked!',
                              text: `The ${themeDisplayNames[t.name] || t.name} is locked. You can unlock/buy it in the Gamification Hub Shop!`,
                              icon: 'lock',
                              confirmButtonColor: 'var(--color-theme-primary)',
                              background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
                              color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#0f172a'
                            });
                            return;
                          }
                          applyThemeColor(t.name);
                          setGamificationData(prev => prev ? { ...prev, currentTheme: t.name } : { currentTheme: t.name });
                          setShowThemeMenu(false);
                          
                          // Save equipped theme to backend database
                          axios.post('/gamification/shop/equip', { category: 'theme', value: t.name })
                            .then(() => {
                              if (socket) socket.emit('equip_change', { category: 'theme', value: t.name });
                            })
                            .catch(err => console.error('Failed to equip theme via navbar:', err));
                        }}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-150 cursor-pointer group relative ${
                          themeColor === t.name
                            ? 'bg-slate-100 dark:bg-slate-700 ring-2 ring-offset-1 dark:ring-offset-slate-800'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        } ${!isThemeUnlocked(t.name) ? 'opacity-60' : ''}`}
                        style={themeColor === t.name ? { ringColor: t.primary } : {}}
                        title={themeDisplayNames[t.name] || t.name}
                      >
                        <div className="relative">
                          <span
                            className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-600 shadow-md block group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: t.primary, boxShadow: `0 2px 8px ${t.primary}40` }}
                          />
                          {themeColor === t.name && (
                            <svg className="absolute inset-0 w-7 h-7 text-white drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                          {!isThemeUnlocked(t.name) && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-900/90 dark:bg-slate-700/95 rounded-full flex items-center justify-center text-white border border-white/20">
                              <Lock size={8} />
                            </div>
                          )}
                        </div>
                        <span className={`text-[9px] font-semibold leading-none truncate w-full text-center ${
                          themeColor === t.name ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                        }`}>{themeDisplayNames[t.name] || t.name}</span>
                      </button>
                    ))}
                  </div>
                  {/* Custom Color Picker */}
                  <div className="border-t border-slate-100 dark:border-slate-700 p-3">
                    <div className="flex items-center gap-3">
                      <label
                        className="relative cursor-pointer group shrink-0"
                        title={!isCustomColorAllowed() ? "Locked - Reached Rank #1 to unlock" : "Pick a custom color"}
                        onClick={(e) => {
                          if (!isCustomColorAllowed()) {
                            e.preventDefault();
                            Swal.fire({
                              title: 'Custom Theme Locked!',
                              text: 'Custom themes are exclusive to the #1 ranked student, or unlocked via the Coding Master / Legend League achievements!',
                              icon: 'lock',
                              confirmButtonColor: 'var(--color-theme-primary)',
                              background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
                              color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#0f172a'
                            });
                          }
                        }}
                      >
                        <span
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-600 shadow-md block group-hover:scale-110 transition-transform relative"
                          style={{ background: `conic-gradient(#f43f5e, #f59e0b, #10b981, #0ea5e9, #8b5cf6, #ec4899, #f43f5e)` }}
                        >
                          {!isCustomColorAllowed() && (
                            <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center text-white">
                              <Lock size={10} />
                            </div>
                          )}
                        </span>
                        {themeColor === 'Custom' && (
                          <svg className="absolute inset-0 w-7 h-7 text-white drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                        {isCustomColorAllowed() && (
                          <input
                            type="color"
                            value={customColor}
                            onChange={(e) => handleCustomColorChange(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        )}
                      </label>
                      <div className="flex-1">
                        <p className={`text-[11px] font-bold leading-none ${
                          themeColor === 'Custom' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                        }`}>Custom Color Theme</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {!isCustomColorAllowed() ? "Requires Rank #1 or Coding Master" : "Customize your workspace style"}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded">{themeColor === 'Custom' ? customColor : '—'}</span>
                    </div>

                    {/* Font and Size Controls - only show if unlocked & selected Custom Theme */}
                    {isCustomColorAllowed() && themeColor === 'Custom' && (
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-col gap-2.5 animate-fadeIn">
                        {/* Font Family Selector */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Font Family</label>
                          <select
                            value={customFont}
                            onChange={(e) => handleCustomFontChange(e.target.value)}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-700 dark:text-slate-300 font-medium"
                          >
                            <option value="Inter">Inter (Clean)</option>
                            <option value="Outfit">Outfit (Modern)</option>
                            <option value="Space Grotesk">Space Grotesk (Tech)</option>
                            <option value="Cinzel">Cinzel (Royal)</option>
                            <option value="Playfair Display">Playfair Display (Elegant)</option>
                            <option value="Share Tech Mono">Share Tech Mono (Console)</option>
                          </select>
                        </div>

                        {/* Font Size Selector */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Font Size Scale</label>
                          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900/60 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            {[
                              { label: 'Small', value: '100%' },
                              { label: 'Medium', value: '106.25%' },
                              { label: 'Large', value: '112.5%' }
                            ].map((sz) => (
                              <button
                                key={sz.value}
                                onClick={() => handleCustomFontSizeChange(sz.value)}
                                className={`text-[10px] font-bold py-1 px-1.5 rounded-md transition-all cursor-pointer ${
                                  customFontSize === sz.value
                                    ? 'bg-white dark:bg-slate-800 text-primary-500 shadow-sm border border-slate-200 dark:border-slate-700/60'
                                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                                }`}
                              >
                                {sz.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="hidden md:block text-right border-l border-slate-200 dark:border-white/10 pl-4 pr-2">
              <p className={`text-sm font-bold leading-tight ${getNamecolorClass(gamificationData?.currentNamecolor || user?.currentNamecolor) || 'text-slate-800 dark:text-white'} namecolor-shine`}>{user?.name}</p>
              <p className={`text-[10px] font-bold capitalize ${
                (gamificationData?.equippedTitle || gamificationData?.currentTitle || user?.equippedTitle || user?.currentTitle)
                  ? 'text-violet-400 dark:text-violet-300 font-extrabold animate-pulse'
                  : 'text-slate-400 dark:text-slate-500'
              }`}>
                {(gamificationData?.equippedTitle || gamificationData?.currentTitle || user?.equippedTitle || user?.currentTitle) ? `🏆 ${gamificationData?.equippedTitle || gamificationData?.currentTitle || user?.equippedTitle || user?.currentTitle}` : user?.role}
              </p>
            </div>
            <div className="relative shrink-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative ${
                (gamificationData?.profileBorder || user?.profileBorder)
                  ? `border-3 p-0.5 ${getBorderPreviewClass(gamificationData?.profileBorder || user?.profileBorder)}` 
                  : 'bg-gradient-to-br from-theme-primary to-theme-accent text-white shadow-md'
              } ${getEffectStyles(gamificationData?.equippedEffect || user?.equippedEffect)}`}>
                <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center">
                  {(gamificationData?.equippedAvatar || user?.equippedAvatar) ? (
                    <img 
                      src={
                        (gamificationData?.equippedAvatar || user?.equippedAvatar).startsWith('/uploads')
                          ? `${import.meta.env.VITE_API_URL || ''}${gamificationData?.equippedAvatar || user?.equippedAvatar}`
                          : (gamificationData?.equippedAvatar || user?.equippedAvatar)
                      } 
                      alt="Profile" 
                      className="w-full h-full object-cover object-top" 
                    />
                  ) : (
                    <UserIcon size={18} />
                  )}
                </div>
              </div>
              {(gamificationData?.equippedPet || user?.equippedPet) && (
                <div className="absolute -bottom-1 -right-1.5 bg-white dark:bg-slate-850 shadow-md border border-slate-200 dark:border-slate-700/60 rounded-full w-5 h-5 flex items-center justify-center text-xs animate-bounce" style={{ zIndex: 10 }} title={`Pet: ${gamificationData?.equippedPet || user?.equippedPet}`}>
                  {PET_EMOJIS[gamificationData?.equippedPet || user?.equippedPet] || '🐾'}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={`flex-1 overflow-auto p-4 lg:p-8 pt-4 relative ${user?.role === 'admin' ? 'pb-24 lg:pb-8' : ''}`}>
          <Outlet context={{ 
            sessionActive, startSession, endSession, sessionSeconds, formatTime, isCheckingIn, activeLeaveStatus,
            themeColor, activeTheme: themes.find(t => t.name === themeColor) || themes[0],
            userCoins, gamificationData, fetchCounts
          }} />
        </div>
      </main>

      {/* Mobile Bottom Navigation (Admin only) */}
      {user?.role === 'admin' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-slate-900/80 dark:bg-slate-950/85 backdrop-blur-xl border-t border-slate-200/10 px-4 py-2 flex items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.15)] pb-safe">
          {[
            { name: 'Home', path: '/', icon: <LayoutDashboard size={20} /> },
            { name: 'Attendance', path: '/attendance-logs', icon: <Clock size={20} /> },
            { name: 'Tasks', path: '/tasks', icon: <FileText size={20} /> },
            { name: 'Chat', path: '/chat', icon: <MessageCircle size={20} /> },
            { name: 'More', isAction: true, action: () => setSidebarOpen(true), icon: <Menu size={20} /> }
          ].map((item, index) => {
            const isLinkActive = item.path && (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)));
            
            return item.isAction ? (
              <button
                key={index}
                onClick={item.action}
                className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-200 active:scale-95 transition-all w-16 py-1 cursor-pointer bg-transparent border-none"
              >
                <div className="p-1.5 rounded-xl bg-slate-800/30 border border-slate-200/5 transition-colors">
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold tracking-wider leading-none mt-0.5">{item.name}</span>
              </button>
            ) : (
              <Link
                key={index}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 w-16 py-1 active:scale-95 transition-all ${
                  isLinkActive 
                    ? 'text-theme-primary font-extrabold' 
                    : 'text-slate-400 font-medium hover:text-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all relative ${
                  isLinkActive 
                    ? 'bg-theme-primary/10 border border-theme-primary/30 text-theme-primary scale-110 shadow-[0_0_15px_rgba(var(--color-theme-primary-rgb),0.15)]' 
                    : 'bg-transparent border border-transparent'
                }`}>
                  {item.icon}
                  {item.name === 'Chat' && chatCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-md">
                      {chatCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-wider leading-none mt-0.5">{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Layout;
