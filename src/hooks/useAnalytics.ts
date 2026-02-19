import { useSocket } from './useSocket';

export interface GameSession {
  userId: string;
  username: string;
  game: string;
  roomId: string;
  startTime: number;
  endTime?: number;
  result?: 'win' | 'loss' | 'draw';
  score?: number;
  roundsPlayed?: number;
}

export interface GameStats {
  totalSessions: number;
  totalPlayTime: number; // ms
  wins: number;
  losses: number;
  draws: number;
  favoriteGame?: string;
  longestSession?: number; // ms
  currentStreak: number;
  bestStreak: number;
}

export const useAnalytics = () => {
  const { socket, connected } = useSocket();

  const startSession = (game: string, roomId: string) => {
    if (!socket || !connected) return;
    socket.emit('analytics-session-start', { game, roomId, timestamp: Date.now() });
  };

  const endSession = (data: Omit<GameSession, 'userId' | 'username' | 'startTime' | 'game' | 'roomId'>) => {
    if (!socket || !connected) return;
    socket.emit('analytics-session-end', { ...data, timestamp: Date.now() });
  };

  const trackRound = (game: string, roundData: any) => {
    if (!socket || !connected) return;
    socket.emit('analytics-round', { game, roundData, timestamp: Date.now() });
  };

  return { startSession, endSession, trackRound };
};
