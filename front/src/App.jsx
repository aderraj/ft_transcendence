"use client";
import AuroraOGL from './Aurora'; // Import your optimized Aurora component
import { useState } from 'react';

import './index.css';

// --- Glass Component Helper ---
const GlassCard = ({ children, className = "" }) => (
  <div className={`
    backdrop-blur-xl 
    bg-white/10 
    border border-white/20 
    shadow-xl 
    rounded-2xl 
    p-6 
    text-white
    transition-all duration-300 hover:bg-white/15 hover:scale-[1.01] hover:shadow-2xl
    ${className}
  `}>
    {children}
  </div>
);

// --- Navbar Component ---
const Navbar = () => (
  <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4">
    <div className="max-w-7xl mx-auto backdrop-blur-md bg-black/20 border border-white/10 rounded-full px-6 py-3 flex justify-between items-center">
      
      {/* Logo Area */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 shadow-lg shadow-cyan-500/20" />
        <span className="text-white font-bold text-lg tracking-tight">NEXUS</span>
      </div>

      {/* Links */}
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
        {['Dashboard', 'Analytics', 'Projects', 'Settings'].map((item) => (
          <a key={item} href="#" className="hover:text-white transition-colors">
            {item}
          </a>
        ))}
      </div>

      {/* Profile/Action */}
      <div className="flex items-center gap-4">
        <button className="text-white/70 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </button>
        <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30" />
      </div>
    </div>
  </nav>
);

export default function App() {
  return (
    <div className="relative min-h-screen w-full font-sans selection:bg-cyan-500/30">
      
      {/* 1. The Background Layer */}
      <AuroraOGL speed={0.8} />

      {/* 2. The Content Layer (Must have relative & z-index) */}
      <div className="relative z-10 pt-32 pb-20 px-6">
        <Navbar />

        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Hero Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                System Online
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50 tracking-tight">
                Glass <br/> Morphism
              </h1>
              
              <p className="text-lg text-white/60 max-w-lg leading-relaxed">
                A seamless integration of WebGL aurora effects with modern UI components. 
                Experience depth, blur, and luminosity.
              </p>

              <div className="flex gap-4 pt-4">
                <button className="px-8 py-3 rounded-xl bg-white text-black font-semibold hover:bg-cyan-50 transition-colors shadow-lg shadow-white/10">
                  Get Started
                </button>
                <GlassCard className="!p-0 !bg-white/5 hover:!bg-white/10 !border-white/10 rounded-xl">
                  <button className="px-8 py-3 font-semibold text-white">Documentation</button>
                </GlassCard>
              </div>
            </div>

            {/* Right Side Stats Panel */}
            <GlassCard className="relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity opacity-50 group-hover:opacity-70" />
              
              <div className="relative space-y-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <h3 className="text-xl font-medium">Server Status</h3>
                  <span className="text-emerald-400 text-sm font-mono">● 98.9%</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-black/20 space-y-1">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Latency</p>
                    <p className="text-2xl font-mono text-cyan-300">24ms</p>
                  </div>
                  <div className="p-4 rounded-lg bg-black/20 space-y-1">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Memory</p>
                    <p className="text-2xl font-mono text-purple-300">4.2GB</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-white/50">
                    <span>CPU Usage</span>
                    <span>42%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-[42%] h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Grid of Widgets */}
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <GlassCard key={i} className="flex flex-col justify-between h-64">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl">
                  {i === 1 ? '⚡' : i === 2 ? '🔒' : '💎'}
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-2">
                    {i === 1 ? 'Lightning Fast' : i === 2 ? 'Secure Core' : 'Premium Design'}
                  </h4>
                  <p className="text-sm text-white/50">
                    Optimized for high performance rendering with minimal overhead.
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}