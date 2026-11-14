import { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  INITIAL_GAME_FORM,
  checkGamepadConnected,
  sortGamesList,
  getGameNormalizedId,
  getHiddenGameIds,
  saveHiddenGameIds
} from './gameHelpers';
import { useGameSessionTracker } from './useGameSessionTracker';

export function useGaming() {
  const [gamingStatus, setGamingStatus] = useState(null);
  const [steamGames, setSteamGames] = useState([]);
  const [customGames, setCustomGames] = useState([]);
  const [gameStatsMap, setGameStatsMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // ⇅ Estado de Ordenamiento
  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem('aegis_gaming_sort_by') || 'recent';
  });

  // 🔒 Bóveda de Juegos Ocultos / Encriptados
  const [hiddenGameIds, setHiddenGameIds] = useState(() => {
    return new Set(getHiddenGameIds());
  });
  const [showHiddenVault, setShowHiddenVault] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [masterPasswordEnabled, setMasterPasswordEnabled] = useState(false);

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

  // Cargar estado de seguridad reactivo para Bóveda
  useEffect(() => {
    invoke('get_security_status')
      .then((res) => {
        if (res && typeof res.masterPasswordEnabled === 'boolean') {
          setMasterPasswordEnabled(res.masterPasswordEnabled);
        }
      })
      .catch(() => {});

    const handleSecChange = (e) => {
      if (e.detail && typeof e.detail.masterPasswordEnabled === 'boolean') {
        setMasterPasswordEnabled(e.detail.masterPasswordEnabled);
      }
    };
    window.addEventListener('aegis:security-status-changed', handleSecChange);
    return () => window.removeEventListener('aegis:security-status-changed', handleSecChange);
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
      const [status, unifiedCatalog, cGames] = await Promise.all([
        invoke('get_gaming_status').catch(() => null),
        invoke('get_unified_game_catalog').catch(async () => {
          const fallbackSteam = await invoke('get_installed_steam_games').catch(() => []);
          return fallbackSteam.map((s) => ({
            gameId: `steam_${s.appId}`,
            title: s.name,
            appId: String(s.appId),
            isSteam: true,
            coverUrl: s.coverImage,
            isInstalled: true,
            achievementsUnlocked: s.achievementsUnlocked || 0,
            achievementsTotal: s.achievementsTotal || 0,
            totalPlayTimeSeconds: 0,
            lastPlayedDevice: 'Local'
          }));
        }),
        invoke('sqlite_get_custom_games').catch(() => [])
      ]);

      setGamingStatus(status);

      const steamItems = Array.isArray(unifiedCatalog)
        ? unifiedCatalog
            .filter((g) => g.isSteam || Boolean(g.appId))
            .map((g) => {
              const cover = g.coverImage || g.coverUrl || (g.appId ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${g.appId}/library_600x900.jpg` : null);
              return {
                appId: g.appId,
                name: g.title,
                title: g.title,
                coverImage: cover,
                coverUrl: cover,
                bannerUrl: g.bannerUrl || cover,
                isInstalled: g.isInstalled,
                lastPlayedDevice: g.lastPlayedDevice,
                achievementsUnlocked: g.achievementsUnlocked,
                achievementsTotal: g.achievementsTotal,
                totalPlayTimeSeconds: g.totalPlayTimeSeconds,
                lastPlayed: g.lastPlayed,
                isSteam: true
              };
            })
        : [];

      setSteamGames(steamItems);
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

  const handleSetSortBy = useCallback((newSort) => {
    setSortBy(newSort);
    localStorage.setItem('aegis_gaming_sort_by', newSort);
  }, []);

  // 🔒 Operaciones de Bóveda / Ocultar Juegos
  const isGameHidden = useCallback((game, isSteam = false) => {
    const id = getGameNormalizedId(game, isSteam);
    return hiddenGameIds.has(id);
  }, [hiddenGameIds]);

  const toggleHideGame = useCallback((game, isSteam = false) => {
    const id = getGameNormalizedId(game, isSteam);
    setHiddenGameIds((prev) => {
      const next = new Set(prev);
      const isCurrentlyHidden = next.has(id);
      if (isCurrentlyHidden) {
        next.delete(id);
        setLaunchMessage(`"${game.title || game.name}" restaurado al catálogo`);
      } else {
        next.add(id);
        setLaunchMessage(`"${game.title || game.name}" resguardado en la Bóveda`);
      }
      saveHiddenGameIds(Array.from(next));
      return next;
    });
    setTimeout(() => setLaunchMessage(null), 3000);
  }, [setLaunchMessage]);

  const handleToggleVault = useCallback(() => {
    if (showHiddenVault) {
      setShowHiddenVault(false);
      setLaunchMessage('Bóveda resguardada');
      setTimeout(() => setLaunchMessage(null), 2000);
    } else {
      if (masterPasswordEnabled) {
        setShowUnlockModal(true);
      } else {
        setShowHiddenVault(true);
      }
    }
  }, [showHiddenVault, masterPasswordEnabled, setLaunchMessage]);

  const handleSaveCustomGame = async (e) => {
    e.preventDefault();
    if (!gameFormData.title.trim() || !gameFormData.launchTarget.trim()) return;

    try {
      const gameToSave = {
        ...gameFormData,
        id: gameFormData.id || `custom_${Date.now()}`,
        playTimeMinutes: gameFormData.playTimeMinutes ?? 0,
        createdAt: gameFormData.createdAt || new Date().toISOString()
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

  const handleInstallSteamGame = useCallback(async (appId) => {
    try {
      await invoke('install_steam_game', { appId: String(appId) });
    } catch (err) {
      console.error('Error al solicitar instalación vía Steam:', err);
      alert(`No se pudo abrir Steam para instalar: ${err}`);
    }
  }, []);

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

  // Filtrado y ordenamiento de juegos
  const filteredSteamGames = useMemo(() => {
    const filtered = steamGames.filter((g) => {
      const isHidden = isGameHidden(g, true);
      if (!showHiddenVault && isHidden) return false;
      if (categoryFilter === 'vault' && !isHidden) return false;

      const matchesSearch =
        !searchQuery ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(g.appId).includes(searchQuery);
      const matchesCat = categoryFilter === 'all' || categoryFilter === 'steam' || categoryFilter === 'vault';
      return matchesSearch && matchesCat;
    });

    return sortGamesList(filtered, sortBy, gameStatsMap);
  }, [steamGames, searchQuery, categoryFilter, isGameHidden, showHiddenVault, sortBy, gameStatsMap]);

  const filteredCustomGames = useMemo(() => {
    const filtered = customGames.filter((g) => {
      const isHidden = isGameHidden(g, false);
      if (!showHiddenVault && isHidden) return false;
      if (categoryFilter === 'vault' && !isHidden) return false;

      const matchesSearch =
        !searchQuery ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = categoryFilter === 'all' || categoryFilter === g.category || categoryFilter === 'vault';
      return matchesSearch && matchesCat;
    });

    return sortGamesList(filtered, sortBy, gameStatsMap);
  }, [customGames, searchQuery, categoryFilter, isGameHidden, showHiddenVault, sortBy, gameStatsMap]);

  return {
    gamingStatus,
    steamGames,
    customGames,
    filteredSteam: filteredSteamGames,
    filteredCustom: filteredCustomGames,
    filteredSteamGames,
    filteredCustomGames,
    totalTitles: filteredSteamGames.length + filteredCustomGames.length,
    gameStatsMap,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy: handleSetSortBy,
    hiddenGameIds,
    hiddenCount: hiddenGameIds.size,
    showHiddenVault,
    setShowHiddenVault,
    showUnlockModal,
    setShowUnlockModal,
    masterPasswordEnabled,
    isGameHidden,
    toggleHideGame,
    handleToggleVault,
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
    openNewGameModal: () => {
      setGameFormData(INITIAL_GAME_FORM);
      setShowGameModal(true);
    },
    openGameDetail: (game, isSteam = false, initialTab = 'achievements') => {
      setSelectedGameForDetail({ game, isSteam, initialTab });
    },
    closeGameDetail: () => setSelectedGameForDetail(null),
    handleOpenEditModal,
    handleOpenDetailModal: (game) => setSelectedGameForDetail(game),
    handleCloseDetailModal: () => setSelectedGameForDetail(null),
    handleSaveCustomGame,
    handleDeleteCustomGame,
    handleInstallSteamGame,
    fetchData,
    refreshStats,
    gamepadConnected
  };
}
