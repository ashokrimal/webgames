import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';

interface GameState {
  status: 'waiting' | 'playing' | 'finished';
  currentPlayer: number;
  players: any[];
  [key: string]: any;
}

interface Room {
  id: string;
  name: string;
  gameType: string;
  host: string;
  players: Array<{
    id: string;
    username: string;
    isHost: boolean;
    isReady: boolean;
    avatar?: string;
  }>;
  maxPlayers: number;
  isPrivate: boolean;
  inviteCode?: string;
  gameState: GameState;
  status: 'waiting' | 'playing' | 'finished';
}

interface RoomManagerState {
  currentRoom: Room | null;
  availableRooms: Room[];
  isLoading: boolean;
  error: string | null;
}

export const useRoomManager = () => {
  const { socket, connected } = useSocket();
  const [roomState, setRoomState] = useState<RoomManagerState>({
    currentRoom: null,
    availableRooms: [],
    isLoading: false,
    error: null
  });

  useEffect(() => {
    if (!socket || !connected) return;

    // Room events
    socket.on('room-created', (room: Room) => {
      setRoomState(prev => ({
        ...prev,
        currentRoom: room,
        availableRooms: [...prev.availableRooms, room]
      }));
    });

    socket.on('room-joined', (room: Room) => {
      setRoomState(prev => ({
        ...prev,
        currentRoom: room
      }));
    });

    socket.on('room-updated', (room: Room) => {
      setRoomState(prev => ({
        ...prev,
        currentRoom: room,
        availableRooms: prev.availableRooms.map(r => r.id === room.id ? room : r)
      }));
    });

    socket.on('room-left', () => {
      setRoomState(prev => ({
        ...prev,
        currentRoom: null
      }));
    });

    socket.on('rooms-list', (rooms: Room[]) => {
      setRoomState(prev => ({
        ...prev,
        availableRooms: rooms
      }));
    });

    socket.on('room-error', (error: string) => {
      setRoomState(prev => ({
        ...prev,
        error,
        isLoading: false
      }));
    });

    // Request initial rooms list
    socket.emit('get-rooms');

    return () => {
      socket.off('room-created');
      socket.off('room-joined');
      socket.off('room-updated');
      socket.off('room-left');
      socket.off('rooms-list');
      socket.off('room-error');
    };
  }, [socket, connected]);

  const createRoom = (roomData: {
    name: string;
    gameType: string;
    maxPlayers: number;
    isPrivate: boolean;
  }) => {
    if (!socket) return;

    setRoomState(prev => ({ ...prev, isLoading: true, error: null }));
    socket.emit('create-room', roomData);
  };

  const joinRoom = (roomId: string, inviteCode?: string) => {
    if (!socket) return;

    setRoomState(prev => ({ ...prev, isLoading: true, error: null }));
    socket.emit('join-room', { roomId, inviteCode });
  };

  const leaveRoom = () => {
    if (!socket) return;

    socket.emit('leave-room');
    setRoomState(prev => ({
      ...prev,
      currentRoom: null
    }));
  };

  const startGame = () => {
    if (!socket) return;

    socket.emit('start-game');
  };

  const refreshRooms = () => {
    if (!socket) return;

    socket.emit('get-rooms');
  };

  return {
    roomState,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    refreshRooms
  };
};
