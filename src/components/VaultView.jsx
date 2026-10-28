import { useState, useEffect, useMemo, useCallback } from 'react';
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
  ChevronsUp
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import MarkdownViewer from './MarkdownViewer';

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

  const [searchTerm, setSearchTerm] = useState('');
  const [activeNote, setActiveNote] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [loadingNote, setLoadingNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Set de carpetas desplegadas (estilo Obsidian)
  const [expandedFolders, setExpandedFolders] = useState(() => new Set([
    '00 Sistema',
    '01 Operaciones MELI',
    '02 Proyectos de Software',
    '03 Personal y Ocio',
    '04 Estudios y Certificaciones',
    '04 Estudios y Certs'
  ]));

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
  }, [activeNote]);

  useEffect(() => {
    loadVaultData();
  }, [loadVaultData]);

  const loadNote = async (note) => {
    setActiveNote(note);
    setLoadingNote(true);
    setSaveSuccess(false);
    try {
      const content = await invoke('read_vault_note', { path: note.path });
      setNoteContent(content);
    } catch (err) {
      console.error('Error leyendo nota:', err);
      setNoteContent(`Error al leer archivo: ${err}`);
    } finally {
      setLoadingNote(false);
    }
  };

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

  // Notas filtradas por término de búsqueda
  const filteredNotes = useMemo(() => {
    if (!searchTerm.trim()) return notes;
    const q = searchTerm.toLowerCase();
    return notes.filter((n) =>
      n.title.toLowerCase().includes(q) || n.relative_path.toLowerCase().includes(q)
    );
  }, [notes, searchTerm]);

  // Si hay búsqueda activa, expandir automáticamente carpetas con coincidencias
  useEffect(() => {
    if (searchTerm.trim()) {
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
  }, [searchTerm, filteredNotes]);

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', overflow: 'hidden' }}>
      {/* 📡 Barra Superior de Control */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1.25rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BookOpen color="#10b981" size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-high)', margin: 0 }}>
              Bóveda Obsidian (BrainIA)
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Árbol de carpetas y Hubs de Obsidian
            </p>
          </div>
        </div>

        {/* Telemetría y Acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {stats && (
            <div style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              gap: '8px'
            }}>
              <span><strong>{stats.total_notes}</strong> notas</span>
              <span>•</span>
              <span><strong>{stats.pending_tasks}</strong> tareas</span>
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '5px 10px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.7rem',
            color: '#34d399',
            fontWeight: 600
          }}>
            <CheckCircle2 size={13} />
            <span>Sincronizada</span>
          </div>

          <button
            onClick={loadVaultData}
            disabled={refreshing}
            title="Recargar árbol de notas"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'var(--transition)'
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 🧭 Lienzo Dividido: Explorador de Carpetas Desplegable (Izquierda) + Editor (Derecha) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: '1rem',
        flex: 1,
        minHeight: 0
      }}>
        {/* PANEL IZQUIERDO: Árbol de Carpetas Desplegables */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Barra de Búsqueda y Controles de Plegado */}
          <div style={{
            padding: '0.65rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '5px 9px'
            }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Buscar nota en la Bóveda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-high)',
                  fontSize: '0.78rem',
                  width: '100%'
                }}
              />
            </div>

            {/* Controles de Colapsar / Expandir Todo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                EXPLORADOR DE ARCHIVOS
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
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
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '0.62rem'
                  }}
                >
                  <ChevronsDown size={12} />
                  <span>Expandir</span>
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
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '0.62rem'
                  }}
                >
                  <ChevronsUp size={12} />
                  <span>Colapsar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Vista en Árbol de Carpetas */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.35rem' }}>
            {loading ? (
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
            )}
          </div>
        </div>

        {/* PANEL DERECHO: Visor y Editor de la Nota Activa */}
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
              {/* Cabecera de la Nota */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1.25rem',
                borderBottom: '1px solid var(--border-color)',
                background: 'rgba(0, 0, 0, 0.15)',
                flexShrink: 0
              }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-high)', margin: 0 }}>
                    {activeNote.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    <span>{activeNote.hub}</span>
                    <span>•</span>
                    <code>{activeNote.relative_path}</code>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {saveSuccess && (
                    <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> Guardado
                    </span>
                  )}

                  {/* Toggle Vista / Edición */}
                  <button
                    onClick={() => setIsEditing(!isEditing)}
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
                      background: 'var(--accent-primary)',
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
                </div>
              </div>

              {/* Área de Visualización / Edición de Contenido */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.25rem' }}>
                {loadingNote ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '8px' }}>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Leyendo nota...</span>
                  </div>
                ) : isEditing ? (
                  <textarea
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
                      outline: 'none'
                    }}
                  />
                ) : (
                  <MarkdownViewer
                    content={noteContent}
                    onNavigateNote={(targetName) => {
                      const clean = targetName.trim().replace(/\.md$/, '').toLowerCase();
                      const found = notes.find((n) => n.title.toLowerCase() === clean);
                      if (found) {
                        loadNote(found);
                      }
                    }}
                  />
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              Selecciona una nota para leer o editar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
