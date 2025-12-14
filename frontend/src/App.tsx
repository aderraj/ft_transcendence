import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Leaderboard from './pages/Leaderboard';
import VaultDemo from './pages/VaultDemo';
import Health from './pages/Health';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/vault-demo" element={<VaultDemo />} />
      <Route path="/health" element={<Health />} />
    </Routes>
  );
}

export default App;
