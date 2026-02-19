import { createServer } from 'http';
import { Server } from 'socket.io';
import type { Socket as IOSocket } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Game rooms storage
const gameRooms = new Map<string, GameRoom>();
const playerSockets = new Map<string, Player>();

const lastChatAtBySocketId = new Map<string, number>();

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

type PointsEntry = {
  userId: string;
  username: string;
  points: number;
};

const globalPoints = new Map<string, PointsEntry>();
const gamePoints = new Map<string, Map<string, PointsEntry>>();
const regionPoints = new Map<string, Map<string, PointsEntry>>();

const upsertPoints = (data: { userId: string; username: string; pointsDelta: number; game?: string; region?: string }) => {
  const { userId, username, pointsDelta, game, region } = data;

  const current = globalPoints.get(userId) || { userId, username, points: 0 };
  current.username = username;
  current.points += pointsDelta;
  globalPoints.set(userId, current);

  if (game) {
    const perGame = gamePoints.get(game) || new Map<string, PointsEntry>();
    const gCurrent = perGame.get(userId) || { userId, username, points: 0 };
    gCurrent.username = username;
    gCurrent.points += pointsDelta;
    perGame.set(userId, gCurrent);
    gamePoints.set(game, perGame);
  }

  if (region) {
    const key = region.trim().toUpperCase();
    if (key) {
      const perRegion = regionPoints.get(key) || new Map<string, PointsEntry>();
      const rCurrent = perRegion.get(userId) || { userId, username, points: 0 };
      rCurrent.username = username;
      rCurrent.points += pointsDelta;
      perRegion.set(userId, rCurrent);
      regionPoints.set(key, perRegion);
    }
  }
};

const buildLeaderboardRows = (entries: Iterable<PointsEntry>) => {
  return Array.from(entries)
    .sort((a, b) => b.points - a.points)
    .map((e) => ({ userId: e.userId, username: e.username, points: e.points }));
};

type BasicUser = {
  id: string;
  username: string;
};

type RecentPlayer = {
  userId: string;
  username: string;
  game?: string;
  lastSeenAt: number;
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

const RECENT_TTL_MS = 24 * 60 * 60 * 1000;

const usersById = new Map<string, BasicUser>();
const userIdByUsername = new Map<string, string>();
const friendsByUserId = new Map<string, Set<string>>();
const friendRequests = new Map<string, FriendRequest>();

// userId -> (otherUserId -> RecentPlayer)
const recentPlayersByUserId = new Map<string, Map<string, RecentPlayer>>();

const now = () => Date.now();

const normalizeUsername = (u: string) => u.trim().toLowerCase();

const getFriendsSet = (userId: string) => {
  const existing = friendsByUserId.get(userId);
  if (existing) return existing;
  const created = new Set<string>();
  friendsByUserId.set(userId, created);
  return created;
};

const touchRecent = (a: BasicUser, b: BasicUser, game?: string) => {
  if (a.id === b.id) return;
  const ts = now();

  const mapA = recentPlayersByUserId.get(a.id) || new Map<string, RecentPlayer>();
  mapA.set(b.id, { userId: b.id, username: b.username, game, lastSeenAt: ts });
  recentPlayersByUserId.set(a.id, mapA);

  const mapB = recentPlayersByUserId.get(b.id) || new Map<string, RecentPlayer>();
  mapB.set(a.id, { userId: a.id, username: a.username, game, lastSeenAt: ts });
  recentPlayersByUserId.set(b.id, mapB);
};

const pruneRecent = (userId: string) => {
  const map = recentPlayersByUserId.get(userId);
  if (!map) return;
  const cutoff = now() - RECENT_TTL_MS;
  for (const [otherId, rec] of map.entries()) {
    if (rec.lastSeenAt < cutoff) map.delete(otherId);
  }
};

const listRecent = (userId: string) => {
  pruneRecent(userId);
  const map = recentPlayersByUserId.get(userId);
  if (!map) return [] as RecentPlayer[];
  return Array.from(map.values()).sort((a, b) => b.lastSeenAt - a.lastSeenAt);
};

const listFriendRequestsFor = (userId: string) => {
  const incoming: FriendRequest[] = [];
  const outgoing: FriendRequest[] = [];
  for (const req of friendRequests.values()) {
    if (req.status !== 'pending') continue;
    if (req.toId === userId) incoming.push(req);
    if (req.fromId === userId) outgoing.push(req);
  }
  incoming.sort((a, b) => b.createdAt - a.createdAt);
  outgoing.sort((a, b) => b.createdAt - a.createdAt);
  return { incoming, outgoing };
};

const listFriends = (userId: string) => {
  const set = getFriendsSet(userId);
  const out: BasicUser[] = [];
  for (const fid of set.values()) {
    const u = usersById.get(fid);
    if (u) out.push(u);
  }
  out.sort((a, b) => a.username.localeCompare(b.username));
  return out;
};

interface GameRoom {
  id: string;
  name: string;
  game: string;
  host: string;
  hostId: string;
  players: Array<{
    id: string;
    username: string;
    socketId: string;
  }>;
  maxPlayers: number;
  isPrivate: boolean;
  code?: string;
  gameState: unknown;
  chatHistory?: Array<{ id: string; username: string; message: string; timestamp: number }>;
  spectators?: Array<{ id: string; username: string }>;
  createdAt: Date;
}

interface Player {
  id: string;
  username: string;
  socketId: string;
  currentRoom?: string;
  isSpectator?: boolean;
  analyticsSession?: {
    userId: string;
    username: string;
    game: string;
    roomId: string;
    startTime: number;
  };
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  const joinRoomInternal = (roomId: string) => {
    const player = playerSockets.get(socket.id);
    const room = gameRooms.get(roomId);
    
    if (!player || !room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit('error', 'Room is full');
      return;
    }

    // Remove player from current room if they're in one
    if (player.currentRoom) {
      leaveCurrentRoom(socket);
    }

    // Add player to new room
    room.players.push(player);
    player.currentRoom = roomId;

    // Update recently-played for everyone in the room (24h window)
    const joiningUser = usersById.get(player.id);
    if (joiningUser) {
      for (const p of room.players) {
        if (p.id === joiningUser.id) continue;
        const otherUser = usersById.get(p.id);
        if (!otherUser) continue;
        touchRecent(joiningUser, otherUser, room.game);
      }

      // Push updated recent lists to affected sockets
      for (const p of room.players) {
        io.to(p.socketId).emit('recent-players', { recent: listRecent(p.id) });
      }
    }
    
    socket.join(roomId);
    socket.emit('room-joined', room);
    
    // Notify all players in the room
    io.to(roomId).emit('player-joined', {
      player: player,
      room: room
    });

    broadcastAvailableRooms();
  };

  // Handle player joining with authentication
  socket.on('authenticate', (userData: { id: string; username: string }) => {
    const player: Player = {
      id: userData.id,
      username: userData.username,
      socketId: socket.id
    };
    
    playerSockets.set(socket.id, player);
    console.log(`Player ${userData.username} authenticated`);

    // Track users for friend system
    const basic: BasicUser = { id: player.id, username: player.username };
    usersById.set(player.id, basic);
    userIdByUsername.set(normalizeUsername(player.username), player.id);

    // Send available rooms
    const availableRooms = Array.from(gameRooms.values()).filter(room => 
      !room.isPrivate && room.players.length < room.maxPlayers
    );
    socket.emit('rooms-available', availableRooms);

    // Provide initial friends + recent lists
    socket.emit('friends-state', {
      friends: listFriends(player.id),
      requests: listFriendRequestsFor(player.id),
      recent: listRecent(player.id)
    });
  });

  socket.on('request-recent-players', () => {
    const player = playerSockets.get(socket.id);
    if (!player) return;
    socket.emit('recent-players', { recent: listRecent(player.id) });
  });

  socket.on('request-friends', () => {
    const player = playerSockets.get(socket.id);
    if (!player) return;
    socket.emit('friends-state', {
      friends: listFriends(player.id),
      requests: listFriendRequestsFor(player.id),
      recent: listRecent(player.id)
    });
  });

  socket.on('send-friend-request', (data: { toUsername: string }) => {
    const player = playerSockets.get(socket.id);
    if (!player) return;

    const from = usersById.get(player.id);
    if (!from) return;

    const toUsername = String(data?.toUsername || '').trim();
    const toId = userIdByUsername.get(normalizeUsername(toUsername));
    if (!toId) {
      socket.emit('error', 'User not found');
      return;
    }
    if (toId === from.id) {
      socket.emit('error', 'Cannot add yourself');
      return;
    }

    // Must be recently played within 24h
    const recent = listRecent(from.id);
    const isRecent = recent.some((r) => r.userId === toId);
    if (!isRecent) {
      socket.emit('error', 'You can only add players you recently played with (24h).');
      return;
    }

    // Already friends?
    if (getFriendsSet(from.id).has(toId)) {
      socket.emit('error', 'Already friends');
      return;
    }

    // Existing pending request?
    for (const req of friendRequests.values()) {
      if (req.status !== 'pending') continue;
      const samePair = (req.fromId === from.id && req.toId === toId) || (req.fromId === toId && req.toId === from.id);
      if (samePair) {
        socket.emit('error', 'Friend request already pending');
        return;
      }
    }

    const to = usersById.get(toId);
    if (!to) {
      socket.emit('error', 'User not available');
      return;
    }

    const reqId = `fr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const req: FriendRequest = {
      id: reqId,
      fromId: from.id,
      fromUsername: from.username,
      toId: to.id,
      toUsername: to.username,
      createdAt: now(),
      status: 'pending'
    };
    friendRequests.set(reqId, req);

    // Notify both parties (broadcast to all; clients can filter by their userId)
    io.emit('friend-request-updated', req);
  });

  socket.on('respond-friend-request', (data: { requestId: string; accept: boolean }) => {
    const player = playerSockets.get(socket.id);
    if (!player) return;

    const req = friendRequests.get(data.requestId);
    if (!req || req.status !== 'pending') {
      socket.emit('error', 'Request not found');
      return;
    }

    // Only receiver can respond
    if (req.toId !== player.id) {
      socket.emit('error', 'Not allowed');
      return;
    }

    req.status = data.accept ? 'accepted' : 'declined';
    friendRequests.set(req.id, req);

    if (req.status === 'accepted') {
      getFriendsSet(req.fromId).add(req.toId);
      getFriendsSet(req.toId).add(req.fromId);
    }

    io.emit('friend-request-updated', req);

    // Send refreshed friend state to both sides (broadcast; clients filter by userId)
    io.emit('friends-state-updated', {
      userId: req.fromId,
      friends: listFriends(req.fromId),
      requests: listFriendRequestsFor(req.fromId),
      recent: listRecent(req.fromId)
    });
    io.emit('friends-state-updated', {
      userId: req.toId,
      friends: listFriends(req.toId),
      requests: listFriendRequestsFor(req.toId),
      recent: listRecent(req.toId)
    });
  });

  socket.on('award-points', (data: { userId: string; username: string; pointsDelta: number; game?: string; region?: string }) => {
    upsertPoints(data);

    // Broadcast global leaderboard updates to everyone.
    io.emit('leaderboard', {
      scope: 'global',
      rows: buildLeaderboardRows(globalPoints.values())
    });

    if (data.game) {
      const perGame = gamePoints.get(data.game);
      io.emit('leaderboard', {
        scope: 'game',
        game: data.game,
        rows: buildLeaderboardRows(perGame ? perGame.values() : [])
      });
    }

    if (data.region) {
      const key = data.region.trim().toUpperCase();
      const perRegion = regionPoints.get(key);
      io.emit('leaderboard', {
        scope: 'region',
        region: key,
        rows: buildLeaderboardRows(perRegion ? perRegion.values() : [])
      });
    }
  });

  socket.on('request-leaderboard', (data: { scope: 'global' | 'game' | 'friends' | 'region'; game?: string; friendIds?: string[]; region?: string }) => {
    if (data.scope === 'global') {
      socket.emit('leaderboard', {
        scope: 'global',
      });
      return;
    }

    // friends
    const friendIds = new Set<string>(data.friendIds || []);
    const friendRows = buildLeaderboardRows(
      Array.from(globalPoints.values()).filter((e) => friendIds.has(e.userId))
    );
    socket.emit('leaderboard', {
      scope: 'friends',
      rows: friendRows
    });
  });

  // Create a new game room
  socket.on('create-room', (roomData: {
    name: string;
    game: string;
    maxPlayers: number;
    isPrivate: boolean;
  }) => {
    const player = playerSockets.get(socket.id);
    if (!player) return;

    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const roomCode = roomData.isPrivate ? generateRoomCode() : undefined;
    
    const newRoom: GameRoom = {
      id: roomId,
      name: roomData.name,
      game: roomData.game,
      host: player.username,
      hostId: player.id,
      players: [player],
      maxPlayers: roomData.maxPlayers,
      isPrivate: roomData.isPrivate,
      code: roomCode,
      gameState: null,
      createdAt: new Date()
    };

    gameRooms.set(roomId, newRoom);
    player.currentRoom = roomId;

    socket.join(roomId);
    socket.emit('room-created', newRoom);
    
    // Broadcast updated room list
    broadcastAvailableRooms();
  });

  socket.on('join-room-by-code', (code: string) => {
    const player = playerSockets.get(socket.id);
    if (!player) return;

    const trimmed = String(code || '').trim().toUpperCase();
    if (!trimmed) {
      socket.emit('error', 'Invalid code');
      return;
    }

    const room = Array.from(gameRooms.values()).find((r) => r.code === trimmed);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    joinRoomInternal(room.id);
  });

  socket.on('update-room-settings', (data: { roomId: string; isPrivate?: boolean; maxPlayers?: number; name?: string }) => {
    const player = playerSockets.get(socket.id);
    if (!player) return;

    const room = gameRooms.get(data.roomId);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (room.hostId !== player.id) {
      socket.emit('error', 'Only host can change settings');
      return;
    }

    if (typeof data.name === 'string' && data.name.trim()) room.name = data.name.trim();
    if (typeof data.maxPlayers === 'number' && Number.isFinite(data.maxPlayers)) {
      room.maxPlayers = Math.max(2, Math.min(12, Math.floor(data.maxPlayers)));
      if (room.players.length > room.maxPlayers) {
        socket.emit('error', 'Max players cannot be less than current players');
      }
    }

    if (typeof data.isPrivate === 'boolean') {
      room.isPrivate = data.isPrivate;
      if (room.isPrivate && !room.code) room.code = generateRoomCode();
      if (!room.isPrivate) room.code = undefined;
    }

    gameRooms.set(room.id, room);
    io.to(room.id).emit('room-updated', room);
    broadcastAvailableRooms();
  });

  // Join an existing room
  socket.on('join-room', (roomId: string) => {
    const player = playerSockets.get(socket.id);
    if (!player) return;
    
    const room = gameRooms.get(roomId);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    
    // If player was already in this room, restore full state
    if (player.currentRoom === roomId) {
      console.log(`Player ${player.username} rejoining room ${roomId}, restoring state`);
      // Send current room state to rejoining player
      socket.emit('room-joined', room);
      socket.emit('room-updated', room);
      
      // Send current game state if it exists
      if (room.gameState) {
        socket.emit('game-action', {
          playerId: player.id,
          action: room.gameState,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    joinRoomInternal(roomId);
  });

  // Leave current room
  socket.on('leave-room', () => {
    leaveCurrentRoom(socket);
  });

  // Handle game-specific events
  socket.on('game-action', (data: unknown) => {
    const player = playerSockets.get(socket.id);
    if (!player || !player.currentRoom) return;

    const room = gameRooms.get(player.currentRoom);
    if (!room) return;

    const playerIndex = room.players.findIndex((p) => p.id === player.id);
    const isRoomHost = room.hostId === player.id;
    const isRoomPlayer = playerIndex >= 0;
    const isActivePlayer = playerIndex === 0 || playerIndex === 1;

    const action = data as { type?: string; fen?: string; payload?: unknown; canvasData?: string; guess?: string };
    if (!action || typeof action !== 'object') return;

    // Chess: broadcast FEN to room
    if (action.type === 'chess-fen' && typeof action.fen === 'string') {
      if (!isRoomPlayer || !isActivePlayer) return;
      io.to(player.currentRoom).emit('game-action', {
        playerId: player.id,
        action: { type: 'chess-fen', fen: action.fen },
        timestamp: Date.now()
      });
      return;
    }

    // Chess: broadcast full state (sanitized)
    if (action.type === 'chess-state' && action.payload && typeof action.payload === 'object') {
      if (!isRoomPlayer || !isActivePlayer) return;

      const payload = action.payload as {
        fen?: unknown;
        resultText?: unknown;
        drawOfferedBy?: unknown;
        resetId?: unknown;
        moveHistory?: unknown;
        undoRequest?: unknown;
        whiteTime?: unknown;
        blackTime?: unknown;
        clockEnabled?: unknown;
        clockRunning?: unknown;
      };

      if (typeof payload.fen !== 'string') return;

      // Only host can set/clear result & draw state and resetId.
      const outPayload: { fen: string; resultText?: string | null; drawOfferedBy?: string | null; resetId?: number; moveHistory?: string[]; undoRequest?: { playerId: string; moveIndex: number } | null; whiteTime?: number; blackTime?: number; clockEnabled?: boolean; clockRunning?: boolean } = {
        fen: payload.fen
      };
      if (isRoomHost) {
        if (typeof payload.resultText === 'string' || payload.resultText === null) outPayload.resultText = payload.resultText as string | null;
        if (typeof payload.drawOfferedBy === 'string' || payload.drawOfferedBy === null) outPayload.drawOfferedBy = payload.drawOfferedBy as string | null;
        if (typeof payload.resetId === 'number') outPayload.resetId = payload.resetId;
        if (Array.isArray(payload.moveHistory)) outPayload.moveHistory = payload.moveHistory;
        if (payload.undoRequest === null || (typeof payload.undoRequest === 'object' && payload.undoRequest && 'playerId' in payload.undoRequest && 'moveIndex' in payload.undoRequest && typeof payload.undoRequest.playerId === 'string' && typeof payload.undoRequest.moveIndex === 'number')) outPayload.undoRequest = payload.undoRequest as { playerId: string; moveIndex: number } | null;
        if (typeof payload.whiteTime === 'number') outPayload.whiteTime = payload.whiteTime;
        if (typeof payload.blackTime === 'number') outPayload.blackTime = payload.blackTime;
        if (typeof payload.clockEnabled === 'boolean') outPayload.clockEnabled = payload.clockEnabled;
        if (typeof payload.clockRunning === 'boolean') outPayload.clockRunning = payload.clockRunning;
      }
      
      // Store full chess state in room for reconnection resilience
      room.gameState = outPayload;

      io.to(player.currentRoom).emit('game-action', {
        playerId: player.id,
        action: { type: 'chess-state', payload: outPayload },
        timestamp: Date.now()
      });
      return;
    }

    // Chess: player-driven events (host will resolve)
    if (action.type === 'chess-event' && action.payload && typeof action.payload === 'object') {
      if (!isRoomPlayer || !isActivePlayer) return;

      const payload = action.payload as { kind?: unknown; playerId?: unknown };
      if (typeof payload.kind !== 'string') return;
      if (typeof payload.playerId !== 'string') return;
      if (payload.playerId !== player.id) return;

      if (payload.kind !== 'resign' && payload.kind !== 'draw-offer') return;

      // Broadcast the event to the room so the host can handle it.
      io.to(player.currentRoom).emit('game-action', {
        playerId: player.id,
        action: { type: 'chess-event', payload: { kind: payload.kind, playerId: payload.playerId } },
        timestamp: Date.now()
      });
      return;
    }

    // Drawing: broadcast state, canvas, and handle guesses
    if (action.type === 'drawing-state' && action.payload) {
      if (!isRoomPlayer) return;
      if (!isRoomHost) return;
      if (typeof action.payload !== 'object') return;
      room.gameState = action.payload;
      io.to(player.currentRoom).emit('game-action', {
        playerId: player.id,
        action: { type: 'drawing-state', payload: action.payload },
        timestamp: Date.now()
      });
      return;
    }
    if (action.type === 'drawing-canvas' && typeof action.canvasData === 'string') {
      if (!isRoomPlayer) return;
      if (action.canvasData.length > 2_000_000) return;
      const drawingState = room.gameState as { drawerId?: unknown } | undefined;
      if (!drawingState || typeof drawingState.drawerId !== 'string') return;
      if (drawingState.drawerId !== player.id) return;

      socket.broadcast.to(player.currentRoom).emit('game-action', {
        playerId: player.id,
        action: { type: 'drawing-canvas', canvasData: action.canvasData },
        timestamp: Date.now()
      });
      return;
    }
    if (action.type === 'drawing-guess' && typeof action.guess === 'string') {
      if (!isRoomPlayer) return;
      const drawingState = (room.gameState as { word?: string; guesses?: unknown[]; drawerId?: string }) || { guesses: [] };
      if (drawingState.drawerId && drawingState.drawerId === player.id) return;

      const rawGuess = action.guess.trim();
      if (!rawGuess) return;
      if (rawGuess.length > 60) return;

      const normalizedGuess = rawGuess.toLowerCase().trim();
      const normalizedWord = (drawingState.word || '').toLowerCase().trim();
      const correct = normalizedGuess === normalizedWord && normalizedWord !== '';
      const guessEntry = {
        playerId: player.id,
        username: player.username,
        guess: rawGuess,
        correct
      };
      drawingState.guesses = [...(drawingState.guesses || []), guessEntry];
      room.gameState = drawingState;
      io.to(player.currentRoom).emit('game-action', {
        playerId: player.id,
        action: { type: 'drawing-state', payload: drawingState },
        timestamp: Date.now()
      });
      return;
    }

    // Gartic Phone: broadcast state
    if (action.type === 'garticphone-state' && action.payload) {
      if (!isRoomPlayer) return;
      if (typeof action.payload !== 'object') return;

      const existing = room.gameState as { currentTurnIndex?: unknown } | undefined;
      const existingTurn = typeof existing?.currentTurnIndex === 'number' ? existing.currentTurnIndex : undefined;
      const currentTurnPlayerId = existingTurn !== undefined ? room.players[existingTurn]?.id : undefined;
      const canUpdate = isRoomHost || (currentTurnPlayerId && currentTurnPlayerId === player.id);
      if (!canUpdate) return;

      const payload = action.payload as {
        phase?: unknown;
        currentRound?: unknown;
        maxRounds?: unknown;
        currentTurnIndex?: unknown;
        chains?: unknown;
      };
      if (typeof payload.phase !== 'string') return;
      if (typeof payload.currentRound !== 'number') return;
      if (typeof payload.maxRounds !== 'number') return;
      if (typeof payload.currentTurnIndex !== 'number') return;
      if (!Array.isArray(payload.chains)) return;

      room.gameState = action.payload;
      io.to(player.currentRoom).emit('game-action', {
        playerId: player.id,
        action: { type: 'garticphone-state', payload: action.payload },
        timestamp: Date.now()
      });
      return;
    }

    // GeoGuessr: broadcast state
    if (action.type === 'geoguessr-state' && action.payload) {
      if (!isRoomPlayer) return;
      if (!action.payload || typeof action.payload !== 'object') return;

      type GeoLocation = { name: string; lat: number; lng: number; imageUrl: string; hint?: string };
      type GeoGuess = { playerId: string; username: string; lat: number; lng: number; distanceKm: number; points: number };
      type GeoTotals = Record<string, { username: string; points: number }>;
      type GeoState = {
        phase?: 'waiting' | 'guessing' | 'reveal' | 'ended';
        round: number;
        maxRounds: number;
        currentLocation?: GeoLocation;
        guesses: GeoGuess[];
        totals?: GeoTotals;
        awardedRounds?: number[];
        timeLeft?: number;
        gameEnded?: boolean;
        revealTimeLeft?: number;
        roundDurationSeconds?: number;
        hint?: string;
      };

      const existing = room.gameState as GeoState | undefined;

      const readGuess = (g: unknown): GeoGuess | null => {
        if (!g || typeof g !== 'object') return null;
        const gg = g as Partial<Record<string, unknown>>;
        if (typeof gg.playerId !== 'string') return null;
        if (typeof gg.username !== 'string') return null;
        if (typeof gg.lat !== 'number') return null;
        if (typeof gg.lng !== 'number') return null;
        if (typeof gg.distanceKm !== 'number') return null;
        if (typeof gg.points !== 'number') return null;
        return {
          playerId: gg.playerId,
          username: gg.username,
          lat: gg.lat,
          lng: gg.lng,
          distanceKm: gg.distanceKm,
          points: gg.points
        };
      };

      if (!isRoomHost) {
        // Non-host can only upsert their own guess into an existing state
        if (!existing || !Array.isArray(existing.guesses)) return;
        const payload = action.payload as { guesses?: unknown };
        if (!Array.isArray(payload.guesses)) return;
        const my = payload.guesses.map(readGuess).find((g) => g?.playerId === player.id) || null;
        if (!my) return;
        if (my.username !== player.username) return;

        const nextGuesses = existing.guesses.filter((g) => g.playerId !== player.id).concat(my);
        const nextState: GeoState = { ...existing, guesses: nextGuesses };
        room.gameState = nextState;
        io.to(player.currentRoom).emit('game-action', {
          playerId: player.id,
          action: { type: 'geoguessr-state', payload: nextState },
          timestamp: Date.now()
        });
        return;
      }

      // Host may update full state, but sanitize
      const p = action.payload as Partial<Record<string, unknown>>;
      const round = typeof p.round === 'number' ? p.round : existing?.round;
      const maxRounds = typeof p.maxRounds === 'number' ? p.maxRounds : existing?.maxRounds;
      const guessesRaw = Array.isArray(p.guesses) ? p.guesses : existing?.guesses;

      if (typeof round !== 'number' || typeof maxRounds !== 'number' || !Array.isArray(guessesRaw)) return;

      const guesses: GeoGuess[] = guessesRaw.map(readGuess).filter((g): g is GeoGuess => Boolean(g));

      let currentLocation: GeoLocation | undefined = existing?.currentLocation;
      if (p.currentLocation && typeof p.currentLocation === 'object') {
        const cl = p.currentLocation as Partial<Record<string, unknown>>;
        if (
          typeof cl.name === 'string' &&
          typeof cl.lat === 'number' &&
          typeof cl.lng === 'number' &&
          typeof cl.imageUrl === 'string'
        ) {
          currentLocation = {
            name: cl.name,
            lat: cl.lat,
            lng: cl.lng,
            imageUrl: cl.imageUrl,
            ...(typeof cl.hint === 'string' ? { hint: cl.hint } : {})
          };
        }
      }

      let phase: GeoState['phase'] = existing?.phase;
      if (p.phase === 'waiting' || p.phase === 'guessing' || p.phase === 'reveal' || p.phase === 'ended') {
        phase = p.phase;
      }

      let totals: GeoTotals | undefined = existing?.totals;
      if (p.totals && typeof p.totals === 'object') {
        const maybeTotals = p.totals as Record<string, unknown>;
        const nextTotals: GeoTotals = {};
        for (const [pid, entry] of Object.entries(maybeTotals)) {
          if (!entry || typeof entry !== 'object') continue;
          const e = entry as Record<string, unknown>;
          if (typeof e.username !== 'string') continue;
          if (typeof e.points !== 'number') continue;
          nextTotals[pid] = { username: e.username, points: e.points };
        }
        totals = nextTotals;
      }

      let awardedRounds: number[] | undefined = existing?.awardedRounds;
      if (Array.isArray(p.awardedRounds)) {
        const next = p.awardedRounds.filter((n) => typeof n === 'number') as number[];
        awardedRounds = next;
      }

      let revealTimeLeft: number | undefined = existing?.revealTimeLeft;
      if (typeof p.revealTimeLeft === 'number') {
        revealTimeLeft = p.revealTimeLeft;
      }

      let roundDurationSeconds: number | undefined = existing?.roundDurationSeconds;
      if (typeof p.roundDurationSeconds === 'number') {
        roundDurationSeconds = p.roundDurationSeconds;
      }

      let hint: string | undefined = existing?.hint;
      if (typeof p.hint === 'string') {
        hint = p.hint;
      }

      const nextState: GeoState = {
        round,
        maxRounds,
        guesses,
        ...(phase ? { phase } : {}),
        ...(currentLocation ? { currentLocation } : {}),
        ...(totals ? { totals } : {}),
        ...(awardedRounds ? { awardedRounds } : {}),
        ...(typeof revealTimeLeft === 'number' ? { revealTimeLeft } : existing?.revealTimeLeft !== undefined ? { revealTimeLeft: existing.revealTimeLeft } : {}),
        ...(typeof roundDurationSeconds === 'number' ? { roundDurationSeconds } : existing?.roundDurationSeconds !== undefined ? { roundDurationSeconds: existing.roundDurationSeconds } : {}),
        ...(typeof hint === 'string' ? { hint } : existing?.hint !== undefined ? { hint: existing.hint } : {}),
        ...(typeof p.timeLeft === 'number' ? { timeLeft: p.timeLeft } : existing?.timeLeft !== undefined ? { timeLeft: existing.timeLeft } : {}),
        ...(typeof p.gameEnded === 'boolean' ? { gameEnded: p.gameEnded } : existing?.gameEnded !== undefined ? { gameEnded: existing.gameEnded } : {})
      };

      room.gameState = nextState;
      io.to(player.currentRoom).emit('game-action', {
        playerId: player.id,
        action: { type: 'geoguessr-state', payload: nextState },
        timestamp: Date.now()
      });
      return;
    }

    // Codenames: broadcast state
    if (action.type === 'codenames-state' && action.payload) {
      room.gameState = action.payload;
      io.to(player.currentRoom).emit('game-action', {
        playerId: player.id,
        action: { type: 'codenames-state', payload: action.payload },
        timestamp: Date.now()
      });
      return;
    }

    // Chat: broadcast message to room
    if (action.type === 'chat-message' && action.payload && typeof action.payload === 'object' && typeof (action.payload as { message?: unknown }).message === 'string') {
      const raw = (action.payload as { message: string }).message;
      const trimmed = raw.trim();
      if (!trimmed) return;
      if (trimmed.length > 300) return;

      const lastAt = lastChatAtBySocketId.get(socket.id) || 0;
      const t = Date.now();
      if (t - lastAt < 800) return;
      lastChatAtBySocketId.set(socket.id, t);

      const message = {
        id: `${Date.now()}-${Math.random()}`,
        username: player.username,
        message: trimmed,
        timestamp: Date.now()
      };
      io.to(player.currentRoom).emit('chat-message', message);
      // Store last 50 messages in room
      if (!room.chatHistory) room.chatHistory = [];
      room.chatHistory.push(message);
      if (room.chatHistory.length > 50) room.chatHistory.shift();
      return;
    }

    // Spectate: join room as spectator
    if (action.type === 'spectate-join') {
      if (!action.payload || typeof action.payload !== 'object') return;
      const roomId = (action.payload as { roomId?: unknown }).roomId;
      if (typeof roomId !== 'string') return;
      const targetRoom = gameRooms.get(roomId);
      if (!targetRoom) return;

      // Prevent spectating while being an active room player
      if (player.currentRoom && !player.isSpectator) return;

      // If already spectating this room, just re-send state
      if (player.currentRoom === roomId && player.isSpectator) {
        socket.emit('spectate-joined', {
          roomId: targetRoom.id,
          game: targetRoom.game,
          spectators: targetRoom.spectators || []
        });
        if (targetRoom.chatHistory) socket.emit('chat-history', targetRoom.chatHistory);
        return;
      }

      // If switching spectator rooms, remove from previous room spectators list
      if (player.currentRoom && player.isSpectator) {
        const prevRoomId = player.currentRoom;
        const prevRoom = gameRooms.get(prevRoomId);
        if (prevRoom?.spectators) {
          prevRoom.spectators = prevRoom.spectators.filter((s) => s.id !== player.id);
          io.to(prevRoomId).emit('spectators-update', prevRoom.spectators);
        }
        socket.leave(prevRoomId);
      }

      player.currentRoom = roomId;
      player.isSpectator = true;
      socket.join(roomId);

      if (!targetRoom.spectators) targetRoom.spectators = [];
      if (!targetRoom.spectators.some((s) => s.id === player.id)) {
        targetRoom.spectators.push({ id: player.id, username: player.username });
      }

      socket.emit('spectate-joined', {
        roomId: targetRoom.id,
        game: targetRoom.game,
        spectators: targetRoom.spectators
      });
      if (targetRoom.chatHistory) socket.emit('chat-history', targetRoom.chatHistory);

      io.to(roomId).emit('spectators-update', targetRoom.spectators);
      return;
    }

    // Spectate: leave
    if (action.type === 'spectate-leave') {
      if (player.currentRoom && player.isSpectator) {
        const targetRoom = gameRooms.get(player.currentRoom);
        if (targetRoom && targetRoom.spectators) {
          targetRoom.spectators = targetRoom.spectators.filter((s) => s.id !== player.id);
          io.to(player.currentRoom).emit('spectators-update', targetRoom.spectators);
        }
        socket.leave(player.currentRoom);
        socket.emit('spectate-left');
        player.currentRoom = undefined;
        player.isSpectator = false;
      }
      return;
    }

    // Analytics: session start
    if (action.type === 'analytics-session-start') {
      if (!action.payload || typeof action.payload !== 'object') return;
      const payload = action.payload as { game?: unknown; roomId?: unknown; timestamp?: unknown };
      if (typeof payload.game !== 'string') return;
      if (typeof payload.roomId !== 'string') return;
      if (typeof payload.timestamp !== 'number') return;
      player.analyticsSession = {
        userId: player.id,
        username: player.username,
        game: payload.game,
        roomId: payload.roomId,
        startTime: payload.timestamp
      };
      return;
    }

    // Analytics: session end
    if (action.type === 'analytics-session-end') {
      if (!action.payload || typeof action.payload !== 'object') return;
      const payload = action.payload as { timestamp?: unknown; result?: unknown };
      if (typeof payload.timestamp !== 'number') return;
      if (player.analyticsSession) {
        const session = {
          ...player.analyticsSession,
          endTime: payload.timestamp,
          ...(typeof action.payload === 'object' ? action.payload : {})
        };
        // Store in analytics (in-memory for now)
        const g = globalThis as unknown as { analytics?: unknown[] };
        if (!g.analytics) g.analytics = [];
        g.analytics.push(session);
        player.analyticsSession = undefined;
      }
      return;
    }

    // Analytics: round
    if (action.type === 'analytics-round') {
      if (!action.payload || typeof action.payload !== 'object') return;
      const payload = action.payload as { game?: unknown; roundData?: unknown; timestamp?: unknown };
      if (typeof payload.game !== 'string') return;
      if (typeof payload.timestamp !== 'number') return;
      const g = globalThis as unknown as { analyticsRounds?: unknown[] };
      if (!g.analyticsRounds) g.analyticsRounds = [];
      g.analyticsRounds.push({
        game: payload.game,
        roundData: payload.roundData,
        timestamp: payload.timestamp
      });
      return;
    }
    socket.to(player.currentRoom).emit('game-action', {
      playerId: player.id,
      action: data,
      timestamp: Date.now()
    });
  });

  // Analytics endpoint
  socket.on('request-analytics', () => {
    const g = globalThis as unknown as { analytics?: unknown[]; analyticsRounds?: unknown[] };
    socket.emit('analytics-data', {
      sessions: g.analytics || [],
      rounds: g.analyticsRounds || []
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    lastChatAtBySocketId.delete(socket.id);
    const player = playerSockets.get(socket.id);
    
    if (player) {
      leaveCurrentRoom(socket);
      playerSockets.delete(socket.id);
    }
  });

  // Helper function to leave current room
  function leaveCurrentRoom(socket: IOSocket) {
    const player = playerSockets.get(socket.id);
    if (!player || !player.currentRoom) return;

    const room = gameRooms.get(player.currentRoom);
    if (!room) return;

    // Remove player from room
    room.players = room.players.filter((p) => p.id !== player.id);
    
    // If room is empty, delete it
    if (room.players.length === 0) {
      gameRooms.delete(player.currentRoom);
    } else {
      // Notify remaining players
      io.to(player.currentRoom).emit('player-left', {
        playerId: player.id,
        room: room
      });
    }

    socket.leave(player.currentRoom);
    player.currentRoom = undefined;

    broadcastAvailableRooms();
  }

  // Helper function to broadcast available rooms
  function broadcastAvailableRooms() {
    const availableRooms = Array.from(gameRooms.values()).filter(room => 
      !room.isPrivate && room.players.length < room.maxPlayers
    );
    io.emit('rooms-available', availableRooms);
  }
});

const PORT = process.env.SOCKET_PORT || 3002;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
