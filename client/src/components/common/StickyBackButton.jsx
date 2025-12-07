'use client';

import { ArrowLeft } from 'lucide-react';

export default function StickyBackButton({ onClick, label = 'Back to Dashboard', theme = 'light' }) {
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-0 p-2 ${cardBg} border rounded-lg shadow-lg ${hoverBg} transition-all duration-300 overflow-hidden`}
      title={label}
    >
      <ArrowLeft className={`w-5 h-5 ${textColor} flex-shrink-0`} />
      <span className={`text-sm font-medium ${textColor} max-w-0 group-hover:max-w-40 group-hover:ml-2 group-hover:pr-1 overflow-hidden whitespace-nowrap transition-all duration-300`}>
        {label}
      </span>
    </button>
  );
}
