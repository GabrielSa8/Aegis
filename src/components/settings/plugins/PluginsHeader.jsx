import { Puzzle, Zap, RotateCcw, Check } from 'lucide-react';

export default function PluginsHeader({
  activeCount,
  disabledCount,
  feedbackMsg,
  onMinimalMode,
  onEnableAll
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Puzzle size={18} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-high)' }}>
              Arquitectura Modular & Plugins
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Activa o desactiva módulos para adaptar Aegis a tus necesidades y optimizar el consumo de RAM/CPU.
          </p>
        </div>

        <div className="settings-plugins-header-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={onMinimalMode}
            className="settings-action-pill-btn"
            title="Apagar todos los módulos opcionales y dejar solo Agente + Bóveda"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-high)',
              fontSize: '0.7rem',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
          >
            <Zap size={13} color="var(--primary)" />
            <span>Modo Mínimo (~18 MB RAM)</span>
          </button>

          <button
            onClick={onEnableAll}
            className="settings-action-pill-btn active"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-glow)',
              border: '1px solid var(--primary)',
              color: 'var(--text-high)',
              fontSize: '0.7rem',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
          >
            <RotateCcw size={13} color="var(--primary)" />
            <span>Activar Todos</span>
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.5rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid var(--border-color)'
      }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Módulos Core: <strong style={{ color: 'var(--primary)' }}>3 fijados</strong>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Plugins Opcionales: <strong style={{ color: 'var(--text-high)' }}>{activeCount} de 5 activos</strong>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Ahorro de Memoria: <strong style={{ color: disabledCount > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
            {disabledCount > 0 ? `~${disabledCount * 6} MB RAM liberados` : 'Capacidad máxima'}
          </strong>
        </div>
      </div>

      {feedbackMsg && (
        <div style={{
          fontSize: '0.72rem',
          color: 'var(--primary)',
          background: 'var(--primary-glow)',
          border: '1px solid var(--primary)',
          padding: '6px 10px',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Check size={14} />
          <span>{feedbackMsg}</span>
        </div>
      )}
    </div>
  );
}
