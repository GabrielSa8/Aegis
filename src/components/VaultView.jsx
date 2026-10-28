import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { 
  BookOpen, 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  FileText, 
  CheckCircle2, 
  RefreshCw, 
  Save, 
  Edit3, 
  Eye,
  ChevronsDown,
  ChevronsUp,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  FolderPlus,
  FilePlus,
  Filter,
  Layers,
  X,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Hash,
  Link2
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import MarkdownViewer from './MarkdownViewer';

const VAULT_HUBS = [
  '00 Sistema',
  '01 Operaciones MELI',
  '02 Proyectos de Software',
  '03 Personal y Ocio',
  '04 Estudios y Certificaciones'
];

const NOTE_TEMPLATES = {
  basic: {
    label: 'Nota General',
    desc: 'Encabezado con etiquetas básicas y fecha',
    getContent: (title) => `---
tags:
  - nota
tipo: Nota
fecha_actualizacion: ${new Date().toISOString().split('T')[0]}
---

# ${title}

`
  },
  sop: {
    label: 'SOP Operativo',
    desc: 'Procedimiento operativo estándar con pasos de verificación',
    getContent: (title) => `---
tags:
  - sop
  - operaciones
tipo: Procedimiento
estado: Activo
fecha_actualizacion: ${new Date().toISOString().split('T')[0]}
---

# 📋 SOP — ${title}

> [!ABSTRACT] Objetivo
> Descripción del procedimiento y contexto operativo.

---

## 🛠️ Pasos de Ejecución
- [ ] Paso 1: 
- [ ] Paso 2: 
- [ ] Paso 3: 

---
*Navegación:* [[INICIO]]
`
  },
  project: {
    label: 'Proyecto de Software',
    desc: 'Arquitectura, stack, repositorio y checklist de hitos',
    getContent: (title) => `---
aliases:
  - ${title}
tags:
  - proyectos/software
tipo: Proyecto
estado: En Desarrollo
fecha_actualizacion: ${new Date().toISOString().split('T')[0]}
---

# 🛡️ ${title}

> [!ABSTRACT] Resumen
> Arquitectura y objetivos técnicos del sistema.

---

## 📍 Datos del Repositorio
* **Ruta Local:** 
* **Stack:** 

---

## 🏗️ Hitos y Tareas
- [ ] Fase 1: Arquitectura base y entorno
- [ ] Fase 2: Implementación de componentes core

---
*Navegación:* [[INICIO]] | [[MOC - Proyectos de Software]]
`
  },
  study: {
    label: 'Estudio y Flashcards',
    desc: 'Objetivos de aprendizaje y tarjetas de repetición espaciada',
    getContent: (title) => `---
tags:
  - estudios
  - certificaciones
tipo: Materia
estado: En Curso
fecha_actualizacion: ${new Date().toISOString().split('T')[0]}
---

# 📚 ${title}

## 🎯 Objetivos de Aprendizaje
- [ ] Concepto 1
- [ ] Concepto 2

---

## ⚡ Flashcards & Conceptos Clave
Q:: ¿Concepto 1?
A:: Explicación atómica.

---
*Navegación:* [[INICIO]] | [[MOC - Estudios y Certificaciones]]
`
  }
};

// Resaltador de términos coincidentes en snippets de búsqueda profunda
function highlightMatch(text, query) {
  if (!query || !query.trim()) return text;
  const cleanQ = query.trim();
  const escaped = cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    part.toLowerCase() === cleanQ.toLowerCase() ? (
      <mark key={i} style={{ background: 'rgba(16, 185, 129, 0.35)', color: '#34d399', fontWeight: 700, padding: '0 2px', borderRadius: '2px' }}>
        {part}
      </mark>
    ) : (
      part
    )
  );
}

// Construcción recursiva del árbol de carpetas estilo Obsidian
function buildVaultTree(notesList) {
  const root = { path: '', name: 'root', folders: {}, files: [] };

  notesList.forEach((note) => {
    const parts = note.relative_path.split('/');
    if (parts.length === 1) {
      root.files.push(note);
    } else {
      let current = root;
      let accumulatedPath = '';
      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i];
        accumulatedPath = accumulatedPath ? `${accumulatedPath}/${folderName}` : folderName;
        if (!current.folders[folderName]) {
          current.folders[folderName] = {
            path: accumulatedPath,
            name: folderName,
            folders: {},
            files: []
          };
        }
        current = current.folders[folderName];
      }
      current.files.push(note);
    }
  });

  return root;
}

// Conteo total de notas dentro de una carpeta y sus subcarpetas
function getFolderFileCount(node) {
  let count = node.files.length;
  Object.values(node.folders).forEach((sub) => {
    count += getFolderFileCount(sub);
  });
  return count;
}

export default function VaultView() {
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
  const [noteContent, setNoteContent] = useState('');
  const [loadingNote, setLoadingNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Modales de Creación
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteHub, setNewNoteHub] = useState('02 Proyectos de Software');
  const [newNoteTemplate, setNewNoteTemplate] = useState('basic');
  const [newNoteSubfolder, setNewNoteSubfolder] = useState('');

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderHub, setNewFolderHub] = useState('02 Proyectos de Software');

  // Atajo de teclado para alternar explorador de archivos (Ctrl + B / Cmd + B)
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

  // Referencias para persistir posición exacta de lectura/edición
  const viewerContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollPosRef = useRef({ ratio: 0, px: 0 });

  // Ref sincronizada para evitar cierres obsoletos en clics rápidos sobre tareas
  const noteContentRef = useRef(noteContent);
  useEffect(() => {
    noteContentRef.current = noteContent;
  }, [noteContent]);

  // Set de carpetas desplegadas (estilo Obsidian)
  const [expandedFolders, setExpandedFolders] = useState(() => new Set([
    '00 Sistema',
    '01 Operaciones MELI',
    '02 Proyectos de Software',
    '03 Personal y Ocio',
    '04 Estudios y Certificaciones',
    '04 Estudios y Certs'
  ]));

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
      const [notesRes, statsRes] = await Promise.all([
        invoke('get_vault_notes'),
        invoke('get_vault_stats')
      ]);
      setNotes(notesRes || []);
      setStats(statsRes || null);

      if (!activeNote && notesRes && notesRes.length > 0) {
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
  }, [activeNote, loadNote]);

  useEffect(() => {
    loadVaultData();
  }, [loadVaultData]);

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

  // Conmutación interactiva de tareas directamente en la nota (estilo Obsidian)
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
      found = notes.find((n) => n.relative_path.toLowerCase().endsWith(`${cleanLower}.md`) || n.relative_path.toLowerCase() === cleanLower);
    }

    // 3. Coincidencia por stem de archivo
    if (!found) {
      found = notes.find((n) => {
        const stem = n.relative_path.split('/').pop().replace(/\.md$/, '').toLowerCase();
        return stem === cleanLower;
      });
    }

    if (found) {
      // Auto-desplegar carpeta contenedora
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

  // Clic en Tag Frontmatter: activa búsqueda profunda de ese tag
  const handleTagClick = (tag) => {
    setSearchMode('fulltext');
    setSearchTerm(tag);
  };

  // Creación de nueva nota
  const handleCreateNoteSubmit = async (e) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    const templateConfig = NOTE_TEMPLATES[newNoteTemplate] || NOTE_TEMPLATES.basic;
    const content = templateConfig.getContent(newNoteTitle.trim());

    let targetRel = `${newNoteHub}`;
    if (newNoteSubfolder.trim()) {
      targetRel += `/${newNoteSubfolder.trim().replace(/^\/+|\/+$/g, '')}`;
    }
    targetRel += `/${newNoteTitle.trim()}.md`;

    try {
      const created = await invoke('create_vault_note', {
        relativePath: targetRel,
        content
      });

      setShowNewNoteModal(false);
      setNewNoteTitle('');
      setNewNoteSubfolder('');

      // Recargar lista y seleccionar la nota creada en modo edición
      await loadVaultData();
      if (created) {
        loadNote(created);
        setIsEditing(true);
      }
    } catch (err) {
      console.error('Error creando nota:', err);
      alert(`Error creando nota: ${err}`);
    }
  };

  // Creación de nueva carpeta
  const handleCreateFolderSubmit = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const targetRel = `${newFolderHub}/${newFolderName.trim().replace(/^\/+|\/+$/g, '')}`;

    try {
      await invoke('create_vault_folder', { relativePath: targetRel });
      setShowNewFolderModal(false);
      setNewFolderName('');
      loadVaultData();
      setExpandedFolders((prev) => new Set([...prev, targetRel, newFolderHub]));
    } catch (err) {
      console.error('Error creando carpeta:', err);
      alert(`Error creando carpeta: ${err}`);
    }
  };

  // Eliminación de la nota activa
  const handleDeleteActiveNote = async () => {
    if (!activeNote) return;
    const ok = window.confirm(`¿Seguro que deseas eliminar la nota "${activeNote.title}" permanentemente de la Bóveda?`);
    if (!ok) return;

    try {
      await invoke('delete_vault_note', { path: activeNote.path });
      setActiveNote(null);
      setNoteContent('');
      loadVaultData();
    } catch (err) {
      console.error('Error eliminando nota:', err);
      alert(`Error al eliminar nota: ${err}`);
    }
  };

  // Copiar enlace Wiki [[Nota]] al portapapeles
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

  // Renderizado recursivo de carpetas y notas estilo Obsidian
  const renderFolderNode = (node, depth = 0) => {
    const sortedFolderKeys = Object.keys(node.folders).sort();
    const sortedFiles = [...node.files].sort((a, b) => a.title.localeCompare(b.title));

    return (
      <div key={node.path || 'root'} style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Subcarpetas */}
        {sortedFolderKeys.map((key) => {
          const sub = node.folders[key];
          const isExpanded = expandedFolders.has(sub.path);
          const totalFiles = getFolderFileCount(sub);
          const isTopHub = depth === 0;

          return (
            <div key={sub.path} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Fila de la Carpeta */}
              <div
                onClick={() => toggleFolder(sub.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  paddingLeft: `${depth * 14 + 8}px`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'var(--transition)',
                  background: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                  <span style={{ color: isTopHub ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center' }}>
                    {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
                  </span>
                  <span style={{
                    fontSize: isTopHub ? '0.78rem' : '0.74rem',
                    fontWeight: isTopHub ? 700 : 600,
                    color: isTopHub ? 'var(--text-high)' : 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {sub.name}
                  </span>
                </div>

                <span style={{
                  fontSize: '0.62rem',
                  color: 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 600
                }}>
                  {totalFiles}
                </span>
              </div>

              {/* Contenido desplegado de la carpeta */}
              {isExpanded && renderFolderNode(sub, depth + 1)}
            </div>
          );
        })}

        {/* Archivos en el nivel actual */}
        {sortedFiles.map((note) => {
          const isSelected = activeNote?.path === note.path;
          return (
            <div
              key={note.path}
              onClick={() => loadNote(note)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '5px 8px',
                paddingLeft: `${depth * 14 + 22}px`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'var(--transition)',
                background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                borderLeft: isSelected ? '2px solid #10b981' : '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.025)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'transparent';
              }}
            >
              <FileText size={13} color={isSelected ? '#34d399' : 'var(--text-muted)'} />
              <span style={{
                fontSize: '0.76rem',
                fontWeight: isSelected ? 700 : 400,
                color: isSelected ? '#34d399' : 'var(--text-high)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {note.title}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 🧭 Lienzo Dividido: Explorador de Carpetas Desplegable (Izquierda) + Editor (Derecha) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showSidebar ? '300px 1fr' : '1fr',
        gap: showSidebar ? '0.75rem' : '0',
        flex: 1,
        minHeight: 0
      }}>
        {/* PANEL IZQUIERDO: Árbol de Carpetas & Búsqueda Profunda */}
        {showSidebar && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden'
          }}>
            {/* Barra de Búsqueda y Filtros */}
            <div style={{
              padding: '0.5rem 0.65rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {/* Selector de Modo de Búsqueda: Títulos vs Texto Completo */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '4px',
                background: 'rgba(0,0,0,0.3)',
                padding: '2px',
                borderRadius: '6px'
              }}>
                <button
                  type="button"
                  onClick={() => setSearchMode('title')}
                  style={{
                    padding: '3px 6px',
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: searchMode === 'title' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: searchMode === 'title' ? '#34d399' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <FileText size={11} />
                  <span>Títulos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('fulltext')}
                  style={{
                    padding: '3px 6px',
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: searchMode === 'fulltext' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                    color: searchMode === 'fulltext' ? '#c084fc' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Sparkles size={11} />
                  <span>Búsqueda Profunda</span>
                </button>
              </div>

              {/* Input de Búsqueda */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '4px 8px'
              }}>
                <Search size={13} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder={searchMode === 'fulltext' ? 'Buscar en contenido (Rust)...' : 'Buscar nota por título...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-high)',
                    fontSize: '0.75rem',
                    width: '100%'
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Selector de Hub */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Filter size={11} color="var(--text-muted)" />
                <select
                  value={selectedHub}
                  onChange={(e) => setSelectedHub(e.target.value)}
                  style={{ fontSize: '0.68rem', padding: '3px 20px 3px 6px', width: '100%' }}
                >
                  <option value="Todos">Todos los Hubs</option>
                  {VAULT_HUBS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Acciones Rápidas (+ Nota, + Carpeta, Expandir/Colapsar) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => setShowNewNoteModal(true)}
                    title="Crear nueva nota con plantilla"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      color: '#34d399',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.64rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <FilePlus size={11} />
                    <span>Nota</span>
                  </button>

                  <button
                    onClick={() => setShowNewFolderModal(true)}
                    title="Crear nueva carpeta"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-muted)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.64rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <FolderPlus size={11} />
                    <span>Carpeta</span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <button
                    onClick={expandAll}
                    title="Expandir todas las carpetas"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <ChevronsDown size={12} />
                  </button>
                  <button
                    onClick={collapseAll}
                    title="Colapsar todas las carpetas"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <ChevronsUp size={12} />
                  </button>
                  <button
                    onClick={loadVaultData}
                    disabled={refreshing}
                    title="Recargar notas de la Bóveda"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: refreshing ? 'not-allowed' : 'pointer',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
                  </button>
                  <div style={{ width: '1px', height: '10px', background: 'var(--border-color)', margin: '0 2px' }} />
                  <button
                    onClick={() => setShowSidebar(false)}
                    title="Ocultar explorador de carpetas (Ctrl + B)"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <PanelLeftClose size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Vista Central de la Barra Lateral: Árbol o Búsqueda Profunda */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem 0.35rem' }}>
              {searchMode === 'fulltext' ? (
                // Resultados de Búsqueda Profunda (Full-Text Rust)
                <div>
                  <div style={{ padding: '4px 6px', fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>RESULTADOS EN TEXTO</span>
                    {searchingFullText && <RefreshCw size={11} className="animate-spin" color="#c084fc" />}
                    {!searchingFullText && <span>{fullTextResults.length} notas</span>}
                  </div>

                  {searchingFullText && fullTextResults.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      Escaneando Bóveda en Rust...
                    </div>
                  ) : fullTextResults.length === 0 && searchTerm.trim().length >= 2 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      Sin coincidencias para "{searchTerm}"
                    </div>
                  ) : fullTextResults.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      Escribe al menos 2 caracteres para buscar en todo el texto.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {fullTextResults.map((res) => {
                        const noteMatch = notes.find((n) => n.path === res.path);
                        return (
                          <div
                            key={res.path}
                            onClick={() => noteMatch && loadNote(noteMatch)}
                            style={{
                              padding: '6px 8px',
                              borderRadius: 'var(--radius-md)',
                              background: activeNote?.path === res.path ? 'rgba(168, 85, 247, 0.12)' : 'rgba(0, 0, 0, 0.2)',
                              border: activeNote?.path === res.path ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid var(--border-color)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              transition: 'var(--transition)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#e9d5ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {res.title}
                              </span>
                              <span style={{ fontSize: '0.58rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                {res.hub.replace(/^\d+\s*/, '')}
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {res.matches.map((m, mIdx) => (
                                <div key={mIdx} style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'monospace', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <span style={{ color: '#fbbf24', marginRight: '4px' }}>L{m.line_number}:</span>
                                  {highlightMatch(m.line_text, searchTerm)}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                // Vista Estándar en Árbol de Carpetas
                loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto 6px auto' }} />
                    <span>Cargando carpetas...</span>
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    No se encontraron notas
                  </div>
                ) : (
                  renderFolderNode(tree)
                )
              )}
            </div>
          </div>
        )}

        {/* PANEL DERECHO: Visor / Editor de Markdown */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {activeNote ? (
            <>
              {/* Barra de Herramientas de la Nota */}
              <div style={{
                padding: '0.65rem 1.25rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                background: 'rgba(0, 0, 0, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  {!showSidebar && (
                    <button
                      onClick={() => setShowSidebar(true)}
                      title="Mostrar explorador de carpetas (Ctrl + B)"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <PanelLeftOpen size={15} />
                    </button>
                  )}
                  <div>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-high)', margin: 0 }}>
                      {activeNote.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <span>{activeNote.hub}</span>
                      <span>•</span>
                      <code>{activeNote.relative_path}</code>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {saveSuccess && (
                    <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> Guardado
                    </span>
                  )}

                  {/* Copiar enlace Wiki [[Nota]] */}
                  <button
                    onClick={handleCopyWikiLink}
                    title="Copiar enlace [[WikiLink]]"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-color)',
                      color: copiedLink ? '#34d399' : 'var(--text-muted)',
                      fontSize: '0.7rem',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedLink ? <Check size={12} /> : <Link2 size={12} />}
                    <span>{copiedLink ? 'Copiado' : '[[Wiki]]'}</span>
                  </button>

                  {/* Toggle Vista / Edición */}
                  <button
                    onClick={handleToggleEdit}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: isEditing ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: isEditing ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-color)',
                      color: isEditing ? '#34d399' : 'var(--text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer'
                    }}
                  >
                    {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
                    <span>{isEditing ? 'Vista Lectura' : 'Editar'}</span>
                  </button>

                  {/* Botón Guardar */}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'var(--primary)',
                      border: 'none',
                      color: '#0f1211',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-md)',
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Save size={13} />
                    <span>{saving ? 'Guardando...' : 'Guardar'}</span>
                  </button>

                  {/* Botón Eliminar Nota */}
                  <button
                    onClick={handleDeleteActiveNote}
                    title="Eliminar nota"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      opacity: 0.6
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Área de Visualización / Edición de Contenido */}
              <div
                ref={viewerContainerRef}
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: isEditing ? 'hidden' : 'auto',
                  padding: isEditing ? '0.75rem' : '1.25rem'
                }}
              >
                {loadingNote ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '8px' }}>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Leyendo nota...</span>
                  </div>
                ) : isEditing ? (
                  <textarea
                    ref={textareaRef}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      color: 'var(--text-high)',
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                      lineHeight: '1.5',
                      resize: 'none',
                      outline: 'none',
                      overflowY: 'auto'
                    }}
                  />
                ) : (
                  <MarkdownViewer
                    content={noteContent}
                    onToggleTask={handleToggleTaskInNote}
                    onNavigateNote={handleNavigateNote}
                    onTagClick={handleTagClick}
                  />
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '10px' }}>
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 600
                  }}
                >
                  <PanelLeftOpen size={14} />
                  <span>Abrir Explorador de Bóveda</span>
                </button>
              )}
              <BookOpen size={36} color="var(--border-color)" />
              <span style={{ fontSize: '0.82rem' }}>Selecciona una nota para comenzar</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Crear Nueva Nota */}
      {showNewNoteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            width: '90%',
            maxWidth: '440px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FilePlus size={16} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Nueva Nota en Bóveda</h3>
              </div>
              <button
                onClick={() => setShowNewNoteModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateNoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Título de la Nota
                </label>
                <input
                  type="text"
                  placeholder="Ej. Arquitectura del Motor SAM"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Hub Destino
                </label>
                <select
                  value={newNoteHub}
                  onChange={(e) => setNewNoteHub(e.target.value)}
                >
                  {VAULT_HUBS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Plantilla Modular
                </label>
                <select
                  value={newNoteTemplate}
                  onChange={(e) => setNewNoteTemplate(e.target.value)}
                >
                  {Object.entries(NOTE_TEMPLATES).map(([key, t]) => (
                    <option key={key} value={key}>{t.label} — {t.desc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Subcarpeta (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej. Cerebro IA o Apps"
                  value={newNoteSubfolder}
                  onChange={(e) => setNewNoteSubfolder(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowNewNoteModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                >
                  Crear Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Nueva Carpeta */}
      {showNewFolderModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            width: '90%',
            maxWidth: '400px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderPlus size={16} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Nueva Carpeta en Bóveda</h3>
              </div>
              <button
                onClick={() => setShowNewFolderModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateFolderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Nombre de Carpeta
                </label>
                <input
                  type="text"
                  placeholder="Ej. Documentación API"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Hub Contenedor
                </label>
                <select
                  value={newFolderHub}
                  onChange={(e) => setNewFolderHub(e.target.value)}
                >
                  {VAULT_HUBS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                >
                  Crear Carpeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
