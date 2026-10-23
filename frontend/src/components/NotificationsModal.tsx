import React from 'react';
import { X, CheckCircle, Info, AlertTriangle, Bell, Clock } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: number) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-purple-500/30 shadow-2xl overflow-hidden mt-12 animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Notifications & Job Alerts
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[480px] overflow-y-auto p-3 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No new alerts or job notifications.
            </div>
          ) : (
            notifications.map((n) => {
              const isSuccess = n.type === 'success';
              const isWarning = n.type === 'warning';
              return (
                <div
                  key={n.id}
                  onClick={() => onMarkRead(n.id)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    n.is_read
                      ? 'bg-slate-950/40 border-white/5 opacity-70'
                      : 'bg-slate-800/70 border-purple-500/30 shadow-lg shadow-purple-950/20'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {isSuccess ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">{n.title}</span>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-2">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
