import React, { useState } from 'react';
import { FolderGit2 } from 'lucide-react';
import { TacticalButton } from '../ui';

/**
 * AddRepoExistingTab — Formulario para vincular un repositorio Git local ya existente.
 */
export function AddRepoExistingTab({ onAddExisting, onClose, isLoading, setFormError }) {
  const [existingPath, setExistingPath] = useState('');
  const [existingName, setExistingName] = useState('');
  const [existingRole, setExistingRole] = useState('');
  const [existingWarning, setExistingWarning] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!existingPath.trim()) {
      setFormError('La ruta en disco es obligatoria');
      return;
    }
    try {
      await onAddExisting({
        name: existingName.trim(),
        path: existingPath.trim(),
        role: existingRole.trim() || 'Proyecto Local',
        warning: existingWarning.trim() || null
      });
      onClose();
      setExistingPath('');
      setExistingName('');
      setExistingRole('');
      setExistingWarning('');
    } catch (err) {
      setFormError(String(err));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
          Ruta Absoluta en Disco (.git requerido) *
        </label>
        <input
          type="text"
          value={existingPath}
          onChange={(e) => setExistingPath(e.target.value)}
          placeholder="/home/usuario/proyectos/mi-proyecto o ~/proyectos/..."
          style={{ width: '100%', boxSizing: 'border-box', padding: '6px 9px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-high)', fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
            Nombre Visible (Opcional)
          </label>
          <input
            type="text"
            value={existingName}
            onChange={(e) => setExistingName(e.target.value)}
            placeholder="Se extrae de la carpeta si está vacío"
            style={{ width: '100%', boxSizing: 'border-box', padding: '6px 9px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-high)', fontSize: '0.76rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
            Rol / Etiqueta Descriptiva
          </label>
          <input
            type="text"
            value={existingRole}
            onChange={(e) => setExistingRole(e.target.value)}
            placeholder="ej. App Android / Backend API"
            style={{ width: '100%', boxSizing: 'border-box', padding: '6px 9px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-high)', fontSize: '0.76rem' }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
          Advertencia de Seguridad / Directriz (Opcional)
        </label>
        <input
          type="text"
          value={existingWarning}
          onChange={(e) => setExistingWarning(e.target.value)}
          placeholder="ej. Prohibido git add -A / Cuidado con rama production"
          style={{ width: '100%', boxSizing: 'border-box', padding: '6px 9px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-high)', fontSize: '0.76rem' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.4rem' }}>
        <TacticalButton variant="ghost" size="sm" type="button" onClick={onClose} disabled={isLoading}>
          Cancelar
        </TacticalButton>
        <TacticalButton variant="primary" size="sm" type="submit" disabled={isLoading} icon={<FolderGit2 size={13} />}>
          {isLoading ? 'Vinculando...' : 'Vincular a la Flota'}
        </TacticalButton>
      </div>
    </form>
  );
}
