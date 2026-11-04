import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export function useGameSessionTracker({
  useGamescopeFsr,
  useMangohud,
  gamescopeRes,
  refreshStats,
  setLaunchMessage
}) {
  const [activeSession, setActiveSession] = useState(null);

  // Cronómetro de sesión activa (1 Hz)
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

  // Centinela: fin automático de sesión cuando el proceso del juego finaliza
  useEffect(() => {
    let unlistenFn = null;
    listen('aegis:game-session-auto-ended', (event) => {
      const payload = event?.payload;
      if (!payload) return;
      const mins = Math.max(1, Math.round((payload.durationSeconds || 0) / 60));
      setLaunchMessage(`🎮 Sesión finalizada automáticamente (+${mins} min)`);
      setTimeout(() => setLaunchMessage(null), 4000);
      setActiveSession(null);
      if (refreshStats) refreshStats();
    })
      .then((unlisten) => {
        unlistenFn = unlisten;
      })
      .catch((e) => console.error('Error escuchando aegis:game-session-auto-ended:', e));

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [refreshStats, setLaunchMessage]);

  const handleLaunchGame = useCallback(
    async (gameId, launchType = null, launchTarget = null, gameTitle = null, isSteam = false) => {
      try {
        const res = await invoke('launch_game', {
          gameId,
          gameTitle,
          isSteam: Boolean(isSteam),
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
    [useGamescopeFsr, useMangohud, gamescopeRes, setLaunchMessage]
  );

  const handleStopSession = useCallback(async () => {
    if (!activeSession) return;
    try {
      invoke('cancel_game_session').catch(() => {});
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
      if (refreshStats) await refreshStats();
    } catch (err) {
      alert(`Error guardando sesión: ${err}`);
    }
  }, [activeSession, refreshStats, setLaunchMessage]);

  const handleCancelSession = useCallback(() => {
    invoke('cancel_game_session').catch(() => {});
    setActiveSession(null);
  }, []);

  return {
    activeSession,
    handleLaunchGame,
    handleStopSession,
    handleCancelSession
  };
}
