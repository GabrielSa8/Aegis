import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useP2pSync() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncingPeerIp, setSyncingPeerIp] = useState(null);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await invoke('get_p2p_sync_status');
      if (isMountedRef.current) {
        setStatus(data);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(typeof err === 'string' ? err : 'Error al consultar estado P2P');
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStatus();

    // Polling regular cada 3.5s para mantener el radar de la LAN al día
    const interval = setInterval(() => {
      fetchStatus();
    }, 3500);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchStatus]);

  const toggleSync = async (enabled) => {
    setLoading(true);
    try {
      const updated = await invoke('toggle_p2p_sync', { enabled });
      setStatus(updated);
      setError(null);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al cambiar estado P2P');
    } finally {
      setLoading(false);
    }
  };

  const updateDeviceName = async (name) => {
    try {
      const updated = await invoke('update_p2p_device_name', { name });
      setStatus(updated);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al actualizar nombre');
    }
  };

  const generatePin = async () => {
    try {
      const newPin = await invoke('generate_new_pairing_pin');
      setStatus(prev => prev ? { ...prev, pairingPin: newPin } : prev);
      return newPin;
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al generar nuevo PIN');
      return null;
    }
  };

  const pairDevice = async (peerIp, peerPort, pin) => {
    try {
      setError(null);
      await invoke('pair_with_remote_peer', {
        peerIp,
        peerPort: Number(peerPort),
        pin
      });
      await fetchStatus();
      return { success: true };
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Fallo en emparejamiento';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const replicateWithPeer = async (peerIp, peerPort) => {
    setSyncingPeerIp(peerIp);
    setError(null);
    try {
      const result = await invoke('trigger_p2p_replicate', {
        peerIp,
        peerPort: Number(peerPort)
      });
      setLastSyncResult(result);
      await fetchStatus();
      try {
        const freshCfg = await invoke('get_aegis_config');
        window.dispatchEvent(new CustomEvent('aegis:config-reloaded', { detail: freshCfg }));
      } catch (_) {}
      return { success: true, result };
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Error durante replicación P2P';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSyncingPeerIp(null);
    }
  };

  const unpairDevice = async (deviceId) => {
    try {
      const updated = await invoke('unpair_peer_device', { peerId: deviceId });
      setStatus(updated);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al desvincular dispositivo');
    }
  };

  return {
    status,
    loading,
    syncingPeerIp,
    lastSyncResult,
    error,
    refreshStatus: fetchStatus,
    toggleSync,
    updateDeviceName,
    generatePin,
    pairDevice,
    replicateWithPeer,
    unpairDevice,
    clearError: () => setError(null)
  };
}
