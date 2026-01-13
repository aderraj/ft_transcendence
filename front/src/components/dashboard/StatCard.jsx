import React from "react";

const StatCard = ({ title, value, subtitle, icon: Icon, color, glow }) => (
    <div className={`relative overflow-hidden rounded-3xl bg-[#0bc1021]/40 backdrop-blur-xl border border-white/5 p-8 group hover:border-white/10 transition-all duration-300`}>
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-3xl ${color.replace('text-', 'bg-')}`}></div>
        <div className="flex justify-between items-start mb-8">
            <div className={`p-3 rounded-xl bg-white/5 ${color} ${glow} ring-1 ring-white/5`}>
                <Icon size={24} />
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-white/5 text-white/40 border border-white/5">WEEKLY</span>
        </div>
        <div>
            <h3 className="text-white/40 text-xs font-mono tracking-widest uppercase mb-1">{title}</h3>
            <div className="text-4xl font-black text-white mb-2 tracking-tight">{value}</div>
            <p className={`text-xs ${color} font-medium tracking-wide`}>{subtitle}</p>
        </div>
    </div>
);

export default StatCard;