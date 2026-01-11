import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from '@/contexts/AuthContext'; 
import { AppDataProvider } from "@/contexts/AppDataContext"; 
import MainLayout from "@/layouts/MainLayout";
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import Game from '@/pages/Game';
import Chat from '@/pages/Chat';

const ProtectedRoute = ({children}) => {
  const { user, loading } = useAuth();
  if (!user) return <Navigate to="/login" replace/>;
  return children;
}

const PublicRoute = ({children}) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace/>;
  return children;
}

// Helper to redirect /reset-password?token=XYZ -> /login?token=XYZ
// This ensures the token survives the redirect so Login.jsx can catch it.
const ResetRedirect = () => {
  const location = useLocation();
  return <Navigate to={`/login${location.search}`} replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route element={ <MainLayout/> }>
        
        <Route path="/login" element={
          <PublicRoute>
            <Login/>
          </PublicRoute>
        } />

        <Route path="/reset-password" element={<ResetRedirect />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard/>
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard/>
          </ProtectedRoute>
        } />
        
        <Route path="/chat" element={
          <ProtectedRoute>
            <Chat/>
          </ProtectedRoute>
        } />

        <Route path="/game/:roomId?" element={
          <ProtectedRoute>
            <Game/>
          </ProtectedRoute>
        } />

        <Route path="/profile/:userId?" element={
          <ProtectedRoute>
            <Profile/>
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          <AppRoutes/>
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};