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
        className={`prompt-tool-btn prompt-effort-toggle ${isHigh ? 'is-high' : 'is-low'} ${isOverride ? 'is-override' : ''}`}
        title={
          isOverride
            ? `Esfuerzo temporal para este envío: ${isHigh ? 'Profundo' : 'Flash'} (Clic para restaurar al global de la sesión)`
            : `Heredando de la sesión (${isHigh ? 'Profundo' : 'Flash'}). Clic para alternar solo para este prompt.`
        }
        aria-label={`Esfuerzo: ${isHigh ? 'Profundo' : 'Flash'}${isOverride ? ' (temporal 1x)' : ''}`}
      >
        {isHigh ? <Brain size={12} /> : <Zap size={12} />}
        <span className="prompt-effort-label">{isHigh ? 'Profundo' : 'Flash'}</span>
        {isOverride && (
          <span className="prompt-effort-override-tag">
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
