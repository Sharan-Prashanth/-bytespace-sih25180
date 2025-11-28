'use client';

import { Camera, Mail, MapPin, Phone, Save, User } from "lucide-react";

export default function UserProfileSection({ user, theme }) {
    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
    const inputBg = isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h2 className={`text-2xl font-bold ${textColor}`}>My Profile</h2>
                <p className={`${subTextColor} text-sm mt-1`}>Manage your personal information and account details.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className={`lg:col-span-1 ${cardBg} p-6 rounded-3xl shadow-sm border flex flex-col items-center text-center`}>
                    <div className="relative mb-4 group cursor-pointer">
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold overflow-hidden ${isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-600'}`}>
                            {user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={24} />
                        </div>
                    </div>
                    <h3 className={`text-xl font-bold ${textColor}`}>{user?.fullName || 'User Name'}</h3>
                    <p className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Principal Investigator</p>

                    <div className={`w-full mt-6 pt-6 border-t space-y-4 ${isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-3 text-sm">
                            <Mail size={16} className={subTextColor} />
                            <span className={textColor}>{user?.email || 'user@example.com'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Phone size={16} className={subTextColor} />
                            <span className={textColor}>+91 98765 43210</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <MapPin size={16} className={subTextColor} />
                            <span className={textColor}>New Delhi, India</span>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className={`lg:col-span-2 ${cardBg} p-8 rounded-3xl shadow-sm border`}>
                    <h3 className={`text-lg font-bold mb-6 ${textColor}`}>Edit Information</h3>
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Full Name</label>
                                <div className="relative">
                                    <User size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${subTextColor}`} />
                                    <input
                                        type="text"
                                        defaultValue={user?.fullName}
                                        className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Email Address</label>
                                <div className="relative">
                                    <Mail size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${subTextColor}`} />
                                    <input
                                        type="email"
                                        defaultValue={user?.email}
                                        className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Phone Number</label>
                                <div className="relative">
                                    <Phone size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${subTextColor}`} />
                                    <input
                                        type="tel"
                                        defaultValue="+91 98765 43210"
                                        className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Organization</label>
                                <div className="relative">
                                    <MapPin size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${subTextColor}`} />
                                    <input
                                        type="text"
                                        defaultValue="Indian Institute of Technology"
                                        className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Bio</label>
                            <textarea
                                rows="4"
                                className={`w-full p-4 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                defaultValue="Principal Investigator with over 10 years of experience in Coal Mining research."
                            ></textarea>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="button" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20">
                                <Save size={18} />
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
