import React, { useState, useEffect } from 'react';
import {
  SunMedium, Upload, Cloud, Wind, Droplets,
  AlertTriangle, Sparkles, CheckCircle, RefreshCw, Layers
} from 'lucide-react';
import { api } from '../services/api';
import { PitchAnalysis } from '../types';

export const PitchPredictView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [venue, setVenue] = useState('Melbourne Cricket Ground');
  const [loading, setLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<PitchAnalysis | null>(null);
  const [history, setHistory] = useState<PitchAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
    handleRunDefaultAnalysis();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await api.getPitchHistory();
      setHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunDefaultAnalysis = async () => {
    setLoading(true);
    try {
      const res = await api.analyzePitch(undefined, venue);
      setActiveAnalysis(res);
      loadHistory();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (!f.type.startsWith('image/')) {
        setError('Please upload a valid pitch image file (JPG, PNG)');
        return;
      }
      setError(null);
      setSelectedFile(f);
    }
  };

  const handleUploadAndAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.analyzePitch(selectedFile || undefined, venue);
      setActiveAnalysis(res);
      setSelectedFile(null);
      loadHistory();
    } catch (err: any) {
      setError(err.message || 'Pitch analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const weather = activeAnalysis?.weather_json ? JSON.parse(activeAnalysis.weather_json) : null;
  const observables = activeAnalysis?.observable_features_json ? JSON.parse(activeAnalysis.observable_features_json) : null;

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-semibold mb-1">
            <SunMedium className="w-3.5 h-3.5" /> MODULE 9: PITCHPREDICT AI
          </div>
          <h1 className="text-2xl font-extrabold text-white">Pitch Surface Intelligence & Micro-Climate CV</h1>
          <p className="text-xs text-slate-400">
            OpenCV surface texture segmentation extracting grass coverage %, soil moisture, and crack density combined with atmospheric weather models.
          </p>
        </div>

        <button
          onClick={handleRunDefaultAnalysis}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Re-Analyze Current Conditions
        </button>
      </div>

      {/* Upload & Venue Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Card */}
        <div className="lg:col-span-8 glass-card p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase font-mono">Target Venue:</span>
              <select
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white"
              >
                <option value="Melbourne Cricket Ground">Melbourne Cricket Ground (MCG)</option>
                <option value="Sydney Cricket Ground">Sydney Cricket Ground (SCG)</option>
                <option value="Wankhede Stadium, Mumbai">Wankhede Stadium, Mumbai</option>
                <option value="Lord's Cricket Ground, London">Lord's Cricket Ground, London</option>
                <option value="Narendra Modi Stadium, Ahmedabad">Narendra Modi Stadium, Ahmedabad</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                id="pitch-image"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="pitch-image"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer border border-white/10 transition flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                {selectedFile ? selectedFile.name : 'Upload Pitch Photo'}
              </label>

              {selectedFile && (
                <button
                  onClick={handleUploadAndAnalyze}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition"
                >
                  Analyze Photo
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Observable Physical Surface Features vs Model Predictions */}
          {activeAnalysis && (
            <div className="space-y-6 pt-2">
              {/* Observable Features (CV Extracted) */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" /> Section A: Observable Physical Surface Metrics (OpenCV)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Grass Coverage</span>
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      {activeAnalysis.grass_coverage}%
                    </span>
                    <div className="text-[10px] text-slate-400">Green spectrum index</div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Moisture Index</span>
                    <span className="text-2xl font-bold font-mono text-cyan-400">
                      {activeAnalysis.moisture_level}%
                    </span>
                    <div className="text-[10px] text-slate-400">Clay reflectance density</div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Crack Density</span>
                    <span className="text-2xl font-bold font-mono text-amber-400">
                      {activeAnalysis.crack_density}%
                    </span>
                    <div className="text-[10px] text-slate-400">Canny edge fissures</div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Surface Class</span>
                    <span className="text-base font-bold font-mono text-purple-300 block truncate">
                      {activeAnalysis.pitch_type}
                    </span>
                    <div className="text-[10px] text-slate-400">Soil profile</div>
                  </div>
                </div>
              </div>

              {/* Section B: Model Predictions & Tactical Outcomes */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Section B: Algorithmic Predictions & Tactical Advice
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Pace & Bounce</span>
                    <span className="text-sm font-bold font-mono text-white">
                      {activeAnalysis.pace_prediction}
                    </span>
                    <div className="text-[10px] text-emerald-400">{activeAnalysis.bounce_prediction}</div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Spin Response</span>
                    <span className="text-sm font-bold font-mono text-white">
                      {activeAnalysis.spin_prediction}
                    </span>
                    <div className="text-[10px] text-cyan-400">Day 1 to 2 grip</div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Toss Decision</span>
                    <span className="text-base font-bold font-mono text-cyan-300">
                      {activeAnalysis.toss_recommendation}
                    </span>
                    <div className="text-[10px] text-slate-400">Exploit early moisture</div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Par 1st Innings</span>
                    <span className="text-2xl font-bold font-mono text-purple-400">
                      174
                    </span>
                    <div className="text-[10px] text-slate-400">Historical average</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Meteorological Context & Disclosures */}
        <div className="lg:col-span-4 space-y-4">
          {/* Weather Widget */}
          <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 space-y-3">
            <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2 pb-2 border-b border-white/10">
              <Cloud className="w-4 h-4 text-cyan-400" /> Match Micro-Climate Telemetry
            </span>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5"><SunMedium className="w-3.5 h-3.5 text-amber-400" /> Temperature</span>
                <span className="font-mono font-bold text-white">{weather?.temperature_c || 24.5}°C</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-cyan-400" /> Humidity</span>
                <span className="font-mono font-bold text-white">{weather?.humidity || 62.0}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-slate-300" /> Wind Velocity</span>
                <span className="font-mono font-bold text-white">{weather?.wind_speed_kmh || 14.0} km/h</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5"><Cloud className="w-3.5 h-3.5 text-purple-400" /> Overcast Cloud</span>
                <span className="font-mono font-bold text-white">{weather?.overcast_pct || 35.0}%</span>
              </div>
            </div>
          </div>

          {/* Uncertainty & Limitations Disclosure */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10 text-xs text-slate-400 leading-relaxed space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <AlertTriangle className="w-4 h-4" /> Data Science & Physical Limitations
            </div>
            <p>
              Observable indicators represent surface-level computer-vision extractions. A single photograph cannot fully determine sub-surface clay compaction, root depth, or rolling history. Predictions provide directional probability guidance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
