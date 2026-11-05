import { useState, useRef, useEffect } from 'react';
import { Layers, ChevronDown, ChevronUp, Check, FolderGit2, Boxes } from 'lucide-react';

const GROUP_OPTIONS = [
  { id: 'hub_project', label: 'Hub > Proyecto', icon: FolderGit2 },
  { id: 'project', label: 'Solo Proyectos', icon: Boxes },
  { id: 'hub', label: 'Solo Hubs', icon: Layers }
];

export default function TaskGroupByDropdown({
  value,
  onChange
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

  const activeOption = GROUP_OPTIONS.find((opt) => opt.id === value) || GROUP_OPTIONS[0];
  const ActiveIcon = activeOption.icon;

  return (
    <div
      ref={containerRef}
      className="task-dropdown-container task-dropdown-groupby"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        boxSizing: 'border-box'
      }}
    >
      <span className="task-filter-label" style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, flexShrink: 0 }}>
        Agrupar:
      </span>

      {/* Botón Disparador Táctico */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="tactical-select-trigger"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          padding: '4px 8px',
          fontSize: '0.68rem',
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${isOpen ? 'var(--primary)' : 'color-mix(in srgb, var(--primary) 30%, transparent)'}`,
          borderRadius: 'var(--radius-sm, 5px)',
          color: 'var(--primary)',
          cursor: 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          fontWeight: 700,
          transition: 'all 0.16s ease'
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Cambiar nivel de agrupación"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, overflow: 'hidden' }}>
          <ActiveIcon size={11} color="var(--primary)" style={{ flexShrink: 0 }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activeOption.label}
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
            right: 0,
            top: 'calc(100% + 4px)',
            zIndex: 100,
            minWidth: '150px',
            background: 'var(--bg-card, rgba(20, 24, 33, 0.98))',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm, 6px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45), 0 0 1px rgba(255, 255, 255, 0.1) inset',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          {GROUP_OPTIONS.map((opt) => {
            const isSelected = value === opt.id;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.id);
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
                  <Icon size={11} color={isSelected ? 'var(--primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {opt.label}
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
