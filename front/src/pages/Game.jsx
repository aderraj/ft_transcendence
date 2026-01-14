import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { LocalGame } from '../game/LocalGame.js';
import { RemoteGame } from '../game/RemoteGame.js';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Users, Monitor, ArrowLeft, Send, Loader2 } from 'lucide-react';

const PongGame = () => {
  const canvasRef = useRef(null);
  const gameInstance = useRef(null);
  const socketRef = useRef(null);
  const { user } = useAuth();
  const { friends, sendGameInvite } = useAppData();
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [mode, setMode] = useState('local');
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState('menu');
  const [winner, setWinner] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [inviteStatus, setInviteStatus] = useState(null);

  useEffect(() => {
    if (roomId && user) {
        initRemoteGame(roomId);
    }
    return () => cleanupGame();
  }, [roomId, user]);

  const cleanupGame = () => {
    if (gameInstance.current) {
      gameInstance.current.destroy();
      gameInstance.current = null;
    }
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
        socketRef.current.close();
      }
      socketRef.current = null;
    }
    setScore({ p1: 0, p2: 0 });
    setTimeLeft(60);
    setCountdown(null);
    setWinner(null);
    setGameOverData(null);
  };

  const startLocalGame = () => {
    if (!canvasRef.current) return;
    cleanupGame();
    setMode('local');
    setGameState('playing');
    setScore({ p1: 0, p2: 0 });
    setTimeLeft(60);
    
    gameInstance.current = new LocalGame(canvasRef.current, {
      onScoreUpdate: setScore,
      onTimerUpdate: setTimeLeft,
      onCountdownUpdate: setCountdown,
      onGameEnd: (winnerName) => {
        setWinner(winnerName);
        setGameOverData({ winner: winnerName, isLocal: true });
        setGameState('gameOver');
      }
    });
    gameInstance.current.start();
  };

  const handleSendInvite = async (friendId) => {
      setInviteStatus({ loading: true, id: friendId });
      const res = await sendGameInvite(friendId);
      if (res.success) {
          setInviteStatus({ sent: true, id: friendId, message: "Invite Sent!" });
          setTimeout(() => setInviteStatus(null), 3000);
      } else {
          setInviteStatus({ error: true, id: friendId, message: "Failed" });
          setTimeout(() => setInviteStatus(null), 3000);
      }
  };

  const initRemoteGame = (targetRoomId) => {
    if (!canvasRef.current || !user) return;
    cleanupGame();
    setMode('remote');
    
    // Use secure WebSocket (WSS) through the reverse proxy
    // Protocol matches page protocol, connects via /game-ws/ path
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // Uses same host as the page (goes through WAF)
    const token = localStorage.getItem('accessToken');
    
    const wsUrl = `${protocol}//${host}/game-ws/?user_id=${user.id}&roomId=${targetRoomId}&token=${token}`;

    setGameState('waiting');
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
        ;
    };

    socket.onerror = (error) => {
        console.error('Failed to connect to game server:', error);

        setGameState('menu');
        cleanupGame();
        navigate('/game');
    };
    
    gameInstance.current = new RemoteGame(canvasRef.current, socket, user.id, {
      onScoreUpdate: setScore,
      onTimerUpdate: (time) => setTimeLeft(time),
      onCountdownUpdate: setCountdown,
      onGameStart: () => {
        setGameState('playing');
      },
      onGameEnd: (gameOverMsg) => {
        ;
        
        if (typeof gameOverMsg === 'string') {
          setGameOverData({
            winner: 'Unknown',
            isWinner: false,
            isDraw: false,
            players: null,
            isLocal: false,
            message: gameOverMsg
          });
          setWinner('Unknown');
        } else if (gameOverMsg.disconnected) {

          setGameOverData({
            winner: user.id,
            isWinner: true,
            isDraw: false,
            players: null,
            isLocal: false,
            message: 'Opponent Disconnected'
          });
          setWinner(user.id);
        } else {

          const winnerId = gameOverMsg.winner;
          const isWinner = winnerId === user.id;
          const isDraw = winnerId === 'Draw';
          
          setGameOverData({
            winner: winnerId,
            isWinner: isWinner,
            isDraw: isDraw,
            players: gameOverMsg.players,
            isLocal: false
          });
          setWinner(winnerId);
        }
        
        setGameState('gameOver');
        setTimeout(() => {
          if (gameInstance.current) {
            gameInstance.current.stop();
          }
        }, 100);
      },
      onConnectionError: (error) => {
        console.error('Connection error:', error);
        setGameState('menu');
        cleanupGame();
        navigate('/game');
      },
      onConnectionClosed: (reason) => {
        ;
        if (gameState !== 'gameOver') {
          setGameState('menu');
          cleanupGame();
          navigate('/game');
        }
      }
    });
    gameInstance.current.start();
  };

  const onlineFriends = friends.filter(f => f.isOnline || f.status === 'Online');

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 animate-in fade-in duration-700">
      
      {gameState === 'playing' && (
        <div className="w-full max-w-[1000px] flex justify-between items-end mb-8 px-4 animate-in slide-in-from-top-4 fade-in duration-700">
          
          <div className="flex flex-col items-center">
             <div className="text-white/60 text-sm font-bold tracking-[0.3em] uppercase mb-2 drop-shadow-md">Player 1</div>
             <div className="text-7xl font-black text-white leading-none tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
               {score.p1}
             </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-black/30 backdrop-blur-xl shadow-2xl">
                <Clock className="w-6 h-6 text-[#0bc102] drop-shadow-[0_0_10px_rgba(11,193,2,0.8)]" />
                <span className="text-2xl font-mono text-white font-bold tracking-widest tabular-nums drop-shadow-lg leading-none translate-y-[1px]">
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </span>
            </div>
          </div>

          <div className="flex flex-col items-center">
             <div className="text-white/60 text-sm font-bold tracking-[0.3em] uppercase mb-2 drop-shadow-md">Player 2</div>
             <div className="text-7xl font-black text-white leading-none tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
               {score.p2}
             </div>
          </div>

        </div>
      )}

      <Card className="bg-[#0bc1021]/40 backdrop-blur-xl relative w-full max-w-[1000px] aspect-[5/3] border-white/5 overflow-hidden rounded-[40px] shadow-2xl ring-1 ring-white/5">
        
        <canvas 
          ref={canvasRef} 
          width={1000}
          height={600} 
          className="block w-full h-full cursor-none opacity-90" 
        />

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="text-[12rem] font-black text-white italic tracking-tighter animate-in zoom-in-50 duration-300 drop-shadow-[0_0_50px_rgba(255,255,255,0.5)]">
              {countdown}
            </div>
          </div>
        )}

        {gameState === 'lobby' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-[#0f172a]/80 backdrop-blur-md animate-in fade-in">
                <div className="w-full max-w-md bg-[#0b1021] border border-white/10 rounded-3xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={() => setGameState('menu')} className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-xl font-bold text-white tracking-widest uppercase">Select Opponent</h2>
                        <div className="w-9"></div> 
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {onlineFriends.length === 0 ? (
                            <div className="text-center py-10 text-white/30 text-sm">No friends online</div>
                        ) : (
                            onlineFriends.map(friend => (
                                <div key={friend.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={friend.avatar || "/default-avatar.png"} className="w-10 h-10 rounded-full bg-black object-cover" alt="avatar" />
                                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0b1021]"></div>
                                        </div>
                                        <span className="font-bold text-white">{friend.username}</span>
                                    </div>
                                    
                                    <Button 
                                        onClick={() => handleSendInvite(friend.id)}
                                        disabled={inviteStatus?.loading && inviteStatus?.id === friend.id}
                                        className={`h-9 px-4 rounded-lg font-bold uppercase text-xs tracking-wider transition-all 
                                            ${inviteStatus?.sent && inviteStatus?.id === friend.id ? 'bg-emerald-500 text-white' : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-black'}
                                        `}
                                    >
                                        {inviteStatus?.loading && inviteStatus?.id === friend.id ? <Loader2 className="w-4 h-4 animate-spin"/> : (
                                            inviteStatus?.sent && inviteStatus?.id === friend.id ? "Sent" : "Invite"
                                        )}
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
             </div>
        )}

        {gameState === 'waiting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/80 backdrop-blur-xl">
                 <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mb-6" />
                 <h2 className="text-2xl font-bold text-white tracking-widest uppercase animate-pulse">Connecting to Arena...</h2>
                 <Button onClick={() => { cleanupGame(); setGameState('menu'); navigate('/game'); }} className="mt-8 px-8 py-2 bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-xl">
                    Cancel
                 </Button>
            </div>
        )}

        {gameState === 'menu' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-[#0f172a]/60 backdrop-blur-sm">
            <div className="text-center mb-16">
              <h1 className="text-9xl font-black text-white tracking-tighter italic">
                PONG<span className="text-[#0bc102]">X</span>
              </h1>
              <p className="text-white/40 uppercase tracking-[0.6em] text-xs font-bold">Transcendence Edition</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6">
              <Button onClick={startLocalGame} className="h-16 px-10 bg-white text-black hover:bg-[#06b6d4] hover:text-white transition-all duration-300 rounded-2xl font-black text-lg uppercase flex gap-3">
                <Monitor className="w-5 h-5" /> Local Match
              </Button>
              <Button onClick={() => setGameState('lobby')} className="h-16 px-10 bg-[#0bc102]/80 text-white border border-white/10 hover:border-[#0bc102]/50 transition-all duration-300 rounded-2xl font-black text-lg uppercase flex gap-3">
                <Users className="w-5 h-5 text-red-500" /> Online Arena
              </Button>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && gameOverData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/80 backdrop-blur-xl">
            {gameOverData.message === 'Opponent Disconnected' ? (
              <>
                <Trophy className="w-20 h-20 text-[#0bc102] mb-6 animate-pulse" />
                <h2 className="text-6xl font-black text-white mb-2 tracking-tighter italic">VICTORY</h2>
                <p className="text-2xl text-white/60 mb-12">
                  Opponent <span className="font-bold text-white">disconnected</span>!
                </p>
              </>
            ) : gameOverData.isLocal ? (
              <>
                <Trophy className="w-20 h-20 text-[#0bc102] mb-6 animate-pulse" />
                <h2 className="text-6xl font-black text-white mb-2 tracking-tighter italic">VICTORY</h2>
                <p className="text-2xl text-white/60 mb-12">
                  <span className="font-bold text-white uppercase">{winner}</span> wins!
                </p>
              </>
            ) : gameOverData.isDraw ? (
              <>
                <div className="w-20 h-20 mb-6 flex items-center justify-center text-6xl">🤝</div>
                <h2 className="text-6xl font-black text-white mb-2 tracking-tighter italic">DRAW</h2>
                <p className="text-2xl text-white/60 mb-12">Both players tied!</p>
              </>
            ) : gameOverData.isWinner ? (
              <>
                <Trophy className="w-20 h-20 text-[#0bc102] mb-6 animate-pulse" />
                <h2 className="text-6xl font-black text-white mb-2 tracking-tighter italic">VICTORY</h2>
                <p className="text-2xl text-white/60 mb-12">
                  You <span className="font-bold text-[#0bc102]">dominated</span> the arena!
                </p>
                {gameOverData.players && (
                  <div className="text-white/40 text-lg mb-12">
                    Final Score: <span className="text-white font-bold">{gameOverData.players.leftPlayer?.userId === user.id ? gameOverData.players.leftPlayer?.score : gameOverData.players.rightPlayer?.score}</span> - <span className="text-white/60">{gameOverData.players.leftPlayer?.userId !== user.id ? gameOverData.players.leftPlayer?.score : gameOverData.players.rightPlayer?.score}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-20 h-20 mb-6 flex items-center justify-center text-6xl opacity-50">💀</div>
                <h2 className="text-6xl font-black text-red-500 mb-2 tracking-tighter italic">DEFEAT</h2>
                <p className="text-2xl text-white/60 mb-12">
                  Better luck <span className="font-bold text-white">next time</span>!
                </p>
                {gameOverData.players && (
                  <div className="text-white/40 text-lg mb-12">
                    Final Score: <span className="text-white/60">{gameOverData.players.leftPlayer?.userId === user.id ? gameOverData.players.leftPlayer?.score : gameOverData.players.rightPlayer?.score}</span> - <span className="text-white font-bold">{gameOverData.players.leftPlayer?.userId !== user.id ? gameOverData.players.leftPlayer?.score : gameOverData.players.rightPlayer?.score}</span>
                  </div>
                )}
              </>
            )}
            <Button onClick={() => { setGameState('menu'); navigate('/game'); }} className="px-12 py-7 bg-white text-black hover:bg-[#0bc102] hover:text-white rounded-2xl font-bold">
              RETURN TO HUB
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PongGame;