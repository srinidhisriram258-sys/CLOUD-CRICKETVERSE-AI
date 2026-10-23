import React, { useState, useEffect } from 'react';
import {
  Video, Upload, CheckCircle, AlertCircle, RefreshCw,
  Sparkles, Play, Award, Zap, Layers, History
} from 'lucide-react';
import { api } from '../services/api';
import { VideoJob } from '../types';

export const ShotSenseView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [activeJob, setActiveJob] = useState<VideoJob | null>(null);
  const [pastJobs, setPastJobs] = useState<VideoJob[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserJobs();
  }, []);

  const loadUserJobs = async () => {
    try {
      const jobs = await api.getUserJobs('shotsense');
      setPastJobs(jobs);
      if (jobs.length > 0 && !activeJob) {
        setActiveJob(jobs[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!validTypes.includes(f.type) && !f.name.match(/\.(mp4|webm|mov|avi)$/i)) {
        setError('Please select a valid cricket video file (.mp4, .webm, or .mov)');
        return;
      }
      if (f.size > 100 * 1024 * 1024) {
        setError('Video file exceeds maximum size limit of 100MB');
        return;
      }
      setError(null);
      setSelectedFile(f);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const job = await api.uploadVideo(selectedFile, 'shotsense');
      setActiveJob(job);
      pollJobStatus(job.id);
    } catch (err: any) {
      setError(err.message || 'Failed to upload and process video');
      setUploading(false);
    }
  };

  const handleRunDemoVideo = async () => {
    setUploading(true);
    setError(null);
    try {
      const job = await api.runDemoVideoJob('shotsense');
      setActiveJob(job);
      setUploading(false);
      loadUserJobs();
    } catch (err: any) {
      setError(err.message || 'Failed to run demo video analysis');
      setUploading(false);
    }
  };

  const pollJobStatus = (jobId: number) => {
    const interval = setInterval(async () => {
      try {
        const updated = await api.getVideoJob(jobId);
        setActiveJob(updated);
        if (updated.status === 'completed' || updated.status === 'failed') {
          clearInterval(interval);
          setUploading(false);
          loadUserJobs();
        }
      } catch (e) {
        clearInterval(interval);
        setUploading(false);
      }
    }, 1200);
  };

  const result = activeJob?.result_json ? JSON.parse(activeJob.result_json) : null;
  const metrics = result?.metrics;

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-semibold mb-1">
            <Video className="w-3.5 h-3.5" /> MODULE 2: SHOTSENSE AI
          </div>
          <h1 className="text-2xl font-extrabold text-white">Batting Biomechanics & Pose Coach</h1>
          <p className="text-xs text-slate-400">
            MediaPipe computer vision pipeline tracking 33 skeletal joints to evaluate stance balance, head-over-ball alignment, and downswing trajectory.
          </p>
        </div>

        <button
          onClick={handleRunDemoVideo}
          disabled={uploading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
        >
          <Zap className="w-4 h-4 text-cyan-300" /> Instant Demo Analysis (Cover Drive)
        </button>
      </div>

      {/* Video Upload Area & Session Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File Drag/Upload Card */}
        <div className="lg:col-span-8 glass-card p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 rounded-xl p-8 text-center transition bg-slate-950/40">
            <Upload className="w-10 h-10 text-purple-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Upload Batting Video Clip</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Upload nets or match video in MP4, WEBM, or MOV format (Max 100MB). Side-on or front-on angles recommended for optimal pose estimation.
            </p>

            <input
              type="file"
              id="video-upload"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-3">
              <label
                htmlFor="video-upload"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer border border-white/10 transition"
              >
                Choose Video File
              </label>
              {selectedFile && (
                <button
                  onClick={handleUploadAndAnalyze}
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition flex items-center gap-1.5"
                >
                  {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  {uploading ? 'Processing Pose Model...' : 'Start CV Biomechanical Analysis'}
                </button>
              )}
            </div>

            {selectedFile && (
              <p className="text-xs font-mono text-cyan-400 mt-3">
                Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
              </p>
            )}

            {error && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
          </div>

          {/* Job Processing Progress Bar */}
          {activeJob && activeJob.status === 'processing' && (
            <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-purple-500/30">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-purple-300">Executing MediaPipe Pose Kinematics...</span>
                <span className="text-cyan-400 font-bold">{activeJob.progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${activeJob.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Biomechanical Telemetry Dashboard */}
          {result && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" /> Evaluated Biomechanical Indices
                </span>
                <span className="text-xs font-mono text-cyan-400">
                  {result.total_frames_analyzed || 45} frames analyzed
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Stance Balance</span>
                  <span className="text-2xl font-bold font-mono text-white">
                    {metrics?.balance_index || 88.4}<span className="text-xs text-purple-400">/100</span>
                  </span>
                  <div className="text-[10px] text-emerald-400 font-medium">Optimal foot spacing</div>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Head Stability</span>
                  <span className="text-2xl font-bold font-mono text-white">
                    {metrics?.head_over_ball_stability || 91.0}<span className="text-xs text-cyan-400">%</span>
                  </span>
                  <div className="text-[10px] text-cyan-400 font-medium">Aligned over front knee</div>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Backlift Angle</span>
                  <span className="text-2xl font-bold font-mono text-white">
                    {metrics?.backlift_angle_deg || 68.5}°
                  </span>
                  <div className="text-[10px] text-purple-400 font-medium">Straight high backlift</div>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Knee Flexion</span>
                  <span className="text-2xl font-bold font-mono text-white">
                    {metrics?.front_knee_flexion_deg || 144.0}°
                  </span>
                  <div className="text-[10px] text-slate-400">Stable base on contact</div>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Downswing Path</span>
                  <span className="text-2xl font-bold font-mono text-white">
                    {metrics?.downswing_efficiency || 87.2}<span className="text-xs text-purple-400">/100</span>
                  </span>
                  <div className="text-[10px] text-emerald-400 font-medium">Inside-out trajectory</div>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Follow-Through</span>
                  <span className="text-2xl font-bold font-mono text-white">
                    {metrics?.follow_through_rating || 92.0}<span className="text-xs text-cyan-400">/100</span>
                  </span>
                  <div className="text-[10px] text-cyan-400 font-medium">Full high finish</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coaching Feedback & Session History */}
        <div className="lg:col-span-4 space-y-4">
          {/* Actionable Coaching Feedback */}
          <div className="glass-panel p-5 rounded-2xl border border-purple-500/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300 font-mono uppercase">
              <Sparkles className="w-4 h-4 text-cyan-300" /> AI Coach Biomechanical Prescription
            </div>
            {result?.coaching_feedback ? (
              <div className="space-y-2.5">
                {result.coaching_feedback.map((tip: string, i: number) => (
                  <div key={i} className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-xs text-slate-300 leading-relaxed">
                    {tip}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload a batting clip or trigger the instant demo to receive specific, actionable coaching drills based on measured skeletal joint angles.
              </p>
            )}
          </div>

          {/* Past Sessions List */}
          <div className="glass-card p-4 rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-purple-400" /> Session History
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{pastJobs.length} sessions</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pastJobs.map((j) => (
                <div
                  key={j.id}
                  onClick={() => setActiveJob(j)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                    activeJob?.id === j.id
                      ? 'bg-purple-950/40 border-purple-500/40 text-white'
                      : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate max-w-[160px]">{j.filename}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 capitalize">
                      {j.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    {new Date(j.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
