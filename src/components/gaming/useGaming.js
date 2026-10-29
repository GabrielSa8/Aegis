import { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';

const INITIAL_GAME_FORM = {
  id: '',
  title: '',
  category: 'Web Roguelike',
  launchType: 'url',
  launchTarget: '',
  description: '',
  bannerUrl: ''
};

export function useGaming() {
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
  const [gameFormData, setGameFormData] = useState(INITIAL_GAME_FORM);

  // Telemetría Gamepad reactiva basada en eventos (Sin polling de CPU)
  const [gamepadConnected, setGamepadConnected] = useState(false);

  useEffect(() => {
    const handleConnect = () => setGamepadConnected(true);
    const handleDisconnect = () => setGamepadConnected(false);

    window.addEventListener('gamepadconnected', handleConnect);
    window.addEventListener('gamepaddisconnected', handleDisconnect);

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
      setGameFormData(INITIAL_GAME_FORM);
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

  const openNewGameModal = () => {
    setGameFormData(INITIAL_GAME_FORM);
    setShowGameModal(true);
  };

  return {
    gamingStatus,
    steamGames,
    customGames,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    useGamescopeFsr,
    gamescopeRes,
    useMangohud,
    launchMessage,
    loading,
    showGameModal,
    setShowGameModal,
    gameFormData,
    setGameFormData,
    gamepadConnected,
    fetchData,
    handleToggleGamescope,
    handleChangeRes,
    handleToggleMangohud,
    handleLaunchGame,
    handleSaveCustomGame,
    handleDeleteCustomGame,
    filteredSteam,
    filteredCustom,
    totalTitles,
    openNewGameModal
  };
}
