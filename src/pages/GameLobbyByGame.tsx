import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Globe, Lock, Play, Plus, Settings, UserPlus, Users, Eye } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { useSpectator } from '../hooks/useSpectator';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';
import { LobbyChat } from '../components/LobbyChat';

const gameKeyToName: Record<string, string> = {
  chess: 'Chess',
  drawing: 'Drawing Game',
  geoguessr: 'GeoGuessr',
  codenames: 'Codenames',
  garticphone: 'Gartic Phone'
};

export const GameLobbyByGame = () => {
  const { gameKey } = useParams();
  const gameName = (gameKey && gameKeyToName[gameKey]) || 'Game';

  const { user } = useAuth();

  const {
    connected,
    loading,
    availableRooms,
    currentRoom,
    error,
    createRoom,
    joinRoom,
    joinRoomByCode,
    updateRoomSettings,
    sendFriendRequest,
    friendsState
  } = useSocket();

  const { spectatorState, spectateRoom, leaveSpectate } = useSpectator();

  const [hostForm, setHostForm] = useState({
    name: '',
    maxPlayers: 2,
    isPrivate: false
  });

  const [privateCode, setPrivateCode] = useState('');

  const publicRooms = useMemo(() => {
    return availableRooms
      .filter((r) => r.game === gameName)
      .filter((r) => !r.isPrivate)
      .map((r) => ({
        id: r.id,
        name: r.name,
        host: r.host,
        players: r.players.length,
        maxPlayers: r.maxPlayers
      }));
  }, [availableRooms, gameName]);

  const isInThisGameRoom = currentRoom?.game === gameName;

  const isHost = Boolean(user && currentRoom && currentRoom.hostId && currentRoom.hostId === user.id);

  const theme = useMemo(() => {
    const themes: Record<string, { hero: string; card: string; accent: string; badge: string; primaryBtn: string; outlineBtn: string }> = {
      'Gartic Phone': {
        hero: 'from-fuchsia-600 via-purple-600 to-indigo-600',
        card: 'bg-white/90 border-white/40',
        accent: 'text-white',
        badge: 'bg-white/20 text-white',
        primaryBtn: 'bg-white text-purple-700 hover:bg-white/90',
        outlineBtn: 'border-white/40 text-white hover:bg-white/10'
      },
      Chess: {
        hero: 'from-slate-900 via-slate-800 to-zinc-900',
        card: 'bg-white/95 border-white/20',
        accent: 'text-white',
        badge: 'bg-white/10 text-white',
        primaryBtn: 'bg-white text-slate-900 hover:bg-white/90',
        outlineBtn: 'border-white/30 text-white hover:bg-white/10'
      },
      GeoGuessr: {
        hero: 'from-emerald-600 via-green-600 to-teal-600',
        card: 'bg-white/90 border-white/40',
        accent: 'text-white',
        badge: 'bg-white/20 text-white',
        primaryBtn: 'bg-white text-emerald-800 hover:bg-white/90',
        outlineBtn: 'border-white/40 text-white hover:bg-white/10'
      },
      Codenames: {
        hero: 'from-rose-600 via-red-600 to-blue-700',
        card: 'bg-white/90 border-white/40',
        accent: 'text-white',
        badge: 'bg-white/20 text-white',
        primaryBtn: 'bg-white text-red-700 hover:bg-white/90',
        outlineBtn: 'border-white/40 text-white hover:bg-white/10'
      },
      'Drawing Game': {
        hero: 'from-pink-600 via-rose-600 to-orange-500',
        card: 'bg-white/90 border-white/40',
        accent: 'text-white',
        badge: 'bg-white/20 text-white',
        primaryBtn: 'bg-white text-rose-700 hover:bg-white/90',
        outlineBtn: 'border-white/40 text-white hover:bg-white/10'
      }
    };

    return themes[gameName] || themes['Drawing Game'];
  }, [gameName]);

  const handleHost = () => {
    if (!hostForm.name.trim()) return;
    createRoom({
      name: hostForm.name,
      game: gameName,
      maxPlayers: hostForm.maxPlayers,
      isPrivate: hostForm.isPrivate
    });
  };

  const handleJoinPrivate = () => {
    if (!privateCode.trim()) return;
    joinRoomByCode(privateCode.trim());
  };

  const handleTogglePrivacy = () => {
    if (!currentRoom) return;
    updateRoomSettings({ roomId: currentRoom.id, isPrivate: !currentRoom.isPrivate });
  };

  const handleUpdateMaxPlayers = (value: number) => {
    if (!currentRoom) return;
    updateRoomSettings({ roomId: currentRoom.id, maxPlayers: value });
  };

  const handleUpdateName = (value: string) => {
    if (!currentRoom) return;
    updateRoomSettings({ roomId: currentRoom.id, name: value });
  };

  const gameRoute = useMemo(() => {
    const routes: Record<string, string> = {
      Chess: '/game/chess',
      'Drawing Game': '/game/drawing',
      GeoGuessr: '/game/geoguessr',
      Codenames: '/game/codenames',
      'Gartic Phone': '/game/garticphone'
    };
    return routes[gameName] || '/';
  }, [gameName]);

  return (
    <div>
      <div className={`bg-gradient-to-r ${theme.hero}`}>
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-start justify-between gap-6">
            <div className={theme.accent}>
              <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${theme.badge}`}>
                THE TELEPHONE GAME • HOST OR JOIN
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">{gameName}</h1>
              <p className="mt-3 text-white/90 max-w-2xl">
                Create a lobby and invite friends, or jump into a public room. Private rooms use a code.
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <Link to="/games" className={`px-4 py-2 rounded-lg border ${theme.outlineBtn}`}>
                Back to Games
              </Link>
              <div className={`text-xs ${theme.accent} opacity-90`}>
                {loading ? <LoadingSpinner size="sm" className="inline mr-1" /> : null}
                {connected ? 'Connected' : 'Connecting...'}
              </div>
            </div>
          </div>

          {error && <ErrorAlert message={error} onDismiss={() => {}} className="mt-6" />}

          {!connected && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Connecting to game server...
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {isInThisGameRoom && currentRoom && (
          <div className="card p-6 mb-8 border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="text-xs font-semibold text-gray-500">CURRENT LOBBY</div>
                <div className="text-2xl font-extrabold text-gray-900 mt-1">{currentRoom.name}</div>
                <div className="text-gray-600 mt-2">
                  Host: <span className="font-semibold">{currentRoom.host}</span> • Players:{' '}
                  <span className="font-semibold">{currentRoom.players.length}/{currentRoom.maxPlayers}</span> •{' '}
                  {currentRoom.isPrivate ? (
                    <span className="inline-flex items-center"><Lock className="h-4 w-4 mr-1" />Private</span>
                  ) : (
                    <span className="inline-flex items-center"><Globe className="h-4 w-4 mr-1" />Public</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Link to={gameRoute} className="btn-outline">
                  Leave Room
                </Link>
                {spectatorState.isSpectating && (
                  <button onClick={leaveSpectate} className="btn-outline">
                    Stop Spectating
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-gray-700">Players</div>
                <div className="text-xs text-gray-500">
                  {spectatorState.spectators.length > 0 && (
                    <span className="mr-4">Spectators: {spectatorState.spectators.map(s => s.username).join(', ')}</span>
                  )}
                  {currentRoom.players.length}/{currentRoom.maxPlayers}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentRoom.players.map((p) => {
                  const isMe = user && p.id === user.id;
                  const isHost = p.id === currentRoom.hostId;
                  const isFriend = friendsState?.friends.some(f => f.id === p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold">
                        {p.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {p.username}
                          {isHost && <span className="ml-1 text-xs bg-yellow-100 text-yellow-800 px-1 rounded">Host</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {!isMe && !isFriend && user ? (
                          <button
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                            onClick={() => sendFriendRequest(p.username)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add
                          </button>
                        ) : (
                          <div className="text-xs text-gray-500">{isMe ? '' : 'Friend'}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              <LobbyChat />
            </div>

            {isHost && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center font-semibold text-gray-900">
                    <Settings className="h-4 w-4 mr-2" />
                    Host settings
                  </div>
                  <div className="text-xs text-gray-500">Changes apply instantly</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lobby name</label>
                    <input
                      className="input w-full"
                      defaultValue={currentRoom.name}
                      onBlur={(e) => handleUpdateName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max players</label>
                    <input
                      type="number"
                      className="input w-full"
                      min={2}
                      max={12}
                      defaultValue={currentRoom.maxPlayers}
                      onBlur={(e) => handleUpdateMaxPlayers(Number(e.target.value))}
                    />
                    <div className="text-xs text-gray-500 mt-1">Cannot go below current players.</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lobby visibility</label>
                    <button
                      type="button"
                      onClick={handleTogglePrivacy}
                      className="btn-outline w-full px-4 py-2 inline-flex items-center justify-center"
                    >
                      {currentRoom.isPrivate ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Make Public
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4 mr-2" />
                          Make Private
                        </>
                      )}
                    </button>
                    <div className="text-xs text-gray-500 mt-1">Private = join by code.</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`rounded-2xl border p-6 shadow-sm ${theme.card}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-semibold text-gray-500">CREATE A ROOM</div>
                <div className="text-2xl font-extrabold text-gray-900">Host</div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gray-900/5 flex items-center justify-center">
                <Plus className="h-5 w-5 text-gray-700" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lobby name</label>
                <input
                  className="input w-full"
                  value={hostForm.name}
                  onChange={(e) => setHostForm({ ...hostForm, name: e.target.value })}
                  placeholder={`My ${gameName} room`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max players</label>
                  <input
                    type="number"
                    className="input w-full"
                    min={2}
                    max={12}
                    value={hostForm.maxPlayers}
                    onChange={(e) => setHostForm({ ...hostForm, maxPlayers: Number(e.target.value) })}
                  />
                </div>

                <div className="flex items-end">
                  <label className="w-full inline-flex items-center justify-between border border-gray-200 rounded-lg px-4 py-2 bg-white">
                    <span className="text-sm font-medium text-gray-700">Private</span>
                    <input
                      type="checkbox"
                      checked={hostForm.isPrivate}
                      onChange={(e) => setHostForm({ ...hostForm, isPrivate: e.target.checked })}
                    />
                  </label>
                </div>
              </div>

              <button
                className="btn-primary w-full px-5 py-3 inline-flex items-center justify-center"
                onClick={handleHost}
                disabled={!connected || !hostForm.name.trim() || loading}
              >
                {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Host lobby
              </button>

              <div className="text-xs text-gray-500">
                Tip: private lobbies generate a code you can share.
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-6 shadow-sm ${theme.card}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-semibold text-gray-500">ENTER A ROOM</div>
                <div className="text-2xl font-extrabold text-gray-900">Join</div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gray-900/5 flex items-center justify-center">
                <Play className="h-5 w-5 text-gray-700" />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700">Public rooms</div>
                  <div className="text-xs text-gray-500">Pick from the list</div>
                </div>

                <div className="space-y-3">
                  {publicRooms.map((r) => (
                    <div key={r.id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-white">
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-green-600" />
                          {r.name}
                        </div>
                        <div className="text-sm text-gray-600">Host: {r.host}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-600 inline-flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {r.players}/{r.maxPlayers}
                        </div>
                        <button
                          className="btn-outline px-3 py-2 inline-flex items-center"
                          onClick={() => spectateRoom(r.id)}
                          disabled={!connected || loading}
                          title="Spectate"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="btn-primary px-4 py-2 inline-flex items-center"
                          onClick={() => joinRoom(r.id)}
                          disabled={!connected || r.players >= r.maxPlayers || loading}
                        >
                          {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                          Join
                        </button>
                      </div>
                    </div>
                  ))}

                  {publicRooms.length === 0 && (
                    <div className="text-sm text-gray-500">No public rooms for {gameName} yet.</div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700">Private room</div>
                  <div className="text-xs text-gray-500">Join with a code</div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      className="input w-full font-mono tracking-widest"
                      placeholder="ABC123"
                      value={privateCode}
                      onChange={(e) => setPrivateCode(e.target.value.toUpperCase())}
                    />
                  </div>
                  <button
                    className="btn-outline px-4 py-2 inline-flex items-center"
                    onClick={handleJoinPrivate}
                    disabled={!connected || loading}
                  >
                    {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
