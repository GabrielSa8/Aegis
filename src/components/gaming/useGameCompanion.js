import { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export function useGameCompanion({ gameId, gameTitle, isSteam }) {
  const [context, setContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [statusNotice, setStatusNotice] = useState(null);

  const activeStreamIdRef = useRef(null);
  const unlistenRef = useRef(null);
  const messageAccumulatorRef = useRef('');

  // 1. Cargar contexto táctico del juego desde Aegis Core (Rust)
  const fetchContext = useCallback(async () => {
    if (!gameId || !gameTitle) return;
    setContextLoading(true);
    try {
      const data = await invoke('get_game_agent_context', {
        gameId: String(gameId),
        gameTitle,
        isSteam: Boolean(isSteam)
      });
      setContext(data);
    } catch (err) {
      console.error('Error cargando contexto táctico de juego:', err);
    } finally {
      setContextLoading(false);
    }
  }, [gameId, gameTitle, isSteam]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  // 2. Escucha reactiva de streaming IPC de Aegis
  useEffect(() => {
    let isCancelled = false;

    listen('agent-stream', (event) => {
      if (isCancelled) return;
      const chunk = event.payload;
      if (!chunk || chunk.stream_id !== activeStreamIdRef.current) return;

      if (chunk.event_type === 'delta') {
        messageAccumulatorRef.current += chunk.content;
        const currentText = messageAccumulatorRef.current;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === chunk.stream_id
              ? { ...msg, content: currentText, loading: true }
              : msg
          )
        );
      } else if (chunk.event_type === 'done') {
        const finalText = messageAccumulatorRef.current;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === chunk.stream_id
              ? { ...msg, content: finalText || msg.content, loading: false }
              : msg
          )
        );
        setLoading(false);
        activeStreamIdRef.current = null;
      } else if (chunk.event_type === 'error') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === chunk.stream_id
              ? {
                  ...msg,
                  content: `${msg.content}\n\n⚠️ Error: ${chunk.content}`,
                  loading: false,
                  isError: true
                }
              : msg
          )
        );
        setLoading(false);
        activeStreamIdRef.current = null;
      }
    }).then((unlisten) => {
      if (isCancelled) {
        unlisten();
      } else {
        unlistenRef.current = unlisten;
      }
    });

    return () => {
      isCancelled = true;
      if (typeof unlistenRef.current === 'function') {
        unlistenRef.current();
      }
    };
  }, []);

  // 3. Enviar prompt al Agente Táctico
  const handleSendPrompt = async (promptText, quickActionTitle = null) => {
    const text = (promptText || input).trim();
    if (!text || loading) return;

    const streamId = `game_comp_${Date.now()}`;
    activeStreamIdRef.current = streamId;
    messageAccumulatorRef.current = '';

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const userMsg = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: timeStr,
      quickActionTitle
    };

    const assistantMsg = {
      id: streamId,
      role: 'assistant',
      content: '',
      timestamp: timeStr,
      loading: true,
      quickActionTitle
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setLoading(true);

    // Si es la primera interacción o acción rápida, enriquecemos con el sistema táctico
    const contextHeader = context?.system_prompt
      ? `${context.system_prompt}\n\n---\nInstrucción de Gabriel:\n${text}`
      : text;

    try {
      await invoke('execute_agent_prompt', {
        prompt: contextHeader,
        contextId: 'gaming',
        contextPath: null,
        skills: ['obsidian-vault-architect'],
        streamId,
        effort: 'low',
        model: null
      });
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamId
            ? {
                ...m,
                content: `Error al conectar con Aegis Core: ${err}`,
                loading: false,
                isError: true
              }
            : m
        )
      );
      setLoading(false);
      activeStreamIdRef.current = null;
    }
  };

  // 4. Detener inferencia
  const handleStopStream = async () => {
    const id = activeStreamIdRef.current;
    if (!id) return;
    try {
      await invoke('cancel_agent_stream', { streamId: id });
    } catch (err) {
      console.warn('Error cancelando stream:', err);
    }
    setLoading(false);
    activeStreamIdRef.current = null;
  };

  // 5. Copiar texto
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 6. Guardar recomendación o build en Obsidian
  const handleSaveToObsidian = async (msgId, content, sectionTitle) => {
    try {
      const res = await invoke('save_game_companion_note', {
        gameId: String(gameId),
        gameTitle,
        isSteam: Boolean(isSteam),
        sectionTitle: sectionTitle || 'Consejo de Juego',
        noteContent: content
      });
      setSavedId(msgId);
      setStatusNotice(res);
      setTimeout(() => {
        setSavedId(null);
        setStatusNotice(null);
      }, 3500);
      fetchContext();
    } catch (err) {
      setStatusNotice(`Error guardando: ${err}`);
      setTimeout(() => setStatusNotice(null), 3500);
    }
  };

  return {
    context,
    contextLoading,
    messages,
    loading,
    input,
    setInput,
    copiedId,
    savedId,
    statusNotice,
    handleSendPrompt,
    handleStopStream,
    handleCopy,
    handleSaveToObsidian,
    fetchContext
  };
}
