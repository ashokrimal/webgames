export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  stats: {
    gamesPlayed: number;
    wins: number;
    points: number;
    winRate: number;
  };
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
