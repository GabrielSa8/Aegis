import React from 'react';

/**
 * TacticalButton — Botón táctico unificado para el ecosistema Aegis.
 * Respeta 100% la Doctrina Aegis: cero hardcode, 100% variables temáticas.
 */
export function TacticalButton({
  children,
  icon = null,
  kbd = null,
  variant = 'ghost',
  size = 'sm',
  active = false,
  disabled = false,
  loading = false,
  onClick,
  title,
  className = '',
  style = {},
  type = 'button',
  ...props
}) {
  const sizeStyles = {
    xs: { padding: '2px 6px', fontSize: '11px', height: '22px', gap: '4px' },
    sm: { padding: '4px 8px', fontSize: '12px', height: '28px', gap: '6px' },
    md: { padding: '6px 12px', fontSize: '13px', height: '34px', gap: '8px' },
    lg: { padding: '8px 16px', fontSize: '14px', height: '40px', gap: '10px' }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'var(--primary)',
          color: '#000000',
          borderColor: 'var(--primary)',
          fontWeight: 700,
          boxShadow: '0 0 12px var(--primary-glow)'
        };
      case 'secondary':
        return {
          background: 'rgba(255, 255, 255, 0.04)',
          color: 'var(--text-main)',
          borderColor: 'var(--border-color)'
        };
      case 'danger':
        return {
          background: 'rgba(239, 68, 68, 0.12)',
          color: '#f87171',
          borderColor: 'rgba(239, 68, 68, 0.35)'
        };
      case 'terminal':
        return {
          background: active ? 'var(--primary-glow)' : 'rgba(0, 0, 0, 0.35)',
          color: active ? 'var(--primary)' : 'var(--text-dim)',
          borderColor: active ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
          fontFamily: 'monospace'
        };
      case 'ghost':
      default:
        return {
          background: active ? 'var(--primary-glow)' : 'transparent',
          color: active ? 'var(--primary)' : 'var(--text-dim)',
          borderColor: active ? 'var(--primary)' : 'transparent'
        };
    }
  };

  const currentSize = sizeStyles[size] || sizeStyles.sm;
  const currentVariant = getVariantStyles();

  return (
    <button
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      title={title}
      className={`tactical-btn-primitive ${active ? 'is-active' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-sm, 4px)',
        border: '1px solid',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: 'inherit',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        lineHeight: 1,
        ...currentSize,
        ...currentVariant,
        ...style
      }}
      {...props}
    >
      {loading ? (
        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
      ) : (
        icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      )}
      {children && <span>{children}</span>}
      {kbd && (
        <span
          className="tactical-kbd"
          style={{
            fontSize: '9px',
            padding: '1px 4px',
            marginLeft: '2px',
            opacity: 0.85
          }}
        >
          {kbd}
        </span>
      )}
    </button>
  );
}
export default TacticalButton;
