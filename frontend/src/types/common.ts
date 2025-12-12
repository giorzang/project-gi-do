import { Socket } from 'socket.io-client';

export interface User {
  id: string; 
  username: string;
  avatar_url: string;
  is_admin: number;
}

export interface MapData {
  map_key: string;      // de_mirage
  display_name: string; // Mirage
  image_url: string;
}

export interface VetoLog {
  team: 'TEAM1' | 'TEAM2';
  map: string;
  action: 'BAN' | 'PICK' | 'SIDE_PICK';
  side?: 'CT' | 'T'; // Chỉ có nếu action là SIDE_PICK
  time: string;
}

export interface Match {
  id: number;
  display_name: string;
  team1_name: string;
  team2_name: string;
  series_type: 'BO1' | 'BO3' | 'BO5';
  status: 'PENDING' | 'VETO' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  server_id: number;
  ip?: string;
  port?: number;
  user_id?: string;
  admin_name?: string;
  veto_log: VetoLog[] | null;
  map_result: string | null;
  winner_team?: string;
  team1_series_score?: number;
  team2_series_score?: number;
}

export interface Participant {
  match_id: number;
  user_id: string;
  team: 'TEAM1' | 'TEAM2' | 'SPECTATOR';
  username: string;
  avatar_url: string;
}

export interface MatchContextType {
    match: Match;
    participants: Participant[];
    socket: Socket | null;
    mapPool: MapData[];
    isAdmin: boolean;
    isLocked: boolean;
    handleJoin: (team: 'TEAM1' | 'TEAM2' | 'SPECTATOR') => Promise<void>;
    handleStartMatch: () => Promise<void>;
}
