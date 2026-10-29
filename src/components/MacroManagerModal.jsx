import { useState } from 'react';
import { Plus, Trash2, Edit3, Save, RotateCcw, Sparkles } from 'lucide-react';
import { ModalWrapper, TacticalButton } from './ui';

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
      id: `m_${Date.now()}`,
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

  const footer = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <TacticalButton
        variant="ghost"
        size="xs"
        icon={<RotateCcw size={12} />}
        onClick={handleResetDefaults}
      >
        Restaurar Predeterminados
      </TacticalButton>
      <TacticalButton
        variant="primary"
        size="sm"
        onClick={onClose}
      >
        Listo
      </TacticalButton>
    </div>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Administrador de Macros Tácticos"
      icon={<Sparkles size={16} />}
      maxWidth="560px"
      footer={footer}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
              + Nuevo Macro Táctico
            </span>
            <input
              type="text"
              placeholder="Etiqueta corta (ej. Auditar Git)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              style={{
                fontSize: '0.75rem',
                padding: '6px 10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
            <textarea
              placeholder="Instrucción detallada para el agente..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              rows={3}
              style={{
                fontSize: '0.75rem',
                padding: '6px 10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                outline: 'none',
                resize: 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <TacticalButton
                variant="ghost"
                size="xs"
                onClick={() => setIsCreating(false)}
              >
                Cancelar
              </TacticalButton>
              <TacticalButton
                variant="primary"
                size="xs"
                icon={<Save size={12} />}
                onClick={handleCreate}
              >
                Guardar
              </TacticalButton>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <TacticalButton
              variant="terminal"
              size="xs"
              icon={<Plus size={12} />}
              onClick={() => setIsCreating(true)}
            >
              Nuevo Macro
            </TacticalButton>
          </div>
        )}

        {/* Lista de macros */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '45vh', overflowY: 'auto' }}>
          {macros.map((macro, idx) => {
            const isEditingThis = editingId === macro.id;

            if (isEditingThis) {
              return (
                <div
                  key={macro.id}
                  style={{
                    padding: '10px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-color)',
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
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)',
                      outline: 'none'
                    }}
                  />
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <TacticalButton
                      variant="ghost"
                      size="xs"
                      onClick={handleCancelEdit}
                    >
                      Cancelar
                    </TacticalButton>
                    <TacticalButton
                      variant="primary"
                      size="xs"
                      icon={<Save size={12} />}
                      onClick={() => handleSaveEdit(macro.id)}
                    >
                      Guardar
                    </TacticalButton>
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
                  <TacticalButton
                    variant="ghost"
                    size="xs"
                    icon={<Edit3 size={12} />}
                    onClick={() => handleStartEdit(macro)}
                    title="Editar macro"
                  />
                  <TacticalButton
                    variant="danger"
                    size="xs"
                    icon={<Trash2 size={12} />}
                    onClick={() => handleDelete(macro.id)}
                    title="Eliminar macro"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ModalWrapper>
  );
}
