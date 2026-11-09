import React from 'react';
import { Search, Gamepad2, Flame, Plus, RefreshCw } from 'lucide-react';
import TacticalButton from '../ui/TacticalButton';

export default function GamingHeader({
  searchQuery,
  setSearchQuery,
  launchMessage,
  gamingStatus,
  gamepadConnected,
  onOpenNewGame,
  onLaunchSteam,
  onRefresh
}) {
  return (
    <div className="gaming-header-card" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.45rem 0.85rem',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      flexShrink: 0,
      gap: '12px',
      flexWrap: 'wrap'
    }}>
      {/* 🔍 Buscador de Títulos */}
      <div className="gaming-header-search-wrap" style={{ position: 'relative', width: '260px', flexShrink: 0 }}>
        <Search size={13} style={{ position: 'absolute', left: '9px', top: '7.5px', color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar juegos en la biblioteca..."
          style={{
            width: '100%',
            height: '28px',
            paddingLeft: '28px',
            paddingRight: '8px',
            fontSize: '0.75rem',
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-high)'
          }}
        />
      </div>

      {/* 🚀 Telemetría de Sistema & Acciones de Cabecera */}
      <div className="gaming-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {launchMessage && (
          <span className="gaming-launch-message" style={{ fontSize: '0.72rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {launchMessage}
          </span>
        )}

        {gamingStatus?.gpuDriver && (
          <span className="gaming-gpu-badge" style={{
            fontSize: '0.66rem',
            color: 'var(--text-muted)',
            background: 'color-mix(in srgb, var(--bg-card) 95%, black)',
            padding: '2px 7px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)'
          }}>
            {gamingStatus.gpuDriver}
          </span>
        )}

        <div className="gaming-mando-badge" style={{
          background: gamepadConnected ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'color-mix(in srgb, var(--bg-card) 95%, black)',
          border: `1px solid ${gamepadConnected ? 'var(--accent)' : 'var(--border-color)'}`,
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.68rem',
          color: gamepadConnected ? 'var(--accent)' : 'var(--text-muted)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <Gamepad2 size={12} color={gamepadConnected ? 'var(--accent)' : 'var(--text-muted)'} />
          <span>{gamepadConnected ? 'MANDO' : 'SIN MANDO'}</span>
        </div>

        <div className="gaming-gamemode-badge" style={{
          background: gamingStatus?.gamemodeActive ? 'var(--primary-glow)' : 'color-mix(in srgb, var(--bg-card) 95%, black)',
          border: `1px solid ${gamingStatus?.gamemodeActive ? 'var(--primary)' : 'var(--border-color)'}`,
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.68rem',
          color: gamingStatus?.gamemodeActive ? 'var(--primary)' : 'var(--text-muted)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <Flame size={12} color={gamingStatus?.gamemodeActive ? 'var(--primary)' : 'var(--text-muted)'} />
          <span>GameMode: {gamingStatus?.gamemodeActive ? 'ACTIVO' : 'STANDBY'}</span>
        </div>

        <TacticalButton
          variant="primary"
          size="xs"
          icon={Plus}
          onClick={onOpenNewGame}
          className="gaming-action-btn"
          style={{ height: '26px' }}
        >
          Juego
        </TacticalButton>

        <TacticalButton
          variant="secondary"
          size="xs"
          onClick={onLaunchSteam}
          className="gaming-action-btn"
          style={{ height: '26px' }}
          title="Abrir el cliente de Steam"
        >
          Steam
        </TacticalButton>

        <button
          onClick={onRefresh}
          className="gaming-refresh-btn"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '3px' }}
          title="Refrescar catálogo"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    </div>
  );
}
