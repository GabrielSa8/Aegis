import { useState, useEffect } from 'react';
import { Brain, ChevronRight, ChevronDown } from 'lucide-react';

export default function ThoughtAccordion({ thoughts, defaultOpen }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  if (!thoughts) return null;

  const toolMatches = (thoughts.match(/⚙️ \[Herramienta/g) || []).length;
  const thinkingMatches = (thoughts.match(/🧠 \[Razonamiento/g) || []).length;

  let badgeText = 'Razonamiento activo';
  if (toolMatches > 0 && thinkingMatches > 0) {
    badgeText = `${toolMatches} ${toolMatches === 1 ? 'herramienta' : 'herramientas'} · Razonamiento`;
  } else if (toolMatches > 0) {
    badgeText = `${toolMatches} ${toolMatches === 1 ? 'herramienta ejecutada' : 'herramientas ejecutadas'}`;
  } else if (thinkingMatches > 0) {
    badgeText = 'Razonamiento activo';
  }

  return (
    <div style={{
      marginBottom: '8px',
      background: 'rgba(0, 0, 0, 0.4)',
      border: '1px solid color-mix(in srgb, var(--primary) 30%, var(--border-color))',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden'
    }}>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          padding: '5px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: 'var(--primary)',
          userSelect: 'none',
          background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
          borderBottom: isOpen ? '1px solid color-mix(in srgb, var(--primary) 20%, var(--border-color))' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
          <Brain size={13} color="var(--primary)" />
          <span>[ PROCESO TÉCNICO & HERRAMIENTAS ]</span>
          <span style={{
            fontSize: '0.62rem',
            padding: '1px 6px',
            borderRadius: '3px',
            background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
            color: 'var(--text-high)',
            fontFamily: 'var(--font-mono)'
          }}>
            {badgeText}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <kbd className="tactical-kbd">
            Ctrl + O
          </kbd>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {isOpen && (
        <div style={{
          padding: '8px 12px',
          color: 'var(--text-normal)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          lineHeight: '1.45',
          whiteSpace: 'pre-wrap',
          maxHeight: '260px',
          overflowY: 'auto',
          background: 'rgba(6, 8, 7, 0.8)'
        }}>
          {thoughts}
        </div>
      )}
    </div>
  );
}
