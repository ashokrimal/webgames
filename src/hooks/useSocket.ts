import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

interface GameRoom {
  id: string;
  name: string;
  game: string;
  host: string;
  hostId?: string;
  players: Array<{
    id: string;
    username: string;
    socketId: string;
  }>;
  maxPlayers: number;
  isPrivate: boolean;
  code?: string;
  gameState: unknown;
  createdAt: Date;
}

type LeaderboardRow = {
  userId: string;
  username: string;
  points: number;
};

type LeaderboardPayload = {
  scope: 'global' | 'game' | 'friends' | 'region';
  game?: string;
  region?: string;
  rows: LeaderboardRow[];
};

type BasicUser = {
  id: string;
  username: string;
};

type FriendRequest = {
  id: string;
  fromId: string;
  fromUsername: string;
  toId: string;
  toUsername: string;
  createdAt: number;
  status: 'pending' | 'accepted' | 'declined';
};

type FriendsState = {
  friends: BasicUser[];
  requests: {
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
  };
  recent: Array<{ userId: string; username: string; game?: string; lastSeenAt: number }>;
};

type GameActionPayload = {
  playerId: string;
  action: unknown;
  timestamp: number;
};

export const useSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<GameRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPayload | null>(null);
  const [friendsState, setFriendsState] = useState<FriendsState | null>(null);
  const [lastGameAction, setLastGameAction] = useState<GameActionPayload | null>(null);
  const [friendRequestNotification, setFriendRequestNotification] = useState<FriendRequest | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; username: string; message: string; timestamp: number }>>([]);

  // Wrap socket actions with loading state
  const setLoadingState = (fn: () => void) => {
    setLoading(true);
    fn();
    setTimeout(() => setLoading(false), 1000); // simple debounce
  };

  // Socket connection
  useEffect(() => {
    let newSocket: Socket | null = null;

    if (isAuthenticated && user) {
      newSocket = io('http://localhost:3002', {
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Connected to Socket.IO server');
        setConnected(true);
        setError(null);
        
        // Authenticate with user data
        if (newSocket) {
          newSocket.emit('authenticate', {
            id: user.id,
            username: user.username
          });
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
        setConnected(false);
        // Don't clear current room on disconnect - allow reconnection to restore state
      });

      newSocket.on('connect', () => {
        console.log('Connected to Socket.IO server');
        setConnected(true);
        setError(null);
        
        // Request current room state after reconnection
        if (currentRoom && newSocket) {
          console.log('Requesting room state after reconnection:', currentRoom.id);
          newSocket.emit('join-room', { roomId: currentRoom.id });
        }
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError('Failed to connect to game server');
        setConnected(false);
      });

      // Room events
      newSocket.on('rooms-available', (rooms: GameRoom[]) => {
        setAvailableRooms(rooms);
      });

      newSocket.on('room-created', (room: GameRoom) => {
        setCurrentRoom(room);
      });

      newSocket.on('room-joined', (room: GameRoom) => {
        setCurrentRoom(room);
      });

      newSocket.on('player-joined', (data: { player: unknown; room: GameRoom }) => {
        setCurrentRoom(data.room);
      });

      newSocket.on('player-left', (data: { playerId: string; room: GameRoom }) => {
        setCurrentRoom(data.room);
      });

      newSocket.on('room-updated', (room: GameRoom) => {
        setCurrentRoom(room);
      });

      newSocket.on('leaderboard', (payload: LeaderboardPayload) => {
        setLeaderboard(payload);
      });

      newSocket.on('game-action', (payload: GameActionPayload) => {
        setLastGameAction(payload);
      });

      newSocket.on('friends-state', (payload: FriendsState) => {
        setFriendsState(payload);
      });

      newSocket.on('chat-message', (message: { id: string; username: string; message: string; timestamp: number }) => {
        setChatHistory((prev) => [...prev.slice(-49), message]);
      });

      newSocket.on('chat-history', (history: Array<{ id: string; username: string; message: string; timestamp: number }>) => {
        setChatHistory(history);
      });

      newSocket.on('recent-players', (payload: { recent: FriendsState['recent'] }) => {
        setFriendsState((prev) => {
          if (!prev) return { friends: [], requests: { incoming: [], outgoing: [] }, recent: payload.recent };
          return { ...prev, recent: payload.recent };
        });
      });

      newSocket.on('friends-state-updated', (payload: { userId: string } & FriendsState) => {
        if (!user) return;
        if (payload.userId !== user.id) return;
        setFriendsState({ friends: payload.friends, requests: payload.requests, recent: payload.recent });
      });

      newSocket.on('friend-request-updated', (req: FriendRequest) => {
        if (!user) return;
        if (req.fromId !== user.id && req.toId !== user.id) return;
        if (req.status === 'pending' && req.toId === user.id) {
          setFriendRequestNotification(req);
          setTimeout(() => setFriendRequestNotification(null), 5000);
        }
        // Ask server for authoritative state (simpler)
        newSocket?.emit('request-friends');
      });

      newSocket.on('error', (errorMessage: string) => {
        setError(errorMessage);
        setTimeout(() => setError(null), 5000);
      });

      setTimeout(() => {
        setSocket(newSocket);
      }, 0);
    }

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [isAuthenticated, user, currentRoom]);

  // Handle socket cleanup when user logs out
  useEffect(() => {
    if (!isAuthenticated && socket) {
      socket.close();
      setTimeout(() => {
        setSocket(null);
        setConnected(false);
        setCurrentRoom(null);
        setAvailableRooms([]);
      }, 0);
    }
  }, [isAuthenticated, socket]);

  // Socket actions
  const createRoom = (roomData: {
    name: string;
    game: string;
    maxPlayers: number;
    isPrivate: boolean;
  }) => {
    setLoadingState(() => {
      if (socket && connected) {
        socket.emit('create-room', roomData);
      }
    });
  };

  const joinRoom = (roomId: string) => {
    setLoadingState(() => {
      if (socket && connected) {
        socket.emit('join-room', roomId);
      }
    });
  };

  const joinRoomByCode = (code: string) => {
    setLoadingState(() => {
      if (socket && connected) {
        socket.emit('join-room-by-code', { code });
      }
    });
  };

  const leaveRoom = () => {
    if (socket && connected) {
      socket.emit('leave-room');
      setCurrentRoom(null);
    }
  };

  const sendGameAction = (action: unknown) => {
    if (socket && connected && currentRoom) {
      socket.emit('game-action', action);
    }
  };

  const updateRoomSettings = (data: { roomId: string; isPrivate?: boolean; maxPlayers?: number; name?: string }) => {
    if (socket && connected) {
      socket.emit('update-room-settings', data);
    }
  };

  const requestLeaderboard = (data: { scope: 'global' | 'game' | 'friends' | 'region'; game?: string; friendIds?: string[]; region?: string }) => {
    if (socket && connected) {
      socket.emit('request-leaderboard', data);
    }
  };

  // Temporary utility until each game emits proper win/loss events.
  const awardPoints = (data: { userId: string; username: string; pointsDelta: number; game?: string; region?: string }) => {
    if (socket && connected) {
      socket.emit('award-points', data);
    }
  };

  const requestFriends = () => {
    if (socket && connected) {
      socket.emit('request-friends');
    }
  };

  const requestRecentPlayers = () => {
    if (socket && connected) {
      socket.emit('request-recent-players');
    }
  };

  const sendFriendRequest = (toUsername: string) => {
    if (socket && connected) {
      socket.emit('send-friend-request', { toUsername });
    }
  };

  const sendChatMessage = (message: string) => {
    if (socket && connected && currentRoom) {
      socket.emit('game-action', {
        type: 'chat-message',
        payload: { message }
      });
    }
  };

  const respondFriendRequest = (requestId: string, accept: boolean) => {
    if (socket && connected) {
      socket.emit('respond-friend-request', { requestId, accept });
    }
  };

  return {
    socket,
    connected,
    loading,
    availableRooms,
    currentRoom,
    error,
    leaderboard,
    friendsState,
    lastGameAction,
    friendRequestNotification,
    chatHistory,
    createRoom,
    joinRoom,
    joinRoomByCode,
    leaveRoom,
    sendGameAction,
    updateRoomSettings,
    requestLeaderboard,
    awardPoints,
    requestFriends,
    requestRecentPlayers,
    sendFriendRequest,
    sendChatMessage,
    respondFriendRequest
  };
};
