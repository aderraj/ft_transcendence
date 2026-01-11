import React, {useState} from "react";
import { X, Check, ArrowRight } from 'lucide-react';

const RequestsModal = ({ onClose, pending, sent, onAccept, onDecline, onCancel }) => {
    const [activeTab, setActiveTab] = useState('received');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-[#0b1021] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white tracking-wide">Friend Requests</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white"><X size={18} /></button>
                </div>

                <div className="flex p-1 mb-6 bg-white/5 rounded-xl border border-white/5">
                    <button 
                        onClick={() => setActiveTab('received')}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'received' ? 'bg-cyan-500/10 text-cyan-400 shadow-sm' : 'text-white/30 hover:text-white'}`}
                    >
                        Received ({pending.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('sent')}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'sent' ? 'bg-cyan-500/10 text-cyan-400 shadow-sm' : 'text-white/30 hover:text-white'}`}
                    >
                        Sent ({sent.length})
                    </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {activeTab === 'received' && (
                        pending.length === 0 ? (
                            <div className="text-center py-8 text-white/20 text-sm">No pending requests</div>
                        ) : (
                            pending.map(req => (
                                <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-3">
                                        <img src={req.sender?.avatar || "/default-avatar.png"} className="w-10 h-10 rounded-full bg-black object-cover" alt="avatar" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white">{req.sender?.username}</span>
                                            <span className="text-[10px] text-white/40">wants to add you</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => onAccept(req.id)} className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg transition-colors"><Check size={14}/></button>
                                        <button onClick={() => onDecline(req.id)} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors"><X size={14}/></button>
                                    </div>
                                </div>
                            ))
                        )
                    )}

                    {activeTab === 'sent' && (
                        sent.length === 0 ? (
                            <div className="text-center py-8 text-white/20 text-sm">No sent requests</div>
                        ) : (
                            sent.map(req => (
                                <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-3">
                                        <img src={req.receiver?.avatar || "/default-avatar.png"} className="w-10 h-10 rounded-full bg-black object-cover opacity-50" alt="avatar" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white/70">{req.receiver?.username}</span>
                                            <span className="text-[10px] text-white/30 flex items-center gap-1">
                                                Pending <ArrowRight size={10} />
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => onCancel(req.id)} className="px-3 py-1.5 bg-white/5 hover:bg-red-500/10 text-white/30 hover:text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors border border-transparent hover:border-red-500/20">
                                        Cancel
                                    </button>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default RequestsModal;