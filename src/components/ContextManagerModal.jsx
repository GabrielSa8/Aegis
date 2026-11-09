import React from 'react';
import { Folder, Check } from 'lucide-react';
import { ModalWrapper, TacticalButton } from './ui';
import {
  AVAILABLE_SKILLS,
  DEFAULT_CONTEXTS,
  useContextManager,
  ContextListSidebar,
  ContextEditorPane
} from './agent/context';

export { AVAILABLE_SKILLS, DEFAULT_CONTEXTS };

export default function ContextManagerModal({
  isOpen,
  onClose,
  contexts,
  onSaveContexts,
  currentContextId,
  onSelectContext
}) {
  const {
    editingList,
    selectedId,
    setSelectedId,
    activeCtx,
    errorMsg,
    handleUpdateActive,
    handleToggleSkill,
    handleAddNew,
    handleDelete,
    handleSaveAll
  } = useContextManager({
    contexts,
    currentContextId,
    onSaveContexts,
    onSelectContext,
    onClose,
    isOpen
  });

  if (!isOpen) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Administrador de Contextos del Agente"
      icon={Folder}
      maxWidth="820px"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          <TacticalButton variant="secondary" onClick={onClose}>
            Cancelar
          </TacticalButton>
          <TacticalButton variant="primary" icon={Check} onClick={handleSaveAll}>
            Guardar Configuración
          </TacticalButton>
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', flex: 1, minHeight: 0, maxHeight: '70vh', overflow: 'hidden' }}>
        <ContextListSidebar
          editingList={editingList}
          selectedId={selectedId}
          onSelectId={setSelectedId}
          onAddNew={handleAddNew}
          onDelete={handleDelete}
        />
        <ContextEditorPane
          activeCtx={activeCtx}
          onUpdateActive={handleUpdateActive}
          onToggleSkill={handleToggleSkill}
          errorMsg={errorMsg}
        />
      </div>
    </ModalWrapper>
  );
}
