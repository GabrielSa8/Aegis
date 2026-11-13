import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useAgentSessions({ activeContext, effortMode, setMessages }) {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showSessionsDrawer, setShowSessionsDrawer] = useState(false);
  const activeSessionIdRef = useRef(null);
  const autoRecoverCheckedRef = useRef(new Set());

  useEffect(() => {
    activeSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // Recupera respuestas huérfanas en transcript sin duplicar reenvíos de prompt
  const checkAndRecoverSession = async (session, existingMsgs) => {
    if (!session || !Array.isArray(existingMsgs) || existingMsgs.length === 0) return existingMsgs;

    const lastMsg = existingMsgs[existingMsgs.length - 1];
    // Si la sesión no tiene prompt pendiente, marcamos como resuelto y salimos
    if (!lastMsg || lastMsg.role !== 'user' || !session.conversationId) {
      autoRecoverCheckedRef.current.add(session.id);
      return existingMsgs;
    }

    // Si ya está en curso una comprobación activa para esta sesión, evitamos colisiones concurrentes
    if (autoRecoverCheckedRef.current.has(session.id)) {
      return existingMsgs;
    }
    autoRecoverCheckedRef.current.add(session.id);

    // Sondeo progresivo (hasta 10 intentos con intervalo elástico) para dar tiempo a que el CLI complete en background
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const rec = await invoke('check_dangling_cli_response', {
          conversationId: session.conversationId,
          minTimestampIso: lastMsg.createdAt || null
        });
        if (rec && rec.found && rec.content) {
          const recoveredMsg = {
            id: 'recovered_' + Date.now(),
            sessionId: session.id,
            role: 'assistant',
            content: rec.content,
            context: lastMsg.context || activeContext.label,
            effort: lastMsg.effort || 'low',
            createdAt: new Date().toISOString(),
            durationSeconds: rec.durationSeconds,
            totalTokens: rec.totalTokens,
            inputTokens: rec.inputTokens,
            outputTokens: rec.outputTokens
          };
          await invoke('sqlite_save_chat_message', { message: recoveredMsg });
          return [
            ...existingMsgs,
            {
              id: recoveredMsg.id,
              role: recoveredMsg.role,
              content: recoveredMsg.content,
              context: recoveredMsg.context,
              effort: recoveredMsg.effort,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              duration: recoveredMsg.durationSeconds,
              totalTokens: recoveredMsg.totalTokens,
              inputTokens: recoveredMsg.inputTokens,
              outputTokens: recoveredMsg.outputTokens
            }
          ];
        }
      } catch (e) {
        console.warn('Error verificando dangling response en transcript:', e);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Si tras 10 intentos aún no termina, liberamos el set para que la próxima interacción/foco pueda volver a checar
    autoRecoverCheckedRef.current.delete(session.id);
    return existingMsgs;
  };

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
          const rawMsgs = await invoke('sqlite_get_chat_messages', { sessionId: first.id });
          if (!isMounted) return;

          let msgs = Array.isArray(rawMsgs) ? rawMsgs : [];
          msgs = await checkAndRecoverSession(first, msgs);

          if (Array.isArray(msgs) && msgs.length > 0) {
            setMessages(
              msgs.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                context: m.context || activeContext.label,
                effort: m.effort || 'low',
                createdAt: m.createdAt,
                timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora',
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
      const rawMsgs = await invoke('sqlite_get_chat_messages', { sessionId });
      const targetSession = sessions.find((item) => item.id === sessionId);
      let msgs = Array.isArray(rawMsgs) ? rawMsgs : [];
      if (targetSession) {
        msgs = await checkAndRecoverSession(targetSession, msgs);
      }

      if (Array.isArray(msgs) && msgs.length > 0) {
        setMessages(
          msgs.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            context: m.context || activeContext.label,
            effort: m.effort || 'low',
            createdAt: m.createdAt,
            timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora',
            duration: m.durationSeconds,
            totalTokens: m.totalTokens,
            inputTokens: m.inputTokens,
            outputTokens: m.outputTokens
          }))
        );
      } else {
        setMessages([
          {
            id: 'welcome_' + sessionId,
            role: 'assistant',
            content: `Sesión activa (${targetSession?.title || 'Táctica'}). Conectado a ${activeContext.label}.`,
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
