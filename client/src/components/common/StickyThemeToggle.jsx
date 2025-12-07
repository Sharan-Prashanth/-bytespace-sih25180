'use client';

import { Moon, Sun, MoonStar } from 'lucide-react';

export default function StickyThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';

  const getNextThemeLabel = () => {
    if (theme === 'light') return 'Switch to dark mode';
    if (theme === 'dark') return 'Switch to darkest mode';
    return 'Switch to light mode';
  };

  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-lg ${cardBg} border shadow-lg ${hoverBg} transition-colors`}
      title={getNextThemeLabel()}
    >
      {theme === 'light' ? (
        <Moon className={`w-5 h-5 ${textColor}`} />
      ) : theme === 'dark' ? (
        <MoonStar className={`w-5 h-5 ${textColor}`} />
      ) : (
        <Sun className={`w-5 h-5 ${textColor}`} />
      )}
    </button>
  );
}
