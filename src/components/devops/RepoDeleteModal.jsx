import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, ShieldAlert, Folder, Globe } from 'lucide-react';
import { ModalWrapper, TacticalButton } from '../ui';

/**
 * RepoDeleteModal — Modal táctico de desvinculación y eliminación de repositorios.
 * Soporta desvinculación segura (default) y destrucción avanzada (disco local / GitHub).
 */
export function RepoDeleteModal({
  isOpen,
  onClose,
  repo,
  onConfirmDelete,
  actionLoading
}) {
  const [deleteLocal, setDeleteLocal] = useState(false);
  const [deleteRemote, setDeleteRemote] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Reset al abrir/cambiar repo
  useEffect(() => {
    if (isOpen) {
      setDeleteLocal(false);
      setDeleteRemote(false);
      setConfirmText('');
    }
  }, [isOpen, repo]);

  if (!repo) return null;

  const isDestructive = deleteLocal || deleteRemote;
  const isProtected = repo.path?.toLowerCase().includes('tadu') || repo.warning?.toLowerCase().includes('tadu');
  const isConfirmDisabled = isDestructive && confirmText.trim() !== repo.name;
  const isLoading = actionLoading === `delete-${repo.id}` || actionLoading === `remove-${repo.id}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isConfirmDisabled || isLoading) return;
    onConfirmDelete(repo, { deleteLocal, deleteRemote });
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="500px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: isDestructive ? 'rgba(239, 68, 68, 0.15)' : 'color-mix(in srgb, var(--primary) 15%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDestructive ? '#f87171' : 'var(--primary)'
            }}>
              <Trash2 size={15} />
            </div>
            <div>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-high)', display: 'block' }}>
                {isDestructive ? 'Eliminación Destructiva de Repositorio' : 'Desvincular Repositorio de la Flota'}
              </span>
              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                {repo.name} ({repo.role})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>

        {/* Ruta en disco */}
        <code style={{
          fontSize: '0.66rem',
          color: 'var(--text-dim, var(--text-muted))',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '4px 8px',
          borderRadius: 'var(--radius-xs)',
          fontFamily: 'var(--font-mono)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          border: '1px solid var(--border-color)'
        }}>
          {repo.path}
        </code>

        {/* Protección TADÚ */}
        {isProtected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--warning, #f59e0b)', fontSize: '0.72rem' }}>
            <ShieldAlert size={14} flexShrink={0} />
            <span>Repositorio protegido por directriz del sistema. La destrucción física de archivos está bloqueada.</span>
          </div>
        )}

        {/* Explicación de Desvinculación Normal */}
        {!isDestructive && (
          <div style={{ fontSize: '0.74rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
            Esta acción <strong>desvinculará</strong> el repositorio del panel de Aegis. No se modificará ni eliminará ningún archivo local ni remoto. Podrás volver a vincularlo en cualquier momento.
          </div>
        )}

        {/* Opciones Destructivas Avanzadas */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Opciones Avanzadas de Eliminación
          </span>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.73rem',
            color: isProtected ? 'var(--text-muted)' : 'var(--text-high)',
            cursor: isProtected ? 'not-allowed' : 'pointer',
            opacity: isProtected ? 0.5 : 1
          }}>
            <input
              type="checkbox"
              checked={deleteLocal}
              disabled={isProtected}
              onChange={(e) => setDeleteLocal(e.target.checked)}
            />
            <Folder size={12} color="var(--warning, #f59e0b)" />
            <span>Eliminar carpeta física y archivos en disco local (<code>rm -rf</code>)</span>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.73rem',
            color: 'var(--text-high)',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={deleteRemote}
              onChange={(e) => setDeleteRemote(e.target.checked)}
            />
            <Globe size={12} color="#f87171" />
            <span>Eliminar repositorio remoto en GitHub vía <code>gh repo delete</code></span>
          </label>
        </div>

        {/* Alerta y confirmación por texto si es destructivo */}
        {isDestructive && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fca5a5', fontSize: '0.72rem', fontWeight: 700 }}>
              <AlertTriangle size={14} flexShrink={0} />
              <span>¡Acción Irreversible! Se eliminarán permanentemente los datos seleccionados.</span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.67rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                Escribe <strong>{repo.name}</strong> para desbloquear la eliminación:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={repo.name}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '5px 8px',
                  background: 'var(--bg-main)',
                  border: confirmText === repo.name ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-high)',
                  fontSize: '0.76rem',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.3rem' }}>
          <TacticalButton variant="ghost" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancelar
          </TacticalButton>

          {isDestructive ? (
            <TacticalButton
              variant="danger"
              size="sm"
              type="submit"
              disabled={isConfirmDisabled || isLoading}
              icon={<Trash2 size={13} />}
            >
              {isLoading ? 'Eliminando...' : 'Eliminar Permanentemente'}
            </TacticalButton>
          ) : (
            <TacticalButton
              variant="secondary"
              size="sm"
              type="submit"
              disabled={isLoading}
              icon={<Trash2 size={13} />}
            >
              {isLoading ? 'Desvinculando...' : 'Desvincular de la Flota'}
            </TacticalButton>
          )}
        </div>
      </form>
    </ModalWrapper>
  );
}
