import React from 'react';
import { User, Mail, Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function EditProfileForm({ 
    formData, 
    handleInputChange, 
    handleSave, 
    isSaving, 
    isOwnProfile, 
    loadingSensitiveData 
}) {
    return (
        <Card className="bg-[#0bc1021]/60 backdrop-blur-xl border-white/10 shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl text-white tracking-wide">
                    {isOwnProfile ? "Profile Settings" : "Profile Details"}
                </CardTitle>
                <CardDescription className="text-white/40">
                    {isOwnProfile 
                        ? "Manage your public identity details." 
                        : "Public user information."}
                </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                            <User size={14} /> Username
                        </label>
                        <Input 
                            name="username" 
                            value={formData.username} 
                            onChange={handleInputChange} 
                            disabled={!isOwnProfile} 
                            className="bg-black/20 border-white/10 text-white" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                            <User size={14} /> Display Name
                        </label>
                        <Input 
                            name="displayName" 
                            value={formData.displayName} 
                            onChange={handleInputChange} 
                            disabled={!isOwnProfile} 
                            className="bg-black/20 border-white/10 text-white" 
                        />
                    </div>
                </div>

                {isOwnProfile && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                            <Mail size={14} /> Email Address
                        </label>
                        <div className="relative">
                            <Input 
                                name="email" 
                                value={formData.email} 
                                disabled 
                                className="bg-black/40 border-white/5 text-white/50 cursor-not-allowed" 
                                placeholder={loadingSensitiveData ? "Loading..." : "Hidden"} 
                            />
                            {loadingSensitiveData && (
                                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-white/20" />
                            )}
                        </div>
                    </div>
                )}

                {isOwnProfile && (
                    <div className="flex justify-end pt-2">
                        <Button 
                            onClick={handleSave} 
                            disabled={isSaving} 
                            className="bg-white text-black hover:bg-cyan-50 font-bold px-8"
                        >
                            {isSaving ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}