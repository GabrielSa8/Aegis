import React from 'react';
import { RefreshCw } from 'lucide-react';
import { RepoCard } from './RepoCard';

/**
 * GitFleetSection — Sección que renderiza la flota de repositorios locales.
 */
export function GitFleetSection({
  repos = [],
  loading = false,
  onInspect,
  onFetch,
  onPull,
  onOpenInEditor,
  actionLoading
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', padding: '0 2px' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Flota de Repositorios Git Locales
        </span>
        <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
          Inspección nativa en tiempo real
        </span>
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
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
