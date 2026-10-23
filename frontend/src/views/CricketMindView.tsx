import React, { useState, useEffect } from 'react';
import {
  Activity, TrendingUp, Download, Shield, Trophy,
  FileText, Sparkles, RefreshCw, BarChart2, PieChart
} from 'lucide-react';
import { api } from '../services/api';
import { Match, MatchDetailResponse } from '../types';

interface CricketMindViewProps {
  matches: Match[];
}

export const CricketMindView: React.FC<CricketMindViewProps> = ({ matches }) => {
  const [selectedMatchId, setSelectedMatchId] = useState<number>(matches[0]?.id || 1);
  const [detail, setDetail] = useState<MatchDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);

  useEffect(() => {
    loadMatchDetails(selectedMatchId);
  }, [selectedMatchId]);

  const loadMatchDetails = async (id: number) => {
    setLoading(true);
    try {
      const data = await api.getMatchDetails(id);
      setDetail(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!detail) return;
    setDownloading(true);
    try {
      window.open(`/api/v1/reports/match/${detail.match.id}/pdf`, '_blank');
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const match = detail?.match;
  const innings = detail?.innings || [];

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-semibold mb-1">
            <Activity className="w-3.5 h-3.5" /> MODULE 1: CRICKETMIND AI
          </div>
          <h1 className="text-2xl font-extrabold text-white">Match Intelligence & Predictive Analytics</h1>
          <p className="text-xs text-slate-400">
            Real-time scorecards, worm progression, dynamic win probability curves, and downloadable intelligence dossiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Match Selector */}
          <select
            value={selectedMatchId}
            onChange={(e) => setSelectedMatchId(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 font-sans"
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.status.toUpperCase()})
              </option>
            ))}
          </select>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? 'Exporting...' : 'Official PDF Report'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
          <span>Crunching match progression matrix & probabilities...</span>
        </div>
      ) : (
        <>
          {/* Innings Scorecards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {innings.map((inn) => (
              <div key={inn.id} className="glass-card p-5 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-xs font-mono font-bold text-purple-400 uppercase">
                    Innings {inn.innings_number} • {inn.batting_team.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 font-mono text-slate-400">
                    vs {inn.bowling_team.short_name}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-extrabold text-white font-mono">
                      {inn.total_runs}/{inn.total_wickets}
                    </span>
                    <span className="text-xs text-slate-400 ml-2 font-mono">
                      in {inn.total_overs} overs
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-mono">Run Rate</span>
                    <span className="text-sm font-bold text-cyan-400 font-mono">
                      {(inn.total_runs / (inn.total_overs || 1)).toFixed(2)} RPO
                    </span>
                  </div>
                </div>

                {/* Partnerships */}
                {inn.partnerships.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                      Key Partnership
                    </span>
                    {inn.partnerships.map((p, idx) => (
                      <div key={idx} className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-slate-300">
                          {p.batter1} & {p.batter2}
                        </span>
                        <span className="font-mono font-bold text-amber-400">
                          {p.runs} runs ({p.balls}b)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Over-by-Over Worm & Progression Analytics */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Over-by-Over Manhattan Progression & Wicket Fall points
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Runs Per Over</span>
            </div>

            {innings.length > 0 && innings[innings.length - 1].over_progression.length > 0 ? (
              <div className="pt-4">
                <div className="h-44 flex items-end gap-1.5 sm:gap-2 px-2 border-b border-white/10 pb-2">
                  {innings[innings.length - 1].over_progression.map((ov) => {
                    const heightPct = Math.min(100, (ov.over_runs / 22) * 100);
                    return (
                      <div key={ov.over} className="flex-1 flex flex-col items-center gap-1 group relative">
                        {/* Wicket marker */}
                        {ov.wickets > 0 && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-bounce -mb-1 shadow-lg shadow-rose-500/50" title={`${ov.wickets} Wicket`} />
                        )}
                        <div
                          style={{ height: `${Math.max(8, heightPct)}%` }}
                          className={`w-full rounded-t-sm transition-all duration-300 ${
                            ov.wickets > 0
                              ? 'bg-rose-500/80 group-hover:bg-rose-400'
                              : 'bg-gradient-to-t from-purple-700 to-cyan-500 group-hover:from-purple-500 group-hover:to-cyan-400'
                          }`}
                        />
                        <span className="text-[10px] font-mono text-slate-400">{ov.over}</span>

                        {/* Tooltip */}
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-900 border border-white/10 px-2 py-1 rounded text-[10px] font-mono text-white whitespace-nowrap z-20">
                          Ov {ov.over}: {ov.over_runs} runs {ov.wickets > 0 && `• ${ov.wickets}W`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">Over progression data pending.</p>
            )}
          </div>

          {/* Win Probability & Projected Score Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Win Probability */}
            <div className="glass-card p-5 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase font-mono">
                  Live Predictive Win Probability
                </h3>
              </div>

              <div className="space-y-3 pt-2">
                {detail?.win_probability && Object.entries(detail.win_probability).map(([team, prob]) => (
                  <div key={team} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white">{team}</span>
                      <span className="text-cyan-400 font-bold">{prob}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-500"
                        style={{ width: `${prob}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 pt-2 leading-relaxed">
                Probability factors required run-rate velocity, remaining top-order wickets, pitch wear factor, and historical chase distributions at venue.
              </p>
            </div>

            {/* Projected Score Matrix */}
            <div className="glass-card p-5 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <Trophy className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase font-mono">
                  Projected Score Scenarios
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Current Run Rate</span>
                  <span className="text-lg font-bold text-white font-mono">{detail?.projected_score.current_rate}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Conservative (-15%)</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">{detail?.projected_score.conservative}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Aggressive (+25%)</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">{detail?.projected_score.aggressive}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Venue Par Score</span>
                  <span className="text-lg font-bold text-purple-400 font-mono">{detail?.projected_score.par_score}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Match Insights */}
          <div className="glass-panel p-5 rounded-xl border border-purple-500/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300 font-mono uppercase">
              <Sparkles className="w-4 h-4 text-cyan-300" /> AI Tactical Match Insights & Takeaways
            </div>
            <div className="space-y-2">
              {detail?.tactical_insights.map((ins, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>{ins}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
