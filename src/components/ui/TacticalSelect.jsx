import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * TacticalSelect — Selector desplegable personalizado con diseño de cabina Aegis.
 * Reemplaza selectores nativos HTML para unificar estilo visual, scroll táctil y estados.
 *
 * Props:
 * - value: valor actual seleccionado
 * - onChange: callback(newValue)
 * - options: Array de { value, label, desc, badge, group } o strings directos
 * - placeholder: texto cuando no hay valor seleccionado
 * - icon: Icono Lucide opcional
 * - disabled: booleano
 * - size: 'sm' | 'md'
 * - style: estilos inline para el contenedor
 */
export function TacticalSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  icon: Icon = null,
  disabled = false,
  size = 'md',
  style = {},
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalizar opciones
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const isSmall = size === 'sm';

  return (
    <div
      ref={containerRef}
      className={`tactical-select-container ${disabled ? 'disabled' : ''} ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        minWidth: isSmall ? '110px' : '160px',
        boxSizing: 'border-box',
        ...style
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className="tactical-select-trigger"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          padding: isSmall ? '5px 8px' : '7px 10px',
          fontSize: isSmall ? '0.72rem' : '0.78rem',
          background: 'color-mix(in srgb, var(--bg-card) 85%, transparent)',
          border: `1px solid ${isOpen ? 'var(--primary)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-sm)',
          color: selectedOption ? 'var(--text-high)' : 'var(--text-muted)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'all var(--transition-fast)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
          {Icon && <Icon size={isSmall ? 12 : 14} color="var(--primary)" style={{ flexShrink: 0 }} />}
          <span style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontWeight: selectedOption ? 600 : 400
          }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          size={isSmall ? 11 : 13}
          color="var(--text-muted)"
          style={{
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.16s ease'
          }}
        />
      </button>

      {isOpen && (
        <div
          className="tactical-select-popover no-scrollbar"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1050,
            minWidth: '100%',
            maxHeight: '220px',
            overflowY: 'auto',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          {normalizedOptions.length === 0 ? (
            <div style={{ padding: '6px 8px', fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Sin opciones
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`tactical-select-item ${isSelected ? 'selected' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isSmall ? '5px 8px' : '6px 10px',
                    borderRadius: 'var(--radius-xs, 4px)',
                    border: 'none',
                    background: isSelected ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'transparent',
                    color: isSelected ? 'var(--primary)' : 'var(--text-high)',
                    fontSize: isSmall ? '0.7rem' : '0.74rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    gap: '8px',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opt.label}
                    </span>
                    {opt.desc && (
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                        {opt.desc}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={12} color="var(--primary)" style={{ flexShrink: 0 }} />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default TacticalSelect;
