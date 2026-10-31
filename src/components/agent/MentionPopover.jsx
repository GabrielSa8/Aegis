import { useEffect, useRef } from 'react';
import { BookOpen, FileText, Brain, Sparkles } from 'lucide-react';

export default function MentionPopover({
  activeMention,
  items = [],
  selectedIndex = 0,
  loading = false,
  onSelect,
  onHoverIndex
}) {
  const scrollListRef = useRef(null);

  // Auto-scroll del elemento seleccionado dentro del viewport scrolleable
  useEffect(() => {
    if (scrollListRef.current) {
      const selectedEl = scrollListRef.current.children[selectedIndex];
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!activeMention || (!items.length && !loading)) return null;

  const renderIcon = (kind) => {
    switch (kind) {
      case 'vault':
        return <BookOpen size={12} className="text-amber-400" />;
      case 'file':
        return <FileText size={12} className="text-blue-400" />;
      case 'context':
        return <Brain size={12} className="text-emerald-400" />;
      default:
        return <Sparkles size={12} className="text-cyan-400" />;
    }
  };

  return (
    <div
      className="mention-popover-portal"
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: '12px',
        maxHeight: '220px',
        width: '320px',
        background: 'var(--surface, #12141a)',
        border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header fijo completamente aislado del scroll */}
      <div
        style={{
          flexShrink: 0,
          padding: '6px 10px',
          fontSize: '0.62rem',
          color: 'var(--text-muted, #888)',
          background: 'var(--surface, #12141a)',
          borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        {activeMention.stage === 'kind' ? 'Selecciona tipo de referencia' : `Referencias @${activeMention.kind}:`}
      </div>

      {/* Contenedor scrolleable dedicado únicamente para los items */}
      <div
        ref={scrollListRef}
        className="custom-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}
      >
        {loading && (
          <div style={{ padding: '8px', fontSize: '0.72rem', color: 'var(--text-muted, #888)' }}>
            Buscando...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div style={{ padding: '8px', fontSize: '0.72rem', color: 'var(--text-muted, #888)' }}>
            Sin coincidencias
          </div>
        )}

        {items.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              onMouseEnter={() => onHoverIndex?.(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                background: isSelected ? 'var(--primary-glow, rgba(16,185,129,0.15))' : 'transparent',
                border: isSelected ? '1px solid var(--primary, #10b981)' : '1px solid transparent',
                transition: 'all 0.1s ease'
              }}
            >
              {renderIcon(item.kind)}
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 500,
                    color: isSelected ? 'var(--primary, #10b981)' : 'var(--text-main, #eee)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {item.label}
                </div>
                {item.desc && (
                  <div
                    style={{
                      fontSize: '0.62rem',
                      color: 'var(--text-muted, #888)',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}
                  >
                    {item.desc}
                  </div>
                )}
              </div>
              <kbd
                className="tactical-kbd"
                style={{ fontSize: '0.55rem', opacity: isSelected ? 1 : 0.4 }}
              >
                ↵
              </kbd>
            </div>
          );
        })}
      </div>
    </div>
  );
}
