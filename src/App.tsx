import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { Navbar } from './components/Navbar';
import { FriendRequestToast } from './components/FriendRequestToast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { GameLobby } from './pages/GameLobby';
import { Games } from './pages/Games';
import { GameLobbyByGame } from './pages/GameLobbyByGame';
import { Leaderboard } from './pages/Leaderboard';
import { ChessGame } from './pages/games/chess';
import { GeoGuessrGame } from './pages/games/geoguessr';
import { GarticPhoneGame } from './pages/games/garticphone';
import { Profile } from './pages/Profile';
import { Friends } from './pages/Friends';
import { Analytics } from './pages/Analytics';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navbar />
          <FriendRequestToast />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/games" element={
                <ProtectedRoute>
                  <Games />
                </ProtectedRoute>
              } />
              <Route path="/games/:gameKey" element={
                <ProtectedRoute>
                  <GameLobbyByGame />
                </ProtectedRoute>
              } />
              <Route path="/leaderboard" element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } />
              <Route path="/lobby" element={
                <ProtectedRoute>
                  <GameLobby />
                </ProtectedRoute>
              } />
              <Route path="/game/chess" element={
                <ProtectedRoute>
                  <ChessGame />
                </ProtectedRoute>
              } />
              <Route path="/game/geoguessr" element={
                <ProtectedRoute>
                  <GeoGuessrGame />
                </ProtectedRoute>
              } />
              <Route path="/game/garticphone" element={
                <ProtectedRoute>
                  <GarticPhoneGame />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/friends" element={
                <ProtectedRoute>
                  <Friends />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
