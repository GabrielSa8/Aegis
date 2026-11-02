import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebview } from '@tauri-apps/api/webview';

const MAX_BYTES = 25 * 1024 * 1024;

const isImage = (f) => f.type?.startsWith('image/');

/** Gestiona adjuntos multimodales (pegar, arrastrar, seleccionar) y su subida al workspace del contexto */
export function useAttachments(contextId) {
  const [attachments, setAttachments] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const urlsRef = useRef(new Set());
  const ctxRef = useRef(contextId);
  ctxRef.current = contextId;

  useEffect(() => {
    const urls = urlsRef.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  // Drop nativo de Tauri (evita que el webview navegue al archivo); copia al workspace al soltar
  useEffect(() => {
    if (typeof window === 'undefined' || !window.__TAURI_INTERNALS__?.metadata?.currentWindow) return;
    let unlisten;
    let cancelled = false;
    getCurrentWebview()
      .onDragDropEvent(async (event) => {
        const { type, paths } = event.payload;
        if (type === 'enter' || type === 'over') return setDragOver(true);
        if (type === 'leave') return setDragOver(false);
        setDragOver(false);
        for (const src of paths || []) {
          try {
            const [saved, size] = await invoke('import_attachment', { contextId: ctxRef.current, sourcePath: src });
            const name = src.split(/[\\/]/).pop();
            setAttachments((prev) => [
              ...prev,
              { id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name, size, savedPath: saved }
            ]);
          } catch (err) {
            console.error('Error importando adjunto:', err);
          }
        }
      })
      .then((fn) => (cancelled ? fn() : (unlisten = fn)))
      .catch(() => {});
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  const addFiles = useCallback((files) => {
    const next = Array.from(files || [])
      .filter((f) => f.size <= MAX_BYTES)
      .map((file) => {
        const previewUrl = isImage(file) ? URL.createObjectURL(file) : null;
        if (previewUrl) urlsRef.current.add(previewUrl);
        return {
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          file,
          name: file.name || (isImage(file) ? 'captura.png' : 'adjunto'),
          size: file.size,
          previewUrl
        };
      });
    if (next.length) setAttachments((prev) => [...prev, ...next]);
  }, []);

  const removeAttachment = useCallback((id) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
        urlsRef.current.delete(target.previewUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => setAttachments([]), []);

  const handlePaste = useCallback(
    (e) => {
      const files = Array.from(e.clipboardData?.files || []);
      if (!files.length) return false;
      e.preventDefault();
      addFiles(files);
      return true;
    },
    [addFiles]
  );

  /** Sube todos los adjuntos y devuelve sus rutas absolutas */
  const uploadAll = useCallback(async () => {
    const paths = [];
    for (const a of attachments) {
      if (a.savedPath) {
        paths.push({ name: a.name, path: a.savedPath });
        continue;
      }
      const data = Array.from(new Uint8Array(await a.file.arrayBuffer()));
      paths.push({
        name: a.name,
        path: await invoke('save_attachment', { contextId, name: a.name, data })
      });
    }
    return paths;
  }, [attachments, contextId]);

  return {
    attachments,
    dragOver,
    addFiles,
    removeAttachment,
    clearAttachments,
    handlePaste,
    uploadAll
  };
}

/** Anexa referencias de archivos al prompt en formato legible por el agente */
export function appendAttachmentRefs(text, uploaded) {
  if (!uploaded.length) return text;
  const refs = uploaded.map((u) => `- ${u.path}`).join('\n');
  return `${text}\n\n[Adjuntos — léelos/analízalos desde estas rutas]\n${refs}`;
}
