import React from 'react';
import { Key, Shield, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SecuritySettings({ 
    isOwnProfile, 
    loadingSensitiveData, 
    isTwoFactorEnabled, 
    onOpenChangePassword, 
    onOpen2FA,
    resetLoading 
}) {
    if (!isOwnProfile) return null;

    return (
        <Card className="bg-[#0bc1021]/60 backdrop-blur-xl border-white/10 shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl text-white tracking-wide">Security</CardTitle>
                <CardDescription className="text-white/40">
                    Manage your account security and authentication methods.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-400">
                            <Key size={20} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white">Change Password</div>
                            <div className="text-xs text-white/40">Update your account password securely.</div>
                        </div>
                    </div>
                    <Button 
                        onClick={onOpenChangePassword} 
                        disabled={resetLoading} 
                        className="bg-white text-black hover:bg-gray-200 font-bold border-none"
                    >
                        {resetLoading ? <Loader2 className="animate-spin h-4 w-4"/> : "Update"}
                    </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${isTwoFactorEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            <Shield size={20} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white">Two-Factor Authentication</div>
                            <div className="text-xs text-white/40">
                                {loadingSensitiveData 
                                    ? "Loading status..." 
                                    : (isTwoFactorEnabled ? "Your account is secured." : "Enable 2FA for better security.")}
                            </div>
                        </div>
                    </div>
                    <Button 
                        onClick={onOpen2FA}
                        disabled={loadingSensitiveData}
                        className={cn(
                            "font-bold border-none transition-colors",
                            isTwoFactorEnabled 
                                ? "bg-red-500 hover:bg-red-600 text-white" 
                                : "bg-white text-black hover:bg-gray-200"
                        )}
                    >
                        {isTwoFactorEnabled ? "Disable" : "Enable"}
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}