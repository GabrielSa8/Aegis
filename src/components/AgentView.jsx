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
  ShieldAlert
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import ContextManagerModal, { DEFAULT_CONTEXTS } from './ContextManagerModal';

export default function AgentView() {
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
  const viewportRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Aegis Copilot táctico en línea. Conectado al agente local (`agy 1.4.8`). ¿Qué tarea ejecutamos?',
      context: activeContext.label,
      timestamp: 'Ahora'
    }
  ]);

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
              if (chunk.event_type === 'delta') {
                return {
                  ...msg,
                  content: (msg.content || '') + chunk.content,
                  loading: true
                };
              } else if (chunk.event_type === 'done') {
                return {
                  ...msg,
                  loading: false,
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

    const assistantPlaceholder = {
      id: streamId,
      role: 'assistant',
      content: '',
      context: activeContext.label,
      effort: effortMode,
      timestamp: timeStr,
      loading: true
    };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setPrompt('');
    setLoading(true);

    try {
      await invoke('execute_agent_prompt', {
        prompt: textToSend,
        contextPath: activeContext.path,
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '0.75rem' }}>
      {/* 🧭 Context Router & Effort Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 1rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
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
                      onClick={() => copyToClipboard(m.content, m.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                      title="Copiar respuesta"
                    >
                      {copiedId === m.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Contenido */}
              <div style={{
                fontSize: '0.86rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                color: 'var(--text-high)',
                fontFamily: isUser ? 'inherit' : 'var(--font-mono)'
              }}>
                {m.content}
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

      {/* ⚡ Quick Macros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', padding: '2px 0', flexShrink: 0 }}>
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
