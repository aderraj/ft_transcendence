import React from "react";
import { Clock } from 'lucide-react';

const HistoryRow = ({ result, opponent, score, date, isWin }) => (
    <div className="group flex items-center justify-between p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer">
        <div className="flex items-center gap-4">
            <div className={`w-1 h-10 rounded-full ${isWin ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500/50'}`}></div>
            <div>
                <div className="text-sm font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{opponent}</div>
                <div className={`text-[10px] font-mono tracking-wider uppercase ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>{result}</div>
            </div>
        </div>
        <div className="flex flex-col items-end">
             <div className="text-lg font-bold text-white/80 tracking-widest font-mono">{score}</div>
             <div className="flex items-center gap-1 text-[10px] text-white/30"><Clock size={10} />{date}</div>
        </div>
    </div>
);

export default HistoryRow;