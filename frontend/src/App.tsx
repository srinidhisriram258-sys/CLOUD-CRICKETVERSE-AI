import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { NotificationsModal } from './components/NotificationsModal';
import { DashboardView } from './views/DashboardView';
import { CricketMindView } from './views/CricketMindView';
import { ShotSenseView } from './views/ShotSenseView';
import { BallTrackView } from './views/BallTrackView';
import { BowlVisionView } from './views/BowlVisionView';
import { ScoutXIView } from './views/ScoutXIView';
import { FieldIQView } from './views/FieldIQView';
import { TeamXIView } from './views/TeamXIView';
import { LiveCricketView } from './views/LiveCricketView';
import { PitchPredictView } from './views/PitchPredictView';
import { CricketVisionView } from './views/CricketVisionView';

import { api } from './services/api';
import { User, Match, Player, Team, FielderPosition, NotificationItem, VideoJob } from './types';

// Initial default fielders (11 players)
const DEFAULT_FIELDERS: FielderPosition[] = [
  { id: 1, name: 'Wicketkeeper', role: 'Keeper', x: 0.0, z: -12.0, label: 'Wicketkeeper' },
  { id: 2, name: 'Bowler', role: 'Bowler', x: 0.0, z: 12.0, label: 'Bowler' },
  { id: 3, name: '1st Slip', role: 'Close Catcher', x: 3.5, z: -11.0, label: '1st Slip' },
  { id: 4, name: '2nd Slip', role: 'Close Catcher', x: 5.5, z: -10.0, label: '2nd Slip' },
  { id: 5, name: 'Point', role: 'Ring Fielder', x: 22.0, z: 2.0, label: 'Point' },
  { id: 6, name: 'Cover', role: 'Ring Fielder', x: 20.0, z: 14.0, label: 'Cover' },
  { id: 7, name: 'Mid-Off', role: 'Ring Fielder', x: 10.0, z: 22.0, label: 'Mid-Off' },
  { id: 8, name: 'Mid-On', role: 'Ring Fielder', x: -10.0, z: 22.0, label: 'Mid-On' },
  { id: 9, name: 'Midwicket', role: 'Ring Fielder', x: -22.0, z: 12.0, label: 'Midwicket' },
  { id: 10, name: 'Deep Square Leg', role: 'Boundary Sweeper', x: -48.0, z: -12.0, label: 'Deep Square Leg' },
  { id: 11, name: 'Deep Third Man', role: 'Boundary Sweeper', x: 42.0, z: -35.0, label: 'Deep Third Man' },
];

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [fielders, setFielders] = useState<FielderPosition[]>(DEFAULT_FIELDERS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [videoJobs, setVideoJobs] = useState<VideoJob[]>([]);

  // Modals
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedPlayerForScout, setSelectedPlayerForScout] = useState<Player | null>(null);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      // 1. Try current session or auto quick-login as coach for instant evaluation
      let user: User | null = null;
      try {
        user = await api.getMe();
      } catch {
        const demoAuth = await api.quickLogin('coach');
        user = demoAuth.user;
      }
      setCurrentUser(user);

      // 2. Load Core Data
      const [matchesData, playersData, teamsData, notifsData, formationsData] = await Promise.all([
        api.getMatches(),
        api.getPlayers(),
        api.getTeams(),
        api.getNotifications(),
        api.getFieldFormations()
      ]);

      setMatches(matchesData);
      setPlayers(playersData);
      setTeams(teamsData);
      setNotifications(notifsData);

      if (formationsData && formationsData.length > 0) {
        try {
          const parsed = JSON.parse(formationsData[0].positions_json);
          setFielders(parsed);
        } catch (e) {
          console.error(e);
        }
      }

      // Load user video jobs
      const jobs = await api.getUserJobs();
      setVideoJobs(jobs);
    } catch (e) {
      console.error('Initialization error:', e);
    }
  };

  const handleQuickLogin = async (role: 'admin' | 'coach' | 'player') => {
    try {
      const res = await api.quickLogin(role);
      setCurrentUser(res.user);
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  const handleMarkNotificationRead = async (id: number) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  return (
    <div className="min-h-screen bg-[#07080f] text-slate-100 flex flex-col font-sans">
      {/* Universal Top Navigation */}
      <Navbar
        currentUser={currentUser}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onQuickLogin={handleQuickLogin}
        onLogout={handleLogout}
        onOpenSearch={() => setSearchOpen(true)}
        notifications={notifications}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />

      {/* Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectModule={setActiveModule}
        players={players}
        onSelectPlayer={(p) => {
          setSelectedPlayerForScout(p);
          setActiveModule('scoutxi');
        }}
      />

      {/* Notifications Drawer Modal */}
      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
      />

      {/* Active Module Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeModule === 'dashboard' && (
          <DashboardView
            onSelectModule={setActiveModule}
            matches={matches}
            fielders={fielders}
            videoJobs={videoJobs}
          />
        )}
        {activeModule === 'cricketmind' && <CricketMindView matches={matches} />}
        {activeModule === 'shotsense' && <ShotSenseView />}
        {activeModule === 'balltrack' && <BallTrackView fielders={fielders} />}
        {activeModule === 'bowlvision' && <BowlVisionView />}
        {activeModule === 'scoutxi' && <ScoutXIView initialSelectedPlayer={selectedPlayerForScout} />}
        {activeModule === 'fieldiq' && (
          <FieldIQView
            fielders={fielders}
            onUpdateFielders={(next) => setFielders(next)}
          />
        )}
        {activeModule === 'teamxi' && <TeamXIView teams={teams} players={players} />}
        {activeModule === 'livecricket' && <LiveCricketView matches={matches} />}
        {activeModule === 'pitchpredict' && <PitchPredictView />}
        {activeModule === 'cricketvision' && <CricketVisionView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-500/15 bg-slate-950/80 py-6 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">CRICKETVERSE AI</span>
            <span>•</span>
            <span className="text-purple-400">All-in-One Intelligent Cricket Ecosystem</span>
          </div>
          <div className="text-slate-400">
            Powered by MediaPipe Pose, Three.js & FastAPI • Version 1.0.0
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
