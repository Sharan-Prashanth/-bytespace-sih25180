import { ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

export default function CalendarWidget({ onClose, theme }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [notes, setNotes] = useState({
        '2025-11-28': ['Review Q3 Budget', 'Team Sync at 2 PM'],
        '2025-12-05': ['Project Deadline'],
    });
    const [newNote, setNewNote] = useState("");

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const bgClass = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
    const textClass = isDark ? 'text-white' : 'text-slate-900';
    const subTextClass = isDark ? 'text-slate-400' : 'text-slate-500';
    const hoverClass = isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50';
    const inputBg = isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900';

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const formatDateKey = (date) => {
        return date.toISOString().split('T')[0];
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(newDate);
    };

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        const key = formatDateKey(selectedDate);
        setNotes(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), newNote]
        }));
        setNewNote("");
    };

    const handleDeleteNote = (index) => {
        const key = formatDateKey(selectedDate);
        setNotes(prev => ({
            ...prev,
            [key]: prev[key].filter((_, i) => i !== index)
        }));
    };

    const renderCalendarDays = () => {
        const days = [];
        const totalDays = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate);
        const selectedKey = formatDateKey(selectedDate);
        const todayKey = formatDateKey(new Date());

        // Empty cells for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
        }

        // Days
        for (let i = 1; i <= totalDays; i++) {
            const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const currentDayKey = formatDateKey(currentDayDate);
            const hasNotes = notes[currentDayKey] && notes[currentDayKey].length > 0;
            const isSelected = currentDayKey === selectedKey;
            const isToday = currentDayKey === todayKey;

            days.push(
                <button
                    key={i}
                    onClick={() => handleDateClick(i)}
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium relative transition-all
                        ${isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                            : isToday
                                ? (isDark ? 'bg-slate-700 text-blue-400 border border-blue-500/50' : 'bg-blue-50 text-blue-600 border border-blue-200')
                                : (isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100')}
                    `}
                >
                    {i}
                    {hasNotes && !isSelected && (
                        <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isToday ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                    )}
                </button>
            );
        }
        return days;
    };

    return (
        <div className={`absolute right-0 top-12 w-80 rounded-2xl shadow-xl border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${bgClass}`}>
            {/* Header */}
            <div className={`p-4 flex items-center justify-between border-b ${isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                <h3 className={`font-bold ${textClass}`}>
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex items-center gap-1">
                    <button onClick={handlePrevMonth} className={`p-1 rounded-lg ${hoverClass} ${subTextClass}`}>
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={handleNextMonth} className={`p-1 rounded-lg ${hoverClass} ${subTextClass}`}>
                        <ChevronRight size={16} />
                    </button>
                    <button onClick={onClose} className={`p-1 rounded-lg hover:bg-red-50 hover:text-red-500 ml-2 ${subTextClass}`}>
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                        <div key={d} className={`text-[10px] font-bold uppercase ${subTextClass}`}>{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1 place-items-center">
                    {renderCalendarDays()}
                </div>
            </div>

            {/* Notes Section */}
            <div className={`p-4 border-t ${isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${subTextClass}`}>
                    Notes for {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </h4>

                <div className="space-y-2 mb-3 max-h-32 overflow-y-auto custom-scrollbar">
                    {notes[formatDateKey(selectedDate)]?.map((note, idx) => (
                        <div key={idx} className={`flex items-start justify-between gap-2 p-2 rounded-lg text-xs group ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                            <span className={textClass}>{note}</span>
                            <button
                                onClick={() => handleDeleteNote(idx)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    {(!notes[formatDateKey(selectedDate)] || notes[formatDateKey(selectedDate)].length === 0) && (
                        <p className={`text-xs italic ${subTextClass}`}>No notes for this day.</p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                        placeholder="Add a note..."
                        className={`flex-1 px-3 py-2 rounded-lg text-xs outline-none border transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg}`}
                    />
                    <button
                        onClick={handleAddNote}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
