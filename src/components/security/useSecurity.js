import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useSecurity() {
  const [status, setStatus] = useState({
    masterPasswordEnabled: false,
    isLocked: false,
    encryptCredentials: true,
    encryptDatabase: false,
    autoLockMinutes: 15,
    lockOnTrayMinimize: false,
    hasEncryptedDb: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const broadcastStatus = useCallback((updated) => {
    if (isMountedRef.current && updated) {
      setStatus(updated);
      window.dispatchEvent(new CustomEvent('aegis:security-status-changed', { detail: updated }));
    }
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await invoke('get_security_status');
      if (isMountedRef.current && res) {
        setStatus(res);
      }
      return res;
    } catch (err) {
      if (isMountedRef.current) {
        setError(typeof err === 'string' ? err : 'Error al obtener estado de seguridad');
      }
      return null;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const setupMasterPassword = useCallback(async ({
    password,
    confirmPassword,
    encryptCredentials = true,
    encryptDatabase = false,
    autoLockMinutes = 15,
    lockOnTrayMinimize = false
  }) => {
    try {
      setError(null);
      const updated = await invoke('setup_master_password', {
        password,
        confirmPassword,
        encryptCredentials,
        encryptDatabase,
        autoLockMinutes,
        lockOnTrayMinimize
      });
      broadcastStatus(updated);
      return { success: true, status: updated };
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Error al configurar contraseña maestra';
      setError(msg);
      return { success: false, error: msg };
    }
  }, [broadcastStatus]);

  const unlockVault = useCallback(async (password) => {
    try {
      setError(null);
      const updated = await invoke('unlock_vault', { password });
      broadcastStatus(updated);
      return { success: true, status: updated };
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Contraseña incorrecta';
      setError(msg);
      return { success: false, error: msg };
    }
  }, [broadcastStatus]);

  const lockVault = useCallback(async () => {
    try {
      setError(null);
      const updated = await invoke('lock_vault');
      broadcastStatus(updated);
      return { success: true, status: updated };
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Error al bloquear vault';
      setError(msg);
      return { success: false, error: msg };
    }
  }, [broadcastStatus]);

  const changeMasterPassword = useCallback(async ({ currentPassword, newPassword, confirmPassword }) => {
    try {
      setError(null);
      const updated = await invoke('change_master_password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      broadcastStatus(updated);
      return { success: true, status: updated };
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Error al cambiar contraseña';
      setError(msg);
      return { success: false, error: msg };
    }
  }, [broadcastStatus]);

  const disableMasterPassword = useCallback(async (currentPassword) => {
    try {
      setError(null);
      const updated = await invoke('disable_master_password', { currentPassword });
      broadcastStatus(updated);
      return { success: true, status: updated };
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Error al desactivar contraseña';
      setError(msg);
      return { success: false, error: msg };
    }
  }, [broadcastStatus]);

  const updatePolicies = useCallback(async ({
    encryptCredentials,
    encryptDatabase,
    autoLockMinutes,
    lockOnTrayMinimize
  }) => {
    try {
      setError(null);
      const updated = await invoke('update_security_policies', {
        encryptCredentials,
        encryptDatabase,
        autoLockMinutes,
        lockOnTrayMinimize
      });
      broadcastStatus(updated);
      return { success: true, status: updated };
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Error al actualizar políticas';
      setError(msg);
      return { success: false, error: msg };
    }
  }, [broadcastStatus]);

  // Sincronización multi-componente, monitor de inactividad periódico y registro de actividad
  useEffect(() => {
    isMountedRef.current = true;
    loadStatus();

    const handleExternalStatus = (e) => {
      if (e.detail && isMountedRef.current) {
        setStatus(e.detail);
      }
    };
    window.addEventListener('aegis:security-status-changed', handleExternalStatus);

    const interval = setInterval(async () => {
      try {
        const wasLocked = await invoke('record_vault_activity');
        if (wasLocked && isMountedRef.current) {
          const res = await invoke('get_security_status');
          broadcastStatus(res);
        }
      } catch {}
    }, 30000);

    let lastActivityTime = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle: registrar actividad en Rust como máximo 1 vez cada 15 segundos (anti-inundación IPC)
      if (now - lastActivityTime >= 15000) {
        lastActivityTime = now;
        invoke('record_vault_activity').catch(() => {});
      }
    };

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      window.removeEventListener('aegis:security-status-changed', handleExternalStatus);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
  }, [loadStatus, broadcastStatus]);

  return {
    status,
    loading,
    error,
    clearError: () => setError(null),
    loadStatus,
    setupMasterPassword,
    unlockVault,
    lockVault,
    changeMasterPassword,
    disableMasterPassword,
    updatePolicies
  };
}
