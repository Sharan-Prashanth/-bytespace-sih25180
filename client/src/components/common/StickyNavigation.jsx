'use client';

import StickyBackButton from './StickyBackButton';
import StickyThemeToggle from './StickyThemeToggle';

export default function StickyNavigation({ 
  onBack, 
  backLabel = 'Back to Dashboard',
  theme, 
  onToggleTheme 
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between pointer-events-none">
      <div className="pointer-events-auto">
        <StickyBackButton onClick={onBack} label={backLabel} theme={theme} />
      </div>
      <div className="pointer-events-auto">
        <StickyThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </div>
  );
}
