import React from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';

/**
 * Reusable Confirmation Modal Component
 * Replaces window.confirm() with a styled modal
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  theme = 'light',
  variant = 'warning' // 'warning', 'danger', 'info'
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';

  // Theme-based classes
  const overlayBg = 'bg-black/50';
  const modalBg = isDarkest ? 'bg-neutral-900 border-neutral-700' : isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200';
  const textColor = isDark ? 'text-white' : 'text-black';
  const subTextColor = isDark ? 'text-slate-300' : 'text-black';
  const hoverBg = isDark ? 'hover:bg-white/10' : 'hover:bg-black/10';

  // Variant-based icon colors
  const iconColors = {
    warning: isDark ? 'text-amber-400' : 'text-amber-500',
    danger: isDark ? 'text-red-400' : 'text-red-500',
    info: isDark ? 'text-blue-400' : 'text-blue-500'
  };

  const iconBgColors = {
    warning: isDark ? 'bg-amber-900/30' : 'bg-amber-100',
    danger: isDark ? 'bg-red-900/30' : 'bg-red-100',
    info: isDark ? 'bg-blue-900/30' : 'bg-blue-100'
  };

  // Button colors based on variant
  const confirmBtnColors = {
    warning: isDark ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white',
    danger: isDark ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-500 hover:bg-red-600 text-white',
    info: isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (isLoading) return;
    await onConfirm();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg} backdrop-blur-sm`}
      onClick={handleOverlayClick}
    >
      <div className={`${modalBg} border rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${iconBgColors[variant]}`}>
              <FiAlertTriangle className={`w-5 h-5 ${iconColors[variant]}`} />
            </div>
            <h3 className={`text-lg font-semibold ${textColor}`}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-colors ${hoverBg} ${textColor} disabled:opacity-50`}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className={`${subTextColor} text-sm leading-relaxed`}>{message}</p>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 p-4 border-t ${isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-slate-200'}`}>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${isDarkest ? 'border-neutral-600' : isDark ? 'border-slate-500' : 'border-slate-300'} ${textColor} ${hoverBg} disabled:opacity-50`}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${confirmBtnColors[variant]} disabled:opacity-50 flex items-center gap-2`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
