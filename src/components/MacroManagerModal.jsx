import { useState, useEffect } from 'react';
import { Plus, RotateCcw, Sliders } from 'lucide-react';
import { ModalWrapper, TacticalButton } from './ui';
import MacroEditorForm from './agent/MacroEditorForm';
import MacroItemCard from './agent/MacroItemCard';

export const DEFAULT_MACROS = [
  { id: 'm1', label: 'Auditar Git', text: 'Revisa status de git y ramas locales de los repositorios vigilados.' },
  { id: 'm2', label: 'Analizar Diff', text: 'Analiza los siguientes cambios del repositorio y resume el impacto:\n{{diff}}' },
  { id: 'm3', label: 'Pegar Clip', text: 'Revisa, corrige o comenta el código pegado desde el portapapeles:\n{{clip}}' },
  { id: 'm4', label: 'Resumen Bitácora', text: 'Lee la bitácora de proyectos en Obsidian y resume el estado del hito actual.' }
];

export default function MacroManagerModal({ isOpen, onClose, macros = [], onSaveMacros }) {
  const [editingId, setEditingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Sincronización de estado interno al cerrar
  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setIsCreating(false);
    }
  }, [isOpen]);

  const handleStartEdit = (macro) => {
    setEditingId(macro.id);
    setIsCreating(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = (id, label, text) => {
    const updated = macros.map((m) =>
      m.id === id ? { ...m, label, text } : m
    );
    onSaveMacros(updated);
    handleCancelEdit();
  };

  const handleDelete = (id) => {
    const updated = macros.filter((m) => m.id !== id);
    onSaveMacros(updated);
  };

  const handleCreate = (label, text) => {
    const newMacro = {
      id: `m_${Date.now()}`,
      label,
      text
    };
    onSaveMacros([...macros, newMacro]);
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
        Restaurar predeterminados
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
      title="Administrador de macros"
      icon={<Sliders size={16} />}
      maxWidth="580px"
      footer={footer}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: 0, flex: 1, minWidth: '220px' }}>
            Atajos e inserción de variables (<code style={{ color: 'var(--primary)', fontSize: '0.70rem' }}>&#123;&#123;clip&#125;&#125;</code>, <code style={{ color: 'var(--primary)', fontSize: '0.70rem' }}>&#123;&#123;diff&#125;&#125;</code>, <code style={{ color: 'var(--primary)', fontSize: '0.70rem' }}>&#123;&#123;nota&#125;&#125;</code>, <code style={{ color: 'var(--primary)', fontSize: '0.70rem' }}>&#123;&#123;cwd&#125;&#125;</code>).
          </p>

          {!isCreating && (
            <TacticalButton
              variant="terminal"
              size="xs"
              icon={<Plus size={12} />}
              onClick={() => {
                setEditingId(null);
                setIsCreating(true);
              }}
            >
              Nueva macro
            </TacticalButton>
          )}
        </div>

        {/* Formulario de creación activa */}
        {isCreating && (
          <MacroEditorForm
            isCreating={true}
            onSave={handleCreate}
            onCancel={() => setIsCreating(false)}
          />
        )}

        {/* Lista de macros */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '48vh', overflowY: 'auto' }}>
          {macros.map((macro, idx) => {
            if (editingId === macro.id) {
              return (
                <MacroEditorForm
                  key={macro.id}
                  initialLabel={macro.label}
                  initialText={macro.text}
                  onSave={(label, text) => handleSaveEdit(macro.id, label, text)}
                  onCancel={handleCancelEdit}
                />
              );
            }

            return (
              <MacroItemCard
                key={macro.id}
                macro={macro}
                idx={idx}
                onEdit={handleStartEdit}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      </div>
    </ModalWrapper>
  );
}
