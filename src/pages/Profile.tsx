import { useState } from 'react';
import { Users, LogOut, Trophy } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

export const Profile = () => {
  const { user, logout } = useAuth();
  const { friendsState } = useSocket();
  const [friendLevels] = useState(() => 
    friendsState?.friends?.reduce((acc, friend) => {
      acc[friend.id] = Math.floor(Math.random() * 50) + 1;
      return acc;
    }, {} as Record<string, number>) || {}
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Player Name</h2>
              <p className="text-gray-600 mb-4">{user?.username || 'Guest'}</p>
              <button className="btn-primary w-full">Edit Profile</button>
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            {/* Friends Section */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Friends
              </h3>
              <div className="space-y-3">
                {friendsState?.friends?.length ? (
                  friendsState.friends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-medium">{friend.username}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Level {friendLevels[friend.id] || 1}</span>
                        <button className="text-sm text-blue-600 hover:text-blue-800">View Profile</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No friends yet.</p>
                )}
              </div>
            </div>

            {/* Analytics Section */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Trophy className="mr-2 h-5 w-5" />
                Game Analytics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">42</p>
                  <p className="text-sm text-gray-600">Games Played</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">28</p>
                  <p className="text-sm text-gray-600">Wins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">156</p>
                  <p className="text-sm text-gray-600">Points</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">67%</p>
                  <p className="text-sm text-gray-600">Win Rate</p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="card p-6">
              <button
                onClick={handleLogout}
                className="btn-outline w-full flex items-center justify-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
