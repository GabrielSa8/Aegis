import { useState, useRef, useCallback } from 'react';

const STORAGE_KEY = 'aegis_prompt_history';
const MAX_HISTORY = 100;

/**
 * Hook modular para navegación de historial de comandos (↑ / ↓) con filtrado por prefijo.
 * Emula la conducta de zsh (history-beginning-search-backward) / fish / readline:
 * - Si el usuario escribió un prefijo (ej. "p" o "hola"), ↑ solo navega comandos que empiezan con ese prefijo.
 * - Si el input está vacío, ↑ navega todo el historial.
 * - ↓ avanza hacia comandos más recientes que coinciden y restaura el borrador inicial.
 * - Escape cancela la navegación y vuelve al borrador intacto.
 * - Evita duplicados consecutivos (HISTCONTROL=ignoredups).
 * - Respeta navegación multilínea si el cursor está en líneas intermedias.
 */
export function usePromptHistory(prompt, onChangePrompt, inputRef) {
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Error al leer historial de prompts:', e);
      return [];
    }
  });

  const [historyIndex, setHistoryIndex] = useState(-1);
  const [matchCount, setMatchCount] = useState(0);
  const [matchPosition, setMatchPosition] = useState(0);

  const draftRef = useRef('');
  const prefixRef = useRef('');
  const matchesRef = useRef([]);
  const matchPointerRef = useRef(-1);

  // Persistir en localStorage
  const persistHistory = useCallback((items) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Error al guardar historial de prompts:', e);
    }
  }, []);

  // Registrar un prompt enviado en el historial
  const recordPrompt = useCallback((text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;

    setHistory((prev) => {
      // Ignorar duplicados consecutivos
      if (prev.length > 0 && prev[prev.length - 1] === trimmed) {
        return prev;
      }
      const updated = [...prev, trimmed].slice(-MAX_HISTORY);
      persistHistory(updated);
      return updated;
    });

    setHistoryIndex(-1);
    setMatchCount(0);
    setMatchPosition(0);
    draftRef.current = '';
    prefixRef.current = '';
    matchesRef.current = [];
    matchPointerRef.current = -1;
  }, [persistHistory]);

  // Colocar cursor al final del valor en el textarea
  const moveCursorToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      if (inputRef && inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    });
  }, [inputRef]);

  // Resetear estado de navegación cuando el usuario tipea o sale
  const resetHistoryIndex = useCallback(() => {
    setHistoryIndex(-1);
    setMatchCount(0);
    setMatchPosition(0);
    matchesRef.current = [];
    matchPointerRef.current = -1;
  }, []);

  // Manejar teclado para ↑, ↓ y Escape
  const handleHistoryKeyDown = useCallback((e) => {
    const isArrowUp = e.key === 'ArrowUp';
    const isArrowDown = e.key === 'ArrowDown';
    const isEscape = e.key === 'Escape';

    if (!isArrowUp && !isArrowDown && !isEscape) {
      return false;
    }

    // Escape: restaurar borrador si se estaba navegando el historial
    if (isEscape && historyIndex !== -1) {
      e.preventDefault();
      onChangePrompt(draftRef.current);
      resetHistoryIndex();
      moveCursorToEnd();
      return true;
    }

    if (history.length === 0) return false;

    const textarea = inputRef?.current;
    const isMultiline = prompt.includes('\n');
    const cursorAtStart = !textarea || textarea.selectionStart === 0;
    const cursorAtEnd = !textarea || textarea.selectionStart === textarea.value.length;

    // Tecla Arriba (↑)
    if (isArrowUp) {
      // En multilínea, permitir mover el cursor hacia arriba si no está al inicio
      if (isMultiline && !cursorAtStart && historyIndex === -1) {
        return false;
      }

      // 1. Inicio de navegación: calcular coincidencias según prefijo ingresado
      if (historyIndex === -1) {
        const prefix = prompt.trimStart().toLowerCase();
        draftRef.current = prompt;
        prefixRef.current = prefix;

        // Filtrar historial buscando coincidencias que comiencen con el prefijo
        const matches = [];
        for (let i = 0; i < history.length; i++) {
          if (!prefix || history[i].trimStart().toLowerCase().startsWith(prefix)) {
            matches.push(i);
          }
        }

        // Si no hay ninguna coincidencia con esta letra/prefijo, bloquear navegación
        if (matches.length === 0) {
          return false;
        }

        e.preventDefault();
        matchesRef.current = matches;
        const lastMatchIdx = matches.length - 1;
        matchPointerRef.current = lastMatchIdx;

        const targetHistIdx = matches[lastMatchIdx];
        setHistoryIndex(targetHistIdx);
        setMatchCount(matches.length);
        setMatchPosition(matches.length);
        onChangePrompt(history[targetHistIdx]);
        moveCursorToEnd();
        return true;
      } else {
        // 2. Ya navegando: subir a la coincidencia previa
        if (matchPointerRef.current > 0) {
          e.preventDefault();
          matchPointerRef.current -= 1;
          const targetHistIdx = matchesRef.current[matchPointerRef.current];
          setHistoryIndex(targetHistIdx);
          setMatchPosition(matchPointerRef.current + 1);
          onChangePrompt(history[targetHistIdx]);
          moveCursorToEnd();
          return true;
        }
        // Ya está en la coincidencia más antigua: retener
        e.preventDefault();
        return true;
      }
    }

    // Tecla Abajo (↓)
    if (isArrowDown) {
      if (historyIndex === -1) {
        return false;
      }

      if (isMultiline && !cursorAtEnd) {
        return false;
      }

      e.preventDefault();

      if (matchPointerRef.current < matchesRef.current.length - 1) {
        matchPointerRef.current += 1;
        const targetHistIdx = matchesRef.current[matchPointerRef.current];
        setHistoryIndex(targetHistIdx);
        setMatchPosition(matchPointerRef.current + 1);
        onChangePrompt(history[targetHistIdx]);
      } else {
        // Fin de las coincidencias: restaurar el borrador original
        resetHistoryIndex();
        onChangePrompt(draftRef.current);
      }
      moveCursorToEnd();
      return true;
    }

    return false;
  }, [history, historyIndex, prompt, onChangePrompt, inputRef, moveCursorToEnd, resetHistoryIndex]);

  return {
    history,
    historyIndex,
    matchCount,
    matchPosition,
    recordPrompt,
    handleHistoryKeyDown,
    resetHistoryIndex
  };
}
