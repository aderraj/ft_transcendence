import React from 'react';
import { Card } from "@/components/ui/card";
import { Gavel, UserX, MessageSquare, AlertTriangle } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen p-8 flex justify-center items-start animate-in fade-in duration-500">
      <Card className="max-w-4xl w-full bg-[#0b1021]/80 backdrop-blur-xl border-white/10 p-10 space-y-8 shadow-2xl">
        
        <header className="border-b border-white/10 pb-6">
          <h1 className="text-4xl font-light text-white tracking-[0.2em] uppercase flex items-center gap-4">
            <Gavel className="w-8 h-8 text-yellow-400" />
            Terms of Service
          </h1>
          <p className="text-white/40 mt-2 font-mono text-xs">Effective Date: {new Date().toLocaleDateString()}</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">1. Acceptance of Terms</h2>
          <p className="text-gray-300 leading-relaxed">
            By accessing Transcendence, you agree to abide by these terms. This platform is a competitive environment designed for fair play and respect.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserX className="w-5 h-5 text-red-400" /> 2. User Conduct
          </h2>
          <p className="text-gray-300 leading-relaxed">
            To ensure a healthy community, the following behaviors are strictly prohibited and may result in an immediate ban:
          </p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li><strong className="text-white">Cheating/Botting:</strong> Using scripts, automation tools, or exploits to manipulate gameplay mechanics.</li>
            <li><strong className="text-white">Harassment:</strong> Bullying, hate speech, or excessive toxicity in chat or usernames.</li>
            <li><strong className="text-white">Impersonation:</strong> Pretending to be staff or other players.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" /> 3. Chat & Social Features
          </h2>
          <p className="text-gray-300 leading-relaxed">
            We provide chat functionality for communication. We reserve the right to monitor and moderate chat logs. You are responsible for the content you post.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" /> 4. Disclaimer
          </h2>
          <p className="text-gray-300 leading-relaxed">
            The service is provided "as is". We are not responsible for data loss due to server outages or connection issues during ranked matches.
          </p>
        </section>

      </Card>
    </div>
  );
};

export default TermsOfService;