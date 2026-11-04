import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useCommunityPlugins() {
  const [plugins, setPlugins] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [installingPluginId, setInstallingPluginId] = useState(null);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchPlugins = useCallback(async () => {
    try {
      setLoading(true);
      const list = await invoke('list_installed_community_plugins');
      setPlugins(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error listando plugins comunitarios');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCatalog = useCallback(async () => {
    try {
      setCatalogLoading(true);
      const items = await invoke('fetch_community_plugins_catalog');
      setCatalog(Array.isArray(items) ? items : []);
    } catch (err) {
      console.warn('Error obteniendo catálogo de plugins:', err);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlugins();
    fetchCatalog();
  }, [fetchPlugins, fetchCatalog]);

  const showActionMessage = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const togglePlugin = async (pluginId, currentState) => {
    try {
      const nextState = !currentState;
      await invoke('toggle_community_plugin', { pluginId, enabled: nextState });
      setPlugins(prev => prev.map(p => p.manifest.id === pluginId ? { ...p, isEnabled: nextState } : p));
      showActionMessage(`Plugin "${pluginId}" ${nextState ? 'activado' : 'desactivado'}.`);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al alternar plugin');
    }
  };

  const installFromPath = async (packagePath) => {
    try {
      const manifest = await invoke('install_plugin_package', { packagePath });
      await fetchPlugins();
      showActionMessage(`Plugin "${manifest.name}" instalado exitosamente.`);
      return { success: true, manifest };
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Fallo en la instalación del paquete';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const installFromUrl = async (url) => {
    try {
      const manifest = await invoke('install_plugin_from_url', { url });
      await fetchPlugins();
      showActionMessage(`Plugin "${manifest.name}" descargado e instalado.`);
      return { success: true, manifest };
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Fallo al descargar paquete desde URL';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const installFromCatalog = async (catalogItem) => {
    try {
      setInstallingPluginId(catalogItem.id);
      setError(null);
      if (catalogItem.downloadUrl && catalogItem.downloadUrl.trim().length > 0) {
        await invoke('install_plugin_from_url', { url: catalogItem.downloadUrl });
      } else {
        await invoke('create_plugin_scaffold', {
          id: catalogItem.id,
          name: catalogItem.name,
          category: catalogItem.category
        });
      }
      await fetchPlugins();
      showActionMessage(`Plugin "${catalogItem.name}" instalado y activado en 1-clic.`);
      return { success: true };
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Error al instalar plugin del catálogo';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setInstallingPluginId(null);
    }
  };

  const uninstallPlugin = async (pluginId) => {
    try {
      await invoke('uninstall_community_plugin', { pluginId });
      setPlugins(prev => prev.filter(p => p.manifest.id !== pluginId));
      showActionMessage(`Plugin "${pluginId}" eliminado.`);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al desinstalar plugin');
    }
  };

  const createScaffold = async (id, name, category) => {
    try {
      const manifest = await invoke('create_plugin_scaffold', { id, name, category });
      await fetchPlugins();
      showActionMessage(`Plantilla "${manifest.name}" creada en plugins.`);
      return { success: true, manifest };
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Error creando plantilla';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const openFolder = async () => {
    try {
      await invoke('open_plugins_directory');
    } catch (err) {
      setError('No se pudo abrir el explorador de archivos.');
    }
  };

  return {
    plugins,
    catalog,
    loading,
    catalogLoading,
    installingPluginId,
    error,
    actionMessage,
    refreshPlugins: fetchPlugins,
    refreshCatalog: fetchCatalog,
    togglePlugin,
    installFromPath,
    installFromUrl,
    installFromCatalog,
    uninstallPlugin,
    createScaffold,
    openFolder,
    clearError: () => setError(null)
  };
}
