import React from 'react';
import { Search, Gamepad2, Flame, Plus, RefreshCw } from 'lucide-react';
import TacticalButton from '../ui/TacticalButton';

export default function GamingHeader({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  steamCount,
  customCount,
  launchMessage,
  gamingStatus,
  gamepadConnected,
  onOpenNewGame,
  onLaunchSteam,
  onRefresh
}) {
  const categories = [
    { id: 'all', label: `Todos (${steamCount + customCount})` },
    { id: 'steam', label: `Steam (${steamCount})` },
    { id: 'web', label: 'Web' },
    { id: 'emu', label: 'Emuladores' }
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.45rem 0.85rem',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      flexShrink: 0,
      gap: '10px',
      flexWrap: 'wrap'
    }}>
      {/* Buscador & Pastillas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '260px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={13} style={{ position: 'absolute', left: '8px', top: '7px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar juegos..."
            style={{
              width: '100%',
              height: '26px',
              paddingLeft: '26px',
              paddingRight: '8px',
              fontSize: '0.74rem',
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-high)'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {categories.map((cat) => {
            const isActive = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.68rem',
                  background: isActive ? 'var(--primary-glow)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border-color)'}`,
                  color: isActive ? '#a7f3d0' : 'var(--text-muted)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: isActive ? 700 : 500
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Telemetría & Acciones */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {launchMessage && (
          <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {launchMessage}
          </span>
        )}

        {gamingStatus?.gpuDriver && (
          <span style={{
            fontSize: '0.66rem',
            color: 'var(--text-muted)',
            background: 'rgba(255,255,255,0.03)',
            padding: '2px 7px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)'
          }}>
            {gamingStatus.gpuDriver}
          </span>
        )}

        <div style={{
          background: gamepadConnected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${gamepadConnected ? '#38bdf8' : 'var(--border-color)'}`,
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.68rem',
          color: gamepadConnected ? '#38bdf8' : 'var(--text-muted)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <Gamepad2 size={12} color={gamepadConnected ? '#38bdf8' : '#9ca3af'} />
          <span>{gamepadConnected ? 'MANDO' : 'SIN MANDO'}</span>
        </div>

        <div style={{
          background: gamingStatus?.gamemodeActive ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${gamingStatus?.gamemodeActive ? 'var(--primary)' : 'var(--border-color)'}`,
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.68rem',
          color: gamingStatus?.gamemodeActive ? '#a7f3d0' : 'var(--text-muted)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <Flame size={12} color={gamingStatus?.gamemodeActive ? 'var(--primary)' : '#9ca3af'} />
          <span>GameMode: {gamingStatus?.gamemodeActive ? 'ACTIVO' : 'STANDBY'}</span>
        </div>

        <TacticalButton
          variant="primary"
          size="xs"
          icon={Plus}
          onClick={onOpenNewGame}
          style={{ height: '26px' }}
        >
          + Juego
        </TacticalButton>

        <TacticalButton
          variant="secondary"
          size="xs"
          onClick={onLaunchSteam}
          style={{ height: '26px' }}
          title="Abrir el cliente de Steam"
        >
          Steam
        </TacticalButton>

        <button
          onClick={onRefresh}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '3px' }}
          title="Refrescar catálogo"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    </div>
  );
}
