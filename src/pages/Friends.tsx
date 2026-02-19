import { useEffect, useMemo, useState } from 'react';
import { Check, Clock, Search, UserPlus, Users, X } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

export const Friends = () => {
  const {
    connected,
    error,
    friendsState,
    requestFriends,
    requestRecentPlayers,
    sendFriendRequest,
    respondFriendRequest
  } = useSocket();

  const [searchTerm, setSearchTerm] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    requestFriends();
    requestRecentPlayers();
  }, [requestFriends, requestRecentPlayers]);

  const friends = useMemo(() => friendsState?.friends || [], [friendsState]);
  const incoming = useMemo(() => friendsState?.requests.incoming || [], [friendsState]);
  const outgoing = useMemo(() => friendsState?.requests.outgoing || [], [friendsState]);
  const recent = useMemo(() => friendsState?.recent || [], [friendsState]);

  const filteredFriends = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => f.username.toLowerCase().includes(q));
  }, [friends, searchTerm]);

  const recentSuggestions = useMemo(() => {
    const q = username.trim().toLowerCase();
    if (!q) return recent;
    return recent.filter((r) => r.username.toLowerCase().includes(q));
  }, [recent, username]);

  const canRequest = useMemo(() => {
    const target = username.trim().toLowerCase();
    if (!target) return false;
    return recent.some((r) => r.username.toLowerCase() === target);
  }, [recent, username]);

  const handleSendRequest = () => {
    if (!canRequest) return;
    sendFriendRequest(username.trim());
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Friends</h1>
          <div className="text-sm text-gray-600">
            {connected ? 'Connected' : 'Connecting...'}
          </div>
        </div>

        {error && (
          <div className="card p-4 mb-6 border border-red-200 bg-red-50 text-red-900">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold text-gray-900">Add friend</div>
              <UserPlus className="h-5 w-5 text-gray-400" />
            </div>

            <div className="text-sm text-gray-600 mb-4">
              You can only send requests to players you played with in the last 24 hours.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  className="input w-full"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Type a username..."
                />
                {!canRequest && username.trim() && (
                  <div className="text-xs text-amber-700 mt-1">
                    Username must be from your recent players list.
                  </div>
                )}
              </div>

              <button
                className="btn-primary w-full inline-flex items-center justify-center"
                onClick={handleSendRequest}
                disabled={!connected || !canRequest}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Send request
              </button>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700">Suggestions (recent players)</div>
                  <div className="text-xs text-gray-500 inline-flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    24h
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-auto">
                  {recentSuggestions.map((r) => (
                    <button
                      key={r.userId}
                      className="w-full text-left border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
                      onClick={() => setUsername(r.username)}
                    >
                      <div className="font-semibold text-gray-900">{r.username}</div>
                      <div className="text-xs text-gray-600">Last played: {r.game || 'Game'}</div>
                    </button>
                  ))}
                  {recentSuggestions.length === 0 && (
                    <div className="text-sm text-gray-500">No recent players yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="text-lg font-semibold text-gray-900 mb-3">Friend requests</div>

            <div className="space-y-5">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Incoming</div>
                <div className="space-y-2">
                  {incoming.map((req) => (
                    <div key={req.id} className="border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{req.fromUsername}</div>
                        <div className="text-xs text-gray-500">Wants to be friends</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="btn-primary px-3 py-2 inline-flex items-center"
                          onClick={() => respondFriendRequest(req.id, true)}
                          disabled={!connected}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          className="btn-outline px-3 py-2 inline-flex items-center"
                          onClick={() => respondFriendRequest(req.id, false)}
                          disabled={!connected}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {incoming.length === 0 && <div className="text-sm text-gray-500">No incoming requests.</div>}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Outgoing</div>
                <div className="space-y-2">
                  {outgoing.map((req) => (
                    <div key={req.id} className="border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{req.toUsername}</div>
                        <div className="text-xs text-gray-500">Pending</div>
                      </div>
                      <div className="text-xs text-gray-500">Waiting</div>
                    </div>
                  ))}
                  {outgoing.length === 0 && <div className="text-sm text-gray-500">No outgoing requests.</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search friends..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredFriends.map((friend) => (
            <div key={friend.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div>
                    <div className="font-semibold text-gray-900">{friend.username}</div>
                    <div className="text-xs text-gray-500">Friend</div>
                  </div>
                </div>

                <div className="text-xs text-gray-500">Online status later</div>
              </div>
            </div>
          ))}
        </div>

        {filteredFriends.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No friends found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try a different search term' : 'Start adding friends to see them here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
