import React from 'react';
import { FiX, FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';

/**
 * Reusable Alert Modal Component
 * Replaces window.alert() with a styled modal
 */
const AlertModal = ({
  isOpen,
  onClose,
  title = 'Alert',
  message = '',
  buttonText = 'OK',
  theme = 'light',
  variant = 'info' // 'info', 'success', 'warning', 'error'
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

  // Variant-based configurations
  const variantConfig = {
    info: {
      icon: FiInfo,
      iconColor: isDark ? 'text-blue-400' : 'text-blue-500',
      iconBg: isDark ? 'bg-blue-900/30' : 'bg-blue-100',
      buttonColor: isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
    },
    success: {
      icon: FiCheckCircle,
      iconColor: isDark ? 'text-green-400' : 'text-green-500',
      iconBg: isDark ? 'bg-green-900/30' : 'bg-green-100',
      buttonColor: isDark ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
    },
    warning: {
      icon: FiAlertTriangle,
      iconColor: isDark ? 'text-amber-400' : 'text-amber-500',
      iconBg: isDark ? 'bg-amber-900/30' : 'bg-amber-100',
      buttonColor: isDark ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
    },
    error: {
      icon: FiAlertCircle,
      iconColor: isDark ? 'text-red-400' : 'text-red-500',
      iconBg: isDark ? 'bg-red-900/30' : 'bg-red-100',
      buttonColor: isDark ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
    }
  };

  const config = variantConfig[variant] || variantConfig.info;
  const IconComponent = config.icon;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
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
            <div className={`p-2 rounded-lg ${config.iconBg}`}>
              <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <h3 className={`text-lg font-semibold ${textColor}`}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${hoverBg} ${textColor}`}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className={`${subTextColor} text-sm leading-relaxed whitespace-pre-wrap`}>{message}</p>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end p-4 border-t ${isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-slate-200'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${config.buttonColor}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
