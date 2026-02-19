import { useState, useEffect } from 'react';
import { Trophy, Users, Target, Lightbulb, ArrowRight } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

interface GuessWordState {
  currentWord: string;
  guesses: string[];
  hints: string[];
  maxGuesses: number;
  timeLeft: number;
  currentPlayer: number;
  players: Array<{
    id: string;
    username: string;
    score: number;
    guesses: string[];
    isGuessing: boolean;
  }>;
  gameStatus: 'waiting' | 'playing' | 'round-end' | 'game-over';
  gameStarted: boolean;
  winner: string | null;
  roundNumber: number;
  totalRounds: number;
}

export const GuessWordGame = () => {
  const { socket, connected } = useSocket();
  const [gameState, setGameState] = useState<GuessWordState>({
    currentWord: '',
    guesses: [],
    hints: [],
    maxGuesses: 6,
    timeLeft: 120,
    currentPlayer: 0,
    players: [],
    gameStatus: 'waiting',
    gameStarted: false,
    winner: null,
    roundNumber: 1,
    totalRounds: 5
  });

  useEffect(() => {
    if (!socket || !connected) return;

    const handleGameState = (state: GuessWordState) => {
      setGameState(prev => ({ ...prev, ...state }));
    };

    socket.on('guessword-game-state', handleGameState);

    return () => {
      socket.off('guessword-game-state', handleGameState);
    };
  }, [socket, connected]);

  const startGame = () => {
    if (!socket) return;

    socket.emit('guessword-start-game');
  };

  const makeGuess = (word: string) => {
    if (!socket) return;

    socket.emit('guessword-make-guess', { word });
  };

  const requestHint = () => {
    if (!socket) return;

    socket.emit('guessword-request-hint');
  };

  const renderGuessResult = (guess: string) => {
    const letters = guess.split('');
    const wordLetters = gameState.currentWord.split('');
    
    return (
      <div className="flex space-x-2 mb-2">
        {letters.map((letter) => {
          let bgColor = 'bg-gray-400'; // Default gray for wrong letters
          
          if (wordLetters.includes(letter)) {
            bgColor = 'bg-yellow-500'; // Yellow for correct letter, wrong position
          }
          
          return (
            <div
              key={letter}
              className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl ${bgColor}`}
            >
              {letter.toUpperCase()}
            </div>
          );
        })}
      </div>
    );
  };

  const renderPlayerInfo = (player: any) => {
    return (
      <div key={player.id} className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div className="ml-3">
              <div className="font-semibold text-gray-800">{player.username}</div>
              <div className="text-sm text-gray-600">{player.score} points</div>
              <div className="text-xs text-gray-500">{player.guesses.length} guesses</div>
            </div>
          </div>
          <div className="text-right">
            {player.isGuessing && (
              <div className="text-sm text-blue-600 font-semibold">
                Guessing...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGameBoard = () => {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <div className="flex justify-between items-center text-white">
            <div className="text-lg font-semibold">
              Round {gameState.roundNumber} of {gameState.totalRounds}
            </div>
            <div className="text-sm">
              Time: {gameState.timeLeft}s
            </div>
          </div>
          
          <div className="text-center text-white mt-4">
            <div className="text-sm opacity-80">Guess the word</div>
            <div className="text-2xl font-bold mt-2">
              {gameState.currentWord ? '_ '.repeat(gameState.currentWord.length) : 'Word'}
            </div>
          </div>
        </div>
        
        {/* Hints */}
        {gameState.hints.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white text-lg font-semibold mb-3 flex items-center">
              <Lightbulb className="w-4 h-4 mr-2" />
              Hints
            </h3>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              {gameState.hints.map((hint, index) => (
                <div key={index} className="text-white mb-2">
                  • {hint}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Guesses */}
        <div className="mb-6">
          <h3 className="text-white text-lg font-semibold mb-3">Guesses</h3>
          <div className="space-y-2">
            {gameState.guesses.map((guess) => renderGuessResult(guess))}
          </div>
        </div>
        
        {/* Guess Input */}
        {gameState.gameStatus === 'playing' && gameState.currentPlayer === 0 && (
          <div className="mt-6">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Enter your guess..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      makeGuess(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                    if (input) {
                      makeGuess(input.value);
                      input.value = '';
                    }
                  }}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Guess
                </button>
              </div>
              
              <div className="mt-4 flex justify-center space-x-4">
                <button
                  onClick={requestHint}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Get Hint
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!gameState.gameStarted) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8 text-gray-800">Guess Word</h1>
          <p className="text-lg text-gray-600 mb-6">Word guessing game with hints and multiplayer</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={startGame}
              className="p-8 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all transform hover:scale-105"
            >
              <Target className="w-8 h-8 mr-3" />
              <div className="text-lg font-semibold">Start Game</div>
              <p className="text-sm text-gray-300">Guess words with friends</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.gameStatus === 'round-end') {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Trophy className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">
            Round {gameState.roundNumber} Complete!
          </h2>
          <p className="text-xl text-gray-600 mb-4">
            The word was: <span className="font-bold text-blue-600">{gameState.currentWord}</span>
          </p>
          <div className="text-lg text-gray-600 mb-4">
            {gameState.winner ? `${gameState.winner} guessed it!` : 'No one guessed the word!'}
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

  if (gameState.gameStatus === 'game-over') {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">
            Game Over!
          </h2>
          <div className="text-xl text-gray-600 mb-4">
            <div className="space-y-2">
              {gameState.players.map((player, index) => (
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
          <h1 className="text-5xl font-bold text-white mb-2">🔍 Guess Word</h1>
          <p className="text-xl text-purple-100">Word Guessing Challenge</p>
        </div>
        
        {renderGameBoard()}
        
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gameState.players.map(player => renderPlayerInfo(player))}
          </div>
        </div>
      </div>
    </div>
  );
};
