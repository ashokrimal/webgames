import { Link } from 'react-router-dom';
import { Crown, Pencil, MapPin, Users, Phone } from 'lucide-react';

const games = [
  {
    key: 'chess',
    name: 'Chess',
    description: 'Classic strategy game. Play 1v1 online.',
    icon: Crown,
    color: 'from-purple-500 to-indigo-600'
  },
  {
    key: 'drawing',
    name: 'Drawing Game',
    description: 'Draw and guess in real time with friends.',
    icon: Pencil,
    color: 'from-pink-500 to-rose-600'
  },
  {
    key: 'geoguessr',
    name: 'GeoGuessr',
    description: 'Guess locations around the world.',
    icon: MapPin,
    color: 'from-emerald-500 to-green-600'
  },
  {
    key: 'codenames',
    name: 'Codenames',
    description: 'Team word association party game.',
    icon: Users,
    color: 'from-amber-500 to-orange-600'
  },
  {
    key: 'garticphone',
    name: 'Gartic Phone',
    description: 'Telephone game with drawings and prompts.',
    icon: Phone,
    color: 'from-sky-500 to-blue-600'
  }
];

export const Games = () => {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Games</h1>
        <p className="text-gray-600 mt-1">Pick a game to host or join a lobby.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((g) => {
          const Icon = g.icon;
          return (
            <Link
              key={g.key}
              to={`/games/${g.key}`}
              className="card overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className={`h-28 bg-gradient-to-r ${g.color} flex items-center px-6`}>
                <Icon className="h-10 w-10 text-white" />
                <div className="ml-4">
                  <div className="text-white text-xl font-semibold">{g.name}</div>
                  <div className="text-white/80 text-sm">Host or join</div>
                </div>
              </div>
              <div className="p-6">
                <div className="text-gray-700">{g.description}</div>
                <div className="mt-4 inline-flex items-center text-primary-600 font-medium">
                  Open lobby
                  <span className="ml-2">→</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
