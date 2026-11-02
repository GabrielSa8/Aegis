import React, { useState } from 'react';
import { 
  FolderGit2, GitBranch, ShieldAlert, CheckCircle2, AlertCircle, 
  ArrowUp, ArrowDown, FileDiff, RefreshCw, Download, Code2, Terminal, Trash2 
} from 'lucide-react';
import { TacticalBadge, TacticalButton } from '../ui';

/**
 * RepoCard — Tarjeta atómica representativa de un repositorio Git local.
 * Integra acciones rápidas (fetch, pull, IDE, terminal, diff, desvincular) y alertas.
 */
export function RepoCard({
  repo,
  onInspect,
  onFetch,
  onPull,
  onOpenInEditor,
  onRequestDelete,
  actionLoading
}) {
  const isFetching = actionLoading === `fetch-${repo.id}`;
  const isPulling = actionLoading === `pull-${repo.id}`;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: repo.warning ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '0.75rem 0.85rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '8px'
    }}>
      {/* Cabecera del Repo */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FolderGit2 size={14} color="var(--primary)" />
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-high)' }}>{repo.name}</span>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>{repo.role}</span>
          </div>

          {/* Badge de Rama y Botón Desvincular / Eliminar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <TacticalBadge variant={repo.is_git_repo ? 'success' : 'neutral'} size="xs" icon={<GitBranch size={11} />}>
              {repo.branch}
            </TacticalBadge>

            {onRequestDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRequestDelete(repo); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim, var(--text-muted))', padding: '2px 3px', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.7 }}
                title="Desvincular o eliminar repositorio"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Ruta en disco */}
        <code style={{ fontSize: '0.62rem', color: 'var(--text-dim, var(--text-muted))', background: 'rgba(0, 0, 0, 0.2)', padding: '2px 5px', borderRadius: '3px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '4px' }}>
          {repo.path}
        </code>

        {/* Advertencia Crítica */}
        {repo.warning && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', padding: '4px 7px', marginTop: '6px', fontSize: '0.66rem', color: 'var(--warning, #f59e0b)', fontWeight: 600 }}>
            <ShieldAlert size={12} flexShrink={0} />
            <span>{repo.warning}</span>
          </div>
        )}
      </div>

      {/* Telemetría de Estado y Último Commit */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {repo.is_clean ? (
              <span style={{ color: 'var(--success, #34d399)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <CheckCircle2 size={12} /> Árbol Limpio
              </span>
            ) : (
              <span style={{ color: 'var(--warning, #f59e0b)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <AlertCircle size={12} /> {repo.changed_files_count} cambios
                {repo.untracked_files_count > 0 && ` (${repo.untracked_files_count} no rastreados)`}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {repo.ahead > 0 && (
              <span style={{ color: 'var(--accent, #38bdf8)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                <ArrowUp size={11} /> {repo.ahead}
              </span>
            )}
            {repo.behind > 0 && (
              <span style={{ color: 'var(--warning, #fb923c)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                <ArrowDown size={11} /> {repo.behind}
              </span>
            )}
            {repo.ahead === 0 && repo.behind === 0 && repo.is_git_repo && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.64rem' }}>Sincronizado</span>
            )}
          </div>
        </div>

        {repo.last_commit_hash && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.64rem', color: 'var(--text-muted)', overflow: 'hidden' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--success, #34d399)', fontWeight: 600 }}>
              {repo.last_commit_hash}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {repo.last_commit_msg}
            </span>
            <span style={{ whiteSpace: 'nowrap', color: 'var(--text-dim, var(--text-muted))' }}>
              {repo.last_commit_time}
            </span>
          </div>
        )}

        {/* Acciones Tácticas del Repo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <TacticalButton
            variant="ghost"
            size="xs"
            icon={<FileDiff size={12} />}
            onClick={() => onInspect(repo)}
            style={{
              background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
              color: 'var(--primary)',
              fontWeight: 700
            }}
          >
            Inspeccionar
          </TacticalButton>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TacticalButton
              variant="secondary"
              size="xs"
              icon={<RefreshCw size={10} className={isFetching ? 'animate-spin' : ''} />}
              onClick={(e) => onFetch(repo, e)}
              disabled={isFetching}
              title="Ejecutar git fetch"
            >
              Fetch
            </TacticalButton>

            <TacticalButton
              variant="secondary"
              size="xs"
              icon={<Download size={10} className={isPulling ? 'animate-spin' : ''} />}
              onClick={(e) => onPull(repo, e)}
              disabled={isPulling}
              title="Ejecutar git pull"
              style={{ color: 'var(--accent, #38bdf8)' }}
            >
              Pull
            </TacticalButton>

            <TacticalButton
              variant="secondary"
              size="xs"
              icon={<Code2 size={11} />}
              onClick={(e) => onOpenInEditor(repo, 'cursor', e)}
              title="Abrir repositorio en Cursor"
              style={{ padding: '3px 6px' }}
            />

            <TacticalButton
              variant="secondary"
              size="xs"
              icon={<Terminal size={11} />}
              onClick={(e) => onOpenInEditor(repo, 'terminal', e)}
              title="Abrir terminal en la ruta del repositorio"
              style={{ padding: '3px 6px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
