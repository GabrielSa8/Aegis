import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * useGitHubTelemetry — Hook modular para CI/CD (GitHub Actions), Pull Requests y metadata remota.
 * Maneja llamadas asíncronas vía gh CLI sin saturar el hilo principal ni useDevOps.
 */
export function useGitHubTelemetry(repo, showToast) {
  const [runs, setRuns] = useState([]);
  const [prs, setPrs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loadingCiCd, setLoadingCiCd] = useState(false);
  const [loadingPrs, setLoadingPrs] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [triggeringWorkflow, setTriggeringWorkflow] = useState(false);
  const [errorCiCd, setErrorCiCd] = useState(null);
  const [errorPrs, setErrorPrs] = useState(null);

  const fetchCiCdRuns = useCallback(async () => {
    if (!repo?.path) return;
    setLoadingCiCd(true);
    setErrorCiCd(null);
    try {
      const data = await invoke('get_github_workflow_runs', { repoPath: repo.path });
      setRuns(data || []);
    } catch (err) {
      console.error('Error cargando GitHub Actions:', err);
      setErrorCiCd(String(err));
    } finally {
      setLoadingCiCd(false);
    }
  }, [repo?.path]);

  const fetchPullRequests = useCallback(async () => {
    if (!repo?.path) return;
    setLoadingPrs(true);
    setErrorPrs(null);
    try {
      const data = await invoke('get_github_pull_requests', { repoPath: repo.path });
      setPrs(data || []);
    } catch (err) {
      console.error('Error cargando Pull Requests:', err);
      setErrorPrs(String(err));
    } finally {
      setLoadingPrs(false);
    }
  }, [repo?.path]);

  const fetchRemoteMeta = useCallback(async () => {
    if (!repo?.path) return;
    setLoadingMeta(true);
    try {
      const data = await invoke('get_github_repo_metadata', { repoPath: repo.path });
      setMeta(data || null);
    } catch (err) {
      console.warn('Metadata remota de GitHub no disponible:', err);
      setMeta(null);
    } finally {
      setLoadingMeta(false);
    }
  }, [repo?.path]);

  const triggerWorkflow = useCallback(async (workflowFile = 'release.yml') => {
    if (!repo?.path) return;
    setTriggeringWorkflow(true);
    try {
      const res = await invoke('trigger_github_workflow', {
        repoPath: repo.path,
        workflowFile
      });
      if (showToast) showToast(res || 'Workflow iniciado');
      await fetchCiCdRuns();
    } catch (err) {
      console.error('Error iniciando workflow:', err);
      if (showToast) showToast(`Error al iniciar workflow: ${err}`, true);
    } finally {
      setTriggeringWorkflow(false);
    }
  }, [repo?.path, showToast, fetchCiCdRuns]);

  return {
    runs,
    prs,
    meta,
    loadingCiCd,
    loadingPrs,
    loadingMeta,
    triggeringWorkflow,
    errorCiCd,
    errorPrs,
    fetchCiCdRuns,
    fetchPullRequests,
    fetchRemoteMeta,
    triggerWorkflow
  };
}
