import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useSocket } from '../hooks/useSocket';
import { Trophy, Clock, TrendingUp, Users } from 'lucide-react';
import { type GameSession } from '../hooks/useAnalytics';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface RoundEntry {
  game: string;
  roundData: unknown;
  timestamp: number;
}

export const Analytics = () => {
  const { socket, connected } = useSocket();
  const [analytics, setAnalytics] = useState<GameSession[]>([]);
  const [rounds, setRounds] = useState<RoundEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket || !connected) return;
    socket.emit('request-analytics');
    socket.on('analytics-data', (data: { sessions: GameSession[]; rounds: RoundEntry[] }) => {
      setAnalytics(data.sessions);
      setRounds(data.rounds);
      setLoading(false);
    });
    return () => { socket.off('analytics-data'); };
  }, [socket, connected]);

  const gamePopularity = useMemo(() => {
    return analytics.reduce((acc: Record<string, number>, s) => {
      acc[s.game] = (acc[s.game] || 0) + 1;
      return acc;
    }, {});
  }, [analytics]);

  const pieData = useMemo(() => {
    return Object.entries(gamePopularity).map(([game, count]) => ({ name: game, value: count }));
  }, [gamePopularity]);

  const totalSessions = analytics.length;
  const totalPlayTime = useMemo(() => analytics.reduce((sum, s) => sum + ((s.endTime || 0) - s.startTime), 0), [analytics]);
  const avgSession = totalSessions ? totalPlayTime / totalSessions : 0;

  const winRates = useMemo(() => {
    const gameResults: Record<string, { wins: number; losses: number; draws: number }> = {};
    
    analytics.forEach(s => {
      if (!s.result) return;
      if (!gameResults[s.game]) {
        gameResults[s.game] = { wins: 0, losses: 0, draws: 0 };
      }
      gameResults[s.game][s.result === 'win' ? 'wins' : s.result === 'loss' ? 'losses' : 'draws']++;
    });
    
    return Object.entries(gameResults).map(([game, results]) => {
      const total = results.wins + results.losses + results.draws;
      return {
        game,
        winRate: total > 0 ? Math.round((results.wins / total) * 100) : 0,
        totalGames: total,
        ...results
      };
    });
  }, [analytics]);

  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Update current time every minute to keep durations fresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const sessionLengths = useMemo(() => {
    return analytics
      .filter(s => s.endTime)
      .map(s => ({
        game: s.game,
        duration: Math.round(((s.endTime || 0) - s.startTime) / 60000), // minutes
        username: s.username
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
  }, [analytics]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Game Analytics</h1>

      {loading ? (
        <div className="text-center py-12">Loading analytics...</div>
      ) : (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{totalSessions}</div>
                  <div className="text-sm text-gray-600">Total Sessions</div>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{Math.round(avgSession / 60000)}m</div>
                  <div className="text-sm text-gray-600">Avg Session</div>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{rounds.length}</div>
                  <div className="text-sm text-gray-600">Rounds Played</div>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{new Set(analytics.map(s => s.userId)).size}</div>
                  <div className="text-sm text-gray-600">Unique Players</div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Game Popularity</h2>
              <PieChart width={400} height={300}>
                <Pie data={pieData} cx={200} cy={150} outerRadius={80} fill="#8884d8" dataKey="value" label>
                  {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Win Rates by Game</h2>
              <div className="space-y-3">
                {winRates.map(({ game, winRate, totalGames, wins, losses, draws }) => (
                  <div key={game} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">{game}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">{totalGames} games</span>
                      <span className="text-sm font-medium text-green-600">{winRate}% win rate</span>
                      <span className="text-xs text-gray-500">({wins}W-{losses}L-{draws}D)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Longest Sessions</h2>
              <div className="space-y-2">
                {sessionLengths.map((session: { game: string; duration: number; username: string }, index: number) => (
                  <div key={`${session.username}-${index}`} className="flex items-center justify-between p-2 border-b">
                    <span className="text-sm">{session.username}</span>
                    <span className="text-sm font-medium">{session.game}</span>
                    <span className="text-sm text-gray-600">{session.duration}m</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">User</th>
                    <th className="text-left py-2">Game</th>
                    <th className="text-left py-2">Duration</th>
                    <th className="text-left py-2">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.slice(-10).reverse().map(s => (
                    <tr key={`${s.userId}-${s.startTime}`} className="border-b">
                      <td className="py-2">{s.username}</td>
                      <td className="py-2">{s.game}</td>
                      <td className="py-2">{Math.round(((s.endTime || currentTime) - s.startTime) / 60000)}m</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          s.result === 'win' ? 'bg-green-100 text-green-800' :
                          s.result === 'loss' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {s.result || 'ongoing'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
