import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';

interface GuestAuthState {
  isGuest: boolean;
  username: string;
  deviceId: string;
  isAuthenticated: boolean;
}

export const useGuestAuth = () => {
  const { socket } = useSocket();
  const [guestState, setGuestState] = useState<GuestAuthState>({
    isGuest: false,
    username: '',
    deviceId: '',
    isAuthenticated: false
  });

  const generateDeviceId = () => {
    return 'guest-' + Math.random().toString(36).substring(2, 15);
  };

  const authenticateAsGuest = (username: string) => {
    const deviceId = generateDeviceId();
    
    setGuestState({
      isGuest: true,
      username,
      deviceId,
      isAuthenticated: true
    });

    // Store in localStorage for persistence
    localStorage.setItem('guest-auth', JSON.stringify({
      username,
      deviceId,
      timestamp: Date.now()
    }));

    // Notify server
    if (socket) {
      socket.emit('guest-authenticate', { username, deviceId });
    }
  };

  const logoutGuest = () => {
    setGuestState({
      isGuest: false,
      username: '',
      deviceId: '',
      isAuthenticated: false
    });

    localStorage.removeItem('guest-auth');
    
    if (socket) {
      socket.emit('guest-logout', { deviceId: guestState.deviceId });
    }
  };

  // Check for existing guest session on mount
  useEffect(() => {
    const checkStoredAuth = () => {
      const storedAuth = localStorage.getItem('guest-auth');
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        const age = Date.now() - authData.timestamp;

        // Guest session expires after 24 hours
        if (age < 24 * 60 * 60 * 1000) {
          setGuestState({
            isGuest: true,
            username: authData.username,
            deviceId: authData.deviceId,
            isAuthenticated: true
          });
        } else {
          localStorage.removeItem('guest-auth');
        }
      }
    };

    checkStoredAuth();
  }, []); // Empty dependency array since we only want to run once on mount

  return {
    guestState,
    authenticateAsGuest,
    logoutGuest
  };
};
