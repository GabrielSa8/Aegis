import { useState, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * useVaultDragDrop — Hook especializado en la reorganización táctica Drag & Drop
 * de notas y carpetas dentro del árbol lateral de Obsidian.
 */
export function useVaultDragDrop({
  loadVaultData,
  activeNoteRef,
  setActiveNote,
  setExpandedFolders
}) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null); // relative path of target folder
  const [isDropAllowed, setIsDropAllowed] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const hoverTimerRef = useRef(null);

  const isInvalidDrop = useCallback((item, targetRelPath) => {
    if (!item) return true;
    const cleanTarget = (targetRelPath || '').trim().replace(/^\/+|\/+$/g, '');

    // Calcular la carpeta padre actual del elemento arrastrado
    let itemParent = '';
    if (item.type === 'note') {
      const parts = item.relativePath.split('/');
      itemParent = parts.slice(0, -1).join('/');
    } else if (item.type === 'folder') {
      const parts = item.path.split('/');
      itemParent = parts.slice(0, -1).join('/');
    }

    // No permitir soltar en su misma carpeta contenedora (no hay cambio)
    if (cleanTarget === itemParent) {
      return true;
    }

    // Si es carpeta, no permitir soltar dentro de sí misma o de sus descendientes
    if (item.type === 'folder') {
      const folderRel = item.path.replace(/^\/+|\/+$/g, '');
      if (cleanTarget === folderRel || cleanTarget.startsWith(`${folderRel}/`)) {
        return true;
      }
    }

    return false;
  }, []);

  const handleDragStart = useCallback((e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('application/json', JSON.stringify(item));
      e.dataTransfer.setData('text/plain', item.relativePath || item.path);
    } catch {
      // Fallback para entornos donde setData falle
    }
  }, []);

  const handleDragOver = useCallback((e, targetRelPath, expandFolderFn) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItem) return;

    const invalid = isInvalidDrop(draggedItem, targetRelPath);
    if (invalid) {
      e.dataTransfer.dropEffect = 'none';
      if (isDropAllowed) setIsDropAllowed(false);
      return;
    }

    e.dataTransfer.dropEffect = 'move';
    if (!isDropAllowed) setIsDropAllowed(true);

    if (dragOverTarget !== targetRelPath) {
      setDragOverTarget(targetRelPath);

      // Auto-expandir carpeta al hacer hover por más de 550ms
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (expandFolderFn && targetRelPath) {
        hoverTimerRef.current = setTimeout(() => {
          expandFolderFn(targetRelPath);
        }, 550);
      }
    }
  }, [draggedItem, dragOverTarget, isDropAllowed, isInvalidDrop]);

  const handleDragLeave = useCallback((e, targetRelPath) => {
    e.preventDefault();
    e.stopPropagation();

    // Solo limpiar si realmente salimos del contenedor
    if (e.currentTarget.contains(e.relatedTarget)) return;

    if (dragOverTarget === targetRelPath) {
      setDragOverTarget(null);
      setIsDropAllowed(false);
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    }
  }, [dragOverTarget]);

  const executeMove = useCallback(async (item, targetRelPath) => {
    const cleanTarget = (targetRelPath || '').trim().replace(/^\/+|\/+$/g, '');
    if (isInvalidDrop(item, cleanTarget)) return;

    setMoveLoading(true);
    try {
      const src = item.type === 'note' ? (item.path || item.relativePath) : item.path;
      const res = await invoke('move_vault_item', {
        sourcePath: src,
        targetFolderRelative: cleanTarget
      });

      if (res && res.success) {
        // Si la nota movida es la actualmente activa, actualizarla
        if (activeNoteRef?.current && item.type === 'note') {
          if (activeNoteRef.current.path === item.path || activeNoteRef.current.relative_path === item.relativePath) {
            setActiveNote((prev) => prev ? {
              ...prev,
              path: res.new_path,
              relative_path: res.new_relative_path,
              hub: res.new_relative_path.split('/')[0] || 'General'
            } : null);
          }
        }

        // Expandir carpeta destino
        if (cleanTarget && setExpandedFolders) {
          const parts = cleanTarget.split('/');
          const toExpand = [];
          let acc = '';
          parts.forEach((p) => {
            acc = acc ? `${acc}/${p}` : p;
            toExpand.push(acc);
          });
          setExpandedFolders((prev) => new Set([...prev, ...toExpand]));
        }

        await loadVaultData();
        setFeedback({
          type: 'success',
          message: `Movido con éxito a ${cleanTarget ? `/${cleanTarget}` : 'la raíz'}`
        });
      }
    } catch (err) {
      console.error('Error al mover elemento:', err);
      setFeedback({
        type: 'error',
        message: typeof err === 'string' ? err : 'Error al mover elemento'
      });
    } finally {
      setMoveLoading(false);
      setDraggedItem(null);
      setDragOverTarget(null);
      setIsDropAllowed(false);
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      setTimeout(() => setFeedback(null), 3000);
    }
  }, [isInvalidDrop, activeNoteRef, setActiveNote, setExpandedFolders, loadVaultData]);

  const handleDrop = useCallback((e, targetRelPath) => {
    e.preventDefault();
    e.stopPropagation();

    let item = draggedItem;
    if (!item) {
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) item = JSON.parse(raw);
      } catch {
        // Ignorar
      }
    }

    if (item) {
      executeMove(item, targetRelPath);
    } else {
      setDraggedItem(null);
      setDragOverTarget(null);
      setIsDropAllowed(false);
    }
  }, [draggedItem, executeMove]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverTarget(null);
    setIsDropAllowed(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  return {
    draggedItem,
    dragOverTarget,
    isDropAllowed,
    moveLoading,
    feedback,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    isInvalidDrop
  };
}

export default useVaultDragDrop;
