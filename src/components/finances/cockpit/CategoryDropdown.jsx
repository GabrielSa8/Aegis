import { useState, useRef, useEffect } from 'react';
import { Tag, ChevronDown, ChevronUp, Check } from 'lucide-react';

export default function CategoryDropdown({
  value,
  onChange,
  categories = [],
  dropUp = true
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Cerrar al hacer clic fuera o Escape
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

  const selectedCat = typeof value === 'string' ? value : (value?.name || '');

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-flex',
        flex: '1 1 130px',
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
          fontSize: '0.72rem',
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${isOpen ? 'var(--accent, var(--primary))' : 'var(--border-color)'}`,
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
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '4px',
              background: 'color-mix(in srgb, var(--accent, var(--primary)) 18%, transparent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Tag size={10} style={{ color: 'var(--accent, var(--primary))' }} />
          </div>
          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedCat || 'Seleccionar categoría'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
          {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </div>
      </button>

      {/* Menú Desplegable Táctico (Nordic Glass) */}
      {isOpen && (
        <div
          role="listbox"
          className="tactical-select-popover no-scrollbar"
          style={{
            position: 'absolute',
            bottom: dropUp ? 'calc(100% + 6px)' : 'auto',
            top: dropUp ? 'auto' : 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 110,
            minWidth: '200px',
            maxHeight: '180px',
            overflowY: 'auto',
            padding: '4px',
            borderRadius: 'var(--radius-md, 8px)',
            background: 'color-mix(in srgb, var(--surface-panel, var(--bg-card)) 98%, transparent)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.75), 0 0 16px color-mix(in srgb, var(--primary) 12%, transparent)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          {categories.map((cat) => {
            const catName = typeof cat === 'string' ? cat : (cat?.name || '');
            const isSelected = selectedCat === catName;

            return (
              <button
                key={catName}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(catName);
                  setIsOpen(false);
                }}
                className={`tactical-select-item ${isSelected ? 'selected' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm, 5px)',
                  border: '1px solid transparent',
                  background: isSelected
                    ? 'color-mix(in srgb, var(--accent, var(--primary)) 16%, transparent)'
                    : 'transparent',
                  color: isSelected ? 'var(--text-high)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: isSelected ? 700 : 500,
                  outline: 'none',
                  textAlign: 'left',
                  transition: 'all 0.14s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      background: 'color-mix(in srgb, var(--accent, var(--primary)) 18%, transparent)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Tag size={11} style={{ color: 'var(--accent, var(--primary))' }} />
                  </div>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {catName}
                  </span>
                </div>

                {isSelected && (
                  <Check size={12} style={{ color: 'var(--accent, var(--primary))', flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
