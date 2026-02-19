import { useState, useEffect } from 'react';
import { Trophy, Users, Clock, Play, Settings, Award, Zap, Target } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

interface ChessGameState {
  board: (string | null)[][];
  currentPlayer: string;
  gameMode: 'casual' | 'ranked' | 'tournament';
  gameStatus: 'waiting' | 'playing' | 'checkmate' | 'stalemate' | 'draw' | 'resigned';
  timer: number;
  lastMove: string;
}

interface ChessMove {
  from: string;
  to: string;
  piece: string;
  promotion?: string;
  timestamp: number;
}

export const ChessGame = () => {
  const { currentRoom, socket, connected } = useSocket();
  const [gameState, setGameState] = useState<ChessGameState>({
    board: Array(8).fill(null),
    currentPlayer: '',
    gameMode: 'casual',
    gameStatus: 'waiting',
    timer: 600,
    lastMove: ''
  });

  useEffect(() => {
    if (!socket || !connected) return;

    const handleGameState = (state: ChessGameState) => {
      setGameState(prev => ({ ...prev, ...state }));
    };

    socket.on('chess-game-state', handleGameState);

    return () => {
      socket.off('chess-game-state', handleGameState);
    };
  }, [socket, connected]);

  const startGame = (mode: 'casual' | 'ranked' | 'tournament') => {
    if (!socket) return;
    
    socket.emit('chess-start-game', { mode, timeControl: 600 });
  };

  const makeMove = (move: ChessMove) => {
    if (!socket) return;
    
    socket.emit('chess-move', move);
  };

  const resignGame = () => {
    if (!socket) return;
    
    socket.emit('chess-resign');
  };

  const requestDraw = () => {
    if (!socket) return;
    
    socket.emit('chess-draw');
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPieceIcon = (piece: string): string => {
    const icons: Record<string, string> = {
      'king': '♔',
      'queen': '♕',
      'rook': '♖',
      'bishop': '♗',
      'knight': '♘',
      'pawn': '♙'
    };
    return icons[piece] || '♟';
  };

  const renderBoard = () => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    return (
      <div className="grid grid-cols-8 gap-0 bg-amber-50 p-4 rounded-lg shadow-2xl">
        {ranks.map(rank => (
          <div key={rank} className="flex">
            {files.map(file => (
              <div
                key={`${file}${rank}`}
                className="w-12 h-12 border border-gray-300 flex items-center justify-center cursor-pointer transition-all hover:bg-gray-100"
                onClick={() => setGameState(prev => ({ ...prev, selectedSquare: `${file}${rank}` }))}
              >
                <div className="text-2xl font-bold text-gray-800">
                  {gameState.board[parseInt(rank) - 1][parseInt(file) - 1] && getPieceIcon(gameState.board[parseInt(rank) - 1][parseInt(file) - 1])}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderGameInfo = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800">
              {formatTime(gameState.timer)}
            </div>
            <div className="text-sm text-gray-600">
              {gameState.currentPlayer === 'white' ? 'White to move' : 'Black to move'}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setGameState(prev => ({ ...prev, showAnalysis: !prev.showAnalysis }))}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <Target className="w-4 h-4 mr-2" />
              {gameState.showAnalysis ? 'Hide Analysis' : 'Show Analysis'}
            </button>
            <button
              onClick={requestDraw}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              <Users className="w-4 h-4 mr-2" />
              Draw
            </button>
            <button
              onClick={resignGame}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              <Play className="w-4 h-4 mr-2" />
              Resign
            </button>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm text-gray-600">
            Mode: <span className="font-semibold">{gameState.gameMode}</span>
          </div>
          <div className="text-sm text-gray-600">
            Time Control: {gameState.timeControl}s
          </div>
          <div className="text-sm text-gray-600">
            Opponent: {gameState.opponent || 'Waiting...'}
          </div>
        </div>
      </div>
    );
  };

  if (gameState.gameStatus === 'waiting') {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8 text-gray-800">Chess</h1>
          <p className="text-lg text-gray-600 mb-6">Choose your game mode and start playing</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => startGame('casual')}
              className="p-8 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all transform hover:scale-105"
            >
              <Play className="w-8 h-8 mr-3" />
              <div className="text-lg font-semibold">Casual Play</div>
              <p className="text-sm text-gray-300">Play against AI or friends</p>
            </button>
            
            <button
              onClick={() => startGame('ranked')}
              className="p-8 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all transform hover:scale-105"
            >
              <Trophy className="w-8 h-8 mr-3" />
              <div className="text-lg font-semibold">Ranked Play</div>
              <p className="text-sm text-gray-300">Compete for ratings and leaderboard positions</p>
            </button>
            
            <button
              onClick={() => startGame('tournament')}
              className="p-8 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all transform hover:scale-105"
            >
              <Award className="w-8 h-8 mr-3" />
              <div className="text-lg font-semibold">Tournament</div>
              <p className="text-sm text-gray-300">Organized competitions with brackets</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.gameStatus === 'playing') {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {renderBoard()}
          </div>
          
          <div className="space-y-4">
            {renderGameInfo()}
          </div>
        </div>
      </div>
    );
  }

  if (gameState.gameStatus === 'checkmate' || gameState.gameStatus === 'stalemate') {
    const winner = gameState.gameStatus === 'checkmate' ? 
      (gameState.currentPlayer === 'white' ? 'Black' : 'White') : 
      (gameState.gameStatus === 'stalemate' ? 'Draw' : 'Draw');
    
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">
            {gameState.gameStatus === 'checkmate' ? 'Checkmate!' : 'Stalemate!'}
          </h2>
          <p className="text-xl text-gray-600 mb-4">
            {winner} wins!
          </p>
          <button
            onClick={() => startGame('casual')}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">♔ Chess Master</h1>
          <p className="text-xl text-blue-100">Strategic Gameplay & Modern Design</p>
        </div>
        
        {gameState.gameStatus === 'waiting' && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 text-white">
              <div className="animate-pulse">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
              <span className="text-lg">Waiting for opponent...</span>
            </div>
          </div>
        )}
        
        {gameState.gameStatus === 'playing' && (
          <div className="text-center mb-4">
            <div className="inline-flex items-center space-x-2 text-white">
              <div className="animate-pulse">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-lg">Game in Progress</span>
            </div>
          </div>
        )}
        
        {gameState.gameStatus && (
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 inline-block">
              <span className="text-sm text-gray-600">
                Status: <span className="font-semibold capitalize">{gameState.gameStatus}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
