export type UserRole = 'admin' | 'coach' | 'player';

export interface User {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  full_name?: string;
  avatar_url?: string;
}

export interface Player {
  id: number;
  name: string;
  country: string;
  role: 'Batter' | 'Fast Bowler' | 'Spin Bowler' | 'All-Rounder' | 'Wicketkeeper';
  batting_style: string;
  bowling_style: string;
  matches: number;
  runs: number;
  batting_avg: number;
  strike_rate: number;
  wickets: number;
  bowling_avg: number;
  economy_rate: number;
  catches: number;
  stumpings: number;
  scout_score: number;
  form_index: number;
  profile_img?: string;
}

export interface Team {
  id: number;
  name: string;
  short_name: string;
  logo_url?: string;
  coach_name?: string;
  captain_player_id?: number;
}

export interface BallEvent {
  id: number;
  over: number;
  ball: number;
  batter_id: number;
  bowler_id: number;
  runs_scored: number;
  extras: number;
  is_wicket: boolean;
  wicket_type?: string;
  pitch_x: number;
  pitch_y: number;
  shot_zone: string;
  ball_speed_kph: number;
  commentary?: string;
}

export interface InningsData {
  id: number;
  innings_number: number;
  batting_team: { id: number; name: string; short_name: string };
  bowling_team: { id: number; name: string; short_name: string };
  total_runs: number;
  total_wickets: number;
  total_overs: number;
  is_completed: boolean;
  over_progression: {
    over: number;
    over_runs: number;
    wickets: number;
    cumulative_runs: number;
    cumulative_wickets: number;
    run_rate: number;
  }[];
  partnerships: {
    batter1: string;
    batter2: string;
    runs: number;
    balls: number;
  }[];
}

export interface Match {
  id: number;
  title: string;
  tournament: string;
  match_type: string;
  venue: string;
  date: string;
  status: 'upcoming' | 'live' | 'completed';
  team1_id: number;
  team2_id: number;
  toss_winner?: string;
  toss_decision?: string;
  winner_id?: number;
  win_margin?: string;
  current_innings: number;
  current_over: number;
  current_ball: number;
  required_rr: number;
  current_rr: number;
  is_demo: boolean;
  team1?: Team;
  team2?: Team;
}

export interface MatchDetailResponse {
  match: Match;
  innings: InningsData[];
  win_probability: Record<string, number>;
  projected_score: {
    current_rate: number;
    conservative: number;
    aggressive: number;
    par_score: number;
  };
  tactical_insights: string[];
}

export interface FielderPosition {
  id: number;
  name: string;
  role: string;
  x: number;
  z: number;
  label: string;
  sector?: string;
}

export interface FieldFormation {
  id: number;
  name: string;
  match_type: string;
  bowling_type: string;
  tactical_intent: string;
  positions_json: string;
  is_preset: boolean;
}

export interface TeamLineupAnalysis {
  is_valid: boolean;
  validation_errors: string[];
  balance_score: number;
  breakdown: {
    batting_depth: number;
    pace_rating: number;
    spin_rating: number;
    fielding_score: number;
    bowling_options_count: number;
    wicketkeepers_count: number;
  };
  suggested_batting_order: number[];
  explanation: string;
}

export interface VideoJob {
  id: number;
  user_id: number;
  module_type: 'shotsense' | 'balltrack' | 'bowlvision' | 'cricketvision';
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result_json?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface PitchAnalysis {
  id: number;
  user_id: number;
  pitch_type: string;
  moisture_level: number;
  crack_density: number;
  grass_coverage: number;
  pace_prediction: string;
  spin_prediction: string;
  bounce_prediction: string;
  toss_recommendation: string;
  weather_json?: string;
  observable_features_json?: string;
  image_path?: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  is_read: boolean;
  created_at: string;
}
