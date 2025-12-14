import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  wins: number;
  losses: number;
  status: string;
}

function Leaderboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/users/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>🏆 LEADERBOARD</h1>
      <h2>Top Players</h2>

      {loading && <p className="loading">Loading...</p>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>RANK</th>
              <th>PLAYER</th>
              <th>WINS</th>
              <th>LOSSES</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>
                  No players yet - be the first!
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td>{user.username}</td>
                  <td>{user.wins}</td>
                  <td>{user.losses}</td>
                  <td>{user.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: '20px', color: '#0a0' }}>
        📊 Data stored in PostgreSQL (credentials from Vault)
      </p>

      <Link to="/" className="back-link">← BACK</Link>
    </div>
  );
}

export default Leaderboard;
