import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from '@/contexts/AuthContext'; 
import MainLayout from "@/layouts/MainLayout";
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import Game from '@/pages/Game';
import Chat from '@/pages/Chat';


const ProtectedRoute = ({children}) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace/>;
  return children;
}

const PublicRoute = ({children}) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace/>;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={ <MainLayout/> }>
        <Route path="/login" element={
          <PublicRoute>
            <Login/>
          </PublicRoute>
        } />

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

        <Route path="/game" element={
          <ProtectedRoute>
            <Game/>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
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
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes/>
      </BrowserRouter>
    </AuthProvider>
  );
};