import React from 'react';
import { AlertCircle, Check } from 'lucide-react';

/**
 * DevOpsToast — Notificación flotante para confirmación o error de operaciones Git y sistema.
 */
export function DevOpsToast({ toast }) {
  if (!toast) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: toast.isError ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
      color: '#ffffff',
      padding: '8px 14px',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      fontSize: '0.76rem',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      zIndex: 10000,
      animation: 'fadeIn 0.2s ease'
    }}>
      {toast.isError ? <AlertCircle size={14} /> : <Check size={14} />}
      <span>{toast.text}</span>
    </div>
  );
}
