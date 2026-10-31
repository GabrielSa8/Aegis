import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getActiveMention, getTokenEndingAt, removeRange, MENTION_KINDS, formatReference } from './promptTokens';
import { getVaultNotes } from './promptReferences';
import MentionPopover from './MentionPopover';

export default function PromptOverlay({
  prompt,
  onChangePrompt,
  inputRef,
  onKeyDown,
  onPaste,
  placeholder,
  disabled,
  activeContext,
  contexts = [],
  onSelectContext,
  onAddReference
}) {
  const [activeMention, setActiveMention] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const updateMentionState = useCallback(() => {
    if (!inputRef.current) return;
    const caret = inputRef.current.selectionStart || 0;
    const mention = getActiveMention(prompt, caret);
    setActiveMention((prev) => {
      if (!prev && !mention) return null;
      if (
        prev &&
        mention &&
        prev.stage === mention.stage &&
        prev.kind === mention.kind &&
        prev.query === mention.query &&
        prev.start === mention.start
      ) {
        return prev;
      }
      return mention;
    });
  }, [prompt, inputRef]);

  useEffect(() => {
    updateMentionState();
  }, [prompt, updateMentionState]);

  // Carga asíncrona de sugerencias según activeMention
  useEffect(() => {
    let cancelled = false;
    if (!activeMention) {
      setItems([]);
      setSelectedIndex(0);
      return;
    }

    const { stage, kind, query = '' } = activeMention;
    const q = query.toLowerCase();

    if (stage === 'kind') {
      const filtered = MENTION_KINDS.filter(
        (k) => k.kind.toLowerCase().includes(q) || k.desc.toLowerCase().includes(q)
      ).map((k) => ({
        id: k.kind,
        kind: k.kind,
        label: `@${k.kind}:`,
        desc: k.desc,
        isKind: true
      }));
      setItems(filtered);
      setSelectedIndex(0);
      return;
    }

    if (stage === 'arg') {
      setLoading(true);
      (async () => {
        try {
          if (kind === 'vault') {
            const notes = await getVaultNotes();
            if (cancelled) return;
            const matches = notes
              .filter((n) => (n.title || '').toLowerCase().includes(q) || (n.relative_path || '').toLowerCase().includes(q))
              .slice(0, 8)
              .map((n) => ({
                id: n.relative_path || n.path,
                label: n.title || n.relative_path,
                desc: n.relative_path,
                kind: 'vault',
                insertText: formatReference('vault', n.relative_path || n.title)
              }));
            setItems(matches);
          } else if (kind === 'file') {
            const files = await invoke('list_workspace_files', {
              root: activeContext?.path || '.',
              query: q,
              limit: 8
            });
            if (cancelled) return;
            const matches = (files || []).map((f) => ({
              id: f,
              label: f.split('/').pop(),
              desc: f,
              kind: 'file',
              insertText: formatReference('file', f)
            }));
            setItems(matches);
          } else if (kind === 'context') {
            const matches = (contexts || [])
              .filter((c) => (c.label || c.name || '').toLowerCase().includes(q))
              .slice(0, 8)
              .map((c) => ({
                id: c.id,
                label: c.label || c.name,
                desc: c.path || 'Perfil de contexto',
                kind: 'context',
                insertText: formatReference('context', c.label || c.name || c.id)
              }));
            setItems(matches);
          }
        } catch {
          if (!cancelled) setItems([]);
        } finally {
          if (!cancelled) {
            setLoading(false);
            setSelectedIndex(0);
          }
        }
      })();
    }

    return () => {
      cancelled = true;
    };
  }, [activeMention, activeContext, contexts]);

  const handleSelectMention = (item) => {
    if (!inputRef.current || !item) return;
    const caret = inputRef.current.selectionStart || 0;
    const mention = activeMention || getActiveMention(prompt, caret);
    if (!mention) return;

    if (item.isKind) {
      const insertion = `@${item.kind}:`;
      const before = prompt.slice(0, mention.start);
      const after = prompt.slice(mention.end);
      const nextPrompt = `${before}${insertion}${after}`;
      onChangePrompt(nextPrompt);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const nextCaret = mention.start + insertion.length;
          inputRef.current.setSelectionRange(nextCaret, nextCaret);
        }
      }, 10);
      return;
    }

    // Al seleccionar el recurso concreto: se crea como Chip arriba y se elimina el texto @tipo:query del input
    if (item.kind === 'context' && onSelectContext) {
      onSelectContext(item.id);
    }

    if (onAddReference) {
      onAddReference({
        kind: item.kind,
        arg: item.id || item.label,
        type: 'ref',
        value: item.insertText ? item.insertText.trim() : `@${item.kind}:${item.label}`
      });
    }

    const before = prompt.slice(0, mention.start).trimEnd();
    const after = prompt.slice(mention.end).trimStart();
    const nextPrompt = before && after ? `${before} ${after}` : `${before}${after}`;

    onChangePrompt(nextPrompt);
    setActiveMention(null);
    setItems([]);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const nextCaret = before ? before.length + 1 : 0;
        inputRef.current.setSelectionRange(nextCaret, nextCaret);
      }
    }, 10);
  };

  const handleInternalKeyDown = (e) => {
    // 1. Navegación en el popover si está activo con items
    if (activeMention && items.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = items[selectedIndex] || items[0];
        if (selected) {
          handleSelectMention(selected);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveMention(null);
        setItems([]);
        return;
      }
    } else if (activeMention && e.key === 'Escape') {
      e.preventDefault();
      setActiveMention(null);
      setItems([]);
      return;
    }

    // 2. Borrado atómico de tokens con Backspace
    if (e.key === 'Backspace' && inputRef.current) {
      const caretStart = inputRef.current.selectionStart;
      const caretEnd = inputRef.current.selectionEnd;
      if (caretStart === caretEnd && caretStart > 0) {
        const tokenAtEnd = getTokenEndingAt(prompt, caretStart);
        if (tokenAtEnd) {
          e.preventDefault();
          const nextPrompt = removeRange(prompt, tokenAtEnd.start, tokenAtEnd.end);
          onChangePrompt(nextPrompt);
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange(tokenAtEnd.start, tokenAtEnd.start);
            }
          }, 10);
          return;
        }
      }
    }

    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div className="prompt-overlay-wrapper" style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex' }}>
      {/* Popover flotante para autocompletado */}
      <MentionPopover
        activeMention={activeMention}
        items={items}
        selectedIndex={selectedIndex}
        loading={loading}
        onSelect={handleSelectMention}
        onHoverIndex={setSelectedIndex}
      />

      {/* Textarea pura, sin colisión visual */}
      <textarea
        ref={inputRef}
        rows={1}
        value={prompt}
        onChange={(e) => {
          onChangePrompt(e.target.value);
        }}
        onKeyUp={updateMentionState}
        onClick={updateMentionState}
        onKeyDown={handleInternalKeyDown}
        onPaste={onPaste}
        placeholder={placeholder}
        disabled={disabled}
        className="terminal-prompt-textarea custom-scrollbar"
        style={{
          width: '100%',
          color: 'var(--text-main, #eee)'
        }}
      />
    </div>
  );
}
