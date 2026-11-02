import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * useVaultNetwork — Hook especializado para telemetría de Red de Conocimiento,
 * extracción en milisegundos de Backlinks, enlaces salientes y micro-grafo.
 */
export function useVaultNetwork(activeNote, onNavigateNote) {
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState('backlinks'); // 'backlinks' | 'outgoing' | 'graph'
  const [degreeFilter, setDegreeFilter] = useState(2); // 1 = solo directo, 2 = 1° y 2° grado

  const fetchNetwork = useCallback(async () => {
    if (!activeNote || !activeNote.path) {
      setNetwork(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await invoke('get_vault_note_network', { filePath: activeNote.path });
      setNetwork(data);
    } catch (err) {
      console.error('[useVaultNetwork] Error al consultar red:', err);
      setError(typeof err === 'string' ? err : 'Error al consultar red de la nota');
    } finally {
      setLoading(false);
    }
  }, [activeNote]);

  useEffect(() => {
    fetchNetwork();
  }, [fetchNetwork]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const toggleMaximized = useCallback(() => {
    setIsMaximized((prev) => !prev);
    setIsExpanded(true);
  }, []);

  const handleSelectNote = useCallback((targetTitle) => {
    if (onNavigateNote && targetTitle) {
      onNavigateNote(targetTitle);
    }
  }, [onNavigateNote]);

  return {
    network,
    loading,
    error,
    isExpanded,
    setIsExpanded,
    toggleExpanded,
    isMaximized,
    setIsMaximized,
    toggleMaximized,
    activeTab,
    setActiveTab,
    degreeFilter,
    setDegreeFilter,
    handleSelectNote,
    refreshNetwork: fetchNetwork,
    incomingCount: network?.incoming?.length || 0,
    outgoingCount: network?.outgoing?.length || 0,
    nodesCount: network?.nodes?.length || 0
  };
}

export default useVaultNetwork;
