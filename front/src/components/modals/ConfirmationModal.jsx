import React from "react";
import { X, AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ title, message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onCancel}></div>
        <div className="relative w-full max-w-sm bg-[#0b1021] border border-white/10 rounded-3xl p-6 shadow-[0_0_50px_-10px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 duration-200">
            <button onClick={onCancel} className="absolute top-4 right-4 text-white/30 hover:text-white"><X size={16} /></button>
            <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-2">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-wide">{title}</h3>
                <p className="text-sm text-white/50">{message}</p>
                <div className="grid grid-cols-2 gap-3 w-full mt-4">
                    <button onClick={onCancel} className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-bold text-white/70">Cancel</button>
                    <button onClick={onConfirm} className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-sm font-bold text-red-500">Confirm</button>
                </div>
            </div>
        </div>
    </div>
);

export default ConfirmationModal;