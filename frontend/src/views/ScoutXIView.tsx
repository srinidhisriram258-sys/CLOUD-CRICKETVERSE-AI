import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Download, Upload, ArrowUpDown,
  Sparkles, Check, ChevronRight, BarChart2, Star, Shield
} from 'lucide-react';
import { api } from '../services/api';
import { Player } from '../types';

interface ScoutXIViewProps {
  initialSelectedPlayer?: Player | null;
}

export const ScoutXIView: React.FC<ScoutXIViewProps> = ({ initialSelectedPlayer }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('scout_score');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(initialSelectedPlayer || null);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, [roleFilter, countryFilter, sortBy]);

  useEffect(() => {
    if (initialSelectedPlayer) {
      setSelectedPlayer(initialSelectedPlayer);
    }
  }, [initialSelectedPlayer]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const data = await api.getPlayers({
        query: searchQuery || undefined,
        role: roleFilter !== 'All' ? roleFilter : undefined,
        country: countryFilter !== 'All' ? countryFilter : undefined,
        sort_by: sortBy,
        order: 'desc'
      });
      setPlayers(data);
      if (!selectedPlayer && data.length > 0) {
        setSelectedPlayer(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompare = async (id: number) => {
    let next: number[];
    if (compareIds.includes(id)) {
      next = compareIds.filter(i => i !== id);
    } else {
      if (compareIds.length >= 3) return; // Max 3 players
      next = [...compareIds, id];
    }
    setCompareIds(next);

    if (next.length > 0) {
      try {
        const comp = await api.comparePlayers(next);
        setComparisonData(comp);
      } catch (e) {
        console.error(e);
      }
    } else {
      setComparisonData([]);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/v1/players/export/csv', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-semibold mb-1">
            <Users className="w-3.5 h-3.5" /> MODULE 5: SCOUTXI AI
          </div>
          <h1 className="text-2xl font-extrabold text-white">Player Scouting & Recruitment Intelligence</h1>
          <p className="text-xs text-slate-400">
            Multi-axis player comparisons, transparent performance index formulas, and bulk CSV intelligence dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search player name or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadPlayers()}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg glass-input text-xs font-sans"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-200"
          >
            <option value="All">All Roles</option>
            <option value="Batter">Batter</option>
            <option value="Fast Bowler">Fast Bowler</option>
            <option value="Spin Bowler">Spin Bowler</option>
            <option value="All-Rounder">All-Rounder</option>
            <option value="Wicketkeeper">Wicketkeeper</option>
          </select>

          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-200"
          >
            <option value="All">All Countries</option>
            <option value="India">India</option>
            <option value="Australia">Australia</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-200 font-mono"
          >
            <option value="scout_score">Scout Score (Formula)</option>
            <option value="runs">Total Runs</option>
            <option value="wickets">Wickets</option>
            <option value="strike_rate">Strike Rate</option>
            <option value="batting_avg">Batting Average</option>
          </select>
        </div>
      </div>

      {/* Comparison Drawer if 2+ selected */}
      {comparisonData.length > 0 && (
        <div className="glass-panel p-5 rounded-xl border border-cyan-500/30 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" /> Multi-Player Head-to-Head Comparison ({comparisonData.length}/3)
            </span>
            <button
              onClick={() => { setCompareIds([]); setComparisonData([]); }}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear Comparison
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisonData.map((c, idx) => (
              <div key={idx} className="bg-slate-950/70 p-4 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{c.player.name}</h4>
                  <span className="text-xs font-bold font-mono text-cyan-400">{c.player.scout_score}/100</span>
                </div>
                <div className="text-[11px] text-slate-400">{c.player.country} • {c.player.role}</div>

                {/* Radar Metric Bars */}
                <div className="space-y-2 pt-2">
                  {Object.entries(c.radar).map(([metric, val]: any) => (
                    <div key={metric} className="space-y-0.5">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>{metric}</span>
                        <span className="text-white font-bold">{val}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Players Directory & Detailed Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table / List */}
        <div className="lg:col-span-8 glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase font-mono">
              Scouted Talent Pool ({players.length} Profiles)
            </span>
            <span className="text-[11px] text-slate-400">Select checkboxes to compare up to 3</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[10px] border-b border-white/5">
                <tr>
                  <th className="py-3 px-3">Compare</th>
                  <th className="py-3 px-3">Player</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3 text-right">Runs</th>
                  <th className="py-3 px-3 text-right">Avg</th>
                  <th className="py-3 px-3 text-right">SR</th>
                  <th className="py-3 px-3 text-right">Wkts</th>
                  <th className="py-3 px-3 text-right">Econ</th>
                  <th className="py-3 px-4 text-right">Scout Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {players.map((p) => {
                  const isSelected = selectedPlayer?.id === p.id;
                  const isCompared = compareIds.includes(p.id);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPlayer(p)}
                      className={`cursor-pointer transition hover:bg-purple-950/20 ${
                        isSelected ? 'bg-purple-950/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isCompared}
                          onChange={() => handleToggleCompare(p.id)}
                          className="rounded border-slate-700 text-purple-600 focus:ring-0 bg-slate-900"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">{p.name}</div>
                        <div className="text-[10px] text-slate-400">{p.country}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">{p.role}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-white">{p.runs}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">{p.batting_avg}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-cyan-400 font-bold">{p.strike_rate}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-white">{p.wickets}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">{p.economy_rate || '-'}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-purple-300">
                        {p.scout_score}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Player Dossier Card */}
        <div className="lg:col-span-4 space-y-4">
          {selectedPlayer ? (
            <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedPlayer.name}</h3>
                  <p className="text-xs text-slate-400">{selectedPlayer.country} • {selectedPlayer.role}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Scout Score</span>
                  <span className="text-xl font-bold font-mono text-cyan-400">{selectedPlayer.scout_score}/100</span>
                </div>
              </div>

              {/* Styles */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/60 p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-mono">Batting Style</span>
                  <span className="text-white font-medium">{selectedPlayer.batting_style}</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-mono">Bowling Style</span>
                  <span className="text-white font-medium">{selectedPlayer.bowling_style}</span>
                </div>
              </div>

              {/* Career Summary */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/5 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block">
                  Career Match Telemetry
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Matches</span>
                    <span className="font-bold text-white">{selectedPlayer.matches}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Catches</span>
                    <span className="font-bold text-white">{selectedPlayer.catches}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Form Index</span>
                    <span className="font-bold text-emerald-400">{selectedPlayer.form_index}</span>
                  </div>
                </div>
              </div>

              {/* Transparent Score Formula Transparency */}
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-center gap-1.5 text-purple-300 font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Scout Scoring Logic
                </div>
                Rankings use transparent weighted metrics:
                {selectedPlayer.role in { Batter: 1, Wicketkeeper: 1 }
                  ? ' 40% Batting Avg + 40% Strike Rate + 20% Run Volume.'
                  : ' 35% Bowling Avg + 35% Economy Rate + 30% Wickets Volume.'}
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-2xl text-center text-slate-500 text-xs">
              Select a player to inspect full scouting telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
