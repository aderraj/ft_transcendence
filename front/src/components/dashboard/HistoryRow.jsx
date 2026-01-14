import React from "react";
import { Clock } from 'lucide-react';

const HistoryRow = ({ result, opponent, score, date, isWin }) => {
    // Check if it is a draw based on the result text
    const isDraw = result === 'DRAW';

    // Determine Styles based on state
    let barColor = "bg-red-500/50";
    let textColor = "text-red-400";
    let shadow = "";

    if (isWin) {
        barColor = "bg-emerald-500";
        textColor = "text-emerald-400";
        shadow = "shadow-[0_010px#10b981]";
    } else if (isDraw) {
        barColor = "bg-amber-500";
        textColor = "text-amber-400";
        shadow = "shadow-[0_010px#f59e0b]";
    }

    return (
        <div className="group flex items-center justify-between p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
                {/* Status Bar Indicator */}
                <div className={`w-1 h-10 rounded-full transition-all duration-300 ${barColor} ${shadow}`}></div>

                <div>
                    <div className="text-sm font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                        {opponent}
                    </div>
                    <div className={`text-[10px] font-mono tracking-wider uppercase ${textColor}`}>
                        {result}
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end">
                 <div className="text-lg font-bold text-white/80 tracking-widest font-mono">
                    {score}
                 </div>
                 <div className="flex items-center gap-1 text-[10px] text-white/30">
                    <Clock size={10} /> {date}
                 </div>
            </div>
        </div>
    );
};

export default HistoryRow;
