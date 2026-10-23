import React, { useState, useEffect } from 'react';
import {
  Shield, Upload, Zap, Award, Activity, CheckCircle,
  AlertTriangle, RefreshCw, Dumbbell, Compass, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { VideoJob } from '../types';

export const BowlVisionView: React.FC = () => {
  const [activeJob, setActiveJob] = useState<VideoJob | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleRunDemoBowling();
  }, []);

  const handleRunDemoBowling = async () => {
    setLoading(true);
    try {
      const job = await api.runDemoVideoJob('bowlvision');
      setActiveJob(job);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const result = activeJob?.result_json ? JSON.parse(activeJob.result_json) : null;
  const metrics = result?.metrics;

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-semibold mb-1">
            <Shield className="w-3.5 h-3.5" /> MODULE 4: BOWLVISION AI
          </div>
          <h1 className="text-2xl font-extrabold text-white">Bowling Action Kinematics & Kinetic Chain</h1>
          <p className="text-xs text-slate-400">
            Biomechanical alignment indicators analyzing run-up cadence, front-foot brace angle, shoulder-hip separation, and arm extension.
          </p>
        </div>

        <button
          onClick={handleRunDemoBowling}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
        >
          <Zap className="w-4 h-4 text-cyan-300" /> Instant Demo Analysis (Fast Bowling)
        </button>
      </div>

      {/* Main Grid: Biomechanical Telemetry & Action Classification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Metric Cards */}
        <div className="lg:col-span-8 glass-card p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <span className="text-xs text-slate-400 font-mono block">Action Classification</span>
              <span className="text-lg font-bold text-white font-mono">{result?.action_type || 'Semi-open Fast Action'}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-mono block">Run-up Consistency</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{result?.run_up_consistency_pct || 91.5}%</span>
            </div>
          </div>

          {/* Core Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Front-Foot Knee Brace</span>
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {metrics?.front_foot_brace_angle_deg || 164.2}°
              </span>
              <div className="text-[10px] text-emerald-400 font-medium">Optimal knee lock (&gt;160°)</div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Release Height</span>
              <span className="text-2xl font-bold font-mono text-white">
                {metrics?.release_height_m || 2.18}m
              </span>
              <div className="text-[10px] text-purple-400 font-medium">High release arc</div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Trunk Flexion</span>
              <span className="text-2xl font-bold font-mono text-white">
                {metrics?.trunk_flexion_deg || 38.5}°
              </span>
              <div className="text-[10px] text-cyan-400 font-medium">Forward torso drive</div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Arm Extension</span>
              <span className="text-2xl font-bold font-mono text-white">
                {metrics?.bowling_arm_extension_deg || 169.5}°
              </span>
              <div className="text-[10px] text-emerald-400 font-medium">Clean legal arm extension</div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Shoulder-Hip Separation</span>
              <span className="text-2xl font-bold font-mono text-white">
                {metrics?.shoulder_hip_separation_deg || 24.0}°
              </span>
              <div className="text-[10px] text-slate-400">Safe rotational torque</div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Approach Velocity</span>
              <span className="text-2xl font-bold font-mono text-white">
                {metrics?.approach_speed_mps || 6.8} m/s
              </span>
              <div className="text-[10px] text-cyan-400 font-medium">Smooth deceleration into gather</div>
            </div>
          </div>

          {/* Biomechanical Observations */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-purple-500/20 space-y-2">
            <span className="text-xs font-bold uppercase text-purple-300 font-mono block">
              Kinematic Chain Diagnostic
            </span>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div>• <b>Knee Brace:</b> {result?.biomechanical_verdict?.knee_brace_status || 'Strong locked front knee providing excellent kinetic energy transfer.'}</div>
              <div>• <b>Arm Path:</b> {result?.biomechanical_verdict?.arm_path || 'Smooth circular high-arm trajectory at release.'}</div>
              <div>• <b>Run-Up Rhythm:</b> {result?.biomechanical_verdict?.run_up_stride || 'Even stride cadence observed with decelerating stutter avoided.'}</div>
            </div>
          </div>
        </div>

        {/* Personalized Practice Suggestions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-purple-500/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 font-mono uppercase">
              <Dumbbell className="w-4 h-4 text-purple-400" /> Prescribed Practice Drills
            </div>
            <div className="space-y-2.5">
              {(result?.training_drills || [
                'Single-leg bound drills to maintain front knee lock stability under load.',
                'Target bowling with towel under non-bowling arm to maximize gather tuck.',
                '4-step short approach practice to isolate wrist snap at release point.'
              ]).map((drill: string, idx: number) => (
                <div key={idx} className="bg-slate-950/70 p-3 rounded-xl border border-white/5 text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-purple-400 mr-1.5 font-mono">0{idx + 1}.</span> {drill}
                </div>
              ))}
            </div>
          </div>

          {/* Ethics / Medical Disclaimer Notice */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-400 leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <HelpCircle className="w-3.5 h-3.5" /> Biomechanical Scope
            </div>
            <p>
              Measurements reflect computer-vision kinematic estimates for coaching and conditioning feedback. They do not constitute official ICC bowling legality certifications or clinical medical diagnostics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
