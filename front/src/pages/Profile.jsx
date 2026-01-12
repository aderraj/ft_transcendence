import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { authenticatedFetch, authenticatedFileUpload } from '@/utils/api'; 
import ProfileHeader from '@/components/ProfileHeader';
import EditProfileForm from '@/components/ProfileEditForm';
import SecuritySettings from '@/components/ProfileSecuritySettings';
import PasswordResetModal from '@/components/modals/PasswordResetModal';
import TwoFactorModal from '@/components/modals/TwoFactorModal';

export default function Profile() {

    const { user: authUser, refreshUser } = useAuth(); 
    const { friends, users: cachedUsers } = useAppData();
    const { userId } = useParams();

    const isOwnProfile = !userId || userId === authUser?.id;
    const initialData = isOwnProfile 
        ? authUser 
        : friends.find(f => f.id === userId) || cachedUsers.find(u => u.id === userId);

    const [profile, setProfile] = useState(initialData || null);
    const [loadingSensitiveData, setLoadingSensitiveData] = useState(isOwnProfile); 
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const [formData, setFormData] = useState({
        username: initialData?.username || '',
        displayName: initialData?.displayName || '',
        email: '', 
    });

    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [twoFactorStep, setTwoFactorStep] = useState('init'); 
    const [twoFactorLoading, setTwoFactorLoading] = useState(false);
    const [securityError, setSecurityError] = useState('');

    const [isChangePassModalOpen, setIsChangePassModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passLoading, setPassLoading] = useState(false);
    const [passError, setPassError] = useState('');
    const [passSuccess, setPassSuccess] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchDeepProfile = async () => {
            try {
                const endpoint = isOwnProfile ? '/api/users/me' : `/api/users/${userId}`;
                const res = await authenticatedFetch(endpoint);
                if (res.ok) {
                    const data = await res.json();
                    setProfile(prev => ({ ...prev, ...data })); 
                    setFormData(prev => ({
                        ...prev,
                        username: data.username || prev.username,
                        displayName: data.displayName || prev.displayName,
                        email: data.email || '',
                    }));
                }
            } catch (error) { console.error(error); } 
            finally { setLoadingSensitiveData(false); }
        };
        fetchDeepProfile();
    }, [userId, isOwnProfile]);

    const handleSaveProfile = async () => {
        if (!isOwnProfile) return;
        setIsSaving(true);
        try {
            const res = await authenticatedFetch('/api/users/me', {
                method: 'PUT',
                body: JSON.stringify({
                    username: formData.username,
                    displayName: formData.displayName,
                })
            });
            if (res.ok) {
                const updated = await res.json();
                setProfile(prev => ({ ...prev, ...updated }));
                if (refreshUser) await refreshUser();
            }
        } catch (error) { console.error(error); } 
        finally { setIsSaving(false); }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !isOwnProfile) return;
        setIsUploading(true);
        try {
            const uploadData = new FormData();
            uploadData.append('file', file);
            const res = await authenticatedFileUpload('/api/users/me/avatar', uploadData);
            if (res.ok) {
                const profileRes = await authenticatedFetch('/api/users/me');
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    setProfile(prev => ({ ...prev, avatar: data.avatar }));
                    if (refreshUser) await refreshUser(); 
                }
            }
        } catch (error) { console.error(error); } 
        finally { setIsUploading(false); }
    };

    const openChangePasswordModal = () => {
        setPassError('');
        setPassSuccess(false);
        setNewPassword('');
        setConfirmPassword('');
        setIsChangePassModalOpen(true);
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setPassError("Passwords do not match.");
            return;
        }
        setPassError('');
        setPassLoading(true);
        try {
            const res = await authenticatedFetch('/api/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ newPassword: newPassword })
            });
            if (res.ok) {
                setPassSuccess(true);
                setTimeout(() => {
                    setIsChangePassModalOpen(false);
                    setPassSuccess(false);
                }, 2000);
            } else {
                const data = await res.json();
                setPassError(data.message || "Failed to update password.");
            }
        } catch (err) {
            setPassError("An error occurred.");
        } finally {
            setPassLoading(false);
        }
    };

    const open2FAModal = async () => {
        setSecurityError('');
        setTwoFactorCode('');
        setIs2FAModalOpen(true);
        if (profile?.isTwoFactorEnabled) {
            setTwoFactorStep('disable');
        } else {
            setTwoFactorStep('init');
            setTwoFactorLoading(true);
            try {
                const res = await authenticatedFetch('/api/auth/2fa/generate', { method: 'POST' });
                if (res.ok) {
                    const data = await res.json();
                    setQrCodeUrl(data.qrCode); 
                    setTwoFactorStep('verify');
                }
            } catch (e) { setSecurityError("Failed to generate QR Code"); } 
            finally { setTwoFactorLoading(false); }
        }
    };

    const handle2FAAction = async () => {
        setSecurityError('');
        setTwoFactorLoading(true);
        try {
            const endpoint = twoFactorStep === 'disable' ? '/api/auth/2fa/disable' : '/api/auth/2fa/enable';
            const res = await authenticatedFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({ code: twoFactorCode })
            });
            if (res.ok) {
                const newState = twoFactorStep !== 'disable';
                setProfile(prev => ({ ...prev, isTwoFactorEnabled: newState }));
                setIs2FAModalOpen(false);
                
                // Optional: Refresh global user if 2FA status is shown elsewhere
                if (refreshUser) await refreshUser();
            } else {
                setSecurityError("Invalid Code.");
            }
        } catch (e) { setSecurityError("Operation failed."); } 
        finally { setTwoFactorLoading(false); }
    };

    if (!profile && !initialData) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <PasswordResetModal 
                isOpen={isChangePassModalOpen}
                onClose={() => !passLoading && setIsChangePassModalOpen(false)}
                onConfirm={handleChangePassword}
                loading={passLoading}
                error={passError}
                success={passSuccess}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
            />

            <TwoFactorModal 
                isOpen={is2FAModalOpen}
                onClose={() => setIs2FAModalOpen(false)}
                step={twoFactorStep}
                qrCodeUrl={qrCodeUrl}
                code={twoFactorCode}
                setCode={setTwoFactorCode}
                onConfirm={handle2FAAction}
                loading={twoFactorLoading}
                error={securityError}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    <ProfileHeader 
                        profile={profile} 
                        isOwnProfile={isOwnProfile}
                        isUploading={isUploading}
                        onAvatarClick={() => fileInputRef.current?.click()}
                        fileInputRef={fileInputRef}
                        onFileChange={handleFileChange}
                    />
                </div>

                <div className="lg:col-span-8 space-y-6">
                    <EditProfileForm 
                        formData={formData}
                        handleInputChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                        handleSave={handleSaveProfile}
                        isSaving={isSaving}
                        isOwnProfile={isOwnProfile}
                        loadingSensitiveData={loadingSensitiveData}
                    />

                    <SecuritySettings 
                        isOwnProfile={isOwnProfile}
                        loadingSensitiveData={loadingSensitiveData}
                        isTwoFactorEnabled={profile?.isTwoFactorEnabled}
                        onOpenChangePassword={openChangePasswordModal}
                        onOpen2FA={open2FAModal}
                        resetLoading={passLoading}
                    />
                </div>
            </div>
        </div>
    );
}