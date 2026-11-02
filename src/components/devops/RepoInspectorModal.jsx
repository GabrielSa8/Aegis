import React, { useEffect } from 'react';
import { 
  FolderGit2, 
  GitBranch, 
  RefreshCw, 
  Download, 
  Code2, 
  Terminal, 
  FileDiff, 
  GitCommit,
  PlayCircle,
  GitPullRequest
} from 'lucide-react';
import { ModalWrapper, TabsBar, TacticalButton } from '../ui';
import { RepoDiffViewer } from './RepoDiffViewer';
import { RepoCommitsViewer } from './RepoCommitsViewer';
import { RepoCiCdViewer } from './RepoCiCdViewer';
import { RepoPrViewer } from './RepoPrViewer';
import { RepoRemoteMetaBar } from './RepoRemoteMetaBar';
import { useGitHubTelemetry } from './useGitHubTelemetry';

/**
 * RepoInspectorModal — Modal táctico avanzado para inspección en vivo de repositorios Git.
 * Ahora integrado con Fase 4.2: CI/CD (GitHub Actions), Pull Requests y metadata remota vía gh CLI.
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
  actionLoading,
  showToast
}) {
  const {
    runs,
    prs,
    meta,
    loadingCiCd,
    loadingPrs,
    triggeringWorkflow,
    errorCiCd,
    errorPrs,
    fetchCiCdRuns,
    fetchPullRequests,
    fetchRemoteMeta,
    triggerWorkflow
  } = useGitHubTelemetry(repo, showToast);

  // Cargar metadata de GitHub al abrir modal o al cambiar de pestaña remota
  useEffect(() => {
    if (repo?.path) {
      fetchRemoteMeta();
    }
  }, [repo?.path, fetchRemoteMeta]);

  useEffect(() => {
    if (repo?.path) {
      if (inspectorTab === 'cicd') fetchCiCdRuns();
      if (inspectorTab === 'prs') fetchPullRequests();
    }
  }, [repo?.path, inspectorTab, fetchCiCdRuns, fetchPullRequests]);

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
    },
    {
      id: 'cicd',
      label: `GitHub CI/CD (${runs.length})`,
      icon: <PlayCircle size={12} />
    },
    {
      id: 'prs',
      label: `Pull Requests (${prs.length})`,
      icon: <GitPullRequest size={12} />
    }
  ];

  return (
    <ModalWrapper
      isOpen={Boolean(repo)}
      onClose={onClose}
      title={`${repo.name} — ${repo.role}`}
      icon={<FolderGit2 size={16} color="var(--primary)" />}
      maxWidth="980px"
      bodyStyle={{ height: '78vh', display: 'flex', flexDirection: 'column', padding: 0 }}
    >
      {/* Franja superior de metadata remota */}
      <RepoRemoteMetaBar meta={meta} />

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
          <GitBranch size={13} color="var(--primary)" />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rama:</span>
          <select
            value={repoDetails?.branch || repo.branch}
            onChange={(e) => onSwitchBranch(e.target.value)}
            disabled={isBranching}
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-high)',
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
            icon={<RefreshCw size={11} className={isFetching ? 'spin-slow' : ''} />}
            onClick={() => onFetch(repo)}
            disabled={isFetching}
            title="Ejecutar git fetch"
          >
            Fetch
          </TacticalButton>

          <TacticalButton
            variant="secondary"
            size="xs"
            icon={<Download size={11} className={isPulling ? 'spin-slow' : ''} />}
            onClick={() => onPull(repo)}
            disabled={isPulling}
            title="Ejecutar git pull"
          >
            Pull
          </TacticalButton>

          <TacticalButton
            variant="secondary"
            size="xs"
            icon={<Code2 size={12} />}
            onClick={() => onOpenInEditor(repo, 'cursor')}
            title="Abrir en Cursor"
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

      {/* Contenido Dinámico: Diff, Commits, CI/CD, PRs */}
      <div style={{ flex: 1, overflowY: 'auto', padding: inspectorTab === 'diff' || inspectorTab === 'commits' ? '1rem' : 0 }}>
        {loading && (inspectorTab === 'diff' || inspectorTab === 'commits') ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'var(--text-muted)', gap: '8px' }}>
            <RefreshCw size={16} className="spin-slow" />
            <span>Inspeccionando diff y ramas de Git...</span>
          </div>
        ) : inspectorTab === 'diff' ? (
          <RepoDiffViewer repo={repo} repoDetails={repoDetails} />
        ) : inspectorTab === 'commits' ? (
          <RepoCommitsViewer
            commits={repoDetails?.recent_commits}
            copiedHash={copiedHash}
            onCopyHash={onCopyHash}
          />
        ) : inspectorTab === 'cicd' ? (
          <RepoCiCdViewer
            runs={runs}
            loading={loadingCiCd}
            error={errorCiCd}
            onRefresh={fetchCiCdRuns}
            onTrigger={triggerWorkflow}
            triggering={triggeringWorkflow}
          />
        ) : (
          <RepoPrViewer
            prs={prs}
            loading={loadingPrs}
            error={errorPrs}
            onRefresh={fetchPullRequests}
          />
        )}
      </div>
    </ModalWrapper>
  );
}
