import {
  User, Player, Team, Match, MatchDetailResponse,
  FieldFormation, TeamLineupAnalysis, VideoJob,
  PitchAnalysis, NotificationItem
} from '../types';

const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('cricketverse_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async quickLogin(role: 'admin' | 'coach' | 'player'): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/quick-login/${role}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to quick login');
    const data = await res.json();
    localStorage.setItem('cricketverse_token', data.access_token);
    localStorage.setItem('cricketverse_user', JSON.stringify(data.user));
    return data;
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  logout() {
    localStorage.removeItem('cricketverse_token');
    localStorage.removeItem('cricketverse_user');
  },

  // Players & Scouting
  async getPlayers(params?: { query?: string; role?: string; country?: string; sort_by?: string; order?: string }): Promise<Player[]> {
    const url = new URL(`${window.location.origin}${API_BASE}/players`);
    if (params?.query) url.searchParams.set('query', params.query);
    if (params?.role) url.searchParams.set('role', params.role);
    if (params?.country) url.searchParams.set('country', params.country);
    if (params?.sort_by) url.searchParams.set('sort_by', params.sort_by);
    if (params?.order) url.searchParams.set('order', params.order);
    
    const res = await fetch(url.toString(), { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch players');
    return res.json();
  },

  async comparePlayers(playerIds: number[]): Promise<any[]> {
    const res = await fetch(`${API_BASE}/players/comparison/multi?ids=${playerIds.join(',')}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to compare players');
    return res.json();
  },

  // Teams & Squads
  async getTeams(): Promise<Team[]> {
    const res = await fetch(`${API_BASE}/teams`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
  },

  async getTeamSquad(teamId: number): Promise<{ team: Team; squad: any[]; total_players: number }> {
    const res = await fetch(`${API_BASE}/teams/${teamId}/squad`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch squad');
    return res.json();
  },

  async optimizeLineup(playerIds: number[]): Promise<{ analysis: TeamLineupAnalysis; selected_players: Player[] }> {
    const res = await fetch(`${API_BASE}/teams/optimize-lineup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ player_ids: playerIds })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to optimize lineup');
    }
    return res.json();
  },

  async saveLineup(teamId: number, name: string, playingXi: number[], battingOrder?: number[]): Promise<any> {
    const res = await fetch(`${API_BASE}/teams/lineups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({
        team_id: teamId,
        name,
        playing_xi: playingXi,
        batting_order: battingOrder
      })
    });
    if (!res.ok) throw new Error('Failed to save lineup');
    return res.json();
  },

  // Matches & Live Cricket
  async getMatches(status?: string): Promise<Match[]> {
    const url = new URL(`${window.location.origin}${API_BASE}/matches`);
    if (status) url.searchParams.set('status', status);
    const res = await fetch(url.toString(), { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch matches');
    return res.json();
  },

  async getMatchDetails(matchId: number): Promise<MatchDetailResponse> {
    const res = await fetch(`${API_BASE}/matches/${matchId}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch match details');
    return res.json();
  },

  async simulateLiveBall(matchId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/matches/live/simulate-ball/${matchId}`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to simulate live ball');
    return res.json();
  },

  // FieldIQ 3D Formations
  async getFieldFormations(): Promise<FieldFormation[]> {
    const res = await fetch(`${API_BASE}/field-formations`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch formations');
    return res.json();
  },

  async getTacticalRecommendation(phase: string, bowlerType: string, batterTendency: string): Promise<any> {
    const res = await fetch(`${API_BASE}/field-formations/recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({
        phase,
        bowler_type: bowlerType,
        batter_tendency: batterTendency
      })
    });
    if (!res.ok) throw new Error('Failed to fetch tactical recommendation');
    return res.json();
  },

  // Video Jobs (ShotSense, BallTrack, BowlVision, CricketVision)
  async uploadVideo(file: File, moduleType: string): Promise<VideoJob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('module_type', moduleType);

    const res = await fetch(`${API_BASE}/video-jobs/upload`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async runDemoVideoJob(moduleType: string): Promise<VideoJob> {
    const res = await fetch(`${API_BASE}/video-jobs/demo/${moduleType}`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to run demo job');
    return res.json();
  },

  async getVideoJob(jobId: number): Promise<VideoJob> {
    const res = await fetch(`${API_BASE}/video-jobs/jobs/${jobId}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch job');
    return res.json();
  },

  async getUserJobs(moduleType?: string): Promise<VideoJob[]> {
    const url = new URL(`${window.location.origin}${API_BASE}/video-jobs/user`);
    if (moduleType) url.searchParams.set('module_type', moduleType);
    const res = await fetch(url.toString(), { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch user jobs');
    return res.json();
  },

  // PitchPredict AI
  async analyzePitch(file?: File, venue: string = 'Melbourne Cricket Ground'): Promise<PitchAnalysis> {
    const formData = new FormData();
    if (file) formData.append('file', file);
    formData.append('venue', venue);

    const res = await fetch(`${API_BASE}/pitch/analyze`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData
    });
    if (!res.ok) throw new Error('Pitch analysis failed');
    return res.json();
  },

  async getPitchHistory(): Promise<PitchAnalysis[]> {
    const res = await fetch(`${API_BASE}/pitch/history`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch pitch history');
    return res.json();
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch(`${API_BASE}/notifications`, { headers: getAuthHeader() });
    if (!res.ok) return [];
    return res.json();
  },

  async markNotificationRead(id: number): Promise<void> {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeader()
    });
  }
};
