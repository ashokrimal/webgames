import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

interface AIPlayerState {
  isActive: boolean;
  isPlaying: boolean;
  currentTurn: boolean;
  aiPlayerId: string;
  aiPlayerName: string;
}

interface GameAction {
  type: string;
  payload: unknown;
  playerId?: string;
  timestamp: number;
}

export const useAIPlayer = (gameType: string) => {
  const { socket, connected, currentRoom } = useSocket();
  const [aiState, setAiState] = useState<AIPlayerState>({
    isActive: false,
    isPlaying: false,
    currentTurn: false,
    aiPlayerId: '',
    aiPlayerName: 'AI Player'
  });

  const activateAI = useCallback(() => {
    const timestamp = Date.now();
    const aiPlayerId = `ai-${gameType}-${timestamp}`;
    const aiPlayerName = `AI ${gameType}`;
    
    setAiState({
      isActive: true,
      isPlaying: true,
      currentTurn: false,
      aiPlayerId,
      aiPlayerName
    });

    if (socket) {
      socket.emit('ai-player-activate', {
        gameType,
        aiPlayerId,
        aiPlayerName
      });
    }
  }, [socket, gameType]);

  const deactivateAI = useCallback(() => {
    setAiState(prev => ({
      ...prev,
      isActive: false,
      isPlaying: false,
      currentTurn: false
    }));

    if (socket) {
      socket.emit('ai-player-deactivate', {
        gameType,
        aiPlayerId: aiState.aiPlayerId
      });
    }
  }, [socket, gameType, aiState.aiPlayerId]);

  const checkForDisconnectedPlayers = useCallback(() => {
    if (!currentRoom?.players) return false;
    
    const hasDisconnectedPlayers = currentRoom.players.some(p => !p.connected);
    const gameIsActive = currentRoom.gameState?.gameStarted || false;
    
    if (hasDisconnectedPlayers && gameIsActive && !aiState.isActive) {
      activateAI();
    } else if (!hasDisconnectedPlayers && aiState.isActive) {
      deactivateAI();
    }
  }, [currentRoom, aiState.isActive, activateAI]);

  useEffect(() => {
    if (!socket || !connected) return;

    const interval = setInterval(checkForDisconnectedPlayers, 2000);
    return () => clearInterval(interval);
  }, [socket, connected]);

  const makeAIMove = useCallback((gameState: any) => {
    if (!aiState.isActive || !socket) return;

    const action: GameAction = {
      type: `${gameType}-move`,
      payload: {},
      playerId: aiState.aiPlayerId,
      timestamp: Date.now()
    };

    socket.emit('game-action', action);
  }, [aiState.isActive, socket, gameType]);

  return {
    aiState,
    activateAI,
    deactivateAI,
    makeAIMove
  };
};
