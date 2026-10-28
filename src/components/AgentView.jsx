import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Terminal, 
  FolderGit2, 
  CheckCircle2, 
  RefreshCw, 
  Copy, 
  Check, 
  Trash2, 
  Cpu, 
  Clock,
  Settings,
  Plus,
  Zap,
  Brain,
  ShieldAlert,
  Minimize2,
  History,
  MessageSquare,
  X,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import ContextManagerModal, { DEFAULT_CONTEXTS } from './ContextManagerModal';
import MarkdownViewer from './MarkdownViewer';

function parseThoughtBlocks(rawContent) {
  if (!rawContent) return { thoughts: '', cleanContent: '' };

  const thoughtRegex = /<(?:thought|thinking|think)>([\s\S]*?)<\/(?:thought|thinking|think)>/gi;
  const thoughts = [];
  let match;
  while ((match = thoughtRegex.exec(rawContent)) !== null) {
    const text = match[1].trim();
    if (text) thoughts.push(text);
  }

  // Si hay un bloque de pensamiento que todavía se está transmitiendo en vivo
  let cleanContent = rawContent.replace(thoughtRegex, '');
  const lastOpenIndex = Math.max(
    cleanContent.lastIndexOf('<thought>'),
    cleanContent.lastIndexOf('<thinking>'),
    cleanContent.lastIndexOf('<think>')
  );
  const lastCloseIndex = Math.max(
    cleanContent.lastIndexOf('</thought>'),
    cleanContent.lastIndexOf('</thinking>'),
    cleanContent.lastIndexOf('</think>')
  );

  if (lastOpenIndex > lastCloseIndex) {
    const openBlock = cleanContent.slice(lastOpenIndex);
    const openText = openBlock.replace(/^<(?:thought|thinking|think)>/i, '').trim();
    if (openText) thoughts.push(openText);
    cleanContent = cleanContent.slice(0, lastOpenIndex);
  }

  return {
    thoughts: thoughts.join('\n\n'),
    cleanContent: cleanContent.trim()
  };
}

function ThoughtAccordion({ thoughts, defaultOpen }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  if (!thoughts) return null;

  const toolMatches = (thoughts.match(/⚙️ \[Herramienta/g) || []).length;
  const thinkingMatches = (thoughts.match(/🧠 \[Razonamiento/g) || []).length;

  let badgeText = 'Razonamiento activo';
  if (toolMatches > 0 && thinkingMatches > 0) {
    badgeText = `${toolMatches} ${toolMatches === 1 ? 'herramienta' : 'herramientas'} · Razonamiento`;
  } else if (toolMatches > 0) {
    badgeText = `${toolMatches} ${toolMatches === 1 ? 'herramienta ejecutada' : 'herramientas ejecutadas'}`;
  } else if (thinkingMatches > 0) {
    badgeText = 'Razonamiento activo';
  }

  return (
    <div style={{
      marginBottom: '8px',
      background: 'rgba(0, 0, 0, 0.35)',
      border: '1px solid rgba(168, 85, 247, 0.3)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden'
    }}>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          padding: '6px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: '#c084fc',
          userSelect: 'none',
          background: 'rgba(168, 85, 247, 0.08)',
          borderBottom: isOpen ? '1px solid rgba(168, 85, 247, 0.2)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
          <Brain size={13} color="#c084fc" />
          <span>Proceso Técnico & Herramientas</span>
          <span style={{
            fontSize: '0.62rem',
            padding: '1px 6px',
            borderRadius: '3px',
            background: 'rgba(168, 85, 247, 0.18)',
            color: '#e9d5ff',
            fontFamily: 'var(--font-mono)'
          }}>
            {badgeText}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <kbd style={{ fontSize: '0.58rem', padding: '1px 5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', color: 'var(--text-muted)' }}>
            Ctrl + O
          </kbd>
          {isOpen ? <ChevronDown size={14} color="#c084fc" /> : <ChevronRight size={14} color="#c084fc" />}
        </div>
      </div>

      {isOpen && (
        <div style={{
          padding: '8px 12px',
          color: 'var(--text-normal)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          lineHeight: '1.45',
          whiteSpace: 'pre-wrap',
          maxHeight: '260px',
          overflowY: 'auto',
          background: 'rgba(10, 12, 11, 0.6)'
        }}>
          {thoughts}
        </div>
      )}
    </div>
  );
}

export default function AgentView({ zenMode, onToggleZenMode }) {
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

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [expandThoughts, setExpandThoughts] = useState(false);
  const viewportRef = useRef(null);

  // Historial de Sesiones Tácticas (v2.1.0)
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
    e.stopPropagation();
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

  const quickMacros = [
    { label: 'Auditar Git', text: 'Revisa status de git y ramas locales sin usar git add -A.' },
    { label: 'Resumen Bitácora', text: 'Lee la bitácora de proyectos en Obsidian y resume el estado del Hito actual.' },
    { label: 'Flashcards AWS', text: 'Analiza la última nota de estudio de AWS y genera 3 flashcards atómicas.' },
    { label: 'Revisar Pendientes', text: 'Inspecciona las tareas pendientes del proyecto activo y prioriza las 3 más críticas.' }
  ];

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
  }, []);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '0.5rem' }}>
      {/* 🧭 Context Router & Effort Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.35rem 0.75rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        flexShrink: 0,
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {/* Selector de perfiles dinámicos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', flex: 1, minWidth: '260px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '2px' }}>
            Contexto:
          </span>
          {contexts.map((ctx) => {
            const isSelected = selectedContextId === ctx.id;
            return (
              <button
                key={ctx.id}
                onClick={() => handleSelectContext(ctx.id)}
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  color: isSelected ? 'var(--text-high)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  transition: 'var(--transition)'
                }}
              >
                <FolderGit2 size={12} color={isSelected ? '#10b981' : '#788882'} />
                <span>{ctx.label}</span>
                {ctx.skills?.length > 0 && (
                  <span style={{ fontSize: '0.6rem', padding: '0 4px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', color: '#a7f3d0' }}>
                    {ctx.skills.length}
                  </span>
                )}
              </button>
            );
          })}

          {/* Botón Gestión de Contextos */}
          <button
            onClick={() => setShowContextModal(true)}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Administrar carpetas, skills y modelos de contextos"
          >
            <Settings size={12} />
            <span>Editar</span>
          </button>
        </div>

        {/* Toggle de Esfuerzo (Flash vs Profundo) y Limpieza */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Toggle Flash / Profundo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '2px'
          }}>
            <button
              onClick={() => setEffortMode('low')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                background: effortMode === 'low' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                border: effortMode === 'low' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                color: effortMode === 'low' ? '#a7f3d0' : 'var(--text-muted)',
                fontSize: '0.68rem',
                fontWeight: effortMode === 'low' ? 700 : 500,
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
              title="Modo Rápido: ~1.9s de respuesta, bajo consumo de tokens de pensamiento"
            >
              <Zap size={11} color={effortMode === 'low' ? '#10b981' : '#788882'} />
              <span>Flash (1.9s)</span>
            </button>

            <button
              onClick={() => setEffortMode('high')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                background: effortMode === 'high' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                border: effortMode === 'high' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent',
                color: effortMode === 'high' ? '#e9d5ff' : 'var(--text-muted)',
                fontSize: '0.68rem',
                fontWeight: effortMode === 'high' ? 700 : 500,
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
              title="Modo Profundo: Razonamiento exhaustivo para refactorización y lógica compleja"
            >
              <Brain size={11} color={effortMode === 'high' ? '#c084fc' : '#788882'} />
              <span>Profundo</span>
            </button>
          </div>

          {/* Toggle Acordeón de Pensamiento */}
          <button
            onClick={() => setExpandThoughts((prev) => !prev)}
            className="btn btn-secondary"
            style={{
              padding: '3px 8px',
              fontSize: '0.68rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: expandThoughts ? '#c084fc' : 'var(--text-muted)',
              borderColor: expandThoughts ? 'rgba(168, 85, 247, 0.4)' : 'var(--border-color)',
              background: expandThoughts ? 'rgba(168, 85, 247, 0.12)' : 'transparent'
            }}
            title="Alternar vista de pensamiento y herramientas (Ctrl + O)"
          >
            <Brain size={12} color={expandThoughts ? '#c084fc' : '#888'} />
            <span>{expandThoughts ? 'Ocultar Razonamiento' : 'Ver Razonamiento'}</span>
            <kbd style={{ fontSize: '0.58rem', opacity: 0.7 }}>Ctrl+O</kbd>
          </button>

          {/* Historial de Sesiones Drawer Toggle */}
          <button
            onClick={() => setShowSessionsDrawer((prev) => !prev)}
            className="btn btn-secondary"
            style={{
              padding: '3px 8px',
              fontSize: '0.68rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: showSessionsDrawer ? '#10b981' : 'var(--text-muted)',
              borderColor: showSessionsDrawer ? 'var(--primary)' : 'var(--border-color)',
              background: showSessionsDrawer ? 'rgba(16, 185, 129, 0.12)' : 'transparent'
            }}
            title="Abrir historial de sesiones tácticas"
          >
            <History size={12} color={showSessionsDrawer ? '#10b981' : '#888'} />
            <span>Sesiones ({sessions.length})</span>
          </button>

          {/* Limpiar Historial */}
          <button
            onClick={clearHistory}
            className="btn btn-secondary"
            style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Limpiar conversación"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* 💬 Central Workspace: Sessions Drawer + Message Viewport */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: '0.5rem', position: 'relative' }}>
        {showSessionsDrawer && (
          <div style={{
            width: '240px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            {/* Header del Drawer */}
            <div style={{
              padding: '0.45rem 0.65rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={13} color="#10b981" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-high)' }}>Sesiones</span>
              </div>
              <button
                onClick={handleNewSession}
                className="btn btn-primary"
                style={{ padding: '2px 7px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                title="Iniciar nueva sesión táctica"
              >
                <Plus size={11} />
                <span>Nueva</span>
              </button>
            </div>

            {/* Lista de sesiones */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  Sin sesiones
                </div>
              ) : (
                sessions.map((sess) => {
                  const isActive = currentSessionId === sess.id;
                  return (
                    <div
                      key={sess.id}
                      onClick={() => selectSession(sess.id)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 0, 0, 0.15)',
                        border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                        transition: 'var(--transition)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? 'var(--text-high)' : 'var(--text-normal)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1
                        }}>
                          {sess.title}
                        </span>
                        <button
                          onClick={(e) => handleDeleteSession(sess.id, e)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: 0.6
                          }}
                          title="Eliminar sesión"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                        <span style={{ textTransform: 'uppercase', opacity: 0.8 }}>
                          {sess.contextId} · {sess.effort === 'high' ? 'Profundo' : 'Flash'}
                        </span>
                        <span>
                          {new Date(sess.updatedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 💬 Message Viewport */}
        <div 
          ref={viewportRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          background: 'var(--bg-main)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {messages.map((m) => {
          const isUser = m.role === 'user';
          const { thoughts, cleanContent } = !isUser ? parseThoughtBlocks(m.content) : { thoughts: '', cleanContent: m.content };

          return (
            <div
              key={m.id}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: isUser ? '80%' : '90%',
                padding: '0.85rem 1.15rem',
                borderRadius: 'var(--radius-lg)',
                background: isUser ? '#1a221f' : 'var(--bg-card)',
                border: isUser ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-color)',
                boxShadow: 'none',
                position: 'relative'
              }}
            >
              {/* Header del Mensaje */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isUser ? '#a7f3d0' : '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isUser ? 'Gabriel' : 'Aegis Copilot'}
                  {m.context && (
                    <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                      {m.context}
                    </span>
                  )}
                  {m.effort && (
                    <span style={{ fontSize: '0.58rem', padding: '1px 4px', borderRadius: '3px', background: m.effort === 'high' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(16, 185, 129, 0.1)', color: m.effort === 'high' ? '#c084fc' : '#34d399' }}>
                      {m.effort === 'high' ? '🧠 Profundo' : '⚡ Flash'}
                    </span>
                  )}
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{m.timestamp}</span>
                  {!isUser && m.content && (
                    <button
                      onClick={() => copyToClipboard(cleanContent || m.content, m.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                      title="Copiar respuesta"
                    >
                      {copiedId === m.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              {/* 🧠 Acordeón Colapsable de Razonamiento & Herramientas */}
              {!isUser && thoughts ? (
                <ThoughtAccordion thoughts={thoughts} defaultOpen={expandThoughts} />
              ) : null}

              {/* ⚠️ Tarjeta de Permiso Interactivo CLI (Human-in-the-loop) */}
              {!isUser && m.permissionPrompt && (
                <div style={{
                  margin: '8px 0',
                  padding: '10px 12px',
                  background: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.35)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#facc15', fontWeight: 700, fontSize: '0.74rem' }}>
                    <ShieldAlert size={13} color="#facc15" />
                    <span>Permiso de Ejecución Solicitado</span>
                  </div>
                  <p style={{ margin: '6px 0', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-high)', whiteSpace: 'pre-wrap' }}>
                    {m.permissionPrompt}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button
                      onClick={() => handlePermissionResponse(m.id, 'y')}
                      style={{
                        padding: '3px 10px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: '#10b981',
                        color: '#000',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer'
                      }}
                    >
                      ✅ Permitir
                    </button>
                    <button
                      onClick={() => handlePermissionResponse(m.id, 'n')}
                      style={{
                        padding: '3px 10px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: 'var(--text-high)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer'
                      }}
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Contenido / Markdown */}
              <div style={{
                fontSize: '0.86rem',
                lineHeight: '1.5',
                color: 'var(--text-high)'
              }}>
                {isUser ? (
                  <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{m.content}</div>
                ) : cleanContent ? (
                  <>
                    <MarkdownViewer content={cleanContent} />
                    {m.loading && (
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '14px',
                        marginLeft: '4px',
                        background: '#10b981',
                        verticalAlign: 'middle',
                        animation: 'pulse 1s infinite'
                      }} />
                    )}
                  </>
                ) : m.loading ? (
                  /* ⚡ Píldora de Carga Animada */
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    color: '#a7f3d0',
                    fontSize: '0.78rem'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      border: '2px solid #10b981',
                      borderTopColor: 'transparent',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    <span>{m.statusText || 'Iniciando agente y montando contexto...'}</span>
                  </div>
                ) : null}
              </div>

              {/* Telemetría y Tokens al finalizar */}
              {!isUser && !m.loading && (m.totalTokens || m.duration) && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '8px',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {m.totalTokens && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Cpu size={10} color="#10b981" />
                      {m.totalTokens.toLocaleString()} tokens
                    </span>
                  )}
                  {m.duration && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={10} />
                      {m.duration.toFixed(1)}s
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>

      {/* ⚡ Quick Macros Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '2px 0',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', flex: 1 }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Macros:</span>
          {quickMacros.map((macro, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(macro.text)}
              disabled={loading}
              style={{
                fontSize: '0.68rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-high)',
                cursor: loading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'var(--transition)',
                opacity: loading ? 0.5 : 1
              }}
            >
              {macro.label}
            </button>
          ))}
        </div>

        {/* 🪟 Pegado a la derecha hasta el tope sobre la misma línea de macros */}
        {zenMode && (
          <button
            onClick={onToggleZenMode}
            title="Restaurar barra de navegación (Escape o Alt + Z)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.68rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              transition: 'var(--transition)',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-high)';
              e.currentTarget.style.borderColor = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <Minimize2 size={12} color="var(--accent)" />
            <span>Restaurar Barra</span>
            <kbd style={{ fontSize: '0.6rem', opacity: 0.65, background: 'rgba(255,255,255,0.08)', padding: '1px 4px', borderRadius: '3px' }}>Esc</kbd>
          </button>
        )}
      </div>

      {/* ⌨️ Input Command Box */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.5rem 0.8rem',
        flexShrink: 0,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
      }}>
        <Terminal size={16} color="#10b981" />
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
          placeholder={loading ? 'Agente ejecutando en segundo plano...' : `[${activeContext.label} · ${effortMode === 'high' ? 'Profundo' : 'Flash'}] Instrucción para el agente...`}
          disabled={loading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-high)',
            fontSize: '0.85rem',
            fontFamily: 'inherit'
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !prompt.trim()}
          style={{
            background: 'var(--primary-grad)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '7px 14px',
            color: '#fff',
            cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !prompt.trim() ? 0.4 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.75rem',
            fontWeight: 600,
            transition: 'var(--transition)'
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={12} className="spin" />
              <span>Ejecutando...</span>
            </>
          ) : (
            <>
              <Send size={12} />
              <span>Enviar</span>
            </>
          )}
        </button>
      </div>

      {/* ⚙️ Modal Administrador de Contextos */}
      <ContextManagerModal
        isOpen={showContextModal}
        onClose={() => setShowContextModal(false)}
        contexts={contexts}
        onSaveContexts={handleSaveContexts}
        currentContextId={selectedContextId}
        onSelectContext={handleSelectContext}
      />
    </div>
  );
}
