import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container">
      <h1>🏓 PONG</h1>
      <h2>RETRO ARENA</h2>
      
      <div className="menu">
        <Link to="/login" className="btn">[ LOGIN ]</Link>
        <Link to="/register" className="btn">[ REGISTER ]</Link>
        <Link to="/leaderboard" className="btn">[ LEADERBOARD ]</Link>
        <Link to="/vault-demo" className="btn">[ VAULT DEMO ]</Link>
        <Link to="/health" className="btn btn-secondary">[ SYSTEM STATUS ]</Link>
      </div>
    </div>
  );
}

export default Home;
