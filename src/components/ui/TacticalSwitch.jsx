import React from 'react';

/**
 * TacticalSwitch — Interruptor deslizante táctico con label y descripción opcional.
 * Conecta directamente con los estilos de alto contraste de Aegis.
 */
export function TacticalSwitch({
  checked = false,
  onChange,
  label = null,
  description = null,
  disabled = false,
  id = null,
  className = '',
  style = {},
  ...props
}) {
  const switchId = id || `tactical-switch-${Math.random().toString(36).substr(2, 9)}`;

  const handleChange = (e) => {
    if (disabled) return;
    if (onChange) {
      onChange(e.target.checked, e);
    }
  };

  const content = (
    <div
      className={`tactical-switch-container ${disabled ? 'opacity-50' : ''} ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        userSelect: 'none',
        ...style
      }}
    >
      {(label || description) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
          {label && (
            <label
              htmlFor={switchId}
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-main)',
                cursor: disabled ? 'not-allowed' : 'pointer'
              }}
            >
              {label}
            </label>
          )}
          {description && (
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.3 }}>
              {description}
            </span>
          )}
        </div>
      )}

      <label className="tactical-switch" style={{ margin: 0, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <input
          id={switchId}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          {...props}
        />
      </label>
    </div>
  );

  return content;
}
export default TacticalSwitch;
