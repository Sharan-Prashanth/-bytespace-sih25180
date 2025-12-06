import React from 'react';
import { FiX, FiAlertTriangle, FiTrash2 } from 'react-icons/fi';

/**
 * Remove Form Modal Component
 * Replaces window.confirm() for form/file removal confirmations
 */
const RemoveFormModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Remove Form',
  message = 'Are you sure you want to remove this form? This action cannot be undone.',
  warningMessage = '',
  confirmText = 'Remove',
  cancelText = 'Cancel',
  isLoading = false,
  theme = 'light'
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
  const warningBg = isDark ? 'bg-amber-900/30 border-amber-800' : 'bg-amber-50 border-amber-200';
  const warningText = isDark ? 'text-amber-300' : 'text-amber-700';

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
            <div className={`p-2 rounded-lg ${isDark ? 'bg-red-900/30' : 'bg-red-100'}`}>
              <FiTrash2 className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
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
        <div className="p-6 space-y-4">
          <p className={`${subTextColor} text-sm leading-relaxed`}>{message}</p>
          
          {warningMessage && (
            <div className={`p-3 rounded-lg border ${warningBg}`}>
              <div className="flex items-start gap-2">
                <FiAlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${warningText}`} />
                <p className={`text-sm ${warningText}`}>{warningMessage}</p>
              </div>
            </div>
          )}
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
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isDark ? 'bg-red-600 hover:bg-red-500' : 'bg-red-500 hover:bg-red-600'} text-white disabled:opacity-50 flex items-center gap-2`}
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

export default RemoveFormModal;
