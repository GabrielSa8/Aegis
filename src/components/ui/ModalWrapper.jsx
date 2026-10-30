import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const renderIcon = (iconItem, size = 16) => {
  if (!iconItem) return null;
  if (React.isValidElement(iconItem)) return iconItem;
  if (typeof iconItem === 'function' || (typeof iconItem === 'object' && iconItem !== null && iconItem.$$typeof)) {
    const IconComp = iconItem;
    return <IconComp size={size} />;
  }
  return iconItem;
};

/**
 * ModalWrapper — Contenedor modal universal para Aegis.
 * Renderizado 60/120fps GPU-composited sin backdrop-filter global ni daños de repintado Mesa (Zero Stutter / Cero Parpadeo).
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
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isActive, setIsActive] = useState(false);
  const modalRef = useRef(null);

  // Sincronización de montaje y animación fluida con doble rAF (Zero FOUC / Cero Parpadeo)
  useEffect(() => {
    let timer;
    if (isOpen) {
      setShouldRender(true);
      const animFrame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsActive(true);
        });
      });
      return () => cancelAnimationFrame(animFrame);
    } else {
      setIsActive(false);
      timer = setTimeout(() => {
        setShouldRender(false);
      }, 170);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Gestión de clics exteriores (Zero Fullscreen DOM Overlay) y teclado (Esc)
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (!closeOnBackdrop) return;
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        // Ignorar clics sobre disparadores de toggle explícitos
        if (e.target.closest && e.target.closest('[data-modal-toggle], [data-macro-modal-toggle]')) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      }
    };

    const handleKeyDown = (e) => {
      if (closeOnEsc && e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnBackdrop, closeOnEsc, onClose]);

  if (!shouldRender) return null;

  const modalNode = (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal'}
      className={`modal-content ${className} ${isActive ? 'is-active' : ''}`}
      style={{
        width: 'calc(100vw - 32px)',
        maxWidth
      }}
    >
      {/* Cabecera */}
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
            {icon && (
              <span style={{ color: 'var(--primary)', fontSize: '15px', display: 'inline-flex', alignItems: 'center' }}>
                {renderIcon(icon, 16)}
              </span>
            )}
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
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );

  return createPortal(modalNode, document.body);
}

export default ModalWrapper;
