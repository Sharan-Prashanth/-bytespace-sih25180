'use client';

import { Bell, Lock, Moon, Shield, Sun } from "lucide-react";

export default function UserSettingsSection({ theme, toggleTheme }) {
    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
    const toggleBg = isDark ? 'bg-slate-700' : 'bg-slate-200';
    const toggleCircle = isDark ? 'bg-white translate-x-6' : 'bg-white translate-x-1';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h2 className={`text-2xl font-bold ${textColor}`}>Settings</h2>
                <p className={`${subTextColor} text-sm mt-1`}>Manage your preferences and account security.</p>
            </div>

            {/* Appearance */}
            <div className={`${cardBg} p-8 rounded-3xl shadow-sm border`}>
                <div className="flex items-center gap-4 mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                        {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${textColor}`}>Appearance</h3>
                        <p className={`text-sm ${subTextColor}`}>Customize the look and feel of your dashboard.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['light', 'dark', 'darkest'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => {
                                // This is a bit hacky since toggleTheme just cycles, but for UI demo it's fine.
                                // In a real app, we'd have setTheme(mode).
                                // For now, we'll just show the active state.
                                if (theme !== mode) {
                                    // Trigger toggle until match (not ideal but works for simple toggle prop)
                                    toggleTheme();
                                    if (mode === 'darkest' && theme === 'light') toggleTheme(); // light -> dark -> darkest
                                }
                            }}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${theme === mode
                                ? (isDark ? 'border-blue-500 bg-blue-900/10' : 'border-blue-600 bg-blue-50')
                                : (isDark ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300')
                                }`}
                        >
                            <div className={`w-full h-24 rounded-lg mb-3 ${mode === 'light' ? 'bg-slate-100 border border-slate-200' :
                                    mode === 'dark' ? 'bg-slate-900 border border-slate-800' :
                                        'bg-black border border-neutral-800'
                                }`}></div>
                            <span className={`font-bold capitalize ${textColor}`}>{mode} Mode</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications */}
            <div className={`${cardBg} p-8 rounded-3xl shadow-sm border`}>
                <div className="flex items-center gap-4 mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        <Bell size={20} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${textColor}`}>Notifications</h3>
                        <p className={`text-sm ${subTextColor}`}>Choose how you want to be notified.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {['Email Notifications', 'Push Notifications', 'SMS Alerts'].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b last:border-0 border-dashed border-slate-200 dark:border-slate-700">
                            <span className={`font-medium ${textColor}`}>{item}</span>
                            <button className={`w-12 h-6 rounded-full transition-colors relative ${i === 0 ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${i === 0 ? 'translate-x-6' : ''}`}></div>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Security */}
            <div className={`${cardBg} p-8 rounded-3xl shadow-sm border`}>
                <div className="flex items-center gap-4 mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                        <Shield size={20} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${textColor}`}>Security</h3>
                        <p className={`text-sm ${subTextColor}`}>Manage your password and account security.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <button className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-3">
                            <Lock size={18} className={subTextColor} />
                            <span className={`font-medium ${textColor}`}>Change Password</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>Last changed 30 days ago</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
