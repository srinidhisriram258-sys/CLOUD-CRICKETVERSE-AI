import React, { useState } from 'react';
import { User, NotificationItem } from '../types';
import {
  Activity, Video, Crosshair, Shield, Users, Radio,
  Compass, LayoutGrid, SunMedium, Bell, Search,
  LogOut, UserCheck, ChevronDown, CheckCircle2, AlertCircle
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeModule: string;
  onSelectModule: (moduleId: string) => void;
  onQuickLogin: (role: 'admin' | 'coach' | 'player') => void;
  onLogout: () => void;
  onOpenSearch: () => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
}

export const MODULES = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutGrid, desc: 'Central Command Center' },
  { id: 'cricketmind', name: 'CricketMind AI', icon: Activity, desc: 'Match Intelligence & Scorecard' },
  { id: 'shotsense', name: 'ShotSense AI', icon: Video, desc: 'Batting Biomechanics' },
  { id: 'balltrack', name: 'BallTrack AI', icon: Crosshair, desc: '3D Trajectory & Bounce' },
  { id: 'bowlvision', name: 'BowlVision AI', icon: Shield, desc: 'Bowling Kinematics' },
  { id: 'scoutxi', name: 'ScoutXI AI', icon: Users, desc: 'Player Scouting & Radars' },
  { id: 'fieldiq', name: 'FieldIQ AI', icon: Compass, desc: '3D Field Formations' },
  { id: 'teamxi', name: 'TeamXI AI', icon: Users, desc: 'Lineup Balance Builder' },
  { id: 'livecricket', name: 'LiveCricket AI', icon: Radio, desc: 'Live Ball-by-Ball Center' },
  { id: 'pitchpredict', name: 'PitchPredict AI', icon: SunMedium, desc: 'Surface & Weather Intel' },
  { id: 'cricketvision', name: 'CricketVision AI', icon: Video, desc: 'Video Highlights & Tracking' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeModule,
  onSelectModule,
  onQuickLogin,
  onLogout,
  onOpenSearch,
  notifications,
  onOpenNotifications
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-500/15 bg-slate-950/80 backdrop-blur-xl">
      {/* Top Banner / Ticker */}
      <div className="w-full bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-purple-950/40 px-4 py-1.5 border-b border-white/5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 overflow-hidden text-slate-300">
          <span className="inline-flex items-center gap-1.5 font-semibold text-cyan-400 font-mono tracking-wider uppercase text-[11px]">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> LIVE MATCH
          </span>
          <span className="truncate">
            ICC T20 World Cup Final: <b className="text-white">IND 182/5</b> vs <b className="text-white">AUS 145/4</b> (16.4 ov) • Req RR: <span className="text-amber-400 font-mono">9.60</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-slate-400 text-[11px] font-mono">
          <span>MCG Pitch: <b className="text-emerald-400">Green Seamer</b></span>
          <span>•</span>
          <span>Win Probability: <b className="text-purple-300">IND 68% / AUS 32%</b></span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectModule('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-purple-600/30">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-lg font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent font-mono">
                CV
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold tracking-tight text-white">CRICKETVERSE</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30 font-bold">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
              Analyze • Predict • Train • Dominate
            </p>
          </div>
        </div>

        {/* Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 hover:border-purple-500/40 text-slate-400 text-xs transition w-64"
        >
          <Search className="w-3.5 h-3.5 text-purple-400" />
          <span>Quick search modules, players...</span>
          <kbd className="ml-auto text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">⌘K</kbd>
        </button>

        {/* Right Action Icons & Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-slate-900 border border-white/10 hover:border-purple-500/40 text-slate-300 hover:text-white transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile / Quick Login */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-purple-500/30 hover:border-purple-500/60 text-slate-200 text-xs transition"
            >
              <img
                src={currentUser?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=coach'}
                alt="Avatar"
                className="w-6 h-6 rounded-full bg-slate-800"
              />
              <div className="text-left hidden sm:block">
                <div className="font-semibold text-white leading-tight">
                  {currentUser?.full_name?.split(' ')[0] || 'Coach'}
                </div>
                <div className="text-[10px] text-purple-400 capitalize font-mono">
                  {currentUser?.role || 'coach'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-950 border border-purple-500/30 shadow-2xl p-3 z-50">
                <div className="pb-2 border-b border-white/10">
                  <p className="text-xs font-bold text-white">{currentUser?.full_name}</p>
                  <p className="text-[11px] text-slate-400">{currentUser?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-mono uppercase">
                    Role: {currentUser?.role}
                  </span>
                </div>

                <div className="py-2">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold px-2 mb-1.5 font-mono">
                    Instant Demo Switch:
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => { onQuickLogin('coach'); setProfileOpen(false); }}
                      className="px-2 py-1 text-xs rounded bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-200 font-medium text-center"
                    >
                      Coach
                    </button>
                    <button
                      onClick={() => { onQuickLogin('admin'); setProfileOpen(false); }}
                      className="px-2 py-1 text-xs rounded bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 font-medium text-center"
                    >
                      Admin
                    </button>
                    <button
                      onClick={() => { onQuickLogin('player'); setProfileOpen(false); }}
                      className="px-2 py-1 text-xs rounded bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 font-medium text-center"
                    >
                      Player
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={() => { onLogout(); setProfileOpen(false); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30 rounded transition"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Module Navigation Pill Bar */}
      <div className="w-full border-t border-white/5 bg-slate-950/60 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1.5 py-1.5">
          {MODULES.map((m) => {
            const Icon = m.icon;
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectModule(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 border border-purple-400/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
