import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

// Caché en memoria para cambio de pestaña instantáneo
let _cachedAutostartItems = null;

export function useAutostart() {
  const [autostartItems, setAutostartItems] = useState(_cachedAutostartItems || []);
  const [loadingAutostart, setLoadingAutostart] = useState(false);
  const [togglingItemId, setTogglingItemId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const isMountedRef = useRef(true);

  const fetchAutostart = useCallback(async (force = false) => {
    try {
      setLoadingAutostart(true);
      const items = await invoke('get_autostart_items', { force });
      _cachedAutostartItems = items;
      if (isMountedRef.current) {
        setAutostartItems(items || []);
      }
    } catch (e) {
      console.error('Error cargando autostart:', e);
    } finally {
      if (isMountedRef.current) {
        setLoadingAutostart(false);
      }
    }
  }, []);

  const toggleAutostart = useCallback(async (id, itemType, currentEnabled) => {
    try {
      setTogglingItemId(id);
      const nextState = !currentEnabled;
      const msg = await invoke('toggle_autostart_item', {
        id,
        itemType,
        enable: nextState
      });
      setFeedback(msg);
      setTimeout(() => isMountedRef.current && setFeedback(null), 3500);
      await fetchAutostart(true);
    } catch (e) {
      setFeedback(`Error: ${e}`);
      setTimeout(() => isMountedRef.current && setFeedback(null), 4000);
    } finally {
      if (isMountedRef.current) {
        setTogglingItemId(null);
      }
    }
  }, [fetchAutostart]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!_cachedAutostartItems) {
      fetchAutostart(false);
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchAutostart]);

  return {
    autostartItems,
    loadingAutostart,
    togglingItemId,
    fetchAutostart: () => fetchAutostart(true),
    toggleAutostart,
    feedback
  };
}
