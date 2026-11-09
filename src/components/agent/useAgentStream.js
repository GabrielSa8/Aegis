import { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { reduceStreamChunk } from './agentHelpers';
import { soundService } from '../../utils/soundService';

export function useAgentStream({
  activeContext,
  activeContextRef,
  effortMode,
  effortRef,
  activeSessionIdRef,
  sessions,
  setSessions,
  currentSessionId,
  setCurrentSessionId
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Aegis Copilot en línea. Conectado al agente local (`agy 1.4.8`). ¿Qué tarea ejecutamos?',
      context: activeContext.label,
      timestamp: 'Ahora'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [expandThoughts, setExpandThoughts] = useState(false);
  const [activeModel, setActiveModel] = useState(() => {
    try {
      return localStorage.getItem('aegis_active_model') || null;
    } catch {
      return null;
    }
  });
  const viewportRef = useRef(null);

  const handleSetActiveModel = useCallback((newModel) => {
    setActiveModel(newModel);
    try {
      if (newModel) {
        localStorage.setItem('aegis_active_model', newModel);
      } else {
        localStorage.removeItem('aegis_active_model');
      }
    } catch (e) {
      console.warn('Error persistiendo modelo activo:', e);
    }
  }, []);

  // Registro para deduplicación estricta de secuencias por stream
  const lastProcessedSeqRef = useRef({});
  const currentAccumulatorRef = useRef({});
  const cancelledStreamsRef = useRef(new Set());
  const activeStreamIdRef = useRef(null);

  // Animación reactiva de carga porcentual líquida
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingProgress(14);
      interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev < 45) return prev + Math.floor(Math.random() * 8) + 4;
          if (prev < 78) return prev + Math.floor(Math.random() * 5) + 2;
          if (prev < 94) return prev + Math.floor(Math.random() * 2) + 1;
          return prev;
        });
      }, 350);
    } else {
      setLoadingProgress(100);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Atajo global Ctrl + O para alternar acordeón de razonamiento
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setExpandThoughts((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-scroll al final en cada actualización de mensajes
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

  // Procesador unificado y libre de mutaciones con deduplicación por seq
  const handleStreamChunk = (chunk) => {
    if (!chunk || !chunk.stream_id) return;

    if (cancelledStreamsRef.current.has(chunk.stream_id)) return;

    // Deduplicación estricta por número de secuencia de Rust
    const maxSeq = lastProcessedSeqRef.current[chunk.stream_id] ?? -1;
    if (chunk.seq !== undefined && chunk.seq <= maxSeq) {
      return;
    }
    if (chunk.seq !== undefined) {
      lastProcessedSeqRef.current[chunk.stream_id] = chunk.seq;
    }

    // Acumulación atómica y persistencia ejecutadas fuera de setMessages
    if (chunk.event_type === 'delta') {
      currentAccumulatorRef.current[chunk.stream_id] =
        (currentAccumulatorRef.current[chunk.stream_id] || '') + chunk.content;
    } else if (chunk.event_type === 'done') {
      const finalContent = currentAccumulatorRef.current[chunk.stream_id] || '';
      if (activeSessionIdRef.current && finalContent) {
        invoke('sqlite_save_chat_message', {
          message: {
            id: chunk.stream_id,
            sessionId: activeSessionIdRef.current,
            role: 'assistant',
            content: finalContent,
            context: activeContextRef.current.label,
            effort: effortRef.current,
            createdAt: new Date().toISOString(),
            durationSeconds: chunk.duration_seconds || null,
            totalTokens: chunk.total_tokens || null,
            inputTokens: chunk.input_tokens || null,
            outputTokens: chunk.output_tokens || null
          }
        }).catch((err) => console.error('Error guardando mensaje en SQLite:', err));
      }
      // Notificación nativa si Aegis está minimizado o en otra ventana/escritorio
      if (typeof document !== 'undefined' && (document.hidden || !document.hasFocus())) {
        const preview = finalContent
          .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
          .replace(/```[\s\S]*?```/gi, '[Bloque de código]')
          .trim();
        const snippet = preview ? preview.slice(0, 120) : 'Respuesta lista.';
        const ctxLabel = activeContextRef.current?.label || 'General';
        invoke('send_desktop_notification', {
          title: `⚡ Aegis · Tarea Lista (${ctxLabel})`,
          body: snippet,
          notificationType: 'agentCompletionAlert'
        }).catch((err) => console.warn('Error emitiendo notificación de fondo:', err));
      }

      delete currentAccumulatorRef.current[chunk.stream_id];
      delete lastProcessedSeqRef.current[chunk.stream_id];
    } else if (chunk.event_type === 'error') {
      invoke('cortex_record_signal', {
        prompt: chunk.content || 'error',
        contextLabel: activeContextRef.current?.label || 'General',
        isError: true,
        activeSkills: activeContextRef.current?.skills || []
      }).catch(() => {});

      // Notificación nativa de error en segundo plano
      if (typeof document !== 'undefined' && (document.hidden || !document.hasFocus())) {
        const ctxLabel = activeContextRef.current?.label || 'General';
        const errSnippet = chunk.content ? String(chunk.content).slice(0, 120) : 'Fallo en la ejecución del agente.';
        invoke('send_desktop_notification', {
          title: `⚠️ Aegis · Error en Agente (${ctxLabel})`,
          body: errSnippet,
          notificationType: 'agentCompletionAlert'
        }).catch((err) => console.warn('Error emitiendo notificación de error en fondo:', err));
      }

      delete currentAccumulatorRef.current[chunk.stream_id];
      delete lastProcessedSeqRef.current[chunk.stream_id];
    }

    // Actualización de estado React 100% pura y modular
    setMessages((prev) =>
      prev.map((msg) => (msg.id === chunk.stream_id ? reduceStreamChunk(msg, chunk) : msg))
    );

    if (chunk.event_type === 'done' || chunk.event_type === 'error') {
      setLoading(false);
      if (chunk.event_type === 'done') {
        soundService.playSuccess();
      } else {
        soundService.playError();
      }
    }
  };

  // Escucha blindada contra fugas en StrictMode y cambios de pestaña
  useEffect(() => {
    let isCancelled = false;
    let unlistenFn = null;

    listen('agent-stream', (event) => {
      if (isCancelled) return;
      handleStreamChunk(event.payload);
    })
      .then((fn) => {
        if (isCancelled) {
          fn();
        } else {
          unlistenFn = fn;
        }
      })
      .catch((err) => console.error('Error suscribiendo a agent-stream:', err));

    return () => {
      isCancelled = true;
      if (typeof unlistenFn === 'function') {
        unlistenFn();
      }
    };
  }, []);

  const handlePermissionResponse = useCallback(async (streamId, input) => {
    try {
      await invoke('send_agent_input', { streamId, input });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamId
            ? {
                ...msg,
                permissionPrompt: null,
                statusText: input === 'y' ? '✅ Permiso concedido. Continuando...' : '❌ Permiso denegado por el usuario.'
              }
            : msg
        )
      );
    } catch (e) {
      console.error('Error enviando respuesta a stdin:', e);
    }
  }, []);

  const handleSend = async (customPrompt, currentPrompt, setPrompt, effortOverride) => {
    const textToSend = customPrompt || currentPrompt;
    if (!textToSend.trim() || loading) return;

    const sendEffort = effortOverride || effortMode;

    let targetSessionId = currentSessionId;
    if (!targetSessionId) {
      const newSession = {
        id: 'session_' + Date.now(),
        title: textToSend.slice(0, 36) + (textToSend.length > 36 ? '...' : ''),
        contextId: activeContext.id,
        effort: sendEffort,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      try {
        await invoke('sqlite_save_chat_session', { session: newSession });
        setSessions((prev) => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        targetSessionId = newSession.id;
      } catch (e) {
        console.error('Error auto-creando sesión:', e);
      }
    } else {
      const curSess = sessions.find((s) => s.id === targetSessionId);
      if (curSess && (curSess.title.startsWith('Sesión') || curSess.title === 'Sesión Táctica General')) {
        const updatedTitle = textToSend.slice(0, 36) + (textToSend.length > 36 ? '...' : '');
        const updated = { ...curSess, title: updatedTitle, updatedAt: new Date().toISOString() };
        invoke('sqlite_save_chat_session', { session: updated }).catch(console.error);
        setSessions((prev) => prev.map((s) => (s.id === targetSessionId ? updated : s)));
      }
    }

    const streamId = 'stream_' + Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: textToSend,
      context: activeContext.label,
      effort: sendEffort,
      timestamp: timeStr
    };

    if (targetSessionId) {
      invoke('sqlite_save_chat_message', {
        message: {
          id: userMsg.id,
          sessionId: targetSessionId,
          role: 'user',
          content: userMsg.content,
          context: userMsg.context,
          effort: userMsg.effort,
          createdAt: new Date().toISOString(),
          durationSeconds: null,
          totalTokens: null,
          inputTokens: null,
          outputTokens: null
        }
      }).catch((e) => console.error('Error guardando mensaje user:', e));
    }

    const assistantPlaceholder = {
      id: streamId,
      role: 'assistant',
      content: '',
      context: activeContext.label,
      effort: sendEffort,
      timestamp: timeStr,
      loading: true,
      statusText: 'Iniciando agente y montando contexto...'
    };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    if (typeof setPrompt === 'function') setPrompt('');
    setLoading(true);
    activeStreamIdRef.current = streamId;

    // Hermes Cortex: logger silencioso de hábitos (0 tokens) + disparo de propuesta al cruzar umbral
    invoke('cortex_record_signal', {
      prompt: textToSend,
      contextLabel: activeContext.label || 'General',
      isError: false,
      activeSkills: activeContext.skills || []
    })
      .then((proposal) => {
        if (proposal) {
          setMessages((prev) => [
            ...prev,
            {
              id: 'cortex_prop_' + Date.now(),
              role: 'assistant',
              cardType: 'cortex',
              cardData: { proposals: [proposal], topHabits: [], totalEvents: proposal.hitCount },
              content: '',
              context: activeContext.label,
              timestamp: timeStr
            }
          ]);
        }
      })
      .catch(() => {});

    try {
      await invoke('execute_agent_prompt', {
        prompt: textToSend,
        contextId: activeContext.id,
        contextPath: activeContext.path,
        skills: activeContext.skills || [],
        streamId,
        effort: sendEffort,
        model: activeModel || null
      });
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamId
            ? {
                ...m,
                content: `Error al iniciar el agente en Aegis Core: ${err}`,
                loading: false,
                isError: true
              }
            : m
        )
      );
      setLoading(false);
    }
  };

  const handleStop = useCallback(async () => {
    const id = activeStreamIdRef.current;
    if (!id) return;
    activeStreamIdRef.current = null;
    cancelledStreamsRef.current.add(id);
    invoke('cancel_agent_stream', { streamId: id }).catch(console.error);
    delete currentAccumulatorRef.current[id];
    delete lastProcessedSeqRef.current[id];
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              loading: false,
              content: (m.content ? m.content + '\n\n' : '') + '> [!WARNING]\n> ⏹ Interrumpido por el usuario.'
            }
          : m
      )
    );
    setLoading(false);
  }, []);

  const copyToClipboard = useCallback((text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([
      {
        id: 'welcome_' + Date.now(),
        role: 'assistant',
        content: `Historial despejado. Entorno listo (${activeContext?.label || 'General'} · ${effortMode === 'high' ? 'Profundo' : 'Flash'}).`,
        context: activeContext?.label || 'General',
        timestamp: 'Ahora'
      }
    ]);
  }, [activeContext?.label, effortMode]);

  return {
    messages,
    setMessages,
    activeModel,
    setActiveModel: handleSetActiveModel,
    loading,
    loadingProgress,
    copiedId,
    copyToClipboard,
    expandThoughts,
    setExpandThoughts,
    viewportRef,
    handlePermissionResponse,
    handleSend,
    handleStop,
    clearHistory
  };
}
