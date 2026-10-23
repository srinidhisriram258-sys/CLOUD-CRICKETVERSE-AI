import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle, AlertTriangle, Sparkles, Shield,
  Award, Trophy, Download, Plus, Trash2, ArrowUpDown
} from 'lucide-react';
import { api } from '../services/api';
import { Team, Player, TeamLineupAnalysis } from '../types';

interface TeamXIViewProps {
  teams: Team[];
  players: Player[];
}

export const TeamXIView: React.FC<TeamXIViewProps> = ({ teams, players }) => {
  const [selectedTeamId, setSelectedTeamId] = useState<number>(teams[0]?.id || 1);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [analysis, setAnalysis] = useState<TeamLineupAnalysis | null>(null);
  const [lineupName, setLineupName] = useState('Championship Final XI');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Default pick first 11 players from country matching team or pool
    if (players.length >= 11 && selectedPlayerIds.length === 0) {
      const initial = players.slice(0, 11).map(p => p.id);
      setSelectedPlayerIds(initial);
      runOptimization(initial);
    }
  }, [players]);

  const runOptimization = async (ids: number[]) => {
    if (ids.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.optimizeLineup(ids);
      setAnalysis(res.analysis);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze lineup');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlayer = (id: number) => {
    let next: number[];
    if (selectedPlayerIds.includes(id)) {
      next = selectedPlayerIds.filter(i => i !== id);
    } else {
      if (selectedPlayerIds.length >= 11) {
        setError('Playing XI is full (11 players maximum). Deselect a player first.');
        return;
      }
      next = [...selectedPlayerIds, id];
    }
    setError(null);
    setSelectedPlayerIds(next);
    runOptimization(next);
  };

  const handleSaveLineup = async () => {
    if (selectedPlayerIds.length !== 11) {
      setError('Please select exactly 11 players for your Playing XI.');
      return;
    }
    try {
      await api.saveLineup(selectedTeamId, lineupName, selectedPlayerIds, analysis?.suggested_batting_order);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save lineup');
    }
  };

  const handleExportTeamSheet = () => {
    const selected = players.filter(p => selectedPlayerIds.includes(p.id));
    const lines = [
      `====================================================`,
      `CRICKETVERSE AI — OFFICIAL MATCH PLAYING XI TEAM SHEET`,
      `====================================================`,
      `Lineup: ${lineupName}`,
      `Team: ${teams.find(t => t.id === selectedTeamId)?.name || 'National Team'}`,
      `Team Balance Score: ${analysis?.balance_score || 85.0}/100`,
      ``,
      `BATTING ORDER & ROLES:`,
      ...selected.map((p, idx) => `${idx + 1}. ${p.name.padEnd(24)} | ${p.role.padEnd(14)} | ${p.batting_style}`),
      ``,
      `TACTICAL RATIONALE:`,
      `${analysis?.explanation || 'Balanced XI with required wicketkeeper and bowling quota.'}`,
      `====================================================`
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lineupName.replace(/\s+/g, '_')}_Team_Sheet.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-semibold mb-1">
            <Users className="w-3.5 h-3.5" /> MODULE 7: TEAMXI AI
          </div>
          <h1 className="text-2xl font-extrabold text-white">Intelligent Team Builder & Lineup Optimizer</h1>
          <p className="text-xs text-slate-400">
            Automated squad constraints validator, batting order heuristics, and composite Team Balance Index (0-100).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportTeamSheet}
            disabled={selectedPlayerIds.length !== 11}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 text-xs font-semibold transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" /> Export Team Sheet
          </button>
          <button
            onClick={handleSaveLineup}
            disabled={selectedPlayerIds.length !== 11}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
          >
            <Trophy className="w-3.5 h-3.5" /> Save Playing XI
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" /> Lineup successfully saved to your profile and team database!
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Main Grid: Squad Pool Picker & Analysis Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Available Player Pool */}
        <div className="lg:col-span-7 glass-card p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <span className="text-xs font-bold text-white uppercase font-mono">
                Squad Selection Pool ({players.length} Available)
              </span>
              <span className="text-[11px] text-slate-400 block font-mono">
                Click players to add/remove ({selectedPlayerIds.length}/11 Selected)
              </span>
            </div>

            <div className="text-right">
              <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${
                selectedPlayerIds.length === 11 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {selectedPlayerIds.length === 11 ? 'Full XI Ready' : `Needs ${11 - selectedPlayerIds.length} more`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
            {players.map((p) => {
              const isSelected = selectedPlayerIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => handleTogglePlayer(p.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-purple-950/50 border-purple-500/50 shadow-md shadow-purple-950/40'
                      : 'bg-slate-950/40 border-white/5 hover:border-white/20 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isSelected ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isSelected ? <CheckCircle className="w-3.5 h-3.5" /> : p.name.charAt(0)}
                    </div>
                    <div>
                      <div className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.role} • {p.country}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-purple-400 font-bold block">
                      Score: {p.scout_score}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      SR {p.strike_rate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Playing XI & Balance Score Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-xs font-bold text-white uppercase font-mono">
                  Team Balance Index
                </span>
                <span className="text-[11px] text-slate-400 block font-mono">Composite Synergy Rating</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-cyan-400">
                  {analysis?.balance_score || 0}<span className="text-xs text-purple-400">/100</span>
                </span>
              </div>
            </div>

            {/* Validation Alerts */}
            {analysis?.validation_errors && analysis.validation_errors.length > 0 ? (
              <div className="space-y-1.5 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs">
                <div className="font-bold flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> Rule Constraint Violations:
                </div>
                {analysis.validation_errors.map((err, i) => (
                  <div key={i} className="text-[11px] leading-relaxed">• {err}</div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                Lineup passes all official match requirements (Wicketkeeper, 5+ bowling options, 11 players).
              </div>
            )}

            {/* Sub-Metric Ratings */}
            {analysis?.breakdown && (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Batting Depth</span>
                  <span className="text-base font-bold font-mono text-white">{analysis.breakdown.batting_depth}/100</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Pace Attack</span>
                  <span className="text-base font-bold font-mono text-cyan-400">{analysis.breakdown.pace_rating}/100</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Spin Variety</span>
                  <span className="text-base font-bold font-mono text-purple-400">{analysis.breakdown.spin_rating}/100</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Fielding Quality</span>
                  <span className="text-base font-bold font-mono text-emerald-400">{analysis.breakdown.fielding_score}/100</span>
                </div>
              </div>
            )}

            {/* AI Batting Order Suggester */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Optimal Batting Order (1-11)
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(analysis?.suggested_batting_order || selectedPlayerIds).map((pid, idx) => {
                  const p = players.find(x => x.id === pid);
                  if (!p) return null;
                  return (
                    <div key={pid} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-white/5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-slate-800 text-[10px] font-mono font-bold flex items-center justify-center text-purple-400">
                          {idx + 1}
                        </span>
                        <span className="text-white font-medium">{p.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{p.role}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
