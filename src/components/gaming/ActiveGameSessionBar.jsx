import React from 'react';
import { Play, Square, Trophy, X, Flame } from 'lucide-react';
import TacticalButton from '../ui/TacticalButton';

export default function ActiveGameSessionBar({
  activeSession,
  onStopSession,
  onCancelSession,
  onOpenDetails
}) {
  if (!activeSession) return null;

  const { gameTitle, elapsedSeconds, isSteam } = activeSession;

  const formatTimer = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n) => String(n).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.5rem 0.85rem',
      background: 'color-mix(in srgb, var(--primary) 12%, var(--bg-card))',
      border: '1px solid var(--primary)',
      borderRadius: 'var(--radius-md)',
      boxShadow: '0 0 12px var(--primary-glow)',
      gap: '10px',
      flexWrap: 'wrap',
      animation: 'pulseGlow 2.5s infinite ease-in-out'
    }}>
      {/* Información del Juego en Ejecución */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '26px',
          height: '26px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--primary)',
          color: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Flame size={15} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--primary)' }}>
              EN JUEGO
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-high)' }}>
              {gameTitle}
            </span>
          </div>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
            {isSteam ? 'Plataforma Steam' : 'Lanzador Custom / Emulador'}
          </span>
        </div>
      </div>

      {/* Cronómetro en Vivo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'color-mix(in srgb, var(--bg-card) 95%, black)',
        padding: '3px 10px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: 'var(--primary)',
          boxShadow: '0 0 6px var(--primary)'
        }} />
        <span style={{
          fontSize: '0.85rem',
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          color: 'var(--primary)',
          letterSpacing: '0.05em'
        }}>
          {formatTimer(elapsedSeconds)}
        </span>
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <TacticalButton
          variant="secondary"
          size="xs"
          icon={Trophy}
          onClick={onOpenDetails}
          style={{ height: '26px' }}
        >
          Logros & Reseña
        </TacticalButton>

        <TacticalButton
          variant="primary"
          size="xs"
          icon={Square}
          onClick={onStopSession}
          style={{ height: '26px' }}
        >
          Finalizar & Guardar
        </TacticalButton>

        <button
          onClick={onCancelSession}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px'
          }}
          title="Descartar sesión sin guardar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
