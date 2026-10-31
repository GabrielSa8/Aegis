import { BookOpen, FileText, Brain, Scissors, GitCompare } from 'lucide-react';

export default function PromptChip({ token, onRemove }) {
  const { kind, arg, type } = token;

  const getDetails = () => {
    if (type === 'var') {
      if (kind === 'clip') {
        return {
          icon: <Scissors size={10} />,
          label: '{{clip}}',
          desc: 'Portapapeles',
          color: 'var(--primary)',
          bg: 'color-mix(in srgb, var(--primary) 12%, transparent)',
          border: 'color-mix(in srgb, var(--primary) 30%, transparent)'
        };
      }
      return {
        icon: <GitCompare size={10} />,
        label: '{{diff}}',
        desc: 'Git Diff',
        color: 'var(--warning)',
        bg: 'color-mix(in srgb, var(--warning) 12%, transparent)',
        border: 'color-mix(in srgb, var(--warning) 30%, transparent)'
      };
    }

    switch (kind) {
      case 'vault':
        return {
          icon: <BookOpen size={10} />,
          label: `@vault:${arg}`,
          desc: 'Bóveda Obsidian',
          color: 'var(--warning)',
          bg: 'color-mix(in srgb, var(--warning) 12%, transparent)',
          border: 'color-mix(in srgb, var(--warning) 30%, transparent)'
        };
      case 'file':
        return {
          icon: <FileText size={10} />,
          label: `@file:${arg.split('/').pop()}`,
          desc: arg,
          color: 'var(--primary)',
          bg: 'color-mix(in srgb, var(--primary) 12%, transparent)',
          border: 'color-mix(in srgb, var(--primary) 30%, transparent)'
        };
      case 'context':
        return {
          icon: <Brain size={10} />,
          label: `@context:${arg}`,
          desc: 'Perfil',
          color: 'var(--primary)',
          bg: 'color-mix(in srgb, var(--primary) 12%, transparent)',
          border: 'color-mix(in srgb, var(--primary) 30%, transparent)'
        };
      default:
        return {
          icon: null,
          label: token.value,
          color: 'var(--text-muted)',
          bg: 'color-mix(in srgb, var(--border-color) 20%, transparent)',
          border: 'var(--border-color)'
        };
    }
  };

  const details = getDetails();

  return (
    <span
      className="prompt-chip-pill"
      contentEditable={false}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '1px 6px',
        margin: '0 2px',
        borderRadius: 'var(--radius-sm, 4px)',
        fontSize: '0.72rem',
        fontFamily: 'monospace',
        background: details.bg,
        border: `1px solid ${details.border}`,
        color: details.color,
        userSelect: 'none',
        verticalAlign: 'baseline',
        lineHeight: '1.2'
      }}
      title={details.desc || details.label}
    >
      {details.icon}
      <span>{details.label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(token);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '0 2px',
            fontSize: '0.68rem',
            opacity: 0.6,
            lineHeight: 1
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}
