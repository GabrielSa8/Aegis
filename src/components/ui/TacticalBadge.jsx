import React from 'react';

/**
 * TacticalBadge — Badge táctico con soporte de pulso reactivo y variantes de estado.
 * Diseñado bajo la Doctrina Aegis: 100% tokens temáticos.
 */
export function TacticalBadge({
  children,
  icon = null,
  variant = 'neutral',
  size = 'sm',
  pulse = false,
  className = '',
  style = {},
  title,
  ...props
}) {
  const sizeStyles = {
    xs: { padding: '1px 5px', fontSize: '10px', height: '18px', gap: '3px' },
    sm: { padding: '2px 7px', fontSize: '11px', height: '22px', gap: '5px' },
    md: { padding: '4px 9px', fontSize: '12px', height: '26px', gap: '6px' }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'var(--primary-glow)',
          color: 'var(--primary)',
          borderColor: 'var(--primary)'
        };
      case 'success':
        return {
          background: 'rgba(34, 197, 94, 0.12)',
          color: '#4ade80',
          borderColor: 'rgba(34, 197, 94, 0.3)'
        };
      case 'warning':
        return {
          background: 'rgba(234, 179, 8, 0.12)',
          color: '#facc15',
          borderColor: 'rgba(234, 179, 8, 0.3)'
        };
      case 'danger':
        return {
          background: 'rgba(239, 68, 68, 0.12)',
          color: '#f87171',
          borderColor: 'rgba(239, 68, 68, 0.3)'
        };
      case 'terminal':
        return {
          background: 'rgba(0, 0, 0, 0.45)',
          color: 'var(--primary)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          fontFamily: 'monospace'
        };
      case 'neutral':
      default:
        return {
          background: 'rgba(255, 255, 255, 0.04)',
          color: 'var(--text-dim)',
          borderColor: 'var(--border-color)'
        };
    }
  };

  const currentSize = sizeStyles[size] || sizeStyles.sm;
  const currentVariant = getVariantStyles();

  return (
    <span
      title={title}
      className={`tactical-badge-primitive ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-sm, 4px)',
        border: '1px solid',
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...currentSize,
        ...currentVariant,
        ...style
      }}
      {...props}
    >
      {pulse && (
        <span
          style={{
            width: size === 'xs' ? '4px' : '6px',
            height: size === 'xs' ? '4px' : '6px',
            borderRadius: '50%',
            background: 'currentColor',
            boxShadow: '0 0 6px currentColor',
            animation: 'pulse 1.8s infinite',
            display: 'inline-block'
          }}
        />
      )}
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children && <span>{children}</span>}
    </span>
  );
}
export default TacticalBadge;
