import { useState, useEffect } from 'react';
import { Trophy, Users, PenTool, Palette, Send } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

interface DrawingPlayer {
  id: string;
  username: string;
  avatar?: string;
  isAI: boolean;
  score: number;
  currentDrawing?: string;
}

interface GarticPhoneState {
  players: DrawingPlayer[];
  currentPlayer: number;
  currentPrompt: string;
  timeLeft: number;
  roundNumber: number;
  gameStatus: 'waiting' | 'drawing' | 'guessing' | 'round-end' | 'game-over';
  gameStarted: boolean;
  winner: string | null;
  isMyTurn: boolean;
  currentDrawing: string | null;
  guesses: Array<{
    player: string;
    guess: string;
    timestamp: number;
  }>;
}

export const GarticPhoneGame = () => {
  const { socket, connected } = useSocket();
  const [gameState, setGameState] = useState<GarticPhoneState>({
    players: [],
    currentPlayer: 0,
    currentPrompt: '',
    timeLeft: 60,
    roundNumber: 1,
    gameStatus: 'waiting',
    gameStarted: false,
    winner: null,
    isMyTurn: false,
    currentDrawing: null,
    guesses: []
  });
  const [currentGuess, setCurrentGuess] = useState('');

  useEffect(() => {
    if (!socket || !connected) return;

    const handleGameState = (state: GarticPhoneState) => {
      setGameState(prev => ({ ...prev, ...state }));
    };

    socket.on('gartic-game-state', handleGameState);

    return () => {
      socket.off('gartic-game-state', handleGameState);
    };
  }, [socket, connected]);

  const startGame = () => {
    if (!socket) return;
    
    socket.emit('gartic-start-game');
  };

  const startDrawing = () => {
    if (!socket) return;
    
    socket.emit('gartic-start-drawing');
  };

  const submitGuess = (guess: string) => {
    if (!socket) return;
    
    socket.emit('gartic-submit-guess', { guess });
  };

  const renderCanvas = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-semibold">
            Round {gameState.roundNumber}
          </div>
          <div className="text-sm text-gray-600">
            {gameState.timeLeft}s
          </div>
          {gameState.isMyTurn && (
            <button
              onClick={startDrawing}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <PenTool className="w-4 h-4 mr-2" />
              Start Drawing
            </button>
          )}
        </div>
        
        <div className="relative bg-gray-50 rounded-lg" style={{ paddingBottom: '56.25%' }}>
          <div className="text-center text-gray-600 mb-2">
            {gameState.currentPrompt}
          </div>
          
          {/* Drawing Canvas */}
          <div className="bg-white rounded border-2 border-gray-300">
            <img
              src={gameState.currentDrawing || ''}
              alt="Current drawing"
              className="w-full h-64 object-contain"
            />
          </div>
        </div>
        
        {/* Guess Input */}
        {gameState.gameStatus === 'guessing' && (
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={currentGuess}
                onChange={(e) => setCurrentGuess(e.target.value)}
                placeholder="Enter your guess..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  if (currentGuess.trim()) {
                    submitGuess(currentGuess.trim());
                    setCurrentGuess('');
                  }
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPlayerInfo = (player: DrawingPlayer) => {
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
              <div className="text-sm text-gray-600">{player.score} points</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              Round Score: {player.score}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGuesses = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 max-h-48 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <Palette className="w-4 h-4 mr-2" />
          Guesses
        </h3>
        <div className="space-y-2">
          {gameState.guesses.map((guess, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div className="ml-2">
                  <div className="font-semibold text-gray-800">{guess.player}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(guess.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono text-gray-700">{guess.guess}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!gameState.gameStarted) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8 text-gray-800">Gartic Phone</h1>
          <p className="text-lg text-gray-600 mb-6">Draw and Guess with Friends</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gameState.players.map(player => renderPlayerInfo(player))}
          </div>
        </div>
      </div>
    );
  }

  if (gameState.gameStatus === 'round-end') {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Trophy className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">
            Round {gameState.roundNumber} Complete!
          </h2>
          <div className="text-xl text-gray-600 mb-4">
            <div className="space-y-2">
              {gameState.players.map(player => (
                <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="text-lg font-semibold">{player.username}</div>
                  <div className="text-2xl font-bold text-gray-800">{player.score}</div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Next Round
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-yellow-500">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">📱 Gartic Phone</h1>
          <p className="text-xl text-purple-100">Creative Drawing & Guessing Game</p>
        </div>
        
        {renderCanvas()}
        
        {gameState.gameStatus === 'guessing' && renderGuesses()}
        
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gameState.players.map(player => renderPlayerInfo(player))}
          </div>
        </div>
      </div>
    </div>
  );
};
