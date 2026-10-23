import React, { useState, useEffect } from 'react';
import {
  Compass, Layers, RotateCcw, Save, Sparkles,
  Shield, Check, AlertCircle, ArrowRight, Eye
} from 'lucide-react';
import { CricketGround3D } from '../components/CricketGround3D';
import { api } from '../services/api';
import { FieldFormation, FielderPosition } from '../types';

interface FieldIQViewProps {
  fielders: FielderPosition[];
  onUpdateFielders: (fielders: FielderPosition[]) => void;
}

export const FieldIQView: React.FC<FieldIQViewProps> = ({ fielders, onUpdateFielders }) => {
  const [formations, setFormations] = useState<FieldFormation[]>([]);
  const [selectedFormationId, setSelectedFormationId] = useState<number | null>(null);
  const [selectedFielder, setSelectedFielder] = useState<FielderPosition | null>(null);

  // Tactical Recommendation Parameters
  const [phase, setPhase] = useState('Powerplay');
  const [bowlerType, setBowlerType] = useState('Fast');
  const [batterTendency, setBatterTendency] = useState('Off-side dominant');
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFormations();
  }, []);

  const loadFormations = async () => {
    try {
      const data = await api.getFieldFormations();
      setFormations(data);
      if (data.length > 0 && selectedFormationId === null) {
        setSelectedFormationId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyPreset = (formation: FieldFormation) => {
    setSelectedFormationId(formation.id);
    try {
      const parsed: FielderPosition[] = JSON.parse(formation.positions_json);
      onUpdateFielders(parsed);
      setSelectedFielder(parsed[0] || null);
    } catch (e) {
      console.error('Failed to parse formation positions', e);
    }
  };

  const handleGetRecommendation = async () => {
    setLoading(true);
    try {
      const res = await api.getTacticalRecommendation(phase, bowlerType, batterTendency);
      setRecommendation(res);
      if (res.recommended_formation) {
        onUpdateFielders(res.recommended_formation);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFielderCoord = (axis: 'x' | 'z', delta: number) => {
    if (!selectedFielder) return;
    const updated = fielders.map((f) => {
      if (f.id === selectedFielder.id) {
        const nextVal = Math.round((f[axis] + delta) * 10) / 10;
        return { ...f, [axis]: nextVal };
      }
      return f;
    });
    onUpdateFielders(updated);
    setSelectedFielder(updated.find((f) => f.id === selectedFielder.id) || null);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-semibold mb-1">
            <Compass className="w-3.5 h-3.5" /> MODULE 6: FIELDIQ AI
          </div>
          <h1 className="text-2xl font-extrabold text-white">Interactive 3D Field Placement & Tactical Formations</h1>
          <p className="text-xs text-slate-400">
            Real-time 3D stadium fielder positioning, preset match formations, batter wagon-wheel tendencies, and tactical risk gap calculations.
          </p>
        </div>

        {/* Preset Selector Buttons */}
        <div className="flex items-center gap-2">
          {formations.map((f) => (
            <button
              key={f.id}
              onClick={() => handleApplyPreset(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedFormationId === f.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400'
                  : 'bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {f.name.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Field & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Field */}
        <div className="lg:col-span-8 space-y-3">
          <CricketGround3D
            fielders={fielders}
            onSelectFielder={(f) => setSelectedFielder(f)}
            selectedFielderId={selectedFielder?.id}
          />

          {/* Fielder Position Fine-Tuning Controls */}
          {selectedFielder && (
            <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-white font-mono">
                  {selectedFielder.label} ({selectedFielder.role})
                </span>
                <span className="text-[11px] text-slate-400 block font-mono">
                  Current Coordinates: X: {selectedFielder.x}m, Z: {selectedFielder.z}m
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Nudge Position:</span>
                <button
                  onClick={() => handleUpdateFielderCoord('x', -2)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white border border-white/10"
                >
                  ← Off
                </button>
                <button
                  onClick={() => handleUpdateFielderCoord('x', 2)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white border border-white/10"
                >
                  Leg →
                </button>
                <button
                  onClick={() => handleUpdateFielderCoord('z', -2)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white border border-white/10"
                >
                  ↑ In
                </button>
                <button
                  onClick={() => handleUpdateFielderCoord('z', 2)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white border border-white/10"
                >
                  Deep ↓
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI Tactical Recommendation Assistant */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 font-mono uppercase pb-2 border-b border-white/10">
              <Sparkles className="w-4 h-4 text-purple-400" /> AI Tactical Placement Engine
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Match Phase</label>
                <select
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                >
                  <option value="Powerplay">Powerplay (Overs 1-6 • Max 2 Out)</option>
                  <option value="Middle Overs">Middle Overs (Overs 7-15 • Ring Squeeze)</option>
                  <option value="Death Overs">Death Overs (Overs 16-20 • 5 Boundary Riders)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Bowler Delivery Profile</label>
                <select
                  value={bowlerType}
                  onChange={(e) => setBowlerType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                >
                  <option value="Fast">Right-Arm Fast (Seam & Yorkers)</option>
                  <option value="Spin">Left-Arm Orthodox / Leg Spin</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Batter Tendency</label>
                <select
                  value={batterTendency}
                  onChange={(e) => setBatterTendency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                >
                  <option value="Off-side dominant">Off-side Heavy (Cover & Point Driver)</option>
                  <option value="Leg-side puller">Leg-side Dominant (Pull & Hook Slogger)</option>
                  <option value="Straight hitter">Straight Ground Hitter (V-Zone Specialist)</option>
                </select>
              </div>

              <button
                onClick={handleGetRecommendation}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                {loading ? 'Calculating Trajectory Gaps...' : 'Generate Optimal Formation'}
              </button>
            </div>

            {recommendation && (
              <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                  Tactical Rationale
                </span>
                <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-white/5">
                  {recommendation.tactical_logic}
                </p>

                {recommendation.risk_gaps && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] uppercase font-bold text-amber-400 font-mono block">
                      Calculated Risk Gaps:
                    </span>
                    {recommendation.risk_gaps.map((gap: string, i: number) => (
                      <div key={i} className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{gap}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
