import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  Gamepad2, 
  Flame, 
  Play, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Zap, 
  Search 
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

// 🎴 Componente Memoizado de Tarjeta de Juego (Zero re-renders innecesarios)
const GameCard = memo(function GameCard({ game, isSteam, onLaunch, onDelete }) {
  const [imgFailed, setImgFailed] = useState(false);
  const coverSrc = isSteam ? game.coverImage : game.bannerUrl;
  const hasCover = Boolean(coverSrc) && !imgFailed;

  return (
    <div
      onClick={() => onLaunch(isSteam ? `steam:${game.appId}` : game.id, isSteam ? null : game.launchType, isSteam ? null : game.launchTarget)}
      style={{
        position: 'relative',
        aspectRatio: '2 / 3',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: 'linear-gradient(145deg, #161c19, #0c100e)',
        border: '1px solid var(--border-color)',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        willChange: 'transform'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = 'var(--primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-color)';
      }}
      title={`Lanzar ${game.name || game.title}`}
    >
      {/* Portada Full Image si está disponible */}
      {hasCover ? (
        <img
          src={coverSrc}
          alt={game.name || game.title}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : (
        /* Tarjeta Estilizada Minimalista cuando no hay portada local */
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at center, rgba(16,185,129,0.08) 0%, rgba(0,0,0,0.5) 100%)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <Gamepad2 size={36} color="rgba(255,255,255,0.15)" />
        </div>
      )}

      {/* Tag de Categoría / Tipo en Esquina Superior */}
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        background: 'rgba(10, 14, 12, 0.88)',
        padding: '2px 6px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.6rem',
        fontWeight: 700,
        color: isSteam ? '#a7f3d0' : 'var(--primary)',
        border: '1px solid rgba(255,255,255,0.08)',
        zIndex: 2,
        pointerEvents: 'none'
      }}>
        {isSteam ? 'STEAM' : (game.category || 'CUSTOM').toUpperCase()}
      </div>

      {/* Botón Eliminar para juegos personalizados */}
      {!isSteam && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(game.id);
          }}
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: 'rgba(10, 14, 12, 0.88)',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            padding: '3px 5px',
            borderRadius: 'var(--radius-sm)',
            zIndex: 3
          }}
          title="Eliminar este lanzador"
        >
          <Trash2 size={11} />
        </button>
      )}

      {/* Degradado Inferior & Título Minimalista */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        background: 'linear-gradient(to top, rgba(8,12,10,0.96) 0%, rgba(8,12,10,0.7) 65%, transparent 100%)',
        padding: '12px 10px 10px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <span style={{
          fontSize: '0.82rem',
          fontWeight: 800,
          color: '#fff',
          lineHeight: '1.15',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {game.name || game.title}
        </span>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '2px'
        }}>
          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
            {isSteam 
              ? (game.sizeMb > 1024 ? `${(game.sizeMb / 1024).toFixed(1)} GB` : `${game.sizeMb} MB`)
              : (game.launchType ? game.launchType.toUpperCase() : 'URL')}
          </span>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--primary)',
            color: '#052e16',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.66rem',
            fontWeight: 800
          }}>
            <Play size={10} fill="#052e16" />
            <span>Jugar</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function LeisureView() {
  const [gamingStatus, setGamingStatus] = useState(null);
  const [steamGames, setSteamGames] = useState([]);
  const [customGames, setCustomGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [useGamescopeFsr, setUseGamescopeFsr] = useState(() => {
    return localStorage.getItem('aegis_leisure_gamescope') === 'true';
  });
  const [gamescopeRes, setGamescopeRes] = useState(() => {
    return localStorage.getItem('aegis_leisure_res') || '720p';
  });
  const [useMangohud, setUseMangohud] = useState(() => {
    return localStorage.getItem('aegis_leisure_mangohud') === 'true';
  });
  const [launchMessage, setLaunchMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal para Juego Personalizado
  const [showGameModal, setShowGameModal] = useState(false);
  const [gameFormData, setGameFormData] = useState({
    id: '',
    title: '',
    category: 'Web Roguelike',
    launchType: 'url',
    launchTarget: '',
    description: '',
    bannerUrl: ''
  });

  // Telemetría Gamepad reactiva basada en eventos (Sin polling de CPU)
  const [gamepadConnected, setGamepadConnected] = useState(false);

  useEffect(() => {
    const handleConnect = () => setGamepadConnected(true);
    const handleDisconnect = () => setGamepadConnected(false);

    window.addEventListener('gamepadconnected', handleConnect);
    window.addEventListener('gamepaddisconnected', handleDisconnect);

    // Verificación inicial única sin interval
    try {
      const gps = navigator.getGamepads ? navigator.getGamepads() : [];
      setGamepadConnected(Array.from(gps).some(g => g && g.connected));
    } catch {
      // Ignorar
    }

    return () => {
      window.removeEventListener('gamepadconnected', handleConnect);
      window.removeEventListener('gamepaddisconnected', handleDisconnect);
    };
  }, []);

  // Carga inicial
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [status, sGames, cGames] = await Promise.all([
        invoke('get_gaming_status').catch(() => null),
        invoke('get_installed_steam_games').catch(() => []),
        invoke('sqlite_get_custom_games').catch(() => [])
      ]);

      setGamingStatus(status);
      setSteamGames(Array.isArray(sGames) ? sGames : []);
      setCustomGames(Array.isArray(cGames) ? cGames : []);
    } catch (e) {
      console.error('Error cargando catálogo gaming:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Persistencia de opciones de aceleración
  const handleToggleGamescope = (val) => {
    setUseGamescopeFsr(val);
    localStorage.setItem('aegis_leisure_gamescope', String(val));
  };

  const handleChangeRes = (val) => {
    setGamescopeRes(val);
    localStorage.setItem('aegis_leisure_res', val);
  };

  const handleToggleMangohud = (val) => {
    setUseMangohud(val);
    localStorage.setItem('aegis_leisure_mangohud', String(val));
  };

  // Lanzar juego universal
  const handleLaunchGame = useCallback(async (gameId, launchType = null, launchTarget = null) => {
    try {
      const res = await invoke('launch_game', {
        gameId,
        launchType,
        launchTarget,
        useGamemode: true,
        useGamescopeFsr,
        useMangohud,
        gamescopeRes
      });
      setLaunchMessage(res);
      setTimeout(() => setLaunchMessage(null), 3500);
    } catch (e) {
      setLaunchMessage(`Error: ${e}`);
      setTimeout(() => setLaunchMessage(null), 3500);
    }
  }, [useGamescopeFsr, useMangohud, gamescopeRes]);

  // Guardar juego personalizado
  const handleSaveCustomGame = async (e) => {
    e.preventDefault();
    if (!gameFormData.title.trim() || !gameFormData.launchTarget.trim()) return;

    try {
      const gameToSave = {
        id: gameFormData.id || `cg_${Date.now()}`,
        title: gameFormData.title.trim(),
        category: gameFormData.category.trim() || 'General',
        launchType: gameFormData.launchType,
        launchTarget: gameFormData.launchTarget.trim(),
        description: gameFormData.description.trim() || null,
        bannerUrl: gameFormData.bannerUrl.trim() || null,
        playTimeMinutes: 0,
        lastPlayed: null,
        createdAt: new Date().toISOString()
      };

      await invoke('sqlite_save_custom_game', { game: gameToSave });
      setShowGameModal(false);
      setGameFormData({
        id: '',
        title: '',
        category: 'Web Roguelike',
        launchType: 'url',
        launchTarget: '',
        description: '',
        bannerUrl: ''
      });
      fetchData();
    } catch (err) {
      alert(`Error guardando juego: ${err}`);
    }
  };

  // Eliminar juego personalizado
  const handleDeleteCustomGame = useCallback(async (id) => {
    if (!confirm('¿Eliminar este lanzador del catálogo?')) return;
    try {
      await invoke('sqlite_delete_custom_game', { id });
      fetchData();
    } catch (err) {
      alert(`Error eliminando juego: ${err}`);
    }
  }, [fetchData]);

  // Filtrado de títulos optimizado con useMemo
  const filteredSteam = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return steamGames.filter(g => {
      if (categoryFilter !== 'all' && categoryFilter !== 'steam') return false;
      return !q || g.name.toLowerCase().includes(q) || g.appId.includes(q);
    });
  }, [steamGames, searchQuery, categoryFilter]);

  const filteredCustom = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customGames.filter(g => {
      if (categoryFilter === 'steam') return false;
      if (categoryFilter === 'web' && g.launchType !== 'url') return false;
      if (categoryFilter === 'emu' && g.launchType !== 'flatpak' && g.launchType !== 'cmd') return false;
      return !q || g.title.toLowerCase().includes(q) || (g.category || '').toLowerCase().includes(q);
    });
  }, [customGames, searchQuery, categoryFilter]);

  const totalTitles = filteredSteam.length + filteredCustom.length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: '0.65rem',
      overflowY: 'auto',
      paddingRight: '2px'
    }}>
      {/* 🧭 Barra Superior: Filtros & Telemetría */}
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
            {[
              { id: 'all', label: `Todos (${steamGames.length + customGames.length})` },
              { id: 'steam', label: `Steam (${steamGames.length})` },
              { id: 'web', label: 'Web' },
              { id: 'emu', label: 'Emuladores' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.68rem',
                  background: categoryFilter === cat.id ? 'var(--primary-glow)' : 'transparent',
                  border: `1px solid ${categoryFilter === cat.id ? 'var(--primary)' : 'var(--border-color)'}`,
                  color: categoryFilter === cat.id ? '#a7f3d0' : 'var(--text-muted)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: categoryFilter === cat.id ? 700 : 500
                }}
              >
                {cat.label}
              </button>
            ))}
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

          <button
            onClick={() => {
              setGameFormData({
                id: '',
                title: '',
                category: 'Web Roguelike',
                launchType: 'url',
                launchTarget: '',
                description: '',
                bannerUrl: ''
              });
              setShowGameModal(true);
            }}
            className="btn btn-primary"
            style={{ padding: '3px 9px', fontSize: '0.72rem', height: '26px' }}
          >
            <Plus size={12} />
            <span>+ Juego</span>
          </button>

          <button
            onClick={() => handleLaunchGame('steam')}
            className="btn btn-secondary"
            style={{ padding: '3px 8px', fontSize: '0.72rem', height: '26px' }}
            title="Abrir el cliente de Steam"
          >
            Steam
          </button>

          <button
            onClick={fetchData}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '3px' }}
            title="Refrescar catálogo"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* 🚀 Barra de Aceleración: Gamescope & MangoHud */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '5px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        fontSize: '0.72rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
          <Zap size={13} color="var(--primary)" />
          <span>Aceleración:</span>
          <span style={{ color: '#fff', fontWeight: 600 }}>gamemoderun automático</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              background: useGamescopeFsr ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              border: useGamescopeFsr ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: useGamescopeFsr ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
              boxShadow: useGamescopeFsr ? '0 0 10px var(--primary-glow)' : 'none'
            }}>
              <input
                type="checkbox"
                checked={useGamescopeFsr}
                onChange={(e) => handleToggleGamescope(e.target.checked)}
                style={{ width: '1rem', height: '1rem' }}
              />
              <span>Gamescope FSR</span>
            </label>

            {useGamescopeFsr && (
              <select
                value={gamescopeRes}
                onChange={(e) => handleChangeRes(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  color: 'var(--text-high)',
                  border: '1px solid var(--primary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.66rem',
                  padding: '2px 6px'
                }}
              >
                <option value="540p">540p → 1080p FSR (Rendimiento)</option>
                <option value="720p">720p → 1080p FSR (Equilibrado)</option>
                <option value="1080p">1080p Nativo</option>
              </select>
            )}
          </div>

          {gamingStatus?.mangohudInstalled && (
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              background: useMangohud ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              border: useMangohud ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: useMangohud ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
              boxShadow: useMangohud ? '0 0 10px var(--primary-glow)' : 'none'
            }}>
              <input
                type="checkbox"
                checked={useMangohud}
                onChange={(e) => handleToggleMangohud(e.target.checked)}
                style={{ width: '1rem', height: '1rem' }}
              />
              <span>MangoHud FPS</span>
            </label>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🎮 CUADRÍCULA: CARDS FULL PORTADA & MINIMALISTAS                          */}
      {/* ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '12px',
        paddingBottom: '12px'
      }}>
        {filteredSteam.map(game => (
          <GameCard
            key={game.appId}
            game={game}
            isSteam={true}
            onLaunch={handleLaunchGame}
          />
        ))}

        {filteredCustom.map(game => (
          <GameCard
            key={game.id}
            game={game}
            isSteam={false}
            onLaunch={handleLaunchGame}
            onDelete={handleDeleteCustomGame}
          />
        ))}
      </div>

      {totalTitles === 0 && !loading && (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.82rem',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Gamepad2 size={32} color="var(--text-muted)" />
          <span>No se encontraron títulos en la biblioteca ni lanzadores que coincidan con la búsqueda.</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🪟 MODAL: AGREGAR NUEVO LANZADOR                                         */}
      {/* ========================================================================= */}
      {showGameModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            width: '90%',
            maxWidth: '460px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>
                Agregar Nuevo Lanzador de Juego
              </span>
              <button
                onClick={() => setShowGameModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomGame} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Título del Juego *
                </label>
                <input
                  type="text"
                  required
                  value={gameFormData.title}
                  onChange={(e) => setGameFormData({ ...gameFormData, title: e.target.value })}
                  placeholder="ej. PokéRogue, RetroArch, Chess..."
                  style={{
                    width: '100%',
                    height: '28px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                    Tipo de Lanzador
                  </label>
                  <select
                    value={gameFormData.launchType}
                    onChange={(e) => setGameFormData({ ...gameFormData, launchType: e.target.value })}
                    style={{
                      width: '100%',
                      height: '28px',
                      padding: '2px 6px',
                      fontSize: '0.72rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff'
                    }}
                  >
                    <option value="url">Navegador Web (URL)</option>
                    <option value="flatpak">Flatpak (App ID)</option>
                    <option value="cmd">Comando Binario / Shell</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                    Categoría / Etiqueta
                  </label>
                  <input
                    type="text"
                    value={gameFormData.category}
                    onChange={(e) => setGameFormData({ ...gameFormData, category: e.target.value })}
                    placeholder="Roguelike, Emulación..."
                    style={{
                      width: '100%',
                      height: '28px',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Destino de Ejecución (URL, ID Flatpak o Comando) *
                </label>
                <input
                  type="text"
                  required
                  value={gameFormData.launchTarget}
                  onChange={(e) => setGameFormData({ ...gameFormData, launchTarget: e.target.value })}
                  placeholder="https://... o io.mgba.mGBA o /usr/bin/..."
                  style={{
                    width: '100%',
                    height: '28px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  URL de Imagen de Portada (Opcional)
                </label>
                <input
                  type="text"
                  value={gameFormData.bannerUrl}
                  onChange={(e) => setGameFormData({ ...gameFormData, bannerUrl: e.target.value })}
                  placeholder="https://... (JPG/PNG vertical u horizontal)"
                  style={{
                    width: '100%',
                    height: '28px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Descripción Breve
                </label>
                <input
                  type="text"
                  value={gameFormData.description}
                  onChange={(e) => setGameFormData({ ...gameFormData, description: e.target.value })}
                  placeholder="Resumen o notas del juego..."
                  style={{
                    width: '100%',
                    height: '28px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowGameModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '4px 14px', fontSize: '0.75rem' }}
                >
                  Guardar Lanzador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
