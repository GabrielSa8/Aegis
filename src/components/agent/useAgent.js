import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { DEFAULT_CONTEXTS } from '../ContextManagerModal';
import { DEFAULT_MACROS } from '../MacroManagerModal';

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

  const [selectedContextId, setSelectedContextId] = useState(() => {
    return contexts[0]?.id || 'general';
  });

  const activeContext = contexts.find((c) => c.id === selectedContextId) || contexts[0] || DEFAULT_CONTEXTS[0];

  // Nivel de esfuerzo / modelo activo ('low' = Flash, 'high' = Profundo)
  const [effortMode, setEffortMode] = useState(activeContext.effort || 'low');
  const [showContextModal, setShowContextModal] = useState(false);
  const [operatorName, setOperatorName] = useState('Operador');

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [expandThoughts, setExpandThoughts] = useState(false);
  const viewportRef = useRef(null);

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

  // Carga reactiva de perfil soberano
  useEffect(() => {
    invoke('load_app_config')
      .then((cfg) => {
        if (cfg?.profile?.name) {
          setOperatorName(cfg.profile.name);
        }
      })
      .catch((e) => console.error('Error cargando perfil en AgentView:', e));
  }, []);

  // Historial de Sesiones Tácticas
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showSessionsDrawer, setShowSessionsDrawer] = useState(false);
  const activeSessionIdRef = useRef(null);
  const currentAccumulatorRef = useRef({});

  useEffect(() => {
    activeSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

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

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Aegis Copilot táctico en línea. Conectado al agente local (`agy 1.4.8`). ¿Qué tarea ejecutamos?',
      context: activeContext.label,
      timestamp: 'Ahora'
    }
  ]);

  // Carga inicial de sesiones desde SQLite
  useEffect(() => {
    const initSessions = async () => {
      try {
        const list = await invoke('sqlite_get_chat_sessions');
        if (Array.isArray(list) && list.length > 0) {
          setSessions(list);
          const first = list[0];
          setCurrentSessionId(first.id);
          const msgs = await invoke('sqlite_get_chat_messages', { sessionId: first.id });
          if (Array.isArray(msgs) && msgs.length > 0) {
            setMessages(msgs.map(m => ({
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
            })));
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
          setSessions([initial]);
          setCurrentSessionId(initial.id);
        }
      } catch (e) {
        console.error('Error inicializando sesiones de chat en SQLite:', e);
      }
    };
    initSessions();
  }, []);

  const selectSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
    try {
      const msgs = await invoke('sqlite_get_chat_messages', { sessionId });
      if (Array.isArray(msgs) && msgs.length > 0) {
        setMessages(msgs.map(m => ({
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
        })));
      } else {
        const s = sessions.find(item => item.id === sessionId);
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
      const remaining = sessions.filter(s => s.id !== sessionId);
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

  const handlePermissionResponse = async (streamId, input) => {
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
  };

  // Al conmutar de contexto, adoptar su esfuerzo por defecto
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

  // Escuchar chunks de streaming emitidos desde Rust
  useEffect(() => {
    let unlisten;
    const setupListener = async () => {
      unlisten = await listen('agent-stream', (event) => {
        const chunk = event.payload;
        if (!chunk || !chunk.stream_id) return;

        setMessages((prev) => {
          return prev.map((msg) => {
            if (msg.id === chunk.stream_id) {
              if (chunk.event_type === 'init') {
                return {
                  ...msg,
                  statusText: chunk.content || 'Montando contexto y preparando modelo...',
                  loading: true
                };
              } else if (chunk.event_type === 'delta') {
                currentAccumulatorRef.current[chunk.stream_id] = (currentAccumulatorRef.current[chunk.stream_id] || '') + chunk.content;
                let currentStatus = msg.statusText;
                if (chunk.step_type === 'thinking' || chunk.content.includes('<thought>') || chunk.content.includes('<thinking>') || chunk.content.includes('<think>')) {
                  currentStatus = '🧠 Razonando proceso técnico...';
                } else if (chunk.step_type === 'tool' || chunk.step_type === 'tool_call' || chunk.content.includes('⚙️ [Herramienta')) {
                  currentStatus = '⚙️ Ejecutando herramienta de sistema...';
                } else if (msg.content && msg.content.length > 30) {
                  currentStatus = '⚡ Transmitiendo respuesta...';
                }
                return {
                  ...msg,
                  content: (msg.content || '') + chunk.content,
                  statusText: currentStatus,
                  loading: true
                };
              } else if (chunk.event_type === 'permission') {
                return {
                  ...msg,
                  permissionPrompt: chunk.content,
                  statusText: '⚠️ Esperando confirmación de permiso...',
                  loading: true
                };
              } else if (chunk.event_type === 'done') {
                const finalContent = currentAccumulatorRef.current[chunk.stream_id] || msg.content || '';
                if (activeSessionIdRef.current && finalContent) {
                  invoke('sqlite_save_chat_message', {
                    message: {
                      id: chunk.stream_id,
                      sessionId: activeSessionIdRef.current,
                      role: 'assistant',
                      content: finalContent,
                      context: activeContext.label,
                      effort: effortMode,
                      createdAt: new Date().toISOString(),
                      durationSeconds: chunk.duration_seconds || null,
                      totalTokens: chunk.total_tokens || null,
                      inputTokens: chunk.input_tokens || null,
                      outputTokens: chunk.output_tokens || null
                    }
                  }).catch((err) => console.error('Error guardando mensaje en SQLite:', err));
                }
                delete currentAccumulatorRef.current[chunk.stream_id];

                return {
                  ...msg,
                  loading: false,
                  permissionPrompt: null,
                  statusText: null,
                  duration: chunk.duration_seconds,
                  totalTokens: chunk.total_tokens,
                  inputTokens: chunk.input_tokens,
                  outputTokens: chunk.output_tokens
                };
              } else if (chunk.event_type === 'error') {
                return {
                  ...msg,
                  content: (msg.content ? msg.content + '\n\n' : '') + `⚠️ [Error agy]: ${chunk.content}`,
                  loading: false,
                  permissionPrompt: null,
                  statusText: null,
                  isError: true
                };
              }
            }
            return msg;
          });
        });

        if (chunk.event_type === 'done' || chunk.event_type === 'error') {
          setLoading(false);
        }
      });
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [activeContext.label, effortMode]);

  // Auto-scroll al final en cada actualización de mensajes
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim() || loading) return;

    let targetSessionId = currentSessionId;
    if (!targetSessionId) {
      const newSession = {
        id: 'session_' + Date.now(),
        title: textToSend.slice(0, 36) + (textToSend.length > 36 ? '...' : ''),
        contextId: activeContext.id,
        effort: effortMode,
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
      effort: effortMode,
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
      effort: effortMode,
      timestamp: timeStr,
      loading: true,
      statusText: 'Iniciando agente y montando contexto...'
    };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setPrompt('');
    setLoading(true);

    try {
      await invoke('execute_agent_prompt', {
        prompt: textToSend,
        contextId: activeContext.id,
        contextPath: activeContext.path,
        skills: activeContext.skills || [],
        streamId,
        effort: effortMode
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

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearHistory = () => {
    setMessages([
      {
        id: 'welcome_' + Date.now(),
        role: 'assistant',
        content: `Historial despejado. Entorno táctico listo (${activeContext.label} · ${effortMode === 'high' ? 'Profundo' : 'Flash'}).`,
        context: activeContext.label,
        timestamp: 'Ahora'
      }
    ]);
  };

  const [portalTarget, setPortalTarget] = useState(() => (typeof document !== 'undefined' ? document.getElementById('top-header-slot') : null));

  useEffect(() => {
    if (!portalTarget) {
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
    loading,
    loadingProgress,
    copiedId,
    copyToClipboard,
    expandThoughts,
    setExpandThoughts,
    viewportRef,
    sessions,
    currentSessionId,
    showSessionsDrawer,
    setShowSessionsDrawer,
    selectSession,
    handleNewSession,
    handleDeleteSession,
    messages,
    handlePermissionResponse,
    handleSend,
    clearHistory,
    macros,
    showMacroModal,
    setShowMacroModal,
    handleSaveMacros,
    portalTarget
  };
}
