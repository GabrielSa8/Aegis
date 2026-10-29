import React from 'react';
import { FolderPlus } from 'lucide-react';
import { ModalWrapper } from '../ui/ModalWrapper';
import { TacticalButton } from '../ui/TacticalButton';

/**
 * NewFolderModal — Diálogo de creación de carpetas y jerarquías en Bóveda.
 */
export function NewFolderModal({
  isOpen,
  onClose,
  onSubmit,
  newFolderHub,
  setNewFolderHub,
  vaultHubs,
  newFolderParent,
  setNewFolderParent,
  availableSubfolders,
  newFolderName,
  setNewFolderName
}) {
  const footerContent = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
      <TacticalButton variant="ghost" size="sm" onClick={onClose}>
        Cancelar
      </TacticalButton>
      <TacticalButton
        variant="primary"
        size="sm"
        icon={FolderPlus}
        onClick={onSubmit}
        disabled={!newFolderName.trim()}
      >
        Crear Carpeta
      </TacticalButton>
    </div>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Carpeta en Bóveda"
      icon={<FolderPlus size={16} color="#10b981" />}
      maxWidth="420px"
      footer={footerContent}
    >
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <label
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              display: 'block',
              marginBottom: '4px'
            }}
          >
            Hub Contenedor (Principal)
          </label>
          <select
            value={newFolderHub}
            onChange={(e) => {
              setNewFolderHub(e.target.value);
              setNewFolderParent('');
            }}
            style={{ width: '100%' }}
          >
            {vaultHubs.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              display: 'block',
              marginBottom: '4px'
            }}
          >
            Carpeta Padre (Opcional)
          </label>
          <select
            value={newFolderParent}
            onChange={(e) => setNewFolderParent(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="">📁 Raíz del Hub</option>
            {availableSubfolders.map((sub) => (
              <option key={sub} value={sub}>
                📂 {sub}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              display: 'block',
              marginBottom: '4px'
            }}
          >
            Nombre de la Nueva Carpeta
          </label>
          <input
            type="text"
            placeholder="Ej. Documentación API"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            autoFocus
            required
            style={{ width: '100%' }}
          />
        </div>
      </form>
    </ModalWrapper>
  );
}

export default NewFolderModal;
