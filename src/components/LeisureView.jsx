import { useState, useEffect, useCallback } from 'react';
import { 
  Gamepad2, 
  Flame, 
  Play, 
  RefreshCw,
  HardDrive,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export default function LeisureView() {
  const [gamingStatus, setGamingStatus] = useState(null);
  const [steamGames, setSteamGames] = useState([]);
  const [useGamescopeFsr, setUseGamescopeFsr] = useState(false);
  const [launchMessage, setLaunchMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [status, games] = await Promise.all([
        invoke('get_gaming_status'),
        invoke('get_installed_steam_games')
      ]);
      setGamingStatus(status);
      setSteamGames(Array.isArray(games) ? games : []);
    } catch (e) {
      console.error('Error cargando gaming:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLaunchGame = async (gameId) => {
    try {
      const res = await invoke('launch_game', {
        gameId,
        useGamemode: true,
        useGamescopeFsr
      });
      setLaunchMessage(res);
      setTimeout(() => setLaunchMessage(null), 4000);
      fetchData();
    } catch (e) {
      setLaunchMessage(`Error: ${e}`);
      setTimeout(() => setLaunchMessage(null), 4000);
    }
  };

  const roguelikes = [
    { id: 'pokerogue', title: 'PokéRogue', type: 'Web Wayland', tag: 'Roguelike', desc: 'Combates por turnos en 200 oleadas procedimentales en navegador.' },
    { id: 'emerald_rogue', title: 'Pokémon Emerald Rogue', type: 'GBA / mGBA', tag: 'ROM Hack', desc: 'Esmeralda convertido en roguelite con mapa ramificado.' },
    { id: 'pokeisaac', title: 'PokéIsaac', type: 'Web Roguelike', tag: 'Action RPG', desc: 'Dungeon crawler de salas y jefes en tiempo real.' },
    { id: 'pokesurvivor', title: 'PokéSurvivor', type: 'Web Game', tag: 'Bullet Heaven', desc: 'Hordas masivas de Pokémon con auto-ataque y mejoras continuas.' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem', overflowY: 'auto' }}>
      {/* 🧭 Barra Táctica de Gaming N150 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.45rem 0.85rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        flexShrink: 0,
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gamepad2 color="var(--primary)" size={15} />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Lanzador de Videojuegos & Aceleración Intel N150
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            • {steamGames.length} títulos detectados en Steam
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {launchMessage && (
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              {launchMessage}
            </span>
          )}

          <div style={{
            background: gamingStatus?.gamemodeActive ? 'var(--primary-glow)' : 'rgba(255,255,255,0.04)',
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

          <button
            onClick={fetchData}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '2px' }}
            title="Re-escanear biblioteca"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* 🚀 Panel de Rendimiento & Gamescope FSR */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'block' }}>
            Aceleración de Gráficos Integrados (24 Execution Units)
          </span>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Inyección automática de `gamemoderun` con prioridad de CPU y escalado FSR para títulos exigentes.
          </p>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.74rem', color: '#fff' }}>
          <input
            type="checkbox"
            checked={useGamescopeFsr}
            onChange={(e) => setUseGamescopeFsr(e.target.checked)}
          />
          <span>Forzar Gamescope FSR (Render 720p 60fps → 1080p)</span>
        </label>
      </div>

      {/* 🎮 Sección 1: Títulos Detectados en Steam Local (Auto-Discovery) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Biblioteca de Steam Detectada ({steamGames.length})
          </span>
          <button
            onClick={() => handleLaunchGame('steam')}
            className="btn btn-secondary"
            style={{ padding: '3px 8px', fontSize: '0.7rem', height: '24px' }}
          >
            Abrir Cliente Steam
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
          {steamGames.length > 0 ? (
            steamGames.map(game => (
              <div
                key={game.appId}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {game.name}
                    </span>
                    <span style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '1px 5px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)' }}>
                      ID {game.appId}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    <span>{game.sizeMb > 1024 ? `${(game.sizeMb / 1024).toFixed(1)} GB` : `${game.sizeMb} MB`}</span>
                    <span>• {game.installDir}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                  <button
                    onClick={() => handleLaunchGame(`steam:${game.appId}`)}
                    className="btn btn-primary"
                    style={{ padding: '3px 10px', fontSize: '0.72rem', height: '24px' }}
                  >
                    <Play size={11} />
                    <span>Jugar</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
              No se detectaron títulos en `~/.local/share/Steam/steamapps/`.
            </div>
          )}
        </div>
      </div>

      {/* 👾 Sección 2: Roguelikes & Emuladores Ligeros */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Roguelikes Web & Emulación
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
          {roguelikes.map(game => (
            <div
              key={game.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>{game.title}</span>
                  <span style={{ fontSize: '0.62rem', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
                    {game.tag}
                  </span>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: '1.15rem' }}>
                  {game.desc}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{game.type}</span>
                <button
                  onClick={() => handleLaunchGame(game.id)}
                  className="btn btn-primary"
                  style={{ padding: '3px 10px', fontSize: '0.72rem', height: '24px' }}
                >
                  <Play size={11} />
                  <span>Lanzar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
