import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

// Caché en memoria para transiciones de pestaña instantáneas (0ms)
let _cachedCleanReport = null;
let _cachedUpdatesReport = null;

export function useMaintenance() {
  const [cleanReport, setCleanReport] = useState(_cachedCleanReport);
  const [scanningDisk, setScanningDisk] = useState(false);
  const [purgingTargetId, setPurgingTargetId] = useState(null);
  const [purgingAll, setPurgingAll] = useState(false);
  const [purgeFeedback, setPurgeFeedback] = useState(null);

  const [updatesReport, setUpdatesReport] = useState(_cachedUpdatesReport);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [launchingUpdate, setLaunchingUpdate] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);

  const isMountedRef = useRef(true);

  const scanDisk = useCallback(async (force = false) => {
    try {
      setScanningDisk(true);
      const res = await invoke('scan_cleanable_targets', { force });
      _cachedCleanReport = res;
      if (isMountedRef.current) {
        setCleanReport(res);
      }
    } catch (e) {
      console.error('Error escaneando disco:', e);
    } finally {
      if (isMountedRef.current) {
        setScanningDisk(false);
      }
    }
  }, []);

  const purgeTarget = useCallback(async (targetId) => {
    try {
      setPurgingTargetId(targetId);
      const res = await invoke('purge_cleanable_target', { targetId });
      setPurgeFeedback(res.message);
      setTimeout(() => isMountedRef.current && setPurgeFeedback(null), 4000);
      await scanDisk(true);
    } catch (e) {
      setPurgeFeedback(`Error: ${e}`);
      setTimeout(() => isMountedRef.current && setPurgeFeedback(null), 4000);
    } finally {
      if (isMountedRef.current) {
        setPurgingTargetId(null);
      }
    }
  }, [scanDisk]);

  const purgeAll = useCallback(async () => {
    try {
      setPurgingAll(true);
      const results = await invoke('purge_all_cleanable_targets');
      setPurgeFeedback(`Purga completa finalizada. ${results.length} destinos limpiados.`);
      setTimeout(() => isMountedRef.current && setPurgeFeedback(null), 4000);
      await scanDisk(true);
    } catch (e) {
      setPurgeFeedback(`Error en purga total: ${e}`);
      setTimeout(() => isMountedRef.current && setPurgeFeedback(null), 4000);
    } finally {
      if (isMountedRef.current) {
        setPurgingAll(false);
      }
    }
  }, [scanDisk]);

  const checkUpdates = useCallback(async (force = false) => {
    try {
      setCheckingUpdates(true);
      const res = await invoke('check_system_updates', { force });
      _cachedUpdatesReport = res;
      if (isMountedRef.current) {
        setUpdatesReport(res);
      }
    } catch (e) {
      console.error('Error comprobando actualizaciones:', e);
    } finally {
      if (isMountedRef.current) {
        setCheckingUpdates(false);
      }
    }
  }, []);

  const launchSystemUpdate = useCallback(async () => {
    try {
      setLaunchingUpdate(true);
      const msg = await invoke('launch_system_update');
      setPurgeFeedback(msg);
      setTimeout(() => isMountedRef.current && setPurgeFeedback(null), 4000);
    } catch (e) {
      setPurgeFeedback(`Error lanzando actualización: ${e}`);
      setTimeout(() => isMountedRef.current && setPurgeFeedback(null), 4000);
    } finally {
      if (isMountedRef.current) {
        setLaunchingUpdate(false);
      }
    }
  }, []);

  const copyUpdateCommand = useCallback(() => {
    if (!updatesReport?.updateCommand) return;
    navigator.clipboard.writeText(updatesReport.updateCommand);
    setCopiedCommand(true);
    setTimeout(() => isMountedRef.current && setCopiedCommand(false), 2500);
  }, [updatesReport]);

  useEffect(() => {
    isMountedRef.current = true;

    // Si no hay reporte en caché, escanear disco de forma asíncrona
    if (!_cachedCleanReport) {
      scanDisk(false);
    }

    // Diferir la comprobación de parches DNF para garantizar cambio de pestaña a 60fps sin stutter
    let timer = null;
    if (!_cachedUpdatesReport) {
      timer = setTimeout(() => {
        if (isMountedRef.current) {
          checkUpdates(false);
        }
      }, 300);
    }

    return () => {
      isMountedRef.current = false;
      if (timer) clearTimeout(timer);
    };
  }, [scanDisk, checkUpdates]);

  return {
    cleanReport,
    scanningDisk,
    purgingTargetId,
    purgingAll,
    purgeFeedback,
    scanDisk: () => scanDisk(true),
    purgeTarget,
    purgeAll,
    updatesReport,
    checkingUpdates,
    launchingUpdate,
    copiedCommand,
    checkUpdates: () => checkUpdates(true),
    copyUpdateCommand,
    launchSystemUpdate
  };
}
