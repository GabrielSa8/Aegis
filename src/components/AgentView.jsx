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
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import ContextManagerModal, { DEFAULT_CONTEXTS } from './ContextManagerModal';
import MacroManagerModal, { DEFAULT_MACROS } from './MacroManagerModal';
import MarkdownViewer from './MarkdownViewer';

function renderAsciiProgress(percent, length = 18) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const filled = Math.round((clamped / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

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
      background: 'rgba(0, 0, 0, 0.4)',
      border: '1px solid color-mix(in srgb, var(--primary) 30%, var(--border-color))',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden'
    }}>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          padding: '5px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: 'var(--primary)',
          userSelect: 'none',
          background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
          borderBottom: isOpen ? '1px solid color-mix(in srgb, var(--primary) 20%, var(--border-color))' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
          <Brain size={13} color="var(--primary)" />
          <span>[ PROCESO TÉCNICO & HERRAMIENTAS ]</span>
          <span style={{
            fontSize: '0.62rem',
            padding: '1px 6px',
            borderRadius: '3px',
            background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
            color: 'var(--text-high)',
            fontFamily: 'var(--font-mono)'
          }}>
            {badgeText}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <kbd className="tactical-kbd">
            Ctrl + O
          </kbd>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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
          background: 'rgba(6, 8, 7, 0.8)'
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
    <div className="terminal-stream-container">
      {/* 🧭 Terminal Context & Effort Strip */}
      <div className="terminal-strip">
        {/* Selector de perfiles dinámicos con scrollbar invisible */}
        <div 
          className="no-scrollbar"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', flex: 1, minWidth: '240px' }}
        >
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
            CONTEXTO:
          </span>
          {contexts.map((ctx) => {
            const isSelected = selectedContextId === ctx.id;
            return (
              <button
                key={ctx.id}
                onClick={() => handleSelectContext(ctx.id)}
                className={`terminal-btn ${isSelected ? 'active' : ''}`}
              >
                <FolderGit2 size={12} color={isSelected ? 'var(--primary)' : 'var(--text-muted)'} />
                <span>{ctx.label}</span>
                {ctx.skills?.length > 0 && (
                  <span style={{ fontSize: '0.58rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.06)', fontFamily: 'var(--font-mono)' }}>
                    {ctx.skills.length} skills
                  </span>
                )}
              </button>
            );
          })}

          {/* Botón Gestión de Contextos */}
          <button
            onClick={() => setShowContextModal(true)}
            className="terminal-btn"
            title="Administrar carpetas, skills y modelos de contextos"
          >
            <Settings size={12} />
            <span>Editar</span>
          </button>
        </div>

        {/* Toggle de Esfuerzo (Flash vs Profundo) y Controles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Toggle Flash / Profundo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px'
          }}>
            <button
              onClick={() => setEffortMode('low')}
              className={`terminal-btn ${effortMode === 'low' ? 'active' : ''}`}
              style={{ border: 'none' }}
              title="Modo Rápido: ~1.9s de respuesta, bajo consumo de tokens"
            >
              <Zap size={11} color={effortMode === 'low' ? 'var(--primary)' : 'var(--text-muted)'} />
              <span>Flash (1.9s)</span>
            </button>

            <button
              onClick={() => setEffortMode('high')}
              className={`terminal-btn ${effortMode === 'high' ? 'active' : ''}`}
              style={{ border: 'none' }}
              title="Modo Profundo: Razonamiento exhaustivo para refactorización y lógica compleja"
            >
              <Brain size={11} color={effortMode === 'high' ? 'var(--primary)' : 'var(--text-muted)'} />
              <span>Profundo</span>
            </button>
          </div>

          {/* Toggle Acordeón de Pensamiento */}
          <button
            onClick={() => setExpandThoughts((prev) => !prev)}
            className={`terminal-btn ${expandThoughts ? 'active' : ''}`}
            title="Alternar vista de pensamiento y herramientas (Ctrl + O)"
          >
            <Brain size={12} color={expandThoughts ? 'var(--primary)' : 'var(--text-muted)'} />
            <span>{expandThoughts ? 'Ocultar Razonamiento' : 'Ver Razonamiento'}</span>
            <kbd className="tactical-kbd" style={{ fontSize: '0.56rem' }}>Ctrl+O</kbd>
          </button>

          {/* Historial de Sesiones Drawer Toggle */}
          <button
            onClick={() => setShowSessionsDrawer((prev) => !prev)}
            className={`terminal-btn ${showSessionsDrawer ? 'active' : ''}`}
            title="Abrir historial de sesiones tácticas"
          >
            <History size={12} color={showSessionsDrawer ? 'var(--primary)' : 'var(--text-muted)'} />
            <span>Sesiones ({sessions.length})</span>
          </button>

          {/* Limpiar Historial */}
          <button
            onClick={clearHistory}
            className="terminal-btn"
            style={{ width: '28px', height: '28px', padding: 0, justifyContent: 'center' }}
            title="Limpiar conversación"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* 💬 Central Workspace: Sessions Drawer + Terminal Message Log */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: '0.5rem', position: 'relative' }}>
        {showSessionsDrawer && (
          <div style={{
            width: '240px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
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
              background: 'rgba(0, 0, 0, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={13} color="var(--primary)" />
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
                        background: isActive ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'rgba(0, 0, 0, 0.15)',
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

        {/* 📟 Terminal Message Log (ZERO Card Bubbles, Pure Stream) */}
        <div 
          ref={viewportRef}
          className="terminal-log-viewport"
        >
          {messages.map((m) => {
            const isUser = m.role === 'user';
            const { thoughts, cleanContent } = !isUser ? parseThoughtBlocks(m.content) : { thoughts: '', cleanContent: m.content };

            return (
              <div key={m.id} className="terminal-stream-entry">
                {/* Terminal Stream Header */}
                <div className="terminal-stream-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontWeight: 700,
                      color: isUser ? 'var(--text-high)' : 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 800 }}>&gt;</span>
                      <span>[{isUser ? `OPERADOR · ${(operatorName || 'DEFAULT').toUpperCase()}` : 'AEGIS COPILOT'}]</span>
                    </span>

                    {m.context && (
                      <span style={{
                        fontSize: '0.62rem',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-muted)',
                        background: 'rgba(255, 255, 255, 0.02)'
                      }}>
                        📂 {m.context}
                      </span>
                    )}

                    {!isUser && (
                      <span style={{
                        fontSize: '0.62rem',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: m.effort === 'high' ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-color)',
                        color: m.effort === 'high' ? 'var(--primary)' : 'var(--text-muted)'
                      }}>
                        {m.effort === 'high' ? '🧠 PROFUNDO' : '⚡ FLASH'}
                      </span>
                    )}

                    {!isUser && (
                      <span style={{
                        fontSize: '0.62rem',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        background: m.isError 
                          ? 'rgba(239, 68, 68, 0.15)' 
                          : m.loading 
                            ? 'color-mix(in srgb, var(--primary) 15%, transparent)' 
                            : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${m.isError ? 'var(--danger)' : m.loading ? 'var(--primary)' : 'var(--border-color)'}`,
                        color: m.isError ? 'var(--danger)' : m.loading ? 'var(--primary)' : 'var(--text-muted)'
                      }}>
                        {m.isError ? '[ ERROR ]' : m.loading ? '[ RUNNING ]' : '[  OK  ]'}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{m.timestamp}</span>
                    {!isUser && m.content && (
                      <button
                        onClick={() => copyToClipboard(cleanContent || m.content, m.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Copiar respuesta"
                      >
                        {copiedId === m.id ? <Check size={12} color="var(--primary)" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Terminal Stream Body */}
                <div className={`terminal-stream-body ${isUser ? 'user-body' : 'assistant-body'}`}>
                  {/* Pensamiento si existe */}
                  {!isUser && thoughts ? (
                    <ThoughtAccordion thoughts={thoughts} defaultOpen={expandThoughts} />
                  ) : null}

                  {/* Tarjeta de Permiso Interactivo CLI (Human-in-the-loop) */}
                  {!isUser && m.permissionPrompt && (
                    <div style={{
                      margin: '6px 0',
                      padding: '8px 12px',
                      background: 'rgba(234, 179, 8, 0.08)',
                      border: '1px solid rgba(234, 179, 8, 0.35)',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#facc15', fontWeight: 700, fontSize: '0.74rem' }}>
                        <ShieldAlert size={14} color="#facc15" />
                        <span>[ ⚠️ PERMISO REQUERIDO: EJECUCIÓN CLI ]</span>
                      </div>
                      <p style={{ margin: '6px 0', fontSize: '0.74rem', color: 'var(--text-high)', whiteSpace: 'pre-wrap' }}>
                        {m.permissionPrompt}
                      </p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <button
                          onClick={() => handlePermissionResponse(m.id, 'y')}
                          className="btn btn-primary"
                          style={{ padding: '3px 10px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span>Permitir</span>
                          <kbd className="tactical-kbd">↵</kbd>
                        </button>
                        <button
                          onClick={() => handlePermissionResponse(m.id, 'n')}
                          className="btn btn-secondary"
                          style={{ padding: '3px 10px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span>Denegar</span>
                          <kbd className="tactical-kbd">Esc</kbd>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Contenido / Markdown */}
                  {isUser ? (
                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-high)', fontWeight: 500 }}>
                      {m.content}
                    </div>
                  ) : cleanContent ? (
                    <>
                      <MarkdownViewer content={cleanContent} />
                      {m.loading && (
                        <span className="terminal-blinking-cursor" style={{ marginLeft: '4px', fontSize: '0.9rem' }}>
                          █
                        </span>
                      )}
                    </>
                  ) : m.loading ? (
                    /* Bloque Terminal de Progreso ASCII + Líquido */
                    <div className="terminal-progress-block">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="terminal-blinking-cursor">▶</span>
                          <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>
                            {m.statusText || 'Iniciando agente y montando contexto...'}
                          </span>
                        </div>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                          {loadingProgress}%
                        </span>
                      </div>
                      <div className="terminal-ascii-bar">
                        &gt; {renderAsciiProgress(loadingProgress, 20)} {loadingProgress}%
                      </div>
                      <div className="liquid-progress-container" style={{ height: '4px' }}>
                        <div className="liquid-progress-fill" style={{ width: `${loadingProgress}%` }}>
                          <div className="liquid-progress-shimmer" />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Telemetría y Tokens al finalizar */}
                  {!isUser && !m.loading && (m.totalTokens || m.duration) && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '8px',
                      paddingTop: '4px',
                      fontSize: '0.64rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      <span>└─</span>
                      {m.totalTokens && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Cpu size={11} color="var(--primary)" />
                          {m.totalTokens.toLocaleString()} tokens
                        </span>
                      )}
                      {m.duration && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} />
                          {m.duration.toFixed(1)}s
                        </span>
                      )}
                      {m.totalTokens && m.duration && m.duration > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}>
                          ⚡ {(m.totalTokens / m.duration).toFixed(0)} tok/s
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ⚡ Quick Macros Row (CRUD de Macros) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '1px 2px',
        flexShrink: 0
      }}>
        <div className="no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', flex: 1 }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>MACROS:</span>
          {macros.map((macro, idx) => (
            <button
              key={macro.id || idx}
              onClick={() => handleSend(macro.text)}
              disabled={loading}
              className="terminal-btn"
              style={{ opacity: loading ? 0.5 : 1 }}
            >
              <kbd className="tactical-kbd" style={{ fontSize: '0.55rem', padding: '0 4px' }}>{idx + 1}</kbd>
              <span>{macro.label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowMacroModal(true)}
            className="terminal-btn"
            style={{ padding: '3px 7px' }}
            title="Administrar macros personalizados (CRUD)"
          >
            <Plus size={11} color="var(--primary)" />
            <span>Editar</span>
          </button>
        </div>

        {/* 🪟 Zen mode toggle */}
        {zenMode && (
          <button
            onClick={onToggleZenMode}
            className="terminal-btn"
            title="Restaurar barra de navegación (Escape o Alt + Z)"
            style={{ flexShrink: 0 }}
          >
            <Minimize2 size={12} color="var(--primary)" />
            <span>Restaurar Barra</span>
            <kbd className="tactical-kbd">Esc</kbd>
          </button>
        )}
      </div>

      {/* ⌨️ Terminal Command Input Deck */}
      <div className="terminal-input-bar">
        <div className="terminal-prompt-chevron">
          <span>&gt;</span>
        </div>

        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
          placeholder={loading ? 'Agente ejecutando instrucción...' : `[${activeContext.label} · ${effortMode === 'high' ? 'Profundo' : 'Flash'}] Instrucción para el agente...`}
          disabled={loading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-high)',
            fontSize: '0.86rem',
            fontFamily: 'inherit'
          }}
        />

        <span className="terminal-blinking-cursor" style={{ marginRight: '6px' }}>█</span>

        <button
          onClick={() => handleSend()}
          disabled={loading || !prompt.trim()}
          className="btn btn-primary"
          style={{
            padding: '5px 14px',
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
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
              <kbd className="tactical-kbd" style={{ background: 'rgba(0, 0, 0, 0.25)', color: 'inherit', border: 'none', boxShadow: 'none' }}>↵</kbd>
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

      {/* ⚡ Modal Administrador de Macros (CRUD) */}
      <MacroManagerModal
        isOpen={showMacroModal}
        onClose={() => setShowMacroModal(false)}
        macros={macros}
        onSaveMacros={handleSaveMacros}
      />
    </div>
  );
}
