import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * ModalWrapper — Contenedor modal táctico universal para Aegis.
 * Soporta cierre con ESC, clic en backdrop, portal seguro y animación nativa.
 */
export function ModalWrapper({
  isOpen = false,
  onClose,
  title,
  icon = null,
  children,
  footer = null,
  maxWidth = '520px',
  closeOnEsc = true,
  closeOnBackdrop = true,
  className = '',
  bodyStyle = {}
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (closeOnEsc && e.key === 'Escape' && onClose) {
        e.stopPropagation();
        onClose();
      }
    },
    [closeOnEsc, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const modalNode = (
    <div
      className="modal-overlay"
      onClick={closeOnBackdrop ? onClose : undefined}
      style={{
        zIndex: 9999,
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div
        className={`modal-content ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          background: 'var(--bg-card, #12141a)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg, 8px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Cabecera Táctica */}
        {(title || icon || onClose) && (
          <div
            className="modal-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {icon && <span style={{ color: 'var(--primary)', fontSize: '15px' }}>{icon}</span>}
              <h3
                style={{
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--text-main)',
                  fontFamily: 'monospace'
                }}
              >
                {title}
              </h3>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="Cerrar (Esc)"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#f87171';
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-dim)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Cuerpo del Modal */}
        <div
          className="modal-body custom-scrollbar"
          style={{
            padding: '16px',
            overflowY: 'auto',
            flex: 1,
            ...bodyStyle
          }}
        >
          {children}
        </div>

        {/* Pie opcional */}
        {footer && (
          <div
            className="modal-footer"
            style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--border-color)',
              background: 'rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '8px'
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}
export default ModalWrapper;
