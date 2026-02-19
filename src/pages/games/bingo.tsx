import { useState, useEffect } from 'react';
import { Trophy, Users, Target, Award, Zap } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

interface BingoCard {
  id: string;
  number: number;
  marked: boolean;
}

interface BingoPlayer {
  id: string;
  username: string;
  cards: BingoCard[];
  isAI: boolean;
  isCurrentPlayer: boolean;
}

interface BingoState {
  gridSize: number;
  players: BingoPlayer[];
  currentPlayer: number;
  calledNumbers: number[];
  gameStatus: 'waiting' | 'playing' | 'bingo' | 'game-over';
  winner: string | null;
  selectedCard: BingoCard | null;
  roundNumber: number;
  isMyTurn: boolean;
  timeLeft: number;
}

export const BingoGame = () => {
  const { currentRoom, socket, connected } = useSocket();
  const [gameState, setGameState] = useState<BingoState>({
    gridSize: 25,
    players: [],
    currentPlayer: 0,
    calledNumbers: [],
    gameStatus: 'waiting',
    winner: null,
    selectedCard: null,
    roundNumber: 1,
    isMyTurn: false,
    timeLeft: 0
  });

  useEffect(() => {
    if (!socket || !connected) return;

    const handleGameState = (state: BingoState) => {
      setGameState(prev => ({ ...prev, ...state }));
    };

    socket.on('bingo-game-state', handleGameState);

    return () => {
      socket.off('bingo-game-state', handleGameState);
    };
  }, [socket, connected]);

  const startGame = () => {
    if (!socket) return;
    
    socket.emit('bingo-start-game');
  };

  const markNumber = (number: number) => {
    if (!socket) return;
    
    socket.emit('bingo-mark-number', { number });
  };

  const callBingo = () => {
    if (!socket) return;
    
    socket.emit('bingo-call-bingo');
  };

  const renderBingoCard = (card: BingoCard, index: number) => {
    const isMarked = gameState.calledNumbers.includes(card.number);
    
    return (
      <div
        key={card.id}
        className={`w-16 h-20 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${
          isMarked ? 'bg-green-100 border-green-500' : 'bg-white border-gray-300'
        } hover:scale-105`}
        onClick={() => markNumber(card.number)}
      >
        <div className="text-2xl font-bold text-gray-800">
          {card.number}
        </div>
        {isMarked && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full flex items-center justify-center">
            <div className="text-white text-xs font-bold">✓</div>
          </div>
        )}
      </div>
    );
  };

  const renderPlayerInfo = (player: BingoPlayer) => {
    return (
      <div key={player.id} className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              {player.avatar ? (
                <img
                  src={player.avatar}
                  alt={player.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="ml-3">
              <div className="font-semibold text-gray-800">{player.username}</div>
              {player.isAI && (
                <div className="text-xs text-blue-500">AI</div>
              )}
              <div className="text-sm text-gray-600">{player.cards.length} cards</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {player.cards.filter(card => card.marked).length} marked
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGameBoard = () => {
    return (
      <div className="bg-purple-50 rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center text-white">
            <div className="text-lg font-semibold">
              Round {gameState.roundNumber}
            </div>
            <div className="text-sm text-gray-300">
              {gameState.timeLeft}s
            </div>
            {gameState.isMyTurn && (
              <button
                onClick={callBingo}
                className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                <Target className="w-4 h-4 mr-2" />
                Call Bingo!
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: gameState.gridSize }, (_, index) => renderBingoCard({ id: index.toString(), number: index + 1, marked: false }))}
        </div>
      </div>
    );
  };

  if (!gameState.gameStarted) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8 text-gray-800">Bingo</h1>
          <p className="text-lg text-gray-600 mb-6">Classic Bingo with Modern Design</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gameState.players.map(player => renderPlayerInfo(player))}
          </div>
        </div>
      </div>
    );
  }

  if (gameState.gameStatus === 'bingo') {
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
            <Target className="w-6 h-6 mr-2" />
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-yellow-500">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">🎯 Bingo</h1>
          <p className="text-xl text-yellow-100">Classic Number Matching Game</p>
        </div>
        
        {renderGameBoard()}
      </div>
    </div>
  );
};
