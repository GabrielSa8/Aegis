import { memo } from 'react';
import { Paperclip, Zap, Brain, Mic } from 'lucide-react';

function PromptQuickToolbar({
  onAttachClick,
  effectiveEffort = 'low',
  isOverride = false,
  onToggleOverride,
  loading = false
}) {
  const isHigh = effectiveEffort === 'high';

  return (
    <div
      className="prompt-quick-toolbar"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '0 2px'
      }}
    >
      {/* Botón 1: Adjuntar archivo/imagen */}
      <button
        type="button"
        onClick={onAttachClick}
        disabled={loading}
        className="prompt-tool-btn"
        title="Adjuntar archivo o imagen (también pegar o arrastrar)"
        aria-label="Adjuntar archivo"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: '1px solid transparent',
          borderRadius: 'var(--radius-sm, 4px)',
          color: 'var(--text-muted)',
          padding: '4px 6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.12s ease'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.color = 'var(--text-high)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 8%, transparent)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <Paperclip size={13} />
      </button>

      {/* Botón 2: Override por prompt de Flash / Profundo */}
      <button
        type="button"
        onClick={onToggleOverride}
        disabled={loading}
        className="prompt-tool-btn"
        title={
          isOverride
            ? `Esfuerzo temporal para este envío: ${isHigh ? 'Profundo' : 'Flash'} (Clic para restaurar al global de la sesión)`
            : `Heredando de la sesión (${isHigh ? 'Profundo' : 'Flash'}). Clic para alternar solo para este prompt.`
        }
        aria-label="Alternar esfuerzo para este prompt"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 6px',
          borderRadius: 'var(--radius-sm, 4px)',
          fontSize: '0.62rem',
          fontWeight: 500,
          background: isHigh
            ? 'color-mix(in srgb, var(--secondary) 14%, transparent)'
            : 'color-mix(in srgb, var(--primary) 14%, transparent)',
          border: isOverride
            ? '1px dashed var(--primary)'
            : isHigh
            ? '1px solid color-mix(in srgb, var(--secondary) 30%, transparent)'
            : '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
          color: isHigh ? 'var(--secondary)' : 'var(--primary)',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.12s ease'
        }}
      >
        {isHigh ? <Brain size={11} /> : <Zap size={11} />}
        <span>{isHigh ? 'Profundo' : 'Flash'}</span>
        {isOverride && (
          <span
            style={{
              fontSize: '0.52rem',
              opacity: 0.8,
              marginLeft: '2px',
              textTransform: 'uppercase'
            }}
          >
            (1x)
          </span>
        )}
      </button>

      {/* Botón 3: Espacio reservado para Voz / Whisper */}
      <button
        type="button"
        disabled
        className="prompt-tool-btn"
        title="Dictado por voz (Whisper offline) — Próximamente"
        aria-label="Voz no disponible"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: '1px solid transparent',
          borderRadius: 'var(--radius-sm, 4px)',
          color: 'var(--text-muted)',
          padding: '4px 6px',
          cursor: 'not-allowed',
          opacity: 0.35
        }}
      >
        <Mic size={12} />
      </button>
    </div>
  );
}

export default memo(PromptQuickToolbar);
