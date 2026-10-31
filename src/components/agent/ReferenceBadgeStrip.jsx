import { memo } from 'react';
import { BookOpen, FileText, Brain, Scissors, GitCompare, X } from 'lucide-react';

function ReferenceBadgeStrip({ tokens = [], onRemoveToken }) {
  const refTokens = tokens.filter((t) => t.type !== 'text');
  if (!refTokens.length) return null;

  const getBadgeDetails = (tok) => {
    const { kind, arg, type } = tok;
    if (type === 'var') {
      if (kind === 'clip') {
        return {
          icon: <Scissors size={11} />,
          label: '{{clip}}',
          desc: 'Portapapeles del sistema',
          color: 'var(--primary)',
          bg: 'color-mix(in srgb, var(--primary) 12%, transparent)',
          border: 'color-mix(in srgb, var(--primary) 30%, transparent)'
        };
      }
      return {
        icon: <GitCompare size={11} />,
        label: '{{diff}}',
        desc: 'Git Diff actual',
        color: 'var(--warning)',
        bg: 'color-mix(in srgb, var(--warning) 12%, transparent)',
        border: 'color-mix(in srgb, var(--warning) 30%, transparent)'
      };
    }

    switch (kind) {
      case 'vault':
        return {
          icon: <BookOpen size={11} />,
          label: arg || 'Nota',
          desc: `Bóveda: ${arg}`,
          color: 'var(--warning)',
          bg: 'color-mix(in srgb, var(--warning) 12%, transparent)',
          border: 'color-mix(in srgb, var(--warning) 30%, transparent)'
        };
      case 'file':
        return {
          icon: <FileText size={11} />,
          label: (arg || '').split('/').pop() || 'Archivo',
          desc: arg,
          color: 'var(--primary)',
          bg: 'color-mix(in srgb, var(--primary) 12%, transparent)',
          border: 'color-mix(in srgb, var(--primary) 30%, transparent)'
        };
      case 'context':
        return {
          icon: <Brain size={11} />,
          label: arg || 'Contexto',
          desc: `Perfil: ${arg}`,
          color: 'var(--primary)',
          bg: 'color-mix(in srgb, var(--primary) 12%, transparent)',
          border: 'color-mix(in srgb, var(--primary) 30%, transparent)'
        };
      default:
        return {
          icon: null,
          label: tok.value,
          color: 'var(--text-muted)',
          bg: 'color-mix(in srgb, var(--border-color) 20%, transparent)',
          border: 'var(--border-color)'
        };
    }
  };

  return (
    <div
      className="reference-badge-strip"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        padding: '4px 10px 4px',
        width: '100%',
        borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.05))'
      }}
    >
      {refTokens.map((tok, idx) => {
        const details = getBadgeDetails(tok);
        return (
          <div
            key={`${tok.value}_${idx}`}
            title={details.desc}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm, 5px)',
              fontSize: '0.68rem',
              fontWeight: 500,
              background: details.bg,
              border: `1px solid ${details.border}`,
              color: details.color,
              userSelect: 'none'
            }}
          >
            {details.icon}
            <span
              style={{
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {details.label}
            </span>
            {onRemoveToken && (
              <button
                type="button"
                onClick={() => onRemoveToken(tok)}
                aria-label={`Quitar ${details.label}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.7,
                  lineHeight: 1
                }}
              >
                <X size={11} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default memo(ReferenceBadgeStrip);
