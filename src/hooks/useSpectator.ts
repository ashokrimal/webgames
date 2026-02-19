import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';

export interface SpectatorState {
  isSpectating: boolean;
  targetRoomId?: string;
  targetGame?: string;
  spectators: Array<{ id: string; username: string }>;
}

export const useSpectator = () => {
  const { socket, connected, currentRoom } = useSocket();
  const [spectatorState, setSpectatorState] = useState<SpectatorState>({ isSpectating: false, spectators: [] });

  useEffect(() => {
    if (!socket || !connected) return;

    socket.on('spectate-joined', (data: { roomId: string; game: string; spectators: any[] }) => {
      setSpectatorState(prev => ({ ...prev, isSpectating: true, targetRoomId: data.roomId, targetGame: data.game, spectators: data.spectators }));
    });

    socket.on('spectate-left', () => {
      setSpectatorState({ isSpectating: false, spectators: [] });
    });

    socket.on('spectators-update', (spectators: any[]) => {
      setSpectatorState(prev => ({ ...prev, spectators }));
    });

    return () => {
      socket.off('spectate-joined');
      socket.off('spectate-left');
      socket.off('spectators-update');
    };
  }, [socket, connected]);

  const spectateRoom = (roomId: string) => {
    if (!socket || !connected) return;
    socket.emit('spectate-join', { roomId });
  };

  const leaveSpectate = () => {
    if (!socket || !connected) return;
    socket.emit('spectate-leave');
  };

  const inviteSpectator = (friendId: string) => {
    if (!socket || !connected || !currentRoom) return;
    socket.emit('spectate-invite', { roomId: currentRoom.id, friendId });
  };

  return { spectatorState, spectateRoom, leaveSpectate, inviteSpectator };
};
