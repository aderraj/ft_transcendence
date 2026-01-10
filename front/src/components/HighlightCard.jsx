import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Trophy } from 'lucide-react';
import TrueFocus from '@/components/TrueFocus'; 

const HighlightCard = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full overflow-hidden rounded-3xl 
                    border border-white/10 bg-[#0bc1021]/40 backdrop-blur-xl 
                    group hover:border-cyan-400/30 transition-all duration-500">
      
      {/* --- 1. BACKGROUND EFFECTS --- */}
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
      
      {/* Ambient Glows (Cyan/Blue) */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] group-hover:bg-cyan-400/30 transition-all duration-700"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] group-hover:bg-blue-500/30 transition-all duration-700"></div>

      {/* --- 2. CONTENT --- */}
      <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 z-10">
        
        {/* Left Side: Text */}
        <div className="space-y-6 max-w-2xl">
          
          {/* Title with TrueFocus Animation (Cyan Theme) */}
          <div className="relative z-20 text-5xl md:text-6xl font-black italic tracking-tighter text-white uppercase drop-shadow-xl -ml-1">
            <TrueFocus 
                sentence="PONG ARENA"
                manualMode={false}
                blurAmount={3}
                borderColor="#22d3ee"
                glowColor="rgba(34, 211, 238, 0.6)"
                animationDuration={0.3}
                pauseBetweenAnimations={0.5}
            />
          </div>

          <p className="text-white/60 text-sm md:text-base font-light leading-relaxed max-w-lg border-l-2 border-cyan-500/30 pl-4">
              Dominate the grid in real-time. Rise through the ranks, unlock cyber-badges, and become the ultimate champion.
          </p>
        </div>
        <div className="flex flex-col items-center gap-5 mt-2">
            
            <button 
                onClick={() => navigate('/game')}
                className="relative group/btn cursor-pointer"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 via-blue-500 to-cyan-600 rounded-full blur opacity-25 group-hover/btn:opacity-75 transition duration-500 group-hover/btn:animate-tilt"></div>
                
                <div className="relative px-10 py-5 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 flex items-center gap-4 transition-all duration-300 group-hover/btn:bg-white/5 group-hover/btn:border-white/20">
                    
                    <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover/btn:duration-1000 group-hover/btn:[transform:skew(-12deg)_translateX(100%)] overflow-hidden">
                        <div className="relative h-full w-8 bg-white/10"></div>
                    </div>

                    <span className="font-bold tracking-[0.2em] text-white uppercase text-sm group-hover/btn:text-white group-hover/btn:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all">
                        Enter Arena
                    </span>

                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 group-hover/btn:scale-110 group-hover/btn:border-cyan-500/50 group-hover/btn:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all duration-300">
                        <Play className="w-4 h-4 text-cyan-400 fill-current group-hover/btn:text-white transition-colors" />
                    </div>
                </div>
            </button>
        </div>
      </div>

      <Trophy className="absolute right-10 bottom-0 w-64 h-64 text-white/5 -rotate-12 translate-y-20 pointer-events-none" />
    </div>
  );
};

export default HighlightCard;