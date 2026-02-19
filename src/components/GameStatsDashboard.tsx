import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Trophy, Target, TrendingUp, Users, Clock, Award, Star, Zap } from 'lucide-react';
import { db, type User } from '../lib/database';
import { useAuth } from '../hooks/useAuth';

interface GameStats {
  game_type: string;
  games_played: number;
  games_won: number;
  total_score: number;
  win_rate: number;
  average_score: number;
  best_score: number;
  total_time: number;
}

interface UserStats {
  totalGames: number;
  totalWins: number;
  totalScore: number;
  averageScore: number;
  winRate: number;
  level: number;
  experience: number;
  achievements: number;
}

export const GameStatsDashboard = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load game-specific stats
      const stats = await db.getUserStats(user.id);
      setGameStats(stats);

      // Load recent games
      const recent = await db.getUserGameSessions(user.id, 10);
      setRecentGames(recent);

      // Calculate overall stats
      const totalGames = stats.reduce((sum, game) => sum + game.games_played, 0);
      const totalWins = stats.reduce((sum, game) => sum + game.games_won, 0);
      const totalScore = stats.reduce((sum, game) => sum + game.total_score, 0);
      const averageScore = totalGames > 0 ? totalScore / totalGames : 0;
      const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

      setUserStats({
        totalGames,
        totalWins,
        totalScore,
        averageScore,
        winRate,
        level: user.level,
        experience: user.experience,
        achievements: 0 // This would need to be loaded separately
      });

    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGameIcon = (gameType: string) => {
    const icons: Record<string, any> = {
      chess: Trophy,
      uno: Zap,
      bingo: Target,
      geoguessr: Star,
      'gartic-phone': Award,
      guessword: TrendingUp
    };
    return icons[gameType] || Users;
  };

  const getGameColor = (gameType: string) => {
    const colors: Record<string, string> = {
      chess: 'bg-blue-500',
      uno: 'bg-red-500',
      bingo: 'bg-purple-500',
      geoguessr: 'bg-green-500',
      'gartic-phone': 'bg-pink-500',
      guessword: 'bg-indigo-500'
    };
    return colors[gameType] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No stats available</h3>
        <p className="text-gray-500">Play some games to see your statistics!</p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = gameStats.map(stat => ({
    game: stat.game_type,
    wins: stat.games_won,
    losses: stat.games_played - stat.games_won,
    score: stat.total_score,
    winRate: stat.win_rate
  }));

  const pieData = gameStats.map(stat => ({
    name: stat.game_type,
    value: stat.games_played,
    color: getGameColor(stat.game_type).replace('bg-', '').replace('-500', '')
  }));

  const COLORS = ['#3b82f6', '#ef4444', '#8b5cf6', '#10b981', '#ec4899', '#6366f1'];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Games</p>
              <p className="text-3xl font-bold text-gray-900">{userStats.totalGames}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Win Rate</p>
              <p className="text-3xl font-bold text-gray-900">{userStats.winRate.toFixed(1)}%</p>
            </div>
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Score</p>
              <p className="text-3xl font-bold text-gray-900">{userStats.totalScore.toLocaleString()}</p>
            </div>
            <Target className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Level</p>
              <p className="text-3xl font-bold text-gray-900">{userStats.level}</p>
              <p className="text-sm text-gray-500">{userStats.experience} XP</p>
            </div>
            <Star className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win/Loss Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Performance by Game</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="game" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="wins" fill="#10b981" name="Wins" />
              <Bar dataKey="losses" fill="#ef4444" name="Losses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Game Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Games Played Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Game-specific Stats */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold">Game Statistics</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {gameStats.map((stat) => {
            const IconComponent = getGameIcon(stat.game_type);
            return (
              <div key={stat.game_type} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getGameColor(stat.game_type)}`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold capitalize">{stat.game_type}</h4>
                      <p className="text-sm text-gray-600">
                        {stat.games_played} games • {stat.win_rate.toFixed(1)}% win rate
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {stat.total_score.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">total score</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{stat.games_won}</div>
                    <div className="text-sm text-gray-600">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">
                      {stat.games_played - stat.games_won}
                    </div>
                    <div className="text-sm text-gray-600">Losses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {stat.average_score.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">
                      {stat.best_score}
                    </div>
                    <div className="text-sm text-gray-600">Best Score</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Games */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold">Recent Games</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentGames.slice(0, 5).map((game) => (
            <div key={game.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getGameColor(game.game_type)}`}>
                    {React.createElement(getGameIcon(game.game_type), { className: 'w-5 h-5 text-white' })}
                  </div>
                  <div>
                    <h4 className="font-semibold capitalize">{game.game_type}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(game.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      game.winner === user?.username ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {game.winner === user?.username ? 'Won' : 'Lost'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {Math.round(game.duration / 60)}m {game.duration % 60}s
                    </div>
                  </div>
                  <Trophy className={`w-5 h-5 ${
                    game.winner === user?.username ? 'text-yellow-500' : 'text-gray-300'
                  }`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {recentGames.length === 0 && (
          <div className="p-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No recent games</h3>
            <p className="text-gray-500">Play some games to see your history!</p>
          </div>
        )}
      </div>
    </div>
  );
};
