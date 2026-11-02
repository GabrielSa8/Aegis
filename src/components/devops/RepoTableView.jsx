import React from 'react';
import { FolderGit2, GitBranch, CheckCircle2, AlertCircle, ArrowUp, ArrowDown, FileDiff, RefreshCw, Download, Code2, Terminal, Trash2 } from 'lucide-react';
import { TacticalButton } from '../ui';

/**
 * RepoTableView — Vista tabular de alta densidad para la flota de repositorios.
 * Elimina el espacio vacío aprovechando el ancho disponible con filas estructuradas.
 */
export function RepoTableView({
  repos = [],
  onInspect,
  onFetch,
  onPull,
  onOpenInEditor,
  onRequestDelete,
  actionLoading
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0
    }}>
      {/* Cabecera de Tabla */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr 140px 120px 1fr 160px',
        gap: '8px',
        padding: '6px 10px',
        background: 'color-mix(in srgb, var(--border-color) 15%, transparent)',
        borderBottom: '1px solid var(--border-color)',
        fontSize: '0.62rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}>
        <span>Repositorio</span>
        <span>Ruta en disco</span>
        <span>Rama / Sync</span>
        <span>Árbol Git</span>
        <span>Último Commit</span>
        <span style={{ textAlign: 'right' }}>Acciones</span>
      </div>

      {/* Filas de Repositorios */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {repos.map((repo) => {
          const isFetching = actionLoading === `fetch-${repo.id}`;
          const isPulling = actionLoading === `pull-${repo.id}`;

          return (
            <div
              key={repo.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr 140px 120px 1fr 160px',
                gap: '8px',
                alignItems: 'center',
                padding: '6px 10px',
                borderBottom: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
                fontSize: '0.68rem',
                transition: 'background 0.1s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Repositorio */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                <FolderGit2 size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span style={{ fontWeight: 800, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {repo.name}
                </span>
              </div>

              {/* Ruta */}
              <code style={{
                fontSize: '0.58rem',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {repo.path}
              </code>

              {/* Rama & Sync */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-high)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <GitBranch size={10} style={{ color: 'var(--primary)' }} /> {repo.branch}
                </span>
                {repo.ahead > 0 && <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.6rem' }}>↑{repo.ahead}</span>}
                {repo.behind > 0 && <span style={{ color: 'var(--warning)', fontWeight: 700, fontSize: '0.6rem' }}>↓{repo.behind}</span>}
              </div>

              {/* Árbol Git */}
              <div>
                {repo.is_clean ? (
                  <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                    <CheckCircle2 size={11} /> Limpio
                  </span>
                ) : (
                  <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
                    <AlertCircle size={11} /> {repo.changed_files_count} cambios
                  </span>
                )}
              </div>

              {/* Último Commit */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden', color: 'var(--text-muted)' }}>
                {repo.last_commit_hash ? (
                  <>
                    <code style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.6rem' }}>{repo.last_commit_hash}</code>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{repo.last_commit_msg}</span>
                  </>
                ) : (
                  <span>-</span>
                )}
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                <TacticalButton
                  variant="ghost"
                  size="xs"
                  onClick={() => onInspect(repo)}
                  title="Inspeccionar diff, commits y ramas"
                  style={{ fontSize: '0.6rem', padding: '1px 5px', color: 'var(--primary)' }}
                >
                  <FileDiff size={11} />
                </TacticalButton>
                <TacticalButton
                  variant="secondary"
                  size="xs"
                  onClick={(e) => onFetch(repo, e)}
                  disabled={isFetching}
                  title="Git fetch"
                  style={{ fontSize: '0.58rem', padding: '1px 5px' }}
                >
                  <RefreshCw size={9} className={isFetching ? 'animate-spin' : ''} />
                </TacticalButton>
                <TacticalButton
                  variant="secondary"
                  size="xs"
                  onClick={(e) => onPull(repo, e)}
                  disabled={isPulling}
                  title="Git pull"
                  style={{ fontSize: '0.58rem', padding: '1px 5px', color: 'var(--accent)' }}
                >
                  <Download size={9} className={isPulling ? 'animate-spin' : ''} />
                </TacticalButton>
                <TacticalButton
                  variant="secondary"
                  size="xs"
                  onClick={(e) => onOpenInEditor(repo, 'cursor', e)}
                  title="Abrir en Cursor"
                  style={{ padding: '2px 4px' }}
                >
                  <Code2 size={10} />
                </TacticalButton>
                <TacticalButton
                  variant="secondary"
                  size="xs"
                  onClick={(e) => onOpenInEditor(repo, 'terminal', e)}
                  title="Abrir Terminal"
                  style={{ padding: '2px 4px' }}
                >
                  <Terminal size={10} />
                </TacticalButton>
                {onRequestDelete && (
                  <button
                    type="button"
                    onClick={() => onRequestDelete(repo)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', opacity: 0.6 }}
                    title="Desvincular repositorio"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
