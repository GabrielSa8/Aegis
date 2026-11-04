import { Sparkles, Download, RotateCcw, Check, RefreshCw, X } from 'lucide-react';

export default function UpdateCockpitPill({
  status,
  updateInfo,
  downloadProgress,
  onOpenModal,
  onRestart,
  onDismiss
}) {
  if (status === 'idle' || !status) return null;

  if (status === 'checking') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 9px',
          borderRadius: 'var(--radius-sm, 6px)',
          background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
          color: 'var(--primary)',
          fontSize: '0.68rem',
          fontWeight: 600,
          animation: 'pulse 1.5s infinite'
        }}
      >
        <RefreshCw size={11} className="spin-animation" />
        <span>Buscando updates...</span>
      </div>
    );
  }

  if (status === 'available') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 4px 2px 8px',
          borderRadius: 'var(--radius-sm, 6px)',
          background: 'color-mix(in srgb, var(--primary) 20%, transparent)',
          border: '1px solid var(--primary)',
          color: 'var(--text-high)',
          fontSize: '0.68rem',
          fontWeight: 700,
          boxShadow: '0 0 10px color-mix(in srgb, var(--primary) 25%, transparent)'
        }}
      >
        <Sparkles size={12} color="var(--primary)" />
        <span
          onClick={onOpenModal}
          style={{ cursor: 'pointer', textDecoration: 'underline' }}
          title="Ver detalles de la actualización"
        >
          v{updateInfo?.version} disponible
        </span>
        <button
          onClick={onOpenModal}
          style={{
            background: 'var(--primary)',
            color: 'var(--bg-main, #000)',
            border: 'none',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '0.64rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <Download size={10} />
          <span>Ver</span>
        </button>
        <button
          onClick={onDismiss}
          title="Ocultar"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={11} />
        </button>
      </div>
    );
  }

  if (status === 'downloading') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '3px 10px',
          borderRadius: 'var(--radius-sm, 6px)',
          background: 'color-mix(in srgb, var(--accent, var(--primary)) 15%, transparent)',
          border: '1px solid var(--accent, var(--primary))',
          color: 'var(--text-high)',
          fontSize: '0.68rem',
          fontWeight: 600
        }}
      >
        <Download size={11} className="bounce-animation" />
        <span>Descargando ({downloadProgress}%)</span>
        <div
          style={{
            width: '40px',
            height: '4px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${downloadProgress}%`,
              height: '100%',
              background: 'var(--primary)',
              transition: 'width 0.2s ease'
            }}
          />
        </div>
      </div>
    );
  }

  if (status === 'ready') {
    return (
      <button
        onClick={onRestart}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 9px',
          borderRadius: 'var(--radius-sm, 6px)',
          background: 'var(--primary)',
          color: 'var(--bg-main, #000)',
          border: 'none',
          fontSize: '0.68rem',
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 0 12px color-mix(in srgb, var(--primary) 40%, transparent)'
        }}
        title="Reiniciar Aegis para aplicar actualización"
      >
        <RotateCcw size={11} />
        <span>Reiniciar v{updateInfo?.version}</span>
      </button>
    );
  }

  if (status === 'upToDate') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm, 6px)',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-color)',
          color: 'var(--primary)',
          fontSize: '0.66rem',
          fontWeight: 600
        }}
      >
        <Check size={11} />
        <span>Al día</span>
      </div>
    );
  }

  return null;
}
