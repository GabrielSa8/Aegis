import React from 'react';
import { RefreshCw, FolderPlus } from 'lucide-react';
import { RepoCard } from './RepoCard';
import { TacticalButton } from '../ui';

/**
 * GitFleetSection — Sección que renderiza la flota de repositorios locales.
 * Permite inspeccionar, sincronizar, abrir y vincular/crear repositorios directamente.
 */
export function GitFleetSection({
  repos = [],
  loading = false,
  onInspect,
  onFetch,
  onPull,
  onOpenInEditor,
  onRequestDelete,
  onOpenAddModal,
  actionLoading
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', padding: '0 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Flota de Repositorios Git Locales ({repos.length})
          </span>
        </div>
        <TacticalButton
          variant="secondary"
          size="xs"
          icon={<FolderPlus size={12} />}
          onClick={onOpenAddModal}
          style={{
            background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
            color: 'var(--primary)',
            fontWeight: 700
          }}
        >
          + Añadir / Crear Repo
        </TacticalButton>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto 6px auto' }} />
          <span>Consultando ramas y estado de Git...</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.65rem' }}>
          {repos.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              onInspect={onInspect}
              onFetch={onFetch}
              onPull={onPull}
              onOpenInEditor={onOpenInEditor}
              onRequestDelete={onRequestDelete}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
