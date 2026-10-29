import { useState } from 'react';
import { X, Plus, Trash2, Edit3, Save, RotateCcw, Sparkles } from 'lucide-react';

export const DEFAULT_MACROS = [
  { id: 'm1', label: 'Auditar Git', text: 'Revisa status de git y ramas locales de los repositorios vigilados.' },
  { id: 'm2', label: 'Resumen Bitácora', text: 'Lee la bitácora de proyectos en Obsidian y resume el estado del hito actual.' },
  { id: 'm3', label: 'Generar Flashcards', text: 'Analiza la última nota de estudio o certificación y genera 3 flashcards atómicas.' },
  { id: 'm4', label: 'Revisar Pendientes', text: 'Inspecciona las tareas pendientes del proyecto activo y prioriza las 3 más críticas.' }
];

export default function MacroManagerModal({ isOpen, onClose, macros, onSaveMacros }) {
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editText, setEditText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newText, setNewText] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = (macro) => {
    setEditingId(macro.id);
    setEditLabel(macro.label);
    setEditText(macro.text);
    setIsCreating(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel('');
    setEditText('');
  };

  const handleSaveEdit = (id) => {
    if (!editLabel.trim() || !editText.trim()) return;
    const updated = macros.map((m) =>
      m.id === id ? { ...m, label: editLabel.trim(), text: editText.trim() } : m
    );
    onSaveMacros(updated);
    handleCancelEdit();
  };

  const handleDelete = (id) => {
    const updated = macros.filter((m) => m.id !== id);
    onSaveMacros(updated);
  };

  const handleCreate = () => {
    if (!newLabel.trim() || !newText.trim()) return;
    const newMacro = {
      id: 'm_' + Date.now(),
      label: newLabel.trim(),
      text: newText.trim()
    };
    onSaveMacros([...macros, newMacro]);
    setNewLabel('');
    setNewText('');
    setIsCreating(false);
  };

  const handleResetDefaults = () => {
    onSaveMacros(DEFAULT_MACROS);
    handleCancelEdit();
    setIsCreating(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content crystal-surface" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '92%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-high)' }}>
              Administrador de Macros Tácticos
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '1rem 1.25rem', maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
            Configura atajos predefinidos para instrucciones recurrentes del agente IA. Se ejecutan con un clic o atajo numérico.
          </p>

          {/* Formulario de creación */}
          {isCreating ? (
            <div style={{
              padding: '10px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--primary)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)' }}>+ Nuevo Macro</span>
              <input
                type="text"
                placeholder="Nombre del botón (ej. Auditar Git)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-high)',
                  fontSize: '0.78rem'
                }}
              />
              <textarea
                placeholder="Instrucción completa que recibirá el agente..."
                rows={3}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-high)',
                  fontSize: '0.78rem',
                  resize: 'none'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                <button onClick={() => setIsCreating(false)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>
                  Cancelar
                </button>
                <button onClick={handleCreate} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Save size={12} />
                  <span>Guardar</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.74rem',
                borderStyle: 'dashed'
              }}
            >
              <Plus size={13} color="var(--primary)" />
              <span>Añadir Nuevo Macro</span>
            </button>
          )}

          {/* Lista de Macros */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {macros.map((macro, idx) => {
              const isEditing = editingId === macro.id;

              if (isEditing) {
                return (
                  <div
                    key={macro.id}
                    style={{
                      padding: '10px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--primary)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-high)',
                        fontSize: '0.78rem'
                      }}
                    />
                    <textarea
                      rows={2}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-high)',
                        fontSize: '0.78rem',
                        resize: 'none'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button onClick={handleCancelEdit} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>
                        Cancelar
                      </button>
                      <button onClick={() => handleSaveEdit(macro.id)} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Save size={12} />
                        <span>Guardar</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={macro.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="tactical-kbd" style={{ fontSize: '0.58rem' }}>{idx + 1}</span>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-high)' }}>
                        {macro.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {macro.text}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={() => handleStartEdit(macro)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      title="Editar macro"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(macro.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                      title="Eliminar macro"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={handleResetDefaults}
            className="btn btn-secondary"
            style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}
          >
            <RotateCcw size={12} />
            <span>Restaurar Predeterminados</span>
          </button>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ fontSize: '0.72rem', padding: '4px 14px' }}
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
