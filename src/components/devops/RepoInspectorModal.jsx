import React from 'react';
import { 
  FolderGit2, 
  GitBranch, 
  RefreshCw, 
  Download, 
  Code2, 
  Terminal, 
  FileDiff, 
  GitCommit 
} from 'lucide-react';
import { ModalWrapper, TabsBar, TacticalButton } from '../ui';
import { RepoDiffViewer } from './RepoDiffViewer';
import { RepoCommitsViewer } from './RepoCommitsViewer';

/**
 * RepoInspectorModal — Modal táctico avanzado para inspección en vivo de repositorios Git.
 * Permite alternar ramas, ejecutar fetch/pull, auditar diffs y examinar commits recientes.
 */
export function RepoInspectorModal({
  repo,
  repoDetails,
  loading = false,
  inspectorTab = 'diff',
  onTabChange,
  onClose,
  onFetch,
  onPull,
  onSwitchBranch,
  onOpenInEditor,
  copiedHash,
  onCopyHash,
  actionLoading
}) {
  if (!repo) return null;

  const isFetching = actionLoading === `fetch-${repo.id}`;
  const isPulling = actionLoading === `pull-${repo.id}`;
  const isBranching = actionLoading === `branch-${repo.id}`;

  const tabs = [
    {
      id: 'diff',
      label: `Diff en Vivo (${repoDetails?.status_files?.length ?? 0})`,
      icon: <FileDiff size={12} />
    },
    {
      id: 'commits',
      label: `Historial Commits (${repoDetails?.recent_commits?.length ?? 0})`,
      icon: <GitCommit size={12} />
    }
  ];

  return (
    <ModalWrapper
      isOpen={Boolean(repo)}
      onClose={onClose}
      title={`${repo.name} — ${repo.role}`}
      icon={<FolderGit2 size={16} color="var(--primary, #10b981)" />}
      maxWidth="940px"
      bodyStyle={{ height: '76vh', display: 'flex', flexDirection: 'column', padding: 0 }}
    >
      {/* Barra de Controles Rápidos y Selector de Rama */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6rem 1rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(0, 0, 0, 0.2)',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        {/* Selector de Rama Local */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <GitBranch size={13} color="var(--primary, #10b981)" />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rama:</span>
          <select
            value={repoDetails?.branch || repo.branch}
            onChange={(e) => onSwitchBranch(e.target.value)}
            disabled={isBranching}
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: '#a7f3d0',
              fontSize: '0.72rem',
              padding: '2px 8px',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {(repoDetails?.branches || [repo.branch]).map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Acciones Tácticas del Repo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TacticalButton
            variant="secondary"
            size="xs"
            icon={<RefreshCw size={11} className={isFetching ? 'animate-spin' : ''} />}
            onClick={() => onFetch(repo)}
            disabled={isFetching}
            title="Ejecutar git fetch"
          >
            Fetch
          </TacticalButton>

          <TacticalButton
            variant="secondary"
            size="xs"
            icon={<Download size={11} className={isPulling ? 'animate-spin' : ''} />}
            onClick={() => onPull(repo)}
            disabled={isPulling}
            title="Ejecutar git pull"
            style={{ color: '#38bdf8' }}
          >
            Pull
          </TacticalButton>

          <TacticalButton
            variant="secondary"
            size="xs"
            icon={<Code2 size={12} />}
            onClick={() => onOpenInEditor(repo, 'cursor')}
            title="Abrir en Cursor"
            style={{ color: '#38bdf8' }}
          >
            Cursor
          </TacticalButton>

          <TacticalButton
            variant="secondary"
            size="xs"
            icon={<Terminal size={12} />}
            onClick={() => onOpenInEditor(repo, 'terminal')}
            title="Abrir en Terminal (Ptyxis)"
          >
            Terminal
          </TacticalButton>
        </div>
      </div>

      {/* Selector de Pestañas del Inspector */}
      <div style={{
        padding: '0.4rem 1rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(0, 0, 0, 0.12)'
      }}>
        <TabsBar
          tabs={tabs}
          activeTab={inspectorTab}
          onChange={onTabChange}
          variant="pills"
          size="sm"
        />
      </div>

      {/* Contenido Dinámico: Diff o Commits */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'var(--text-muted)', gap: '8px' }}>
            <RefreshCw size={16} className="animate-spin" />
            <span>Inspeccionando diff y ramas de Git...</span>
          </div>
        ) : inspectorTab === 'diff' ? (
          <RepoDiffViewer repo={repo} repoDetails={repoDetails} />
        ) : (
          <RepoCommitsViewer
            commits={repoDetails?.recent_commits}
            copiedHash={copiedHash}
            onCopyHash={onCopyHash}
          />
        )}
      </div>
    </ModalWrapper>
  );
}
