import { Link } from 'react-router-dom';
import { Trophy, Users, Zap, Target, Globe, PenTool } from 'lucide-react';

const games = [
  {
    id: 'chess',
    name: '♔ Chess',
    description: 'Strategic gameplay with modern design',
    icon: Trophy,
    color: 'from-blue-600 to-indigo-600',
    players: '2',
    difficulty: 'Medium',
    features: ['Real-time multiplayer', 'Tournament mode', 'Game analysis', 'AI opponents']
  },
  {
    id: 'uno',
    name: 'UNO',
    description: 'Fast-paced card game with special action cards',
    icon: Zap,
    color: 'from-red-500 via-yellow-500 to-green-500',
    players: '2-10',
    difficulty: 'Easy',
    features: ['Wild cards', 'Draw pile', 'Color matching', 'Skip turns']
  },
  {
    id: 'bingo',
    name: '🎯 Bingo',
    description: 'Classic number matching with customizable grids',
    icon: Target,
    color: 'from-purple-400 via-pink-500 to-yellow-500',
    players: '2-10',
    difficulty: 'Easy',
    features: ['Custom grids', 'Auto-daub', 'Multiple patterns', 'Jackpot rounds']
  },
  {
    id: 'geoguessr',
    name: '🌍 GeoGuessr',
    description: 'Explore the world through Street View',
    icon: Globe,
    color: 'from-green-400 via-blue-600 to-indigo-900',
    players: '2-8',
    difficulty: 'Hard',
    features: ['Real locations', 'Distance scoring', 'Multi-round', 'Location hints']
  },
  {
    id: 'gartic-phone',
    name: '📱 Gartic Phone',
    description: 'Draw and guess with friends',
    icon: PenTool,
    color: 'from-purple-400 via-pink-500 to-yellow-500',
    players: '2-8',
    difficulty: 'Easy',
    features: ['Drawing canvas', 'Real-time guessing', 'Prompt creation', 'Gallery mode']
  },
  {
    id: 'guessword',
    name: '🔍 Guess Word',
    description: 'Word guessing game with hints',
    icon: Target,
    color: 'from-indigo-500 to-purple-600',
    players: '2-6',
    difficulty: 'Medium',
    features: ['Word hints', 'Multi-round', 'Score tracking', 'Time limits']
  }
];

export const GamesIndex = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">🎮 Game Collection</h1>
          <p className="text-xl text-gray-600">Choose your favorite game and start playing</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Link
              key={game.id}
              to={`/games/${game.id}`}
              className="group relative bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${game.color}`}>
                    <game.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-800">{game.name}</h3>
                    <p className="text-sm text-gray-600">{game.description}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{game.players}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{game.difficulty}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {game.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-xs text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
