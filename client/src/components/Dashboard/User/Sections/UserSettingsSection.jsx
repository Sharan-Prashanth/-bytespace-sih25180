'use client';

import { AlertCircle, Check, Eye, EyeOff, Loader2, Lock, Moon, Shield, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function UserSettingsSection({ theme, setTheme }) {
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState(null);
    const [isPageLoaded, setIsPageLoaded] = useState(false);

    useEffect(() => {
        setIsPageLoaded(true);
    }, []);

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-black';
    const subTextColor = isDark ? 'text-slate-400' : 'text-black';
    const inputBg = isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
    const modalBg = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-white';

    // Persist theme to localStorage
    useEffect(() => {
        if (theme) {
            localStorage.setItem('prism-theme', theme);
        }
    }, [theme]);

    const handleThemeChange = (mode) => {
        if (setTheme) {
            setTheme(mode);
        }
    };

    const handlePasswordChange = async () => {
        // Validation
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'All fields are required' });
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setIsChangingPassword(true);
        setPasswordMessage(null);

        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
            const response = await fetch(`${apiUrl}/api/users/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to change password');
            }

            setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            
            // Close modal after success
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordMessage(null);
            }, 2000);
        } catch (error) {
            console.error('Error changing password:', error);
            setPasswordMessage({ type: 'error', text: error.message || 'Failed to change password' });
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-4">
            {/* Header */}
            <div 
                className={`transition-all duration-500 ease-out ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
                <h2 className={`text-xl font-bold ${textColor}`}>Settings</h2>
                <p className={`${subTextColor} text-sm`}>Manage your preferences and account security.</p>
            </div>

            {/* Appearance */}
            <div 
                className={`${cardBg} p-5 rounded-2xl shadow-sm border transition-all duration-500 ease-out ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: '100ms' }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                        {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                    </div>
                    <div>
                        <h3 className={`text-base font-bold ${textColor}`}>Appearance</h3>
                        <p className={`text-sm ${subTextColor}`}>Customize the look and feel of your dashboard.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['light', 'dark', 'darkest'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => handleThemeChange(mode)}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${theme === mode
                                ? (isDark ? 'border-blue-500 bg-blue-900/10' : 'border-blue-600 bg-blue-50')
                                : (isDark ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300')
                                }`}
                        >
                            <div className={`w-full h-20 rounded-lg mb-2.5 flex items-center justify-center ${mode === 'light' ? 'bg-slate-100 border border-slate-200' :
                                    mode === 'dark' ? 'bg-slate-900 border border-slate-800' :
                                        'bg-black border border-neutral-800'
                                }`}>
                                {mode === 'light' && <Sun size={22} className="text-amber-500" />}
                                {mode === 'dark' && <Moon size={22} className="text-blue-400" />}
                                {mode === 'darkest' && <Moon size={22} className="text-purple-400" />}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={`font-bold capitalize text-sm ${textColor}`}>{mode === 'darkest' ? 'Midnight' : mode} Mode</span>
                                {theme === mode && (
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`}>
                                        <Check size={12} className="text-white" />
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Security */}
            <div 
                className={`${cardBg} p-5 rounded-2xl shadow-sm border transition-all duration-500 ease-out ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: '200ms' }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                        <Shield size={18} />
                    </div>
                    <div>
                        <h3 className={`text-base font-bold ${textColor}`}>Security</h3>
                        <p className={`text-sm ${subTextColor}`}>Manage your password and account security.</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <button 
                        onClick={() => setShowPasswordModal(true)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                        <div className="flex items-center gap-3">
                            <Lock size={16} className={subTextColor} />
                            <span className={`font-medium text-sm ${textColor}`}>Change Password</span>
                        </div>
                        <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Update</span>
                    </button>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowPasswordModal(false);
                            setPasswordMessage(null);
                            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }
                    }}
                >
                    <div className={`${modalBg} rounded-2xl shadow-2xl max-w-md w-full p-5 border ${isDark ? 'border-slate-700' : 'border-slate-200'} animate-scaleIn`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                <Lock size={18} />
                            </div>
                            <div>
                                <h3 className={`text-base font-bold ${textColor}`}>Change Password</h3>
                                <p className={`text-sm ${subTextColor}`}>Enter your current and new password</p>
                            </div>
                        </div>

                        {/* Message */}
                        {passwordMessage && (
                            <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${
                                passwordMessage.type === 'success' 
                                    ? (isDark ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 'bg-green-50 text-green-700 border border-green-100')
                                    : (isDark ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-red-50 text-red-700 border border-red-100')
                            }`}>
                                {passwordMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                <span className="text-sm font-medium">{passwordMessage.text}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Current Password */}
                            <div className="space-y-1.5">
                                <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                        className={`w-full px-4 py-2.5 pr-10 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${subTextColor} hover:opacity-70`}
                                    >
                                        {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="space-y-1.5">
                                <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                        className={`w-full px-4 py-2.5 pr-10 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${subTextColor} hover:opacity-70`}
                                    >
                                        {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        className={`w-full px-4 py-2.5 pr-10 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${subTextColor} hover:opacity-70`}
                                    >
                                        {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPasswordMessage(null);
                                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                }}
                                className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-700/50' : 'border-slate-200 text-black hover:bg-slate-50'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePasswordChange}
                                disabled={isChangingPassword}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
                            >
                                {isChangingPassword ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Changing...</span>
                                    </>
                                ) : (
                                    <span>Change Password</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
