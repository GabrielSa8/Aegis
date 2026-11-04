import { useState, useCallback, useEffect } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export function useAppUpdater() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'upToDate' | 'error'
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeUpdateRef, setActiveUpdateRef] = useState(null);

  const checkForUpdates = useCallback(async (silent = false) => {
    try {
      setStatus('checking');
      setErrorMessage(null);
      const update = await check();

      if (update && update.available) {
        setUpdateInfo({
          version: update.version,
          currentVersion: update.currentVersion,
          body: update.body || '',
          date: update.date || ''
        });
        setActiveUpdateRef(update);
        setStatus('available');
      } else {
        setStatus('upToDate');
        if (!silent) {
          setTimeout(() => setStatus('idle'), 4000);
        }
      }
    } catch (err) {
      console.warn('[Aegis Updater]: Error comprobando actualizaciones:', err);
      const msg = String(err?.message || err || '');

      // Si GitHub devuelve 404 (aún no se publica un latest.json en releases remotas)
      if (
        msg.includes('Could not fetch a valid release JSON') ||
        msg.includes('404') ||
        msg.includes('Not Found') ||
        msg.includes('status code')
      ) {
        setStatus('upToDate');
        setErrorMessage(null);
      } else {
        setErrorMessage(msg || 'No se pudo contactar el servidor de actualizaciones');
        setStatus('error');
        if (!silent) {
          setTimeout(() => setStatus('idle'), 6000);
        }
      }
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    if (!activeUpdateRef) return;
    try {
      setStatus('downloading');
      setDownloadProgress(0);

      let downloaded = 0;
      let contentLength = 0;

      await activeUpdateRef.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setDownloadProgress(Math.min(100, Math.round((downloaded / contentLength) * 100)));
            }
            break;
          case 'Finished':
            setDownloadProgress(100);
            break;
        }
      });

      setStatus('ready');
    } catch (err) {
      console.error('[Aegis Updater]: Fallo descargando actualización:', err);
      setErrorMessage(err?.message || 'Error descargando paquete');
      setStatus('error');
    }
  }, [activeUpdateRef]);

  const restartApp = useCallback(async () => {
    try {
      await relaunch();
    } catch (err) {
      console.error('[Aegis Updater]: Error reiniciando aplicación:', err);
    }
  }, []);

  const dismiss = useCallback(() => {
    setStatus('idle');
  }, []);

  // Comprobación inicial silenciosa al iniciar
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdates(true);
    }, 6000); // 6s de cortesía tras cargar la interfaz
    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  return {
    status,
    updateInfo,
    downloadProgress,
    errorMessage,
    checkForUpdates,
    downloadAndInstall,
    restartApp,
    dismiss
  };
}
