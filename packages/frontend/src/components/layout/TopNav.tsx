import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  Settings,
  Bell,
  LayoutGrid,
  Users2,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { disconnectSocket } from '../../socket';
import api from '../../lib/axios';
import { cn } from '../../lib/utils';

export default function TopNav() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAuth();
      disconnectSocket();
      navigate('/login');
    }
  };

  const navLinks = [
    { name: 'Public Rooms', path: '/rooms', icon: <LayoutGrid size={16} /> },
    { name: 'Contacts', path: '/contacts', icon: <Users2 size={16} /> },
  ];

  return (
    // CHANGED: bg-white/70 to bg-[#0a0a0c]/80 and border-white/20 to border-white/5
    <header className="relative h-16 flex items-center px-6 shrink-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl">

      {/* Brand Section */}
      <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
        {/* Futuristic Logo Mark */}
        <div className="relative flex items-center justify-center">
          {/* Outer pulsing ring */}
          <div className="absolute w-14 h-14 rounded-full border border-indigo-500/30 animate-ping" style={{ animationDuration: '2.5s' }} />
          {/* Mid rotating ring */}
          <div className="absolute w-12 h-12 rounded-full border border-cyan-400/20 animate-spin" style={{ animationDuration: '8s' }} />
          {/* Glow bloom */}
          <div className="absolute w-10 h-10 rounded-full bg-indigo-600/20 blur-md" />
          {/* Core hex logo */}
          <div className="relative w-11 h-11 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            {/* Hexagon SVG background */}
            <svg viewBox="0 0 48 48" className="absolute inset-0 w-full h-full" fill="none">
              <polygon
                points="24,2 44,13 44,35 24,46 4,35 4,13"
                className="fill-indigo-600/80 stroke-cyan-400/60"
                strokeWidth="1.5"
              />
              <polygon
                points="24,8 38,16 38,32 24,40 10,32 10,16"
                className="fill-indigo-900/60 stroke-indigo-400/40"
                strokeWidth="0.8"
              />
            </svg>
            {/* Icon inside hex */}
            <Sparkles size={18} className="relative z-10 text-cyan-300 drop-shadow-[0_0_6px_#67e8f9]" />
          </div>
          {/* Corner accent dots */}
          <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
          <div className="absolute bottom-0 left-0 w-1 h-1 rounded-full bg-indigo-400 shadow-[0_0_4px_#818cf8]" />
        </div>

        {/* Brand Text */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-black text-white text-lg tracking-widest uppercase" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.15em', textShadow: '0 0 20px rgba(99,102,241,0.8)' }}>
              HACK
            </span>
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 text-lg tracking-widest uppercase" style={{ letterSpacing: '0.15em' }}>
              ART
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Animated status dot */}
            <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_4px_#22d3ee]" />
            <span className="text-[9px] text-cyan-400/70 font-bold tracking-[0.3em] uppercase">v2.0.4 · LIVE</span>
          </div>
        </div>
      </div>

      {/* Center Navigation */}
      <nav className="hidden md:flex items-center gap-2 ml-10">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "relative px-4 py-2 text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 rounded-xl group",
                // CHANGED: Improved text contrast for inactive states
                isActive ? "text-white bg-white/5" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              {link.icon}
              {link.name}
              {isActive && (
                <motion.div
                  layoutId="navUnderglow"
                  className="absolute bottom-0 left-2 right-2 h-[2px] bg-indigo-500 shadow-[0_0_15px_#6366f1] rounded-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right Actions */}
      <div className="ml-auto flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 text-white/40 hover:text-indigo-400 hover:bg-white/5 rounded-xl transition-all relative group">
          <Bell size={20} />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0a0a0c] shadow-[0_0_8px_rgba(79,70,229,0.8)]" />
        </button>

        <div className="h-6 w-px bg-white/10 mx-1" />

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(v => !v)}
            className={cn(
              "flex items-center gap-3 p-1.5 pr-4 rounded-2xl transition-all duration-300 border",
              showMenu ? "bg-white/10 border-white/10" : "bg-transparent border-transparent hover:bg-white/5"
            )}
          >
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-lg ring-2 ring-indigo-500/60 ring-offset-1 ring-offset-black/40">
              <img
                src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(user?.username || 'user')}&backgroundColor=1e1b4b,2e1065,1a1a2e&backgroundType=gradientLinear`}
                alt={user?.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:block text-left">
              {/* CHANGED: text-gray-900 to text-white */}
              <p className="text-xs font-black text-white leading-none mb-1 uppercase tracking-tighter">
                {user?.username}
              </p>
              <p className="text-[9px] text-indigo-400/80 font-black leading-none uppercase tracking-[0.1em]">Core Operative</p>
            </div>
            <ChevronDown size={14} className={cn("text-white/40 transition-transform duration-300", showMenu && "rotate-180")} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-3 w-52 bg-[#121217]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 py-2 overflow-hidden"
              >
                <div className="px-4 py-2 border-b border-white/5 mb-1">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">System Access</p>
                </div>

                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all">
                  <Settings size={16} className="text-indigo-400" />
                  <span className="font-bold tracking-tight">Preferences</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut size={16} />
                  <span className="font-black uppercase text-[11px] tracking-widest">Terminate Session</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}