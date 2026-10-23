import React, { useState, useEffect } from 'react';
import { Search, X, Activity, Video, Crosshair, Users, Compass, ChevronRight } from 'lucide-react';
import { MODULES } from './Navbar';
import { Player } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (moduleId: string) => void;
  players: Player[];
  onSelectPlayer?: (player: Player) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectModule,
  players,
  onSelectPlayer
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle handled by parent
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredModules = MODULES.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    m.desc.toLowerCase().includes(query.toLowerCase())
  );

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.country.toLowerCase().includes(query.toLowerCase()) ||
    p.role.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-purple-500/30 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-purple-400" />
          <input
            type="text"
            placeholder="Type a module, player (e.g. Bumrah, Kohli), or topic..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-500 font-sans"
          />
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Modules Group */}
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 mb-1.5 font-mono">
              AI Modules & Systems
            </p>
            <div className="space-y-1">
              {filteredModules.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => { onSelectModule(m.id); onClose(); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-purple-950/40 text-left transition group border border-transparent hover:border-purple-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-slate-800 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-purple-300">
                          {m.name}
                        </div>
                        <div className="text-[11px] text-slate-400">{m.desc}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Players Group */}
          {filteredPlayers.length > 0 && (
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 mb-1.5 font-mono">
                Scouted Players
              </p>
              <div className="space-y-1">
                {filteredPlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectModule('scoutxi');
                      if (onSelectPlayer) onSelectPlayer(p);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-cyan-950/30 text-left transition group border border-transparent hover:border-cyan-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-cyan-400">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-cyan-300">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.country} • {p.role} • Scout Score: <span className="text-purple-400 font-mono font-bold">{p.scout_score}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Navigate with mouse or arrow keys</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
