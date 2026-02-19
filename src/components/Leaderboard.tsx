import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Users, TrendingUp } from 'lucide-react';
import { db, type User } from '../lib/database';
import { useAuth } from '../hooks/useAuth';

interface LeaderboardEntry extends User {
  rank: number;
  winRate: number;
  recentGames: number;
}

interface LeaderboardProps {
  gameType?: string;
  limit?: number;
  showFilters?: boolean;
}

export const Leaderboard = ({ gameType, limit = 50, showFilters = true }: LeaderboardProps) => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGameType, setSelectedGameType] = useState<string>(gameType || 'all');
  const [timeFrame, setTimeFrame] = useState<'all' | 'month' | 'week'>('all');

  useEffect(() => {
    loadLeaderboard();
  }, [selectedGameType, timeFrame]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await db.getLeaderboard(selectedGameType === 'all' ? undefined : selectedGameType, limit);

      // Transform data to include win rates and rankings
      const transformedData: LeaderboardEntry[] = data.map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1,
        winRate: entry.games_played > 0 ? (entry.games_won / entry.games_played) * 100 : 0,
        recentGames: entry.games_played // This would need to be filtered by time frame
      }));

      setLeaderboard(transformedData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default:
        return rank <= 10 ? 'bg-blue-50' : 'bg-white';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <Trophy className="w-8 h-8 mr-3" />
              Leaderboard
            </h2>
            <p className="text-blue-100 mt-1">
              {selectedGameType === 'all' ? 'Overall Rankings' : `${selectedGameType} Rankings`}
            </p>
          </div>
          {user && (
            <div className="text-right">
              <div className="text-sm text-blue-100">Your Rank</div>
              <div className="text-xl font-bold">
                #{leaderboard.find(entry => entry.id === user.id)?.rank || 'Unranked'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedGameType}
              onChange={(e) => setSelectedGameType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Games</option>
              <option value="chess">Chess</option>
              <option value="uno">UNO</option>
              <option value="bingo">Bingo</option>
              <option value="geoguessr">GeoGuessr</option>
              <option value="gartic-phone">Gartic Phone</option>
              <option value="guessword">Guess Word</option>
            </select>

            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value as 'all' | 'month' | 'week')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
            </select>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="divide-y divide-gray-200">
        {leaderboard.map((entry) => (
          <div
            key={entry.id}
            className={`p-4 hover:bg-gray-50 transition-colors ${
              entry.id === user?.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            }`}
          >
            <div className="flex items-center space-x-4">
              {/* Rank */}
              <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankStyle(entry.rank)}`}>
                {getRankIcon(entry.rank)}
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                {entry.avatar ? (
                  <img
                    src={entry.avatar}
                    alt={entry.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <Users className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-lg font-semibold text-gray-900 truncate">
                    {entry.username}
                    {entry.id === user?.id && (
                      <span className="ml-2 text-sm text-blue-600 font-normal">(You)</span>
                    )}
                  </p>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      entry.level >= 10 ? 'bg-purple-500' :
                      entry.level >= 5 ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                    <span className="text-sm text-gray-500">Lv.{entry.level}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center space-x-1">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">{entry.total_score.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">{entry.winRate.toFixed(1)}% WR</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">{entry.games_played} games</span>
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {entry.total_score.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">points</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {leaderboard.length === 0 && (
        <div className="p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No players yet</h3>
          <p className="text-gray-500">Be the first to play and claim the top spot!</p>
        </div>
      )}
    </div>
  );
};
