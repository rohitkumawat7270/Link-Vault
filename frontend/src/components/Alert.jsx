import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const Alert = ({ type = 'info', message, onClose }) => {
  const variants = {
    success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: CheckCircle, iconColor: 'text-green-500' },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: XCircle, iconColor: 'text-red-500' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: AlertCircle, iconColor: 'text-yellow-500' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: Info, iconColor: 'text-blue-500' }
  };

  const variant = variants[type];
  const Icon = variant.icon;

  return (
    <div className={`${variant.bg} ${variant.border} border rounded-lg p-4 flex items-start gap-3 animate-fadeIn`}>
      <Icon className={`w-5 h-5 ${variant.iconColor} flex-shrink-0 mt-0.5`} />
      <p className={`${variant.text} flex-1 text-sm`}>{message}</p>
      {onClose && (
        <button onClick={onClose} className={`${variant.text} hover:opacity-70 transition-opacity`}>✕</button>
      )}
    </div>
  );
};

export default Alert;