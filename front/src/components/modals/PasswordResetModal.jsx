import React from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function PasswordResetModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    loading, 
    error, 
    success, 
    newPassword, 
    setNewPassword, 
    confirmPassword, 
    setConfirmPassword 
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-[#0b1021] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Change Password</h3>
                    <button onClick={onClose} disabled={loading}>
                        <X className="text-white/50 hover:text-white" />
                    </button>
                </div>

                {success ? (
                    <div className="flex flex-col items-center py-6 text-emerald-400">
                        <CheckCircle size={48} className="mb-2" />
                        <p className="font-bold">Password Updated!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-xs text-white/50 text-center">
                            Enter your new password below.
                        </p>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-cyan-400 uppercase">New Password</label>
                            <Input 
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="bg-black/40 border-white/10 text-white"
                                placeholder="Min 6 characters"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-cyan-400 uppercase">Confirm Password</label>
                            <Input 
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="bg-black/40 border-white/10 text-white"
                                placeholder="Re-enter password"
                            />
                        </div>

                        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                        
                        <Button 
                            onClick={onConfirm} 
                            disabled={!newPassword || !confirmPassword || loading}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Save New Password"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}