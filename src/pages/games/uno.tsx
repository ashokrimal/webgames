import { useState, useEffect } from 'react';
import { Trophy, Users, Play, Zap } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

interface UnoCard {
  id: string;
  color: 'red' | 'blue' | 'green' | 'yellow' | 'wild';
  value: string | number;
  type: 'number' | 'action' | 'wild';
}

interface UnoPlayer {
  id: string;
  username: string;
  cards: UnoCard[];
  isAI: boolean;
  isCurrentPlayer: boolean;
}

interface UnoGameState {
  deck: UnoCard[];
  discardPile: UnoCard[];
  players: UnoPlayer[];
  currentPlayer: number;
  direction: number;
  currentColor: 'red' | 'blue' | 'green' | 'yellow' | 'wild';
  selectedCard: UnoCard | null;
  wildColorSelection: string | null;
  gameStarted: boolean;
  winner: string | null;
  drawPileCount: number;
}

export const UnoGame = () => {
  const { currentRoom, socket, connected } = useSocket();
  const [gameState, setGameState] = useState<UnoGameState>({
    deck: [],
    discardPile: [],
    players: [],
    currentPlayer: 0,
    direction: 1,
    currentColor: 'red',
    selectedCard: null,
    wildColorSelection: null,
    gameStarted: false,
    winner: null,
    drawPileCount: 0
  });

  useEffect(() => {
    if (!socket || !connected) return;

    const handleGameState = (state: UnoGameState) => {
      setGameState(prev => ({ ...prev, ...state }));
    };

    socket.on('uno-game-state', handleGameState);

    return () => {
      socket.off('uno-game-state', handleGameState);
    };
  }, [socket, connected]);

  const startGame = () => {
    if (!socket) return;
    
    socket.emit('uno-start-game');
  };

  const playCard = (card: UnoCard) => {
    if (!socket) return;
    
    socket.emit('uno-play-card', { card });
  };

  const drawCard = () => {
    if (!socket) return;
    
    socket.emit('uno-draw-card');
  };

  const selectWildColor = (color: string) => {
    if (!socket) return;
    
    socket.emit('uno-select-wild-color', { color });
    };

  const getCardColor = (card: UnoCard): string => {
    switch (card.color) {
      case 'red': return 'bg-red-500';
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'wild': return 'bg-gradient-to-br from-red-500 via-blue-500 to-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCardDisplay = (card: UnoCard): string => {
    if (card.type === 'wild') {
      return card.value === 'wild4' ? '+4' : 'W';
    }
    
    if (card.type === 'action') {
      switch (card.value) {
        case 'skip': return '⊘';
        case 'reverse': return '↻';
        case 'draw2': return '+2';
        default: return card.value.toString();
      }
    }
    
    return card.value.toString();
  };

  const canPlayCard = (card: UnoCard): boolean => {
    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    if (!topCard) return false;
    
    if (card.type === 'wild') return true;
    if (card.color === gameState.currentColor) return true;
    if (card.color === 'wild' && gameState.currentColor !== 'wild') return true;
    if (card.value === topCard.value && card.type === topCard.type) return true;
    
    return false;
  };

  const renderCard = (card: UnoCard, index: number, isClickable: boolean = false) => {
    const isPlayable = isClickable && canPlayCard(card);
    const isSelected = gameState.selectedCard?.id === card.id;
    
    return (
      <div
        key={card.id}
        onClick={isClickable ? () => playCard(card) : undefined}
        className={`w-16 h-24 rounded-lg flex flex-col items-center justify-center transition-all transform hover:scale-105 ${
          isPlayable ? 'cursor-pointer hover:shadow-lg' : 'cursor-not-allowed opacity-50'
        } ${getCardColor(card)} ${isSelected ? 'ring-4 ring-blue-400 scale-110' : ''}`}
      >
        <div className="text-white font-bold text-lg">
          {getCardDisplay(card)}
        </div>
        {card.type === 'wild' && (
          <div className="w-8 h-8 rounded-full bg-white bg-opacity-30 mt-1">
            <div className="text-xs text-gray-800">WILD</div>
          </div>
        )}
      </div>
    );
  };

  const renderPlayerHand = (player: UnoPlayer) => {
    return (
      <div key={player.id} className="text-center">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="ml-2">
            <div className="font-semibold text-gray-800">{player.username}</div>
            {player.isAI && (
              <div className="text-xs text-blue-500">AI</div>
            )}
            <div className="text-sm text-gray-600">{player.cards.length} cards</div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-1">
          {player.cards.map((card, index) => renderCard(card, index, !player.isAI))}
        </div>
      </div>
    );
  };

  const renderGameBoard = () => {
    return (
      <div className="bg-green-800 rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          {/* Draw Pile */}
          <div className="text-center">
            <div className="w-20 h-28 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                 onClick={drawCard}
            >
              <div className="text-white font-bold text-2xl">UNO</div>
              <div className="text-xs text-gray-300">Draw Pile</div>
              <div className="text-lg text-white">{gameState.drawPileCount}</div>
            </div>
          </div>
          
          {/* Discard Pile */}
          <div className="text-center">
            <div className="w-20 h-28 rounded-lg flex items-center justify-center">
              {gameState.discardPile.length > 0 ? (
                renderCard(gameState.discardPile[gameState.discardPile.length - 1], 0, false)
              ) : (
                <div className="w-20 h-28 bg-gray-300 rounded-lg flex items-center justify-center border-2 border-dashed">
                  <div className="text-gray-500 text-4xl">?</div>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-300 mt-1">Discard Pile</div>
          </div>
        </div>
        
        {/* Current Color */}
        <div className="text-center mb-4">
          <div className="text-sm text-gray-600">Current Color:</div>
          <div className={`w-8 h-8 rounded-full ${getCardColor(gameState.currentColor)}`}></div>
        </div>
      </div>
    );
  };

  const renderWildColorSelection = () => {
    if (!gameState.wildColorSelection) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
          <h3 className="text-lg font-semibold mb-4">Choose Wild Card Color</h3>
          <div className="grid grid-cols-2 gap-4">
            {['red', 'blue', 'green', 'yellow'].map(color => (
              <button
                key={color}
                onClick={() => selectWildColor(color)}
                className={`w-16 h-16 rounded-lg ${getCardColor({ color, value: '0', type: 'number' })} hover:scale-105 transition-all`}
              >
                <div className="text-white font-bold text-2xl">{color.toUpperCase()}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!gameState.gameStarted) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8 text-gray-800">UNO</h1>
          <p className="text-lg text-gray-600 mb-6">Waiting for players to join...</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gameState.players.map(player => renderPlayerHand(player))}
          </div>
        </div>
      </div>
    );
  }

  if (gameState.winner) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">
            {gameState.winner} Wins!
          </h2>
          <p className="text-xl text-gray-600 mb-4">
            Congratulations to {gameState.winner}!
          </p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Play className="w-6 h-6 mr-2" />
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-yellow-500 to-green-500">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">UNO</h1>
          <p className="text-xl text-red-100">Fast-Paced Card Game</p>
        </div>
        
        {renderGameBoard()}
        
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gameState.players.map(player => renderPlayerHand(player))}
          </div>
        </div>
        
        {renderWildColorSelection()}
      </div>
    </div>
  );
};
