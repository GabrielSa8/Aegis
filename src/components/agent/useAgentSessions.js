import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useAgentSessions({ activeContext, effortMode, setMessages }) {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showSessionsDrawer, setShowSessionsDrawer] = useState(false);
  const activeSessionIdRef = useRef(null);

  useEffect(() => {
    activeSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // Carga inicial de sesiones desde SQLite
  useEffect(() => {
    let isMounted = true;
    const initSessions = async () => {
      try {
        const list = await invoke('sqlite_get_chat_sessions');
        if (!isMounted) return;

        if (Array.isArray(list) && list.length > 0) {
          setSessions(list);
          const first = list[0];
          setCurrentSessionId(first.id);
          const msgs = await invoke('sqlite_get_chat_messages', { sessionId: first.id });
          if (!isMounted) return;

          if (Array.isArray(msgs) && msgs.length > 0) {
            setMessages(
              msgs.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                context: m.context || activeContext.label,
                effort: m.effort || 'low',
                timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                duration: m.durationSeconds,
                totalTokens: m.totalTokens,
                inputTokens: m.inputTokens,
                outputTokens: m.outputTokens
              }))
            );
          }
        } else {
          const initial = {
            id: 'session_' + Date.now(),
            title: 'Sesión Táctica General',
            contextId: activeContext.id,
            effort: effortMode,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await invoke('sqlite_save_chat_session', { session: initial });
          if (!isMounted) return;
          setSessions([initial]);
          setCurrentSessionId(initial.id);
        }
      } catch (e) {
        console.error('Error inicializando sesiones de chat en SQLite:', e);
      }
    };

    initSessions();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
    try {
      const msgs = await invoke('sqlite_get_chat_messages', { sessionId });
      if (Array.isArray(msgs) && msgs.length > 0) {
        setMessages(
          msgs.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            context: m.context || activeContext.label,
            effort: m.effort || 'low',
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: m.durationSeconds,
            totalTokens: m.totalTokens,
            inputTokens: m.inputTokens,
            outputTokens: m.outputTokens
          }))
        );
      } else {
        const s = sessions.find((item) => item.id === sessionId);
        setMessages([
          {
            id: 'welcome_' + sessionId,
            role: 'assistant',
            content: `Sesión activa (${s?.title || 'Táctica'}). Conectado a ${activeContext.label}.`,
            context: activeContext.label,
            timestamp: 'Ahora'
          }
        ]);
      }
    } catch (e) {
      console.error('Error cargando mensajes de sesión:', e);
    }
  };

  const handleNewSession = async () => {
    const newSession = {
      id: 'session_' + Date.now(),
      title: `Sesión ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      contextId: activeContext.id,
      effort: effortMode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    try {
      await invoke('sqlite_save_chat_session', { session: newSession });
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([
        {
          id: 'welcome_' + newSession.id,
          role: 'assistant',
          content: `Nueva sesión táctica lista (${activeContext.label} · ${effortMode === 'high' ? 'Profundo' : 'Flash'}). ¿Qué ejecutamos?`,
          context: activeContext.label,
          timestamp: 'Ahora'
        }
      ]);
    } catch (e) {
      console.error('Error creando nueva sesión:', e);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    if (e) e.stopPropagation();
    try {
      await invoke('sqlite_delete_chat_session', { id: sessionId });
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (currentSessionId === sessionId) {
        if (remaining.length > 0) {
          selectSession(remaining[0].id);
        } else {
          handleNewSession();
        }
      }
    } catch (e) {
      console.error('Error eliminando sesión:', e);
    }
  };

  return {
    sessions,
    setSessions,
    currentSessionId,
    setCurrentSessionId,
    showSessionsDrawer,
    setShowSessionsDrawer,
    activeSessionIdRef,
    selectSession,
    handleNewSession,
    handleDeleteSession
  };
}
