import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { DEFAULT_CONTEXTS } from '../ContextManagerModal';
import { DEFAULT_MACROS } from '../MacroManagerModal';
import { useAgentSessions } from './useAgentSessions';
import { useAgentStream } from './useAgentStream';

export function useAgent() {
  // Carga de contextos desde localStorage con fallback
  const [contexts, setContexts] = useState(() => {
    try {
      const saved = localStorage.getItem('aegis_agent_contexts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error cargando contextos:', e);
    }
    return DEFAULT_CONTEXTS;
  });

  const [selectedContextId, setSelectedContextId] = useState(() => contexts[0]?.id || 'general');
  const activeContext = contexts.find((c) => c.id === selectedContextId) || contexts[0] || DEFAULT_CONTEXTS[0];

  // Nivel de esfuerzo / modelo activo ('low' = Flash, 'high' = Profundo)
  const [effortMode, setEffortMode] = useState(activeContext.effort || 'low');
  const effortRef = useRef(effortMode);
  useEffect(() => {
    effortRef.current = effortMode;
  }, [effortMode]);

  const activeContextRef = useRef(activeContext);
  useEffect(() => {
    activeContextRef.current = activeContext;
  }, [activeContext]);

  const [showContextModal, setShowContextModal] = useState(false);
  const [operatorName, setOperatorName] = useState('Operador');
  const [prompt, setPrompt] = useState('');

  // Carga reactiva de perfil soberano
  useEffect(() => {
    invoke('get_aegis_config')
      .then((cfg) => {
        if (cfg?.profile?.name) {
          setOperatorName(cfg.profile.name);
        }
      })
      .catch((e) => console.error('Error cargando perfil en AgentView:', e));
  }, []);

  // Quick Macros
  const [macros, setMacros] = useState(() => {
    try {
      const saved = localStorage.getItem('aegis_quick_macros');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error cargando macros:', e);
    }
    return DEFAULT_MACROS;
  });

  const [showMacroModal, setShowMacroModal] = useState(false);

  const handleSaveMacros = (updatedList) => {
    setMacros(updatedList);
    try {
      localStorage.setItem('aegis_quick_macros', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Error guardando macros:', e);
    }
  };

  const handleSelectContext = (id) => {
    setSelectedContextId(id);
    const target = contexts.find((c) => c.id === id);
    if (target && target.effort) {
      setEffortMode(target.effort);
    }
  };

  const handleSaveContexts = (updatedList) => {
    setContexts(updatedList);
    try {
      localStorage.setItem('aegis_agent_contexts', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Error guardando contextos:', e);
    }
  };

  // Sub-hook para sesiones SQLite
  const sessionsManager = useAgentSessions({
    activeContext,
    effortMode,
    setMessages: (msgs) => streamManager.setMessages(msgs)
  });

  // Sub-hook para streaming de terminal y deduplicación estricta
  const streamManager = useAgentStream({
    activeContext,
    activeContextRef,
    effortMode,
    effortRef,
    activeSessionIdRef: sessionsManager.activeSessionIdRef,
    sessions: sessionsManager.sessions,
    setSessions: sessionsManager.setSessions,
    currentSessionId: sessionsManager.currentSessionId,
    setCurrentSessionId: sessionsManager.setCurrentSessionId
  });

  // Portal Target para Dynamic Island HUD
  const [portalTarget, setPortalTarget] = useState(() =>
    typeof document !== 'undefined' ? document.getElementById('top-header-slot') : null
  );

  useEffect(() => {
    if (!portalTarget || !portalTarget.isConnected) {
      const el = document.getElementById('top-header-slot');
      if (el) setPortalTarget(el);
    }
  }, [portalTarget]);

  return {
    contexts,
    selectedContextId,
    activeContext,
    handleSelectContext,
    handleSaveContexts,
    showContextModal,
    setShowContextModal,
    effortMode,
    setEffortMode,
    operatorName,
    prompt,
    setPrompt,
    loading: streamManager.loading,
    loadingProgress: streamManager.loadingProgress,
    copiedId: streamManager.copiedId,
    copyToClipboard: streamManager.copyToClipboard,
    expandThoughts: streamManager.expandThoughts,
    setExpandThoughts: streamManager.setExpandThoughts,
    viewportRef: streamManager.viewportRef,
    sessions: sessionsManager.sessions,
    currentSessionId: sessionsManager.currentSessionId,
    showSessionsDrawer: sessionsManager.showSessionsDrawer,
    setShowSessionsDrawer: sessionsManager.setShowSessionsDrawer,
    selectSession: sessionsManager.selectSession,
    handleNewSession: sessionsManager.handleNewSession,
    handleDeleteSession: sessionsManager.handleDeleteSession,
    messages: streamManager.messages,
    handlePermissionResponse: streamManager.handlePermissionResponse,
    handleSend: (customPrompt) => streamManager.handleSend(customPrompt, prompt, setPrompt),
    clearHistory: streamManager.clearHistory,
    macros,
    showMacroModal,
    setShowMacroModal,
    handleSaveMacros,
    portalTarget
  };
}
