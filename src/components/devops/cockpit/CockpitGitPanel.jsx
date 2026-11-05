import React from 'react';
import { FolderGit2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { TacticalButton } from '../../ui';

/**
 * CockpitGitPanel — Panel compacto de la flota Git para el Cockpit DevOps.
 */
export function CockpitGitPanel({
  repos = [],
  onNavigateTab,
  onInspectRepo,
  onFetchRepo,
  onPullRepo,
  actionLoading
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      overflow: 'hidden'
    }}>
      {/* Cabecera del Panel */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6rem 0.85rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'color-mix(in srgb, var(--border-color) 10%, transparent)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FolderGit2 size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-high)' }}>
            Flota Git ({repos.length})
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('fleet')}
          className="cockpit-view-all-btn"
        >
          <span>Ver todos</span>
          <ArrowRight size={11} />
        </button>
      </div>

      {/* Lista de Repos con Scroll Interno */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {repos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            No hay repositorios vinculados
          </div>
        ) : (
          repos.map((repo) => {
            const isFetching = actionLoading === `fetch-${repo.id}`;
            const isPulling = actionLoading === `pull-${repo.id}`;

            return (
              <div
                key={repo.id}
                style={{
                  background: 'color-mix(in srgb, var(--border-color) 8%, transparent)',
                  border: repo.warning ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.55rem 0.65rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-high)' }}>{repo.name}</span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>• {repo.branch}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {repo.is_clean ? (
                      <span style={{ color: 'var(--primary)', fontSize: '0.62rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <CheckCircle2 size={10} /> Limpio
                      </span>
                    ) : (
                      <span style={{ color: 'var(--warning)', fontSize: '0.62rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <AlertCircle size={10} /> {repo.changed_files_count} cambios
                      </span>
                    )}
                  </div>
                </div>

                {repo.last_commit_hash && (
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <code style={{ color: 'var(--primary)', fontWeight: 700 }}>{repo.last_commit_hash}</code> {repo.last_commit_msg}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <button
                    type="button"
                    onClick={() => onInspectRepo(repo)}
                    className="cockpit-inspect-btn"
                  >
                    Inspeccionar →
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TacticalButton
                      variant="secondary"
                      size="xs"
                      onClick={(e) => onFetchRepo(repo, e)}
                      disabled={isFetching}
                      style={{ fontSize: '0.58rem', padding: '1px 5px' }}
                    >
                      Fetch
                    </TacticalButton>
                    <TacticalButton
                      variant="secondary"
                      size="xs"
                      onClick={(e) => onPullRepo(repo, e)}
                      disabled={isPulling}
                      style={{ fontSize: '0.58rem', padding: '1px 5px', color: 'var(--accent)' }}
                    >
                      Pull
                    </TacticalButton>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
