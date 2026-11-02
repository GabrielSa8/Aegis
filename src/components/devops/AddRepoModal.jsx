import React, { useState } from 'react';
import { FolderPlus, FolderGit2, Sparkles, AlertCircle } from 'lucide-react';
import { ModalWrapper } from '../ui';
import { AddRepoExistingTab } from './AddRepoExistingTab';
import { AddRepoCreateTab } from './AddRepoCreateTab';

/**
 * AddRepoModal — Modal orquestador para vincular o crear repositorios en la Flota.
 * Estrictamente modular y alineado a la doctrina anti-monolitos.
 */
export function AddRepoModal({
  isOpen,
  onClose,
  onAddExisting,
  onCreateNew,
  actionLoading
}) {
  const [tab, setTab] = useState('existing'); // 'existing' | 'create'
  const [formError, setFormError] = useState(null);

  const isLoading = actionLoading === 'add-repo' || actionLoading === 'create-repo';

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="560px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderPlus size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-high)' }}>
              Gestor de Repositorios de la Flota
            </span>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>

        {/* Selector de Pestañas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: 'var(--bg-card)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => { setTab('existing'); setFormError(null); }}
            style={{
              padding: '6px 10px',
              fontSize: '0.74rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: tab === 'existing' ? 'var(--primary)' : 'transparent',
              color: tab === 'existing' ? 'var(--bg-main)' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <FolderGit2 size={13} />
            Monitorear Local Existente
          </button>
          <button
            type="button"
            onClick={() => { setTab('create'); setFormError(null); }}
            style={{
              padding: '6px 10px',
              fontSize: '0.74rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: tab === 'create' ? 'var(--primary)' : 'transparent',
              color: tab === 'create' ? 'var(--bg-main)' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={13} />
            Crear Nuevo Repositorio
          </button>
        </div>

        {/* Mensaje de Error */}
        {formError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: '0.72rem' }}>
            <AlertCircle size={14} flexShrink={0} />
            <span>{formError}</span>
          </div>
        )}

        {/* Renderizado de Pestaña Activa */}
        {tab === 'existing' ? (
          <AddRepoExistingTab
            onAddExisting={onAddExisting}
            onClose={onClose}
            isLoading={isLoading}
            setFormError={setFormError}
          />
        ) : (
          <AddRepoCreateTab
            onCreateNew={onCreateNew}
            onClose={onClose}
            isLoading={isLoading}
            setFormError={setFormError}
          />
        )}
      </div>
    </ModalWrapper>
  );
}
