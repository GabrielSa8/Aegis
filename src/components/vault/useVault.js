import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { NOTE_TEMPLATES, buildVaultTree, resolveAvailableSubfolders } from './vaultHelpers';
import { useVaultDragDrop } from './useVaultDragDrop';

/**
 * useVault — Custom Hook que encapsula el estado, persistencia IPC de Tauri,
 * búsqueda de texto completo y árbol de carpetas de la Bóveda Obsidian.
 */
export function useVault() {
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modos de Búsqueda y Filtros
  const [searchMode, setSearchMode] = useState('title'); // 'title' | 'fulltext'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHub, setSelectedHub] = useState('Todos');
  const [fullTextResults, setFullTextResults] = useState([]);
  const [searchingFullText, setSearchingFullText] = useState(false);

  // Estados de Nota Activa y Edición
  const [activeNote, setActiveNote] = useState(null);
  const activeNoteRef = useRef(activeNote);
  useEffect(() => {
    activeNoteRef.current = activeNote;
  }, [activeNote]);
  const [noteContent, setNoteContent] = useState('');
  const [loadingNote, setLoadingNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Estructura de carpetas en disco
  const [vaultFolders, setVaultFolders] = useState([]);

  // Modales de Creación
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteHub, setNewNoteHub] = useState('');
  const [newNoteTemplate, setNewNoteTemplate] = useState('basic');
  const [newNoteSubfolderChoice, setNewNoteSubfolderChoice] = useState('');
  const [customSubfolder, setCustomSubfolder] = useState('');

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderHub, setNewFolderHub] = useState('');
  const [newFolderParent, setNewFolderParent] = useState('');

  // Carpetas desplegadas estilo Obsidian
  const [expandedFolders, setExpandedFolders] = useState(() => new Set());

  // Referencias para persistir posición exacta de lectura/edición
  const viewerContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollPosRef = useRef({ ratio: 0, px: 0 });

  // Ref sincronizada para evitar cierres obsoletos en clics rápidos sobre tareas
  const noteContentRef = useRef(noteContent);
  useEffect(() => {
    noteContentRef.current = noteContent;
  }, [noteContent]);

  // Hubs descubiertos dinámicamente de carpetas y notas (Cero Hardcode)
  const vaultHubs = useMemo(() => {
    const hubSet = new Set();
    if (Array.isArray(vaultFolders)) {
      vaultFolders.forEach((f) => {
        const top = f.split('/')[0];
        if (top) hubSet.add(top);
      });
    }
    if (Array.isArray(notes)) {
      notes.forEach((n) => {
        if (n.hub && n.hub !== 'General' && n.hub !== 'Raíz') hubSet.add(n.hub);
      });
    }
    return Array.from(hubSet).sort();
  }, [vaultFolders, notes]);

  // Sincronizar selección inicial de Hubs
  useEffect(() => {
    if (vaultHubs.length > 0) {
      if (!newNoteHub || !vaultHubs.includes(newNoteHub)) {
        setNewNoteHub(vaultHubs[0]);
      }
      if (!newFolderHub || !vaultHubs.includes(newFolderHub)) {
        setNewFolderHub(vaultHubs[0]);
      }
      if (expandedFolders.size === 0) {
        setExpandedFolders(new Set(vaultHubs));
      }
    }
  }, [vaultHubs]);

  // Atajo de teclado (Ctrl + B / Cmd + B)
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setShowSidebar((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const loadNote = useCallback(async (note) => {
    setActiveNote(note);
    setLoadingNote(true);
    setSaveSuccess(false);
    scrollPosRef.current = { ratio: 0, px: 0 };
    if (viewerContainerRef.current) viewerContainerRef.current.scrollTop = 0;
    if (textareaRef.current) textareaRef.current.scrollTop = 0;
    try {
      const content = await invoke('read_vault_note', { path: note.path });
      setNoteContent(content);
    } catch (err) {
      console.error('Error leyendo nota:', err);
      setNoteContent(`Error al leer archivo: ${err}`);
    } finally {
      setLoadingNote(false);
    }
  }, []);

  const loadVaultData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const [foldersRes, notesRes, statsRes] = await Promise.all([
        invoke('get_vault_folders').catch(() => []),
        invoke('get_vault_notes'),
        invoke('get_vault_stats')
      ]);
      setVaultFolders(foldersRes || []);
      setNotes(notesRes || []);
      setStats(statsRes || null);

      if (!activeNoteRef.current && notesRes && notesRes.length > 0) {
        const inicio = notesRes.find((n) => n.title.toLowerCase() === 'inicio') || notesRes[0];
        loadNote(inicio);
      }
    } catch (err) {
      console.error('Error cargando notas de Bóveda:', err);
      setError(String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadNote]);

  useEffect(() => {
    loadVaultData();
  }, [loadVaultData]);

  // Escucha de evento táctico aegis:open-vault-note para apertura de notas desde otras pestañas (ej. Tasks)
  useEffect(() => {
    const handleOpenExternalNote = (e) => {
      const targetPath = e.detail?.path || e.detail?.relative_path;
      if (!targetPath || !notes || notes.length === 0) return;
      const target = notes.find(
        (n) => n.path === targetPath || n.relative_path === targetPath || n.title.toLowerCase() === targetPath.toLowerCase()
      );
      if (target) {
        loadNote(target);
      }
    };
    window.addEventListener('aegis:open-vault-note', handleOpenExternalNote);
    return () => window.removeEventListener('aegis:open-vault-note', handleOpenExternalNote);
  }, [notes, loadNote]);

  // Gestor especializado de reorganización táctica Drag & Drop
  const dragDrop = useVaultDragDrop({
    loadVaultData,
    activeNoteRef,
    setActiveNote,
    setExpandedFolders
  });

  // Búsqueda profunda en Rust (Full-Text)
  useEffect(() => {
    if (searchMode !== 'fulltext' || !searchTerm.trim() || searchTerm.trim().length < 2) {
      setFullTextResults([]);
      setSearchingFullText(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingFullText(true);
      try {
        const hubArg = selectedHub === 'Todos' ? null : selectedHub;
        const res = await invoke('search_vault_content', {
          query: searchTerm.trim(),
          hubFilter: hubArg
        });
        setFullTextResults(res || []);
      } catch (err) {
        console.error('Error en búsqueda profunda:', err);
        setFullTextResults([]);
      } finally {
        setSearchingFullText(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchMode, searchTerm, selectedHub]);

  // Conmutación interactiva de tareas directamente en la nota
  const handleToggleTaskInNote = async (lineNumber, currentCompleted) => {
    if (!activeNote) return;
    const targetCompleted = !currentCompleted;

    const currentText = noteContentRef.current || noteContent;
    const lines = currentText.split('\n');
    const idx = lineNumber - 1;
    if (idx < 0 || idx >= lines.length) return;

    const oldLine = lines[idx];
    if (targetCompleted) {
      lines[idx] = oldLine.replace(/- \[\s\]/, '- [x]');
    } else {
      lines[idx] = oldLine.replace(/- \[[xX]\]/, '- [ ]');
    }
    const updatedContent = lines.join('\n');
    noteContentRef.current = updatedContent;
    setNoteContent(updatedContent);

    try {
      await invoke('save_vault_note', {
        path: activeNote.path,
        content: updatedContent
      });
      invoke('get_vault_stats').then((s) => setStats(s)).catch(() => {});
    } catch (err) {
      console.error('Error al guardar tarea en Obsidian:', err);
      noteContentRef.current = currentText;
      setNoteContent(currentText);
    }
  };

  // Alternar modo preservando la posición exacta de scroll
  const handleToggleEdit = () => {
    if (!isEditing && viewerContainerRef.current) {
      const el = viewerContainerRef.current;
      const maxScroll = el.scrollHeight - el.clientHeight;
      const ratio = maxScroll > 0 ? el.scrollTop / maxScroll : 0;
      scrollPosRef.current = { ratio, px: el.scrollTop };
    } else if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      const maxScroll = el.scrollHeight - el.clientHeight;
      const ratio = maxScroll > 0 ? el.scrollTop / maxScroll : 0;
      scrollPosRef.current = { ratio, px: el.scrollTop };
    }

    setIsEditing((prev) => !prev);
  };

  // Restaurar posición de scroll al alternar entre Vista Lectura y Edición
  useLayoutEffect(() => {
    const { ratio, px } = scrollPosRef.current;
    const frameId = requestAnimationFrame(() => {
      if (isEditing && textareaRef.current) {
        const el = textareaRef.current;
        const maxScroll = el.scrollHeight - el.clientHeight;
        el.scrollTop = maxScroll > 0 ? ratio * maxScroll : px;
      } else if (!isEditing && viewerContainerRef.current) {
        const el = viewerContainerRef.current;
        const maxScroll = el.scrollHeight - el.clientHeight;
        el.scrollTop = maxScroll > 0 ? ratio * maxScroll : px;
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [isEditing]);

  const handleSave = async () => {
    if (!activeNote) return;
    setSaving(true);
    try {
      await invoke('save_vault_note', { path: activeNote.path, content: noteContent });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Error guardando nota:', err);
      alert(`Error al guardar: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleFolder = (folderPath) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allPaths = new Set();
    const collectPaths = (node) => {
      Object.values(node.folders).forEach((sub) => {
        allPaths.add(sub.path);
        collectPaths(sub);
      });
    };
    collectPaths(buildVaultTree(notes));
    setExpandedFolders(allPaths);
  };

  const collapseAll = () => {
    setExpandedFolders(new Set());
  };

  // Navegación inteligente de WikiLinks [[Nota]]
  const handleNavigateNote = useCallback((targetName) => {
    if (!targetName) return;
    const clean = targetName.trim().replace(/\.md$/, '');
    const cleanLower = clean.toLowerCase();

    // 1. Coincidencia exacta por título
    let found = notes.find((n) => n.title.toLowerCase() === cleanLower);

    // 2. Coincidencia por ruta relativa
    if (!found) {
      found = notes.find(
        (n) => n.relative_path.toLowerCase().endsWith(`${cleanLower}.md`) || n.relative_path.toLowerCase() === cleanLower
      );
    }

    // 3. Coincidencia por stem de archivo
    if (!found) {
      found = notes.find((n) => {
        const stem = n.relative_path.split('/').pop().replace(/\.md$/, '').toLowerCase();
        return stem === cleanLower;
      });
    }

    if (found) {
      const parts = found.relative_path.split('/');
      if (parts.length > 1) {
        let acc = '';
        setExpandedFolders((prev) => {
          const next = new Set(prev);
          for (let i = 0; i < parts.length - 1; i++) {
            acc = acc ? `${acc}/${parts[i]}` : parts[i];
            next.add(acc);
            next.add(parts[i]);
          }
          return next;
        });
      }
      loadNote(found);
    } else {
      console.warn(`Nota [[${targetName}]] no encontrada en Bóveda.`);
    }
  }, [notes, loadNote]);

  const handleTagClick = (tag) => {
    setSearchMode('fulltext');
    setSearchTerm(tag);
  };

  const availableSubfoldersForNewNote = useMemo(() => {
    return resolveAvailableSubfolders(vaultFolders, notes, newNoteHub);
  }, [vaultFolders, notes, newNoteHub]);

  const availableSubfoldersForNewFolder = useMemo(() => {
    return resolveAvailableSubfolders(vaultFolders, notes, newFolderHub);
  }, [vaultFolders, notes, newFolderHub]);

  const handleCreateNoteSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newNoteTitle.trim()) return;

    const templateConfig = NOTE_TEMPLATES[newNoteTemplate] || NOTE_TEMPLATES.basic;
    const content = templateConfig.getContent(newNoteTitle.trim());

    let finalSubfolder = '';
    if (newNoteSubfolderChoice === '__custom__') {
      finalSubfolder = customSubfolder.trim().replace(/^\/+|\/+$/g, '');
    } else if (newNoteSubfolderChoice) {
      finalSubfolder = newNoteSubfolderChoice.trim().replace(/^\/+|\/+$/g, '');
    }

    let targetRel = `${newNoteHub}`;
    if (finalSubfolder) {
      targetRel += `/${finalSubfolder}`;
    }
    targetRel += `/${newNoteTitle.trim()}.md`;

    try {
      const created = await invoke('create_vault_note', {
        relativePath: targetRel,
        content
      });

      setShowNewNoteModal(false);
      setNewNoteTitle('');
      setNewNoteSubfolderChoice('');
      setCustomSubfolder('');

      await loadVaultData();
      if (created) {
        loadNote(created);
        setIsEditing(true);
        if (finalSubfolder) {
          setExpandedFolders((prev) => new Set([...prev, newNoteHub, `${newNoteHub}/${finalSubfolder}`]));
        }
      }
    } catch (err) {
      console.error('Error creando nota:', err);
      alert(`Error creando nota: ${err}`);
    }
  };

  const handleCreateFolderSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newFolderName.trim()) return;

    const cleanFolder = newFolderName.trim().replace(/^\/+|\/+$/g, '');
    let targetRel = `${newFolderHub}`;
    if (newFolderParent.trim()) {
      targetRel += `/${newFolderParent.trim().replace(/^\/+|\/+$/g, '')}`;
    }
    targetRel += `/${cleanFolder}`;

    try {
      await invoke('create_vault_folder', { relativePath: targetRel });
      setShowNewFolderModal(false);
      setNewFolderName('');
      setNewFolderParent('');
      await loadVaultData();
      setExpandedFolders((prev) => new Set([...prev, targetRel, newFolderHub]));
    } catch (err) {
      console.error('Error creando carpeta:', err);
      alert(`Error creando carpeta: ${err}`);
    }
  };

  // Modales defensivos de Borrado y Renombrado (Cero window.confirm)
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToRename, setItemToRename] = useState(null);

  const handleRequestDelete = useCallback((item) => {
    setItemToDelete(item);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    try {
      await invoke('delete_vault_item', { path: itemToDelete.path });
      if (
        activeNoteRef.current &&
        (activeNoteRef.current.path === itemToDelete.path ||
          activeNoteRef.current.relative_path === itemToDelete.relativePath)
      ) {
        setActiveNote(null);
        setNoteContent('');
      }
      setItemToDelete(null);
      await loadVaultData();
    } catch (err) {
      console.error('Error eliminando elemento de Bóveda:', err);
    }
  }, [itemToDelete, loadVaultData]);

  const handleRequestRename = useCallback((item) => {
    setItemToRename(item);
  }, []);

  const handleConfirmRename = useCallback(
    async (item, newName) => {
      if (!item || !newName) return;
      try {
        const src = item.path || item.relativePath;
        const res = await invoke('rename_vault_item', {
          currentPath: src,
          newName
        });

        if (res && res.success) {
          if (
            activeNoteRef.current &&
            (activeNoteRef.current.path === item.path ||
              activeNoteRef.current.relative_path === item.relativePath)
          ) {
            const cleanTitle = newName.replace(/\.md$/, '');
            setActiveNote((prev) =>
              prev
                ? {
                    ...prev,
                    path: res.new_path,
                    relative_path: res.new_relative_path,
                    title: cleanTitle,
                    hub: res.new_relative_path.split('/')[0] || 'General'
                  }
                : null
            );
          }
          setItemToRename(null);
          await loadVaultData();
        }
      } catch (err) {
        console.error('Error renombrando elemento:', err);
      }
    },
    [loadVaultData]
  );

  const handleDeleteActiveNote = useCallback(() => {
    if (activeNoteRef.current) {
      setItemToDelete({
        type: 'note',
        path: activeNoteRef.current.path,
        relativePath: activeNoteRef.current.relative_path,
        title: activeNoteRef.current.title
      });
    }
  }, []);

  const handleRenameActiveNote = useCallback(() => {
    if (activeNoteRef.current) {
      setItemToRename({
        type: 'note',
        path: activeNoteRef.current.path,
        relativePath: activeNoteRef.current.relative_path,
        title: activeNoteRef.current.title
      });
    }
  }, []);

  const handleCopyWikiLink = () => {
    if (!activeNote) return;
    const link = `[[${activeNote.title}]]`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Notas filtradas por título / ruta
  const filteredNotes = useMemo(() => {
    let list = notes;
    if (selectedHub !== 'Todos') {
      list = list.filter((n) => n.hub === selectedHub);
    }
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter((n) =>
      n.title.toLowerCase().includes(q) || n.relative_path.toLowerCase().includes(q)
    );
  }, [notes, searchTerm, selectedHub]);

  // Si hay búsqueda activa por título, expandir automáticamente carpetas con coincidencias
  useEffect(() => {
    if (searchMode === 'title' && searchTerm.trim()) {
      const pathsToExpand = new Set();
      filteredNotes.forEach((n) => {
        const parts = n.relative_path.split('/');
        let acc = '';
        for (let i = 0; i < parts.length - 1; i++) {
          acc = acc ? `${acc}/${parts[i]}` : parts[i];
          pathsToExpand.add(acc);
        }
      });
      setExpandedFolders(pathsToExpand);
    }
  }, [searchMode, searchTerm, filteredNotes]);

  const tree = useMemo(() => {
    return buildVaultTree(filteredNotes);
  }, [filteredNotes]);

  return {
    notes,
    stats,
    loading,
    refreshing,
    error,
    searchMode,
    setSearchMode,
    searchTerm,
    setSearchTerm,
    selectedHub,
    setSelectedHub,
    fullTextResults,
    searchingFullText,
    activeNote,
    setActiveNote,
    noteContent,
    setNoteContent,
    loadingNote,
    saving,
    saveSuccess,
    copiedLink,
    isEditing,
    showSidebar,
    setShowSidebar,
    vaultHubs,
    expandedFolders,
    toggleFolder,
    expandAll,
    collapseAll,
    loadNote,
    loadVaultData,
    handleToggleTaskInNote,
    handleToggleEdit,
    handleSave,
    handleDeleteActiveNote,
    handleRenameActiveNote,
    handleCopyWikiLink,
    handleNavigateNote,
    handleTagClick,
    filteredNotes,
    tree,
    viewerContainerRef,
    textareaRef,
    // Modals
    showNewNoteModal,
    setShowNewNoteModal,
    newNoteTitle,
    setNewNoteTitle,
    newNoteHub,
    setNewNoteHub,
    newNoteTemplate,
    setNewNoteTemplate,
    newNoteSubfolderChoice,
    setNewNoteSubfolderChoice,
    customSubfolder,
    setCustomSubfolder,
    availableSubfoldersForNewNote,
    handleCreateNoteSubmit,
    showNewFolderModal,
    setShowNewFolderModal,
    newFolderName,
    setNewFolderName,
    newFolderHub,
    setNewFolderHub,
    newFolderParent,
    setNewFolderParent,
    availableSubfoldersForNewFolder,
    handleCreateFolderSubmit,
    dragDrop,
    // Modales de eliminación y renombrado
    itemToDelete,
    setItemToDelete,
    handleRequestDelete,
    handleConfirmDelete,
    itemToRename,
    setItemToRename,
    handleRequestRename,
    handleConfirmRename
  };
}
