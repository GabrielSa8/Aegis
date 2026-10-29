import React from 'react';

/**
 * TabsBar — Selector táctico horizontal de pestañas y filtros.
 * Evita duplicar decenas de líneas de navegación en cada vista.
 */
export function TabsBar({
  tabs = [],
  activeTab,
  onChange,
  variant = 'pills',
  size = 'sm',
  className = '',
  style = {}
}) {
  const sizeStyles = {
    xs: { padding: '2px 6px', fontSize: '11px', height: '24px', gap: '4px' },
    sm: { padding: '3px 8px', fontSize: '12px', height: '28px', gap: '6px' },
    md: { padding: '5px 12px', fontSize: '13px', height: '32px', gap: '8px' }
  };

  const currentSize = sizeStyles[size] || sizeStyles.sm;

  return (
    <div
      className={`tactical-tabs-bar ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: variant === 'pills' ? 'rgba(0, 0, 0, 0.25)' : 'transparent',
        padding: variant === 'pills' ? '2px' : 0,
        borderRadius: 'var(--radius-sm, 4px)',
        border: variant === 'pills' ? '1px solid var(--border-color)' : 'none',
        gap: variant === 'underline' ? '12px' : '2px',
        userSelect: 'none',
        ...style
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = tab.disabled;

        const buttonStyles = () => {
          if (variant === 'underline') {
            return {
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              color: isActive ? 'var(--primary)' : 'var(--text-dim)',
              fontWeight: isActive ? 700 : 500,
              borderRadius: 0
            };
          }

          if (variant === 'terminal') {
            return {
              background: isActive ? 'var(--primary-glow)' : 'transparent',
              border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
              color: isActive ? 'var(--primary)' : 'var(--text-dim)',
              fontWeight: 600,
              fontFamily: 'monospace'
            };
          }

          // Default: pills
          return {
            background: isActive ? 'var(--primary)' : 'transparent',
            border: 'none',
            color: isActive ? '#000000' : 'var(--text-dim)',
            fontWeight: isActive ? 700 : 500,
            boxShadow: isActive ? '0 1px 4px rgba(0, 0, 0, 0.4)' : 'none'
          };
        };

        return (
          <button
            key={tab.id}
            type="button"
            disabled={isDisabled}
            title={tab.title}
            onClick={() => !isDisabled && onChange && onChange(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.4 : 1,
              transition: 'all 0.15s ease',
              borderRadius: 'var(--radius-sm, 3px)',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              ...currentSize,
              ...buttonStyles()
            }}
          >
            {tab.icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== null && (
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  background: isActive ? (variant === 'pills' ? 'rgba(0,0,0,0.2)' : 'var(--primary-glow)') : 'rgba(255,255,255,0.08)',
                  color: isActive ? (variant === 'pills' ? '#000000' : 'var(--primary)') : 'var(--text-dim)',
                  fontWeight: 700,
                  marginLeft: '2px'
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
export default TabsBar;
