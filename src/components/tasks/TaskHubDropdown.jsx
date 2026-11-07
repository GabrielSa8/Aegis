import { useState, useRef, useEffect } from 'react';
import { FolderGit2, ChevronDown, ChevronUp, Check, Layers } from 'lucide-react';

export default function TaskHubDropdown({
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
      className="task-dropdown-container task-dropdown-hub"
      style={{
        position: 'relative',
        display: 'inline-flex',
        flex: '1 1 140px',
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
        title="Filtrar por Hub Maestro"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
          <FolderGit2 size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: '0.7rem',
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
            minWidth: '160px',
            background: 'color-mix(in srgb, var(--bg-card) 98%, black)',
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
          {hubs.map((hub) => {
            const isSelected = value === hub;
            const isTodos = hub === 'Todos';
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
                  {isTodos ? (
                    <Layers size={11} style={{ opacity: 0.7, flexShrink: 0 }} />
                  ) : (
                    <FolderGit2 size={11} color={isSelected ? 'var(--primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                  )}
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isTodos ? 'Todos los Hubs' : hub}
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
