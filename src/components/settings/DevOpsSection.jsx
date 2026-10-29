import { Trash2, Plus } from 'lucide-react';
import { TacticalButton } from '../ui';

export default function DevOpsSection({
  config,
  newRepoName,
  setNewRepoName,
  newRepoPath,
  setNewRepoPath,
  newRepoRole,
  setNewRepoRole,
  newRepoWarning,
  setNewRepoWarning,
  onAddRepo,
  onRemoveRepo
}) {
  if (!config) return null;
  const repos = config.gitRepos || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '780px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>
            Flota de Repositorios Vigilados ({repos.length})
          </h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
            Controla los repositorios monitoreados en el radar DevOps y sus políticas de commit.
          </p>
        </div>
      </div>

      {/* Lista de Repositorios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {repos.map(repo => (
          <div
            key={repo.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{repo.name}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>({repo.role})</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {repo.path}
              </span>
              {repo.warning && (
                <span style={{ display: 'block', fontSize: '0.64rem', color: '#ef4444', fontWeight: 600, marginTop: '2px' }}>
                  ⚠️ {repo.warning}
                </span>
              )}
            </div>

            <button
              onClick={() => onRemoveRepo(repo.id)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              title="Eliminar de la vigilancia"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Añadir Nuevo Repositorio */}
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '8px' }}>
          + Añadir Repositorio a la Flota
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={newRepoName}
            onChange={(e) => setNewRepoName(e.target.value)}
            placeholder="Nombre del Repo (ej. Mi App)"
            style={{ fontSize: '0.75rem' }}
          />
          <input
            type="text"
            value={newRepoRole}
            onChange={(e) => setNewRepoRole(e.target.value)}
            placeholder="Rol (ej. Backend / Móvil)"
            style={{ fontSize: '0.75rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={newRepoPath}
            onChange={(e) => setNewRepoPath(e.target.value)}
            placeholder="Ruta local absoluta (ej. /home/usuario/proyectos/app)"
            style={{ flex: 1, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={newRepoWarning}
            onChange={(e) => setNewRepoWarning(e.target.value)}
            placeholder="Advertencia preventiva opcional (ej. Nunca usar git add -A)"
            style={{ flex: 1, fontSize: '0.72rem' }}
          />
          <TacticalButton
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={onAddRepo}
            style={{ whiteSpace: 'nowrap' }}
          >
            Añadir
          </TacticalButton>
        </div>
      </div>
    </div>
  );
}
