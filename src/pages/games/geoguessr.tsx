import { useState, useEffect } from 'react';
import { Trophy, MapPin, Camera, Users, Globe, Compass } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

interface GeoGuessrLocation {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  imageUrl: string;
  country: string;
  distance: number;
  hint?: string;
}

interface GeoGuessrState {
  currentRound: number;
  totalRounds: number;
  locations: GeoGuessrLocation[];
  players: Array<{
    id: string;
    username: string;
    score: number;
    currentGuess: GeoGuessrLocation | null;
    roundWinner: string | null;
    isMyTurn: boolean;
    gameStatus: 'waiting' | 'playing' | 'round-end' | 'game-over';
    timeLeft: number;
  selectedLocation: GeoGuessrLocation | null;
  showHint: boolean;
    hintUsed: boolean;
  distance: number;
}

interface GeoGuessrPlayer {
  id: string;
  username: string;
  score: number;
  avatar?: string;
  country?: string;
  totalGames: number;
  wins: number;
}

export const GeoGuessrGame = () => {
  const { currentRoom, socket, connected } = useSocket();
  const [gameState, setGameState] = useState<GeoGuessrState>({
    currentRound: 1,
    totalRounds: 5,
    locations: [],
    players: [],
    currentPlayer: 0,
    roundWinner: null,
    isMyTurn: false,
    gameStatus: 'waiting',
    timeLeft: 0,
    selectedLocation: null,
    showHint: false,
    hintUsed: false,
    distance: 0
  });

  useEffect(() => {
    if (!socket || !connected) return;

    const handleGameState = (state: GeoGuessrState) => {
      setGameState(prev => ({ ...prev, ...state }));
    };

    socket.on('geoguessr-game-state', handleGameState);

    return () => {
      socket.off('geoguessr-game-state', handleGameState);
    };
  }, [socket, connected]);

  const startGame = () => {
    if (!socket) return;
    
    socket.emit('geoguessr-start-game');
  };

  const makeGuess = (location: GeoGuessrLocation) => {
    if (!socket) return;
    
    socket.emit('geoguessr-guess', { location });
  };

  const requestHint = () => {
    if (!socket) return;
    
    socket.emit('geoguessr-request-hint');
  };

  const nextRound = () => {
    if (!socket) return;
    
    socket.emit('geoguessr-next-round');
  };

  const renderLocationCard = (location: GeoGuessrLocation, index: number) => {
    const isSelected = gameState.selectedLocation?.id === location.id;
    
    return (
      <div
        key={location.id}
        onClick={() => setGameState(prev => ({ ...prev, selectedLocation: location }))}
        className={`relative w-32 h-20 rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105 ${
          isSelected ? 'ring-2 ring-blue-400' : ''
        }`}
      >
        <img
          src={location.imageUrl}
          alt={location.name}
          className="w-full h-full object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2">
          <MapPin className="w-4 h-4 text-white" />
          <div className="text-white text-xs font-semibold">{location.name}</div>
        </div>
      </div>
    );
  };

  const renderPlayerInfo = (player: GeoGuessrPlayer) => {
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
              <div className="text-sm text-gray-600">
                {player.score} points
              </div>
              <div className="text-xs text-gray-500">
                {player.totalGames} games
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {player.wins} wins
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGameBoard = () => {
    return (
      <div className="bg-blue-900 rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center text-white">
            <div className="text-lg font-semibold">
              Round {gameState.currentRound} of {gameState.totalRounds}
            </div>
            <div className="text-sm text-gray-600">
              {gameState.timeLeft}s
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {!gameState.showHint && gameState.hintUsed && (
              <button
                onClick={requestHint}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              >
                <Compass className="w-4 h-4 mr-2" />
                Get Hint
              </button>
            )}
            
            {gameState.isMyTurn && (
              <button
                onClick={nextRound}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                End Turn
              </button>
            )}
            
            <button
              onClick={() => setGameState(prev => ({ ...prev, showHint: !prev.showHint }))}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
                <Camera className="w-4 h-4 mr-2" />
                {gameState.showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gameState.locations.map((location, index) => renderLocationCard(location, index))}
          </div>
        </div>
        
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Compass className="w-4 h-4 mr-2" />
              Distance: {gameState.distance}km
            </h3>
            <div className="text-sm text-gray-600">
              {gameState.selectedLocation && (
                <div className="text-blue-500">
                  <MapPin className="w-4 h-4 mr-2" />
                  {gameState.selectedLocation.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!gameState.gameStarted) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8 text-gray-800">GeoGuessr</h1>
          <p className="text-lg text-gray-600 mb-6">Choose your location and start guessing</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={startGame}
              className="p-8 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all transform hover:scale-105"
            >
              <Globe className="w-8 h-8 mr-3" />
              <div className="text-lg font-semibold">Start Game</div>
              <p className="text-sm text-gray-300">Guess locations from around the world</p>
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
            {renderGameBoard()}
          </div>
          
          <div className="space-y-4">
            {renderPlayerInfo()}
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
            Round {gameState.currentRound} Winner!
          </h2>
          <p className="text-xl text-gray-600 mb-4">
            {gameState.roundWinner} guessed correctly!
          </p>
          <div className="text-sm text-gray-600">
            Distance: {gameState.distance}km from actual location
          </div>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Play className="w-6 h-6 mr-2" />
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
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            {gameState.players[0]?.username} Wins!
          </h2>
          <p className="text-xl text-gray-600 mb-4">
            Final Score: {gameState.players[0]?.score} points
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gameState.players.map(player => renderPlayerInfo(player))}
          </div>
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
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-600 to-indigo-900">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">🌍 GeoGuessr</h1>
          <p className="text-xl text-green-100">Explore the World Through Maps</p>
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
