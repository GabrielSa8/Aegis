import { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, ChevronUp, Check, Layers } from 'lucide-react';

export default function VaultHubDropdown({
  value,
  onChange,
  hubs = []
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const displayLabel = value === 'Todos' ? 'Todos los Hubs' : value;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Botón Disparador Táctico */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          padding: '4px 8px',
          fontSize: '0.68rem',
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${isOpen ? 'var(--primary)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-sm, 5px)',
          color: 'var(--text-high)',
          cursor: 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'all 0.16s ease'
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
          <Filter size={11} color="var(--primary)" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              color: 'var(--text-high)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {displayLabel}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
          {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </div>
      </button>

      {/* Menú Desplegable con Efecto Glass */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 'calc(100% + 4px)',
            zIndex: 100,
            background: 'var(--bg-card, rgba(20, 24, 33, 0.98))',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm, 6px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45), 0 0 1px rgba(255, 255, 255, 0.1) inset',
            padding: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          {/* Opción Todos */}
          <button
            type="button"
            role="option"
            aria-selected={value === 'Todos'}
            onClick={() => {
              onChange('Todos');
              setIsOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '5px 8px',
              borderRadius: 'var(--radius-xs, 4px)',
              border: 'none',
              background: value === 'Todos' ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'transparent',
              color: value === 'Todos' ? 'var(--primary)' : 'var(--text-high)',
              fontSize: '0.68rem',
              fontWeight: value === 'Todos' ? 600 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.12s ease'
            }}
            onMouseEnter={(e) => {
              if (value !== 'Todos') e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              if (value !== 'Todos') e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
              <Layers size={11} style={{ opacity: 0.7, flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Todos los Hubs
              </span>
            </div>
            {value === 'Todos' && <Check size={11} color="var(--primary)" style={{ flexShrink: 0 }} />}
          </button>

          {/* Opciones de cada Hub */}
          {hubs.map((hub) => {
            const isSelected = value === hub;
            return (
              <button
                key={hub}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(hub);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-xs, 4px)',
                  border: 'none',
                  background: isSelected ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'transparent',
                  color: isSelected ? 'var(--primary)' : 'var(--text-high)',
                  fontSize: '0.68rem',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                  <Layers size={11} style={{ opacity: 0.6, flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {hub}
                  </span>
                </div>
                {isSelected && <Check size={11} color="var(--primary)" style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
