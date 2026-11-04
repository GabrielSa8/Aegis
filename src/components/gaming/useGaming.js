import { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { INITIAL_GAME_FORM, checkGamepadConnected } from './gameHelpers';
import { useGameSessionTracker } from './useGameSessionTracker';

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

  // ⏱️ Tracker de Sesión de Juego (Cronómetro + Centinela de Proceso)
  const {
    activeSession,
    handleLaunchGame,
    handleStopSession,
    handleCancelSession
  } = useGameSessionTracker({
    useGamescopeFsr,
    useMangohud,
    gamescopeRes,
    refreshStats,
    setLaunchMessage
  });

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

  const handleSaveCustomGame = async (e) => {
    e.preventDefault();
    if (!gameFormData.title.trim() || !gameFormData.launchTarget.trim()) return;

    try {
      const gameToSave = {
        ...gameFormData,
        id: gameFormData.id || `custom_${Date.now()}`
      };
      await invoke('sqlite_save_custom_game', { game: gameToSave });
      setShowGameModal(false);
      setGameFormData(INITIAL_GAME_FORM);
      fetchData();
    } catch (e) {
      alert(`Error guardando juego: ${e}`);
    }
  };

  const handleDeleteCustomGame = async (id) => {
    if (!window.confirm('¿Eliminar este juego personalizado de Aegis?')) return;
    try {
      await invoke('sqlite_delete_custom_game', { id });
      if (selectedGameForDetail && selectedGameForDetail.id === id) {
        setSelectedGameForDetail(null);
      }
      fetchData();
    } catch (e) {
      alert(`Error eliminando juego: ${e}`);
    }
  };

  const handleOpenEditModal = (game) => {
    setGameFormData({
      id: game.id,
      title: game.title,
      category: game.category || 'emulator',
      launchType: game.launchType || 'cmd',
      launchTarget: game.launchTarget || '',
      description: game.description || '',
      bannerUrl: game.bannerUrl || ''
    });
    setShowGameModal(true);
  };

  const handleOpenDetailModal = (game) => {
    setSelectedGameForDetail(game);
  };

  const handleCloseDetailModal = () => {
    setSelectedGameForDetail(null);
  };

  // Filtrado de juegos por búsqueda y categoría
  const filteredSteamGames = useMemo(() => {
    return steamGames.filter((g) => {
      const matchesSearch =
        !searchQuery ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(g.appId).includes(searchQuery);
      const matchesCat = categoryFilter === 'all' || categoryFilter === 'steam';
      return matchesSearch && matchesCat;
    });
  }, [steamGames, searchQuery, categoryFilter]);

  const filteredCustomGames = useMemo(() => {
    return customGames.filter((g) => {
      const matchesSearch =
        !searchQuery ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = categoryFilter === 'all' || categoryFilter === g.category;
      return matchesSearch && matchesCat;
    });
  }, [customGames, searchQuery, categoryFilter]);

  return {
    gamingStatus,
    steamGames,
    customGames,
    filteredSteamGames,
    filteredCustomGames,
    gameStatsMap,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    useGamescopeFsr,
    handleToggleGamescope,
    gamescopeRes,
    handleChangeRes,
    useMangohud,
    handleToggleMangohud,
    launchMessage,
    loading,
    activeSession,
    handleLaunchGame,
    handleStopSession,
    handleCancelSession,
    showGameModal,
    setShowGameModal,
    gameFormData,
    setGameFormData,
    selectedGameForDetail,
    handleOpenEditModal,
    handleOpenDetailModal,
    handleCloseDetailModal,
    handleSaveCustomGame,
    handleDeleteCustomGame,
    refreshStats,
    gamepadConnected
  };
}
