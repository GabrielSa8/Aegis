import React from 'react';
import { FilePlus } from 'lucide-react';
import { ModalWrapper } from '../ui/ModalWrapper';
import { TacticalButton } from '../ui/TacticalButton';
import { NOTE_TEMPLATES } from './vaultHelpers';

/**
 * NewNoteModal — Diálogo de creación guiada de notas con plantillas y selector dinámico de Hubs.
 */
export function NewNoteModal({
  isOpen,
  onClose,
  onSubmit,
  newNoteTitle,
  setNewNoteTitle,
  vaultHubs,
  newNoteHub,
  setNewNoteHub,
  newNoteSubfolderChoice,
  setNewNoteSubfolderChoice,
  customSubfolder,
  setCustomSubfolder,
  availableSubfolders,
  newNoteTemplate,
  setNewNoteTemplate
}) {
  const footerContent = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
      <TacticalButton variant="ghost" size="sm" onClick={onClose}>
        Cancelar
      </TacticalButton>
      <TacticalButton
        variant="primary"
        size="sm"
        icon={FilePlus}
        onClick={onSubmit}
        disabled={!newNoteTitle.trim()}
      >
        Crear Nota
      </TacticalButton>
    </div>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Nota en Bóveda"
      icon={<FilePlus size={16} color="#10b981" />}
      maxWidth="460px"
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
            Título de la Nota
          </label>
          <input
            type="text"
            placeholder="Ej. Arquitectura del Motor SAM"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            autoFocus
            required
            style={{ width: '100%' }}
          />
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
            Hub Destino (Carpeta Principal)
          </label>
          <select
            value={newNoteHub}
            onChange={(e) => {
              setNewNoteHub(e.target.value);
              setNewNoteSubfolderChoice('');
              setCustomSubfolder('');
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
            Ubicación / Subcarpeta
          </label>
          <select
            value={newNoteSubfolderChoice}
            onChange={(e) => setNewNoteSubfolderChoice(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="">📁 Raíz del Hub (sin subcarpeta)</option>
            {availableSubfolders.map((sub) => (
              <option key={sub} value={sub}>
                📂 {sub}
              </option>
            ))}
            <option value="__custom__">✨ + Crear nueva subcarpeta para esta nota...</option>
          </select>
        </div>

        {newNoteSubfolderChoice === '__custom__' && (
          <div>
            <label
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#10b981',
                display: 'block',
                marginBottom: '4px'
              }}
            >
              Nombre de la Nueva Subcarpeta
            </label>
            <input
              type="text"
              placeholder="ej. Arquitectura o Soporte"
              value={customSubfolder}
              onChange={(e) => setCustomSubfolder(e.target.value)}
              autoFocus
              required
              style={{ width: '100%' }}
            />
          </div>
        )}

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
            Plantilla Modular
          </label>
          <select
            value={newNoteTemplate}
            onChange={(e) => setNewNoteTemplate(e.target.value)}
            style={{ width: '100%' }}
          >
            {Object.entries(NOTE_TEMPLATES).map(([key, t]) => (
              <option key={key} value={key}>
                {t.label} — {t.desc}
              </option>
            ))}
          </select>
        </div>
      </form>
    </ModalWrapper>
  );
}

export default NewNoteModal;
