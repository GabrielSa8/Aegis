import React, { useState } from 'react';
import { 
  FolderGit2, GitBranch, ShieldAlert, CheckCircle2, AlertCircle, 
  ArrowUp, ArrowDown, FileDiff, RefreshCw, Download, Code2, Terminal, Trash2, Copy, Check 
} from 'lucide-react';
import { TacticalBadge, TacticalButton } from '../ui';

function getRepoStack(repo) {
  const p = (repo.path || '').toLowerCase();
  const n = (repo.name || '').toLowerCase();
  if (p.includes('aegis') || n.includes('aegis')) return { label: 'Tauri / Rust + React', color: 'var(--primary)' };
  if (p.includes('tadu') || n.includes('tadu')) return { label: 'AWS SAM / Python 3.12', color: 'var(--secondary)' };
  if (p.includes('granja') || n.includes('granja')) return { label: 'Android / Kotlin', color: 'var(--accent)' };
  if (p.includes('vault') || p.includes('obsidian') || n.includes('obsidian')) return { label: 'Obsidian PKM', color: 'var(--text-high)' };
  return { label: 'Git Project', color: 'var(--text-muted)' };
}

/**
 * RepoCard — Tarjeta de alta densidad para un repositorio Git local.
 * Cero espacios muertos: combina tech stack, estado Git granular y acciones tácticas.
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
  const [copied, setCopied] = useState(false);
  const isFetching = actionLoading === `fetch-${repo.id}`;
  const isPulling = actionLoading === `pull-${repo.id}`;
  const stack = getRepoStack(repo);

  const handleCopyPath = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(repo.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`repo-card ${repo.warning ? 'has-warning' : ''}`}>
      {/* 🧭 Cabecera: Nombre, Stack y Rama */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FolderGit2 size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {repo.name}
            </span>
            <span style={{
              fontSize: '0.58rem',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '4px',
              background: 'color-mix(in srgb, var(--border-color) 25%, transparent)',
              color: stack.color,
              whiteSpace: 'nowrap'
            }}>
              {stack.label}
            </span>
          </div>

          {/* Ruta en disco con botón copiar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <code style={{
              fontSize: '0.6rem',
              color: 'var(--text-muted)',
              background: 'color-mix(in srgb, var(--border-color) 15%, transparent)',
              padding: '1px 5px',
              borderRadius: '3px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '240px'
            }}>
              {repo.path}
            </code>
            <button
              type="button"
              onClick={handleCopyPath}
              className="devops-icon-action-btn"
              title="Copiar ruta absoluta"
            >
              {copied ? <Check size={10} color="var(--primary)" /> : <Copy size={10} />}
            </button>
          </div>
        </div>

        {/* Badge de Rama y Desvincular */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <TacticalBadge variant={repo.is_git_repo ? 'success' : 'neutral'} size="xs" icon={<GitBranch size={10} />}>
            {repo.branch}
          </TacticalBadge>

          {onRequestDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRequestDelete(repo); }}
              className="devops-icon-action-btn danger"
              title="Desvincular repositorio de la flota"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ⚠️ Advertencia de Seguridad TADÚ / Archivos Críticos */}
      {repo.warning && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)',
          borderRadius: 'var(--radius-sm)',
          padding: '3px 6px',
          fontSize: '0.64rem',
          color: 'var(--warning)',
          fontWeight: 600
        }}>
          <ShieldAlert size={11} flexShrink={0} />
          <span>{repo.warning}</span>
        </div>
      )}

      {/* 📊 Matriz de Telemetría Git (Estado y Sincronización) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'color-mix(in srgb, var(--border-color) 12%, transparent)',
        borderRadius: 'var(--radius-sm)',
        padding: '3px 7px',
        fontSize: '0.66rem'
      }}>
        {/* Estado del árbol */}
        <div>
          {repo.is_clean ? (
            <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
              <CheckCircle2 size={11} /> Árbol limpio
            </span>
          ) : (
            <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
              <AlertCircle size={11} />
              {repo.changed_files_count} cambios
              {repo.untracked_files_count > 0 && ` (${repo.untracked_files_count} untracked)`}
            </span>
          )}
        </div>

        {/* Sincronización Remota */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {repo.ahead > 0 && (
            <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
              <ArrowUp size={10} /> {repo.ahead} ahead
            </span>
          )}
          {repo.behind > 0 && (
            <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
              <ArrowDown size={10} /> {repo.behind} behind
            </span>
          )}
          {repo.ahead === 0 && repo.behind === 0 && repo.is_git_repo && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>✓ Sincronizado</span>
          )}
        </div>
      </div>

      {/* 📜 Cardlet del Último Commit */}
      {repo.last_commit_hash && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.64rem',
          color: 'var(--text-muted)',
          background: 'color-mix(in srgb, var(--border-color) 8%, transparent)',
          padding: '3px 6px',
          borderRadius: 'var(--radius-sm)'
        }}>
          <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--primary)', fontWeight: 700 }}>
            {repo.last_commit_hash}
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, color: 'var(--text-high)' }}>
            {repo.last_commit_msg}
          </span>
          <span style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.58rem' }}>
            {repo.last_commit_time}
          </span>
        </div>
      )}

      {/* ⚡ Barra Táctica de Acciones */}
      <div className="repo-card-actions">
        <TacticalButton
          variant="ghost"
          size="xs"
          icon={<FileDiff size={11} />}
          onClick={() => onInspect(repo)}
          style={{
            background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
            color: 'var(--primary)',
            fontWeight: 700,
            fontSize: '0.64rem',
            padding: '2px 7px'
          }}
        >
          Inspeccionar
        </TacticalButton>

        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap' }}>
          <TacticalButton
            variant="secondary"
            size="xs"
            icon={<RefreshCw size={9} className={isFetching ? 'animate-spin' : ''} />}
            onClick={(e) => onFetch(repo, e)}
            disabled={isFetching}
            title="Ejecutar git fetch"
            style={{ fontSize: '0.62rem', padding: '2px 6px' }}
          >
            Fetch
          </TacticalButton>

          <TacticalButton
            variant="secondary"
            size="xs"
            icon={<Download size={9} className={isPulling ? 'animate-spin' : ''} />}
            onClick={(e) => onPull(repo, e)}
            disabled={isPulling}
            title="Ejecutar git pull"
            style={{ color: 'var(--accent)', fontSize: '0.62rem', padding: '2px 6px' }}
          >
            Pull
          </TacticalButton>

          <TacticalButton
            variant="secondary"
            size="xs"
            icon={<Code2 size={10} />}
            onClick={(e) => onOpenInEditor(repo, 'editor', e)}
            title="Abrir repositorio en el Editor / IDE preferido"
            style={{ padding: '2px 5px' }}
          />

          <TacticalButton
            variant="secondary"
            size="xs"
            icon={<Terminal size={10} />}
            onClick={(e) => onOpenInEditor(repo, 'terminal', e)}
            title="Abrir emulador de terminal preferido en el repositorio"
            style={{ padding: '2px 5px' }}
          />
        </div>
      </div>
    </div>
  );
}
