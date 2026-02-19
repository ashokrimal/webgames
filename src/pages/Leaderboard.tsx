import { useEffect, useMemo, useState } from 'react';
import { Crown, Medal, Trophy, Users } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

type LeaderboardScope = 'global' | 'friends' | 'region';

type LeaderboardRow = {
  userId: string;
  username: string;
  points: number;
};

const games = [
  { key: 'chess', name: 'Chess' },
  { key: 'drawing', name: 'Drawing Game' },
  { key: 'geoguessr', name: 'GeoGuessr' },
  { key: 'codenames', name: 'Codenames' },
  { key: 'garticphone', name: 'Gartic Phone' }
];

export const Leaderboard = () => {
  const { leaderboard, requestLeaderboard, friendsState, requestFriends } = useSocket();

  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [gameKey, setGameKey] = useState<string>('chess');
  const [region, setRegion] = useState<string>('');

  const selectedGameName = useMemo(() => {
    return games.find((g) => g.key === gameKey)?.name || 'Chess';
  }, [gameKey]);

  useEffect(() => {
    if (scope === 'friends' && !friendsState) requestFriends();

    if (scope === 'global') requestLeaderboard({ scope: 'global', game: selectedGameName });
    if (scope === 'friends') {
      const friendIds = (friendsState?.friends || []).map((f) => f.id);
      requestLeaderboard({ scope: 'friends', friendIds, game: selectedGameName });
    }
    if (scope === 'region') requestLeaderboard({ scope: 'region', region, game: selectedGameName });
  }, [scope, gameKey, region, requestLeaderboard, selectedGameName, friendsState, requestFriends]);

  const rows: LeaderboardRow[] = leaderboard?.rows || [];

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-600 mt-1">Points update in real-time (server memory).</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select className="input" value={gameKey} onChange={(e) => setGameKey(e.target.value)}>
            {games.map((g) => (
              <option key={g.key} value={g.key}>
                {g.name}
              </option>
            ))}
          </select>

          <select className="input" value={scope} onChange={(e) => setScope(e.target.value as LeaderboardScope)}>
            <option value="global">Global</option>
            <option value="friends">Friends</option>
            <option value="region">Region</option>
          </select>

          {scope === 'region' && (
            <input
              className="input"
              placeholder="Region (e.g. NP, US, EU)"
              value={region}
              onChange={(e) => setRegion(e.target.value.toUpperCase())}
            />
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="inline-flex items-center font-semibold text-gray-900">
            <Trophy className="h-5 w-5 mr-2 text-amber-500" />
            {scope === 'global' && `${selectedGameName} • Global`}
            {scope === 'friends' && (
              <span className="inline-flex items-center">
                <Users className="h-5 w-5 mr-2 text-sky-500" />
                {selectedGameName} • Friends
              </span>
            )}
            {scope === 'region' && `${selectedGameName} • Region ${region || '(unset)'}`}
          </div>
          <div className="text-sm text-gray-500">Higher points = higher rank</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-3 pr-4">#</th>
                <th className="py-3 pr-4">Player</th>
                <th className="py-3">Points</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="py-10 text-center text-gray-500" colSpan={3}>
                    No matches recorded yet.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;
                  return (
                    <tr
                      key={r.userId}
                      className={`border-b last:border-b-0 transition-colors hover:bg-gray-50 ${
                        isTop3 ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="py-3 pr-4 font-semibold text-gray-700">
                        <div className="inline-flex items-center">
                          {rank === 1 && <Crown className="h-4 w-4 mr-2 text-amber-600" />}
                          {rank === 2 && <Medal className="h-4 w-4 mr-2 text-gray-500" />}
                          {rank === 3 && <Medal className="h-4 w-4 mr-2 text-orange-600" />}
                          {rank > 3 && <span className="w-6 inline-block">{rank}</span>}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-900 font-semibold">{r.username}</td>
                      <td className="py-3 font-extrabold text-gray-900 tabular-nums">{r.points}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
