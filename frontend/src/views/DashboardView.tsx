import React from 'react';
import {
  Activity, Video, Crosshair, Shield, Users, Radio,
  Compass, SunMedium, ArrowUpRight, Zap, Trophy, Play,
  TrendingUp, Download, Eye, Sparkles
} from 'lucide-react';
import { CricketGround3D } from '../components/CricketGround3D';
import { FielderPosition, Match, VideoJob } from '../types';

interface DashboardViewProps {
  onSelectModule: (moduleId: string) => void;
  matches: Match[];
  fielders: FielderPosition[];
  videoJobs: VideoJob[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectModule,
  matches,
  fielders,
  videoJobs
}) => {
  const liveMatch = matches.find(m => m.status === 'live') || matches[0];

  return (
    <div className="space-y-6">
      {/* Hero Telemetry Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple-950/60 via-slate-900/90 to-indigo-950/70 border border-purple-500/30 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> NEXT-GEN CRICKET INTELLIGENCE SUITE
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Analyze. Predict. Train. <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Dominate.</span>
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Unified command center merging real-time match state, 3D stadium kinematics, MediaPipe computer-vision biomechanics, and tactical team builders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onSelectModule('shotsense')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-600/40 transition"
            >
              <Video className="w-4 h-4" /> Analyze Batting Video
            </button>
            <button
              onClick={() => onSelectModule('livecricket')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-slate-200 text-xs font-semibold transition"
            >
              <Radio className="w-4 h-4 text-cyan-400" /> Live Match Center
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 3D Ground (Module 6 Anchor) & Live Match Status (Module 1/8 Anchor) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Interactive Stadium Field */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Interactive 3D Ground & Tactical Field Matrix
              </h2>
            </div>
            <button
              onClick={() => onSelectModule('fieldiq')}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition"
            >
              Open Full FieldIQ <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <CricketGround3D fielders={fielders} />
        </div>

        {/* Live Match State & Win Probability Telemetry */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Live Match Telemetry
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 font-mono font-bold animate-pulse">
              LIVE
            </span>
          </div>

          <div className="glass-card p-5 rounded-xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-xs font-semibold text-slate-400">{liveMatch?.tournament}</span>
              <span className="text-xs font-mono text-purple-400">{liveMatch?.venue}</span>
            </div>

            {/* Scorecard Quick Glance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-cyan-500" />
                  <span className="text-sm font-bold text-white">India</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-white">182/5</span>
                  <span className="text-[11px] text-slate-400 ml-1.5 font-mono">(20.0 ov)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm font-bold text-white">Australia</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-cyan-400">145/4</span>
                  <span className="text-[11px] text-slate-400 ml-1.5 font-mono">({liveMatch?.current_over} ov)</span>
                </div>
              </div>
            </div>

            {/* Win Probability Bar */}
            <div className="pt-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400">IND 68.4%</span>
                <span className="text-slate-400">Win Probability</span>
                <span className="text-amber-400">AUS 31.6%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: '68.4%' }} />
                <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: '31.6%' }} />
              </div>
            </div>

            {/* Key Rates */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Required RR</span>
                <span className="text-base font-bold text-amber-400 font-mono">9.60</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Current RR</span>
                <span className="text-base font-bold text-cyan-400 font-mono">8.70</span>
              </div>
            </div>

            <button
              onClick={() => onSelectModule('cricketmind')}
              className="w-full py-2 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold transition text-center"
            >
              Explore CricketMind AI Deep Analytics
            </button>
          </div>

          {/* Quick Pitch & Conditions Indicator */}
          <div className="glass-card p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400">
                <SunMedium className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Pitch Intelligence</h4>
                <p className="text-[11px] text-slate-400">MCG Track: Green Seamer (48% Grass)</p>
              </div>
            </div>
            <button
              onClick={() => onSelectModule('pitchpredict')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Inspect
            </button>
          </div>
        </div>
      </div>

      {/* Ten Modules Interactive Grid */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" /> The Ten Core Intelligence Modules
          </h2>
          <span className="text-xs text-slate-400 font-mono">All 10 Systems Operational</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { id: 'cricketmind', name: 'CricketMind AI', icon: Activity, desc: 'Live worm charts, projected totals & predictive win models', tag: 'Analytics' },
            { id: 'shotsense', name: 'ShotSense AI', icon: Video, desc: 'MediaPipe pose tracking for batting balance & backlift angle', tag: 'Computer Vision' },
            { id: 'balltrack', name: 'BallTrack AI', icon: Crosshair, desc: '3D trajectory curve, bounce point & line/length classification', tag: 'Hawkeye 3D' },
            { id: 'bowlvision', name: 'BowlVision AI', icon: Shield, desc: 'Bowling kinematics, front-foot brace & release height', tag: 'Biomechanics' },
            { id: 'scoutxi', name: 'ScoutXI AI', icon: Users, desc: 'Comprehensive scouting directory & multi-axis radar charts', tag: 'Recruitment' },
            { id: 'fieldiq', name: 'FieldIQ AI', icon: Compass, desc: 'Tactical 3D placement presets & batter tendency heatmaps', tag: 'Tactics' },
            { id: 'teamxi', name: 'TeamXI AI', icon: Users, desc: 'Squad builder with strict role balance & order optimization', tag: 'Optimization' },
            { id: 'livecricket', name: 'LiveCricket AI', icon: Radio, desc: 'Real-time ball-by-ball simulator & commentary streams', tag: 'Live Match' },
            { id: 'pitchpredict', name: 'PitchPredict AI', icon: SunMedium, desc: 'OpenCV surface grass extraction & meteorological toss advice', tag: 'Surface CV' },
            { id: 'cricketvision', name: 'CricketVision AI', icon: Video, desc: 'Multi-player tracking & automated match highlight detector', tag: 'Highlights' },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                onClick={() => onSelectModule(m.id)}
                className="glass-card p-4 rounded-xl cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-slate-900 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/5 text-slate-400">
                      {m.tag}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white group-hover:text-purple-300 transition">
                      {m.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-purple-400 group-hover:text-cyan-300 font-semibold">
                  <span>Launch Module</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
