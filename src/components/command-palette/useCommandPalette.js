import { useState, useEffect, useRef } from 'react';
import { FileText } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { getBaseCommands } from './commandHelpers';

export function useCommandPalette({
  isOpen,
  onClose,
  onSelectTab,
  onOpenSettings,
  onThemeChange
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [vaultNotes, setVaultNotes] = useState([]);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      invoke('get_vault_notes')
        .then((notes) => setVaultNotes(Array.isArray(notes) ? notes.slice(0, 30) : []))
        .catch(() => setVaultNotes([]));
    }
  }, [isOpen]);

  const baseCommands = getBaseCommands({
    onSelectTab,
    onOpenSettings,
    onThemeChange,
    onClose
  });

  const noteCommands = vaultNotes.map((n) => ({
    id: 'note-' + n.path,
    title: `Nota: ${n.title}`,
    category: `Bóveda · ${n.hub}`,
    icon: FileText,
    action: () => {
      onSelectTab('vault');
      onClose();
    }
  }));

  const allItems = [...baseCommands, ...noteCommands];

  const filtered = allItems.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
  });

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return {
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    inputRef,
    listRef,
    filtered,
    handleKeyDown
  };
}
