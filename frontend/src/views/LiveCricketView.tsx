import React, { useState, useEffect } from 'react';
import {
  Radio, Play, Pause, RotateCcw, Activity, Shield,
  Sparkles, RefreshCw, Zap, Clock, Info, CheckCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Match, MatchDetailResponse } from '../types';

interface LiveCricketViewProps {
  matches: Match[];
}

export const LiveCricketView: React.FC<LiveCricketViewProps> = ({ matches }) => {
  const liveMatch = matches.find(m => m.status === 'live') || matches[0];
  const [matchDetail, setMatchDetail] = useState<MatchDetailResponse | null>(null);
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);
  const [recentCommentary, setRecentCommentary] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (liveMatch) {
      loadMatch(liveMatch.id);
    }
  }, [liveMatch?.id]);

  const loadMatch = async (id: number) => {
    try {
      const data = await api.getMatchDetails(id);
      setMatchDetail(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateBall = async () => {
    if (!matchDetail) return;
    try {
      const sim = await api.simulateLiveBall(matchDetail.match.id);
      setRecentCommentary(prev => [sim, ...prev.slice(0, 15)]);
      // Reload details to sync scorecard
      loadMatch(matchDetail.match.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-simulation interval
  useEffect(() => {
    let timer: any = null;
    if (isAutoSimulating) {
      timer = setInterval(() => {
        handleSimulateBall();
      }, 3500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoSimulating, matchDetail?.match?.id]);

  const m = matchDetail?.match || liveMatch;
  const currentInnings = matchDetail?.innings?.[matchDetail.innings.length - 1];

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-mono font-semibold mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> MODULE 8: LIVECRICKET AI
          </div>
          <h1 className="text-2xl font-extrabold text-white">Live Match Center & Real-Time Ball Telemetry</h1>
          <p className="text-xs text-slate-400">
            Real-time delivery simulator with ball-by-ball commentary streams, live required run rate pressure, and dynamic win probabilities.
          </p>
        </div>

        {/* Demo Mode Toggle & Simulator Controls */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>MODE: <b>DEMO SIMULATOR</b></span>
          </div>

          <button
            onClick={() => setIsAutoSimulating(!isAutoSimulating)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              isAutoSimulating
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
            }`}
          >
            {isAutoSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAutoSimulating ? 'Stop Auto Ticker' : 'Start Auto Live Ticker'}
          </button>

          <button
            onClick={handleSimulateBall}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-white text-xs font-semibold transition"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" /> +1 Delivery
          </button>
        </div>
      </div>

      {/* Hero Live Scoreboard Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 font-mono font-bold animate-pulse">
                LIVE NOW
              </span>
              <span className="text-sm font-bold text-white">{m?.title}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Venue: {m?.venue} • Toss: {m?.toss_winner} elected to {m?.toss_decision}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>Current RR: <b className="text-cyan-400">{m?.current_rr}</b></div>
            <div>•</div>
            <div>Required RR: <b className="text-amber-400">{m?.required_rr}</b></div>
          </div>
        </div>

        {/* Live Innings Comparison Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Innings 1 Team */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
            <span className="text-xs font-mono text-slate-400 uppercase">1st Innings (Completed)</span>
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-bold text-white">India</h3>
              <span className="text-2xl font-bold font-mono text-slate-300">182/5 <span className="text-xs text-slate-500">(20.0)</span></span>
            </div>
          </div>

          {/* Innings 2 Chasing Team */}
          <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-1">
            <span className="text-xs font-mono text-purple-300 uppercase flex items-center justify-between">
              <span>Chasing Innings (Target 183)</span>
              <span className="text-emerald-400 font-bold">Needs {183 - (currentInnings?.total_runs || 145)} from {Math.max(0, 120 - Math.round((currentInnings?.total_overs || 16.4) * 6))} balls</span>
            </span>
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-bold text-white">Australia</h3>
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {currentInnings?.total_runs || 145}/{currentInnings?.total_wickets || 4}{' '}
                <span className="text-xs text-slate-400">({currentInnings?.total_overs || 16.4} ov)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Commentary Feed & Live Probability */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ball-by-Ball Live Commentary Stream */}
        <div className="lg:col-span-8 glass-card p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" /> Ball-by-Ball Commentary Stream
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Live WebSocket Simulation</span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {recentCommentary.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs space-y-2">
                <Radio className="w-8 h-8 mx-auto text-purple-400/50 animate-pulse" />
                <p>Click "+1 Delivery" or start the Auto Live Ticker to stream real-time ball commentary.</p>
              </div>
            ) : (
              recentCommentary.map((c, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border transition animate-in slide-in-from-top-2 duration-200 ${
                    c.is_wicket
                      ? 'bg-rose-950/40 border-rose-500/40'
                      : c.runs_scored >= 4
                      ? 'bg-cyan-950/40 border-cyan-500/40'
                      : 'bg-slate-950/60 border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-purple-300">
                        {c.over}.{c.ball}
                      </span>
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                        c.is_wicket ? 'bg-rose-500 text-white' : c.runs_scored >= 4 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-200'
                      }`}>
                        {c.is_wicket ? 'WICKET' : `${c.runs_scored} RUNS`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>Speed: <b className="text-white">{c.ball_speed_kph} kph</b></span>
                      <span>•</span>
                      <span>Zone: <b className="text-cyan-300">{c.shot_zone}</b></span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {c.commentary}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Match State & API Attribution */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 space-y-4">
            <span className="text-xs font-bold text-white uppercase font-mono block pb-2 border-b border-white/10">
              Match Situation Pressure
            </span>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Target:</span>
                <span className="font-bold text-white">183 runs</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Balls Remaining:</span>
                <span className="font-bold text-cyan-400">20 balls</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Wickets in Hand:</span>
                <span className="font-bold text-emerald-400">6 wickets</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Wagon Wheel Hotspot:</span>
                <span className="font-bold text-purple-300">Cover / Extra Cover (42%)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 text-[11px] text-slate-400 leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                  <Info className="w-3.5 h-3.5" /> Data Attribution
                </div>
                <p>
                  Demo Mode actively simulates high-fidelity live match events. To connect live international tournament feeds, configure your Cricket API key in Settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
