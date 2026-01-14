import React from 'react';
import { Card } from "@/components/ui/card";
import { Shield, Lock, Eye, Server } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen p-8 flex justify-center items-start animate-in fade-in duration-500">
      <Card className="max-w-4xl w-full bg-[#0b1021]/80 backdrop-blur-xl border-white/10 p-10 space-y-8 shadow-2xl">
        
        <header className="border-b border-white/10 pb-6">
          <h1 className="text-4xl font-light text-white tracking-[0.2em] uppercase flex items-center gap-4">
            <Shield className="w-8 h-8 text-cyan-400" />
            Privacy Policy
          </h1>
          <p className="text-white/40 mt-2 font-mono text-xs">Last Updated: {new Date().toLocaleDateString()}</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-400" /> 1. Information We Collect
          </h2>
          <p className="text-gray-300 leading-relaxed">
            In the Transcendence arena, we collect minimal data necessary to provide the multiplayer experience:
          </p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li><strong className="text-white">Account Information:</strong> Username, email address, and avatar image provided during registration or OAuth login (42/Google).</li>
            <li><strong className="text-white">Game Data:</strong> Match history, scores, win/loss records, and achievements/levels.</li>
            <li><strong className="text-white">Communications:</strong> Chat logs from private messages and channel discussions for moderation purposes.</li>
            <li><strong className="text-white">Technical Data:</strong> IP addresses and device info for security and session management (JWT).</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" /> 2. How We Use Your Data
          </h2>
          <p className="text-gray-300 leading-relaxed">
            Your data fuels the core mechanics of the platform:
          </p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li><strong className="text-white">Matchmaking:</strong> Using your skill level and stats to pair you with suitable opponents.</li>
            <li><strong className="text-white">Leaderboards:</strong> Publicly displaying usernames and scores to rank players.</li>
            <li><strong className="text-white">Security:</strong> Implementing Two-Factor Authentication (2FA) and preventing cheat/bot behavior.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-red-400" /> 3. Data Protection
          </h2>
          <p className="text-gray-300 leading-relaxed">
            We employ industry-standard security measures including encryption for passwords and secure WebSocket connections (WSS) for gameplay. Your data is never sold to third parties.
          </p>
        </section>

        <section className="space-y-4 border-t border-white/10 pt-6">
          <p className="text-white/50 text-sm">
            Contact our admin team regarding data deletion requests or privacy concerns via the support channels.
          </p>
        </section>

      </Card>
    </div>
  );
};

export default PrivacyPolicy;