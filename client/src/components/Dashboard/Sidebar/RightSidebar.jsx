'use client';

import {
    MessageSquare,
    MoreVertical,
    Phone,
    Video
} from 'lucide-react';

export default function RightSidebar() {
    return (
        <div className="w-80 bg-white border-l border-slate-100 flex flex-col h-full overflow-y-auto hidden xl:flex">
            {/* Profile Section */}
            <div className="p-6 border-b border-slate-50">
                <div className="bg-slate-50 rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden">
                    {/* Decorative background circle */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-full -mr-10 -mt-10 opacity-50"></div>

                    <div className="relative">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Megan"
                            alt="Megan Norton"
                            className="w-20 h-20 rounded-full border-4 border-white shadow-sm mb-3"
                        />
                        <div className="absolute bottom-3 right-0 w-5 h-5 bg-red-400 border-4 border-white rounded-full"></div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-lg">Megan Norton</h3>
                    <p className="text-sm text-slate-500 mb-6">@megnorton</p>

                    <div className="flex items-center gap-3 w-full justify-center">
                        <button className="p-2.5 bg-white rounded-full text-slate-600 shadow-sm hover:text-blue-600 hover:shadow-md transition-all">
                            <Phone size={18} />
                        </button>
                        <button className="p-2.5 bg-white rounded-full text-slate-600 shadow-sm hover:text-blue-600 hover:shadow-md transition-all">
                            <Video size={18} />
                        </button>
                        <button className="p-2.5 bg-white rounded-full text-slate-600 shadow-sm hover:text-blue-600 hover:shadow-md transition-all">
                            <MoreVertical size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Activity Section */}
            <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900">Activity</h3>
                    <button className="text-slate-400 hover:text-slate-600">
                        <MoreVertical size={18} />
                    </button>
                </div>

                <div className="space-y-6 relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100"></div>

                    {/* Activity Item 1 */}
                    <div className="relative pl-10">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Floyd"
                            alt="Floyd"
                            className="absolute left-0 top-0 w-8 h-8 rounded-full border-2 border-white shadow-sm z-10 bg-white"
                        />
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm text-slate-900">Floyd Miles</span>
                            <span className="text-xs text-slate-400">10:15 AM</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">Commented on <span className="text-blue-600 font-medium cursor-pointer">Stark Project</span></p>
                        <div className="bg-slate-50 p-3 rounded-xl rounded-tl-none text-sm text-slate-600 leading-relaxed">
                            Hi! Next week we'll start a new project. I'll tell you all the details later
                            <div className="flex justify-end mt-2">
                                <span className="text-lg">👍</span>
                            </div>
                        </div>
                    </div>

                    {/* Activity Item 2 */}
                    <div className="relative pl-10">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Guy"
                            alt="Guy"
                            className="absolute left-0 top-0 w-8 h-8 rounded-full border-2 border-white shadow-sm z-10 bg-white"
                        />
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm text-slate-900">Guy Hawkins</span>
                            <span className="text-xs text-slate-400">10:15 AM</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">Added a file to <span className="text-blue-600 font-medium cursor-pointer">7Heros Project</span></p>
                        <div className="bg-blue-50 p-3 rounded-xl flex items-center gap-3 border border-blue-100">
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">F</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">Homepage.fig</p>
                                <p className="text-xs text-slate-500">13.4 Mb</p>
                            </div>
                        </div>
                    </div>

                    {/* Activity Item 3 */}
                    <div className="relative pl-10">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Kristin"
                            alt="Kristin"
                            className="absolute left-0 top-0 w-8 h-8 rounded-full border-2 border-white shadow-sm z-10 bg-white"
                        />
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm text-slate-900">Kristin Watson</span>
                            <span className="text-xs text-slate-400">10:15 AM</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">Commented on <span className="text-blue-600 font-medium cursor-pointer">7Heros Project</span></p>
                    </div>
                </div>
            </div>

            {/* Message Input */}
            <div className="p-6 mt-auto">
                <div className="bg-slate-50 rounded-2xl p-2 flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600">
                        <div className="rotate-45">📎</div>
                    </button>
                    <input
                        type="text"
                        placeholder="Write a message"
                        className="flex-1 bg-transparent border-none outline-none text-sm placeholder-slate-400"
                    />
                    <button className="p-2 text-slate-400 hover:text-slate-600">
                        <MessageSquare size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
