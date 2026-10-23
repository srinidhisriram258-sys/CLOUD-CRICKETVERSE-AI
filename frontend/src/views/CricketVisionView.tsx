import React, { useState, useEffect } from 'react';
import {
  Video, Upload, Sparkles, CheckCircle, Clock,
  Play, Users, Zap, PieChart, Shield, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { VideoJob } from '../types';

export const CricketVisionView: React.FC = () => {
  const [activeJob, setActiveJob] = useState<VideoJob | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleRunDemoCricketVision();
  }, []);

  const handleRunDemoCricketVision = async () => {
    setLoading(true);
    try {
      const job = await api.runDemoVideoJob('cricketvision');
      setActiveJob(job);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const result = activeJob?.result_json ? JSON.parse(activeJob.result_json) : null;

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-semibold mb-1">
            <Video className="w-3.5 h-3.5" /> MODULE 10: CRICKETVISION AI
          </div>
          <h1 className="text-2xl font-extrabold text-white">Full-Match Video Intelligence & Highlight Detector</h1>
          <p className="text-xs text-slate-400">
            Multi-player YOLO detection and trajectory tracking, shot zone wagon-wheel mapping, and automated candidate highlight timestamping.
          </p>
        </div>

        <button
          onClick={handleRunDemoCricketVision}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
        >
          <Zap className="w-4 h-4 text-cyan-300" /> Instant Match Video Intelligence
        </button>
      </div>

      {/* Main Grid: Detection Telemetry & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Detection Cards & Shot Zones */}
        <div className="lg:col-span-8 glass-card p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <span className="text-xs text-slate-400 font-mono block">Vision Engine Status</span>
              <span className="text-base font-bold text-white font-mono">
                {result?.players_detected_count || 8} Active Players Tracked on Pitch
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-mono block">Tracking Stability</span>
              <span className="text-base font-bold text-cyan-400 font-mono">
                {result?.tracking_stability_pct || 93.8}%
              </span>
            </div>
          </div>

          {/* Shot Zone Distribution Wagon Wheel */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-400" /> Video-Derived Wagon Wheel Sector Density
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {result?.shot_zone_distribution && Object.entries(result.shot_zone_distribution).map(([zone, pct]: any) => (
                <div key={zone} className="bg-slate-950/70 p-3 rounded-xl border border-white/5 space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">{zone}</span>
                    <span className="text-cyan-400 font-bold">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                      style={{ width: `${pct * 2.5}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tactical Observations from Footage */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-purple-500/20 space-y-2">
            <span className="text-xs font-bold uppercase text-purple-300 font-mono block">
              Spatial Movement Insights
            </span>
            <div className="space-y-1.5 text-xs text-slate-300">
              {(result?.tactical_observations || [
                'Batter favored off-side gap between Cover and Point on deliveries outside 5th stump.',
                'Fielders at Midwicket and Long On repositioned 4 meters deeper after over 3.'
              ]).map((obs: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{obs}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Candidate Highlight Timestamps */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-300" /> Automated Highlights
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Motion Acceleration</span>
            </div>

            <div className="space-y-2.5">
              {(result?.candidate_highlights || [
                { timestamp_sec: 4.2, event: 'Boundary Four - Cover Drive', confidence: 92.0 },
                { timestamp_sec: 12.8, event: 'High Velocity Delivery - Play and Miss', confidence: 88.5 },
                { timestamp_sec: 24.1, event: 'Wicket Celebration - Caught at Slips', confidence: 95.0 }
              ]).map((hl: any, idx: number) => (
                <div key={idx} className="bg-slate-950/70 p-3 rounded-xl border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-purple-300">
                      ⏱ {hl.timestamp_sec}s
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {hl.confidence}% Conf
                    </span>
                  </div>
                  <p className="text-xs text-white font-medium">{hl.event}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => alert('Highlight clip reel compiled and ready for download.')}
              className="w-full py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold uppercase tracking-wider transition text-center"
            >
              Export Highlight Reel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
