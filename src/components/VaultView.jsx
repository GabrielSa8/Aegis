import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BookOpen, 
  Folder, 
  GitBranch, 
  Shield, 
  Search, 
  FileText, 
  CheckCircle2, 
  RefreshCw, 
  Save, 
  ExternalLink,
  Edit3,
  Eye,
  Calendar,
  HardDrive
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export default function VaultView() {
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [selectedHub, setSelectedHub] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeNote, setActiveNote] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [loadingNote, setLoadingNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const hubsConfig = [
    { id: '00', code: '00 Sistema', title: 'Sistema y Cerebro IA', icon: Shield, color: '#10b981' },
    { id: '01', code: '01 Operaciones MELI', title: 'Operaciones Mercado Libre', icon: Folder, color: '#d97706' },
    { id: '02', code: '02 Proyectos de Software', title: 'Proyectos de Software', icon: GitBranch, color: '#10b981' },
    { id: '03', code: '03 Personal y Ocio', title: 'Personal y Ocio', icon: Folder, color: '#8b5cf6' },
    { id: '04', code: '04 Estudios y Certs', title: 'Estudios y Certificaciones', icon: BookOpen, color: '#06b6d4' }
  ];

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

      // Si no hay nota activa, seleccionar INICIO.md o la primera
      if (!activeNote && notesRes && notesRes.length > 0) {
        const inicio = notesRes.find(n => n.title.toLowerCase() === 'inicio') || notesRes[0];
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

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (selectedHub !== 'Todos' && n.hub !== selectedHub) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.relative_path.toLowerCase().includes(q);
      }
      return true;
    });
  }, [notes, selectedHub, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', overflow: 'hidden' }}>
      {/* 📡 Barra Superior de Control de la Bóveda */}
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
              Memoria central: <code>/home/zabrielsa/Documentos/Obsidian Vault/</code>
            </p>
          </div>
        </div>

        {/* Telemetría de la Bóveda */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {stats && (
            <>
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
            </>
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
            <span>Sincronizada con disco</span>
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

      {/* 🧭 Lienzo Dividido: Explorador (Izquierda) + Lector / Editor (Derecha) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: '1rem',
        flex: 1,
        minHeight: 0
      }}>
        {/* PANEL IZQUIERDO: Hubs y Archivos */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Buscador */}
          <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 10px'
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

            {/* Filtros de Hub en píldoras */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', marginTop: '8px' }}>
              {['Todos', ...hubsConfig.map(h => h.code)].map((hub) => (
                <button
                  key={hub}
                  onClick={() => setSelectedHub(hub)}
                  style={{
                    background: selectedHub === hub ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    border: selectedHub === hub ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                    color: selectedHub === hub ? '#34d399' : 'var(--text-muted)',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    padding: '3px 7px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {hub === 'Todos' ? 'Todos' : hub.replace(/^\d+\s*/, '')}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Notas */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto 6px auto' }} />
                <span>Cargando notas...</span>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                No se encontraron notas
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = activeNote?.path === note.path;
                return (
                  <div
                    key={note.path}
                    onClick={() => loadNote(note)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                      border: isSelected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      marginBottom: '3px',
                      transition: 'var(--transition)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={13} color={isSelected ? '#34d399' : 'var(--text-muted)'} />
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--text-high)' : 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {note.title}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', paddingLeft: '19px' }}>
                      {note.hub}
                    </span>
                  </div>
                );
              })
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
                  <pre style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: 'var(--text-high)',
                    fontSize: '0.82rem',
                    lineHeight: '1.6',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    margin: 0
                  }}>
                    {noteContent}
                  </pre>
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
