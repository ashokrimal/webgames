import { Link } from 'react-router-dom';
import { Play, Trophy, Globe, Pencil, MessageSquare, Phone, Gamepad2 } from 'lucide-react';

const games = [
  {
    id: 'chess',
    title: 'Chess',
    description: 'Classic strategy board game for two players',
    icon: Trophy,
    color: 'bg-purple-500',
    path: '/game/chess'
  },
  {
    id: 'drawing',
    title: 'Drawing Game',
    description: 'Draw and guess with friends like Skribbl.io',
    icon: Pencil,
    color: 'bg-green-500',
    path: '/game/drawing'
  },
  {
    id: 'geoguessr',
    title: 'GeoGuessr',
    description: 'Guess locations from around the world',
    icon: Globe,
    color: 'bg-blue-500',
    path: '/game/geoguessr'
  },
  {
    id: 'codenames',
    title: 'Codenames',
    description: 'Word association team game',
    icon: MessageSquare,
    color: 'bg-red-500',
    path: '/game/codenames'
  },
  {
    id: 'garticphone',
    title: 'Gartic Phone',
    description: 'Telephone game with drawings',
    icon: Phone,
    color: 'bg-yellow-500',
    path: '/game/garticphone'
  },
  {
    id: 'guessword',
    title: 'Guess Word',
    description: 'Guess the hidden word',
    icon: MessageSquare,
    color: 'bg-indigo-500',
    path: '/game/guessword'
  },
  {
    id: 'bingo',
    title: 'Bingo',
    description: 'Classic bingo game with customizable grids',
    icon: Trophy,
    color: 'bg-pink-500',
    path: '/game/bingo'
  }
];

export const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <section className="py-20 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Play Games Together
            <span className="block text-primary-600">Online</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Challenge your friends or play with random people in our collection of multiplayer games. 
            Create public or private lobbies and start playing instantly!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/lobby"
              className="btn-primary px-8 py-4 text-lg font-semibold inline-flex items-center justify-center"
            >
              <Play className="mr-2 h-5 w-5" />
              Play Now
            </Link>
            <Link to="/games" className="btn-outline px-8 py-4 text-lg font-semibold">
              <Gamepad2 className="ml-2 h-5 w-5" />
              Browse Games
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our Games
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => {
              const IconComponent = game.icon;
              return (
                <Link
                  key={game.id}
                  to={game.path}
                  className="card p-6 hover:shadow-lg transition-shadow duration-300 group"
                >
                  <div className={`${game.color} w-16 h-16 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {game.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {game.description}
                  </p>
                  <div className="flex items-center text-primary-600 font-medium">
                    <Gamepad2 className="ml-2 h-4 w-4" />
                    Play Now
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">WebGames</h3>
              <p className="text-gray-300">Play multiplayer games online with friends</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Games</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                {games.map((game) => (
                  <li key={game.id}>{game.title}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Connect</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>Play with friends worldwide</li>
                <li>Create custom game rooms</li>
                <li>Real-time chat</li>
                <li>Leaderboards & achievements</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Company</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>&copy; 2024 WebGames Platform</li>
                <li>Built with React & TypeScript</li>
                <li>Powered by Socket.IO</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
