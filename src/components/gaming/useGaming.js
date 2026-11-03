import { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { INITIAL_GAME_FORM, checkGamepadConnected } from './gameHelpers';

export function useGaming() {
  const [gamingStatus, setGamingStatus] = useState(null);
  const [steamGames, setSteamGames] = useState([]);
  const [customGames, setCustomGames] = useState([]);
  const [gameStatsMap, setGameStatsMap] = useState({});
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

  // ⏱️ Sesión Activa de Juego (Tracker en Vivo)
  const [activeSession, setActiveSession] = useState(null);

  // 🪟 Modales Tácticos
  const [showGameModal, setShowGameModal] = useState(false);
  const [gameFormData, setGameFormData] = useState(INITIAL_GAME_FORM);
  const [selectedGameForDetail, setSelectedGameForDetail] = useState(null);

  // 🎮 Telemetría Gamepad reactiva
  const [gamepadConnected, setGamepadConnected] = useState(false);

  useEffect(() => {
    const handleConnect = () => setGamepadConnected(true);
    const handleDisconnect = () => setGamepadConnected(false);

    window.addEventListener('gamepadconnected', handleConnect);
    window.addEventListener('gamepaddisconnected', handleDisconnect);
    setGamepadConnected(checkGamepadConnected());

    return () => {
      window.removeEventListener('gamepadconnected', handleConnect);
      window.removeEventListener('gamepaddisconnected', handleDisconnect);
    };
  }, []);

  // Cronómetro de sesión activa
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      setActiveSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [Boolean(activeSession)]);

  const refreshStats = useCallback(async () => {
    try {
      const statsList = await invoke('get_all_game_stats').catch(() => []);
      const map = {};
      if (Array.isArray(statsList)) {
        statsList.forEach((s) => {
          if (s && s.gameId) {
            map[s.gameId] = s;
          }
        });
      }
      setGameStatsMap(map);
    } catch (err) {
      console.error('Error cargando estadísticas de juego:', err);
    }
  }, []);

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
      await refreshStats();
    } catch (e) {
      console.error('Error cargando catálogo gaming:', e);
    } finally {
      setLoading(false);
    }
  }, [refreshStats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleLaunchGame = useCallback(
    async (gameId, launchType = null, launchTarget = null, gameTitle = null, isSteam = false) => {
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

        if (gameTitle) {
          const rawId = isSteam && gameId.startsWith('steam:') ? gameId.slice(6) : gameId;
          setActiveSession({
            gameId: rawId,
            gameTitle,
            isSteam: Boolean(isSteam),
            startTime: new Date(),
            elapsedSeconds: 0
          });
        }
      } catch (e) {
        setLaunchMessage(`Error: ${e}`);
        setTimeout(() => setLaunchMessage(null), 3500);
      }
    },
    [useGamescopeFsr, useMangohud, gamescopeRes]
  );

  const handleStopSession = useCallback(async () => {
    if (!activeSession) return;
    try {
      const now = new Date();
      await invoke('record_game_session', {
        gameId: String(activeSession.gameId),
        gameTitle: activeSession.gameTitle,
        isSteam: Boolean(activeSession.isSteam),
        durationSeconds: activeSession.elapsedSeconds,
        startedAt: activeSession.startTime.toISOString(),
        endedAt: now.toISOString()
      });
      const mins = Math.max(1, Math.round(activeSession.elapsedSeconds / 60));
      setLaunchMessage(`Sesión registrada (+${mins} min)`);
      setTimeout(() => setLaunchMessage(null), 3500);
      setActiveSession(null);
      await refreshStats();
    } catch (err) {
      alert(`Error guardando sesión: ${err}`);
    }
  }, [activeSession, refreshStats]);

  const handleCancelSession = useCallback(() => {
    setActiveSession(null);
  }, []);

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
      setGameFormData(INITIAL_GAME_FORM);
      fetchData();
    } catch (err) {
      alert(`Error guardando juego: ${err}`);
    }
  };

  const handleDeleteCustomGame = useCallback(
    async (id) => {
      if (!confirm('¿Eliminar este lanzador del catálogo?')) return;
      try {
        await invoke('sqlite_delete_custom_game', { id });
        fetchData();
      } catch (err) {
        alert(`Error eliminando juego: ${err}`);
      }
    },
    [fetchData]
  );

  const filteredSteam = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return steamGames.filter((g) => {
      if (categoryFilter !== 'all' && categoryFilter !== 'steam') return false;
      return !q || g.name.toLowerCase().includes(q) || g.appId.includes(q);
    });
  }, [steamGames, searchQuery, categoryFilter]);

  const filteredCustom = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customGames.filter((g) => {
      if (categoryFilter === 'steam') return false;
      if (categoryFilter === 'web' && g.launchType !== 'url') return false;
      if (categoryFilter === 'emu' && g.launchType !== 'flatpak' && g.launchType !== 'cmd') return false;
      return !q || g.title.toLowerCase().includes(q) || (g.category || '').toLowerCase().includes(q);
    });
  }, [customGames, searchQuery, categoryFilter]);

  const totalTitles = filteredSteam.length + filteredCustom.length;

  return {
    gamingStatus,
    steamGames,
    customGames,
    gameStatsMap,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    useGamescopeFsr,
    gamescopeRes,
    useMangohud,
    launchMessage,
    loading,
    activeSession,
    showGameModal,
    setShowGameModal,
    gameFormData,
    setGameFormData,
    selectedGameForDetail,
    gamepadConnected,
    fetchData,
    refreshStats,
    handleToggleGamescope,
    handleChangeRes,
    handleToggleMangohud,
    handleLaunchGame,
    handleStopSession,
    handleCancelSession,
    handleSaveCustomGame,
    handleDeleteCustomGame,
    filteredSteam,
    filteredCustom,
    totalTitles,
    openNewGameModal: () => {
      setGameFormData(INITIAL_GAME_FORM);
      setShowGameModal(true);
    },
    openGameDetail: (game, isSteam, initialTab = 'achievements') =>
      setSelectedGameForDetail({ game, isSteam, initialTab }),
    closeGameDetail: () => setSelectedGameForDetail(null)
  };
}
