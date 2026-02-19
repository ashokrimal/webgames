import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Gamepad2, Trophy, BarChart3 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const publicLinks = [
    { path: '/', label: 'Home' },
    { path: '/games', label: 'Games', icon: Gamepad2 },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  const protectedLinks = [
    { path: '/games', label: 'Games', icon: Gamepad2 },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const userMenuLinks = [
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const links = isAuthenticated ? [...protectedLinks] : [...publicLinks];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Gamepad2 className="h-8 w-8 text-primary-600" />
              <span className="font-bold text-xl text-gray-900">WebGames</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {links.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    isActive(link.path) 
                      ? 'text-primary-600 bg-primary-50' 
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  {IconComponent && <IconComponent className="h-4 w-4 mr-1" />}
                  {link.label}
                </Link>
              );
            })}
            
            {isAuthenticated && (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-300">
                <Link
                  to="/profile"
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    isActive('/profile') 
                      ? 'text-primary-600 bg-primary-50' 
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  <User className="h-4 w-4 mr-1" />
                  Profile
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {links.map((link) => {
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-md text-base font-medium flex items-center ${
                      isActive(link.path) 
                        ? 'text-primary-600 bg-primary-50' 
                        : 'text-gray-700 hover:text-primary-600'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {IconComponent && <IconComponent className="h-4 w-4 mr-2" />}
                    {link.label}
                  </Link>
                );
              })}
              
              {isAuthenticated && (
                <div className="border-t border-gray-200 pt-2 mt-2">
                  {userMenuLinks.map((link) => {
                    const IconComponent = link.icon;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`px-3 py-2 rounded-md text-base font-medium flex items-center ${
                          isActive(link.path) 
                            ? 'text-primary-600 bg-primary-50' 
                            : 'text-gray-700 hover:text-primary-600'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {IconComponent && <IconComponent className="h-4 w-4 mr-2" />}
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
