import { useState, useRef, useEffect } from 'react';
import { Boxes, ChevronDown, ChevronUp, Check, Layers } from 'lucide-react';

export default function TaskProjectDropdown({
  value,
  onChange,
  projects = [],
  customizations = {}
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

  const displayLabel = value === 'Todos' ? 'Todos los Proyectos' : value;

  return (
    <div
      ref={containerRef}
      className="task-dropdown-container task-dropdown-project"
      style={{
        position: 'relative',
        display: 'inline-flex',
        flex: '1 1 150px',
        minWidth: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* Botón Disparador Táctico */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="tactical-select-trigger"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          padding: '4px 8px',
          fontSize: '0.7rem',
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${isOpen ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 30%, transparent)'}`,
          borderRadius: 'var(--radius-sm, 5px)',
          color: 'var(--accent)',
          cursor: 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          fontWeight: 600,
          transition: 'all 0.16s ease'
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Filtrar por Proyecto específico"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
          <Boxes size={12} color="var(--accent)" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
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
            minWidth: '170px',
            background: 'var(--bg-card, rgba(20, 24, 33, 0.98))',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm, 6px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45), 0 0 1px rgba(255, 255, 255, 0.1) inset',
            padding: '4px',
            maxHeight: '220px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          {projects.map((proj) => {
            const isSelected = value === proj;
            const isTodos = proj === 'Todos';
            const customIcon = !isTodos && customizations[proj]?.icon;

            return (
              <button
                key={proj}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(proj);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-xs, 4px)',
                  border: 'none',
                  background: isSelected ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'transparent',
                  color: isSelected ? 'var(--accent)' : 'var(--text-high)',
                  fontSize: '0.68rem',
                  fontWeight: isSelected ? 700 : 500,
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
                  {customIcon ? (
                    <span style={{ fontSize: '0.75rem', flexShrink: 0 }}>{customIcon}</span>
                  ) : isTodos ? (
                    <Layers size={11} style={{ opacity: 0.7, flexShrink: 0 }} />
                  ) : (
                    <Boxes size={11} color={isSelected ? 'var(--accent)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                  )}
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isTodos ? 'Todos los Proyectos' : proj}
                  </span>
                </div>
                {isSelected && <Check size={11} color="var(--accent)" style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
