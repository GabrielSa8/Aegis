import React, { useState } from 'react';
import { Sparkles, Globe, Lock } from 'lucide-react';
import { TacticalButton } from '../ui';

/**
 * AddRepoCreateTab — Formulario para crear e inicializar un nuevo repositorio Git local/remoto.
 */
export function AddRepoCreateTab({ onCreateNew, onClose, isLoading, setFormError }) {
  const [newParentDir, setNewParentDir] = useState('~/Proyects/projects');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newWarning, setNewWarning] = useState('');
  const [initCommit, setInitCommit] = useState(true);
  const [createGithub, setCreateGithub] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!newName.trim()) {
      setFormError('El nombre del repositorio es obligatorio');
      return;
    }
    if (!newParentDir.trim()) {
      setFormError('El directorio padre es obligatorio');
      return;
    }
    try {
      await onCreateNew({
        parentDir: newParentDir.trim(),
        name: newName.trim(),
        role: newRole.trim() || 'Proyecto Local',
        warning: newWarning.trim() || null,
        initCommit,
        createGithub,
        isPrivate
      });
      onClose();
      setNewName('');
      setNewRole('');
      setNewWarning('');
    } catch (err) {
      setFormError(String(err));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
            Nombre del Repositorio *
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="mi-nuevo-microservicio"
            style={{ width: '100%', boxSizing: 'border-box', padding: '6px 9px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-high)', fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
            Directorio Padre *
          </label>
          <input
            type="text"
            value={newParentDir}
            onChange={(e) => setNewParentDir(e.target.value)}
            placeholder="~/Proyects/projects"
            style={{ width: '100%', boxSizing: 'border-box', padding: '6px 9px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-high)', fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}
            required
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
            Rol / Propósito
          </label>
          <input
            type="text"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            placeholder="ej. Microservicio Rust / Script Automator"
            style={{ width: '100%', boxSizing: 'border-box', padding: '6px 9px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-high)', fontSize: '0.76rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
            Advertencia de Flota (Opcional)
          </label>
          <input
            type="text"
            value={newWarning}
            onChange={(e) => setNewWarning(e.target.value)}
            placeholder="Directriz especial"
            style={{ width: '100%', boxSizing: 'border-box', padding: '6px 9px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-high)', fontSize: '0.76rem' }}
          />
        </div>
      </div>

      {/* Opciones Avanzadas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-card)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: 'var(--text-high)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={initCommit}
            onChange={(e) => setInitCommit(e.target.checked)}
          />
          <span>Crear <code>README.md</code> y commit inicial (<code>feat: initial commit</code>)</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: 'var(--text-high)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={createGithub}
            onChange={(e) => setCreateGithub(e.target.checked)}
          />
          <span>Publicar repo remoto en GitHub vía <code>gh repo create</code></span>
        </label>

        {createGithub && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '22px', marginTop: '2px', fontSize: '0.7rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: isPrivate ? 'var(--primary)' : 'var(--text-muted)' }}>
              <input
                type="radio"
                name="repoVisibility"
                checked={isPrivate}
                onChange={() => setIsPrivate(true)}
              />
              <Lock size={11} /> Privado
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: !isPrivate ? 'var(--primary)' : 'var(--text-muted)' }}>
              <input
                type="radio"
                name="repoVisibility"
                checked={!isPrivate}
                onChange={() => setIsPrivate(false)}
              />
              <Globe size={11} /> Público
            </label>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.4rem' }}>
        <TacticalButton variant="ghost" size="sm" type="button" onClick={onClose} disabled={isLoading}>
          Cancelar
        </TacticalButton>
        <TacticalButton variant="primary" size="sm" type="submit" disabled={isLoading} icon={<Sparkles size={13} />}>
          {isLoading ? 'Creando...' : 'Crear e Inicializar'}
        </TacticalButton>
      </div>
    </form>
  );
}
