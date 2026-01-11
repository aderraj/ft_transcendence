import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TwoFactorModal({ 
    isOpen, 
    onClose, 
    step, 
    qrCodeUrl, 
    code, 
    setCode, 
    onConfirm, 
    loading, 
    error 
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-[#0b1021] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">
                        {step === 'disable' ? 'Disable 2FA' : 'Setup 2FA'}
                    </h3>
                    <button onClick={onClose}><X className="text-white/50 hover:text-white" /></button>
                </div>

                <div className="space-y-6">
                    {step === 'verify' && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-white p-2 rounded-xl">
                                {qrCodeUrl ? (
                                    <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
                                ) : (
                                    <Loader2 className="animate-spin text-black" />
                                )}
                            </div>
                            <p className="text-xs text-white/50 text-center px-4">
                                Scan with Google Authenticator and enter the code below.
                            </p>
                        </div>
                    )}

                    {step === 'disable' && (
                        <p className="text-sm text-white/60 text-center">
                            Enter the code from your authenticator app to confirm disabling 2FA.
                        </p>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                            Verification Code
                        </label>
                        <Input 
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0,6))}
                            className="bg-black/40 border-white/10 text-center text-2xl tracking-[0.5em] font-mono h-12 text-white"
                            placeholder="000000"
                        />
                        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                    </div>

                    <Button 
                        onClick={onConfirm} 
                        disabled={code.length !== 6 || loading}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                    >
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Confirm"}
                    </Button>
                </div>
            </div>
        </div>
    );
}