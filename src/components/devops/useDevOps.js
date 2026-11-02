import { useState, useEffect, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * useDevOps — Custom Hook para telemetría DevOps, flota Git y arsenal de skills.
 * Aísla toda la lógica de estado y llamadas Tauri IPC de la capa de presentación.
 */
export function useDevOps() {
  const [repos, setRepos] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filtro de búsqueda para habilidades
  const [skillSearch, setSkillSearch] = useState('');

  // Modal de lectura de SKILL.md
  const [activeSkillModal, setActiveSkillModal] = useState(null);
  const [skillMarkdown, setSkillMarkdown] = useState('');
  const [loadingSkillMd, setLoadingSkillMd] = useState(false);

  // Modal / Drawer de Inspector de Repositorio en Vivo
  const [activeRepoInspector, setActiveRepoInspector] = useState(null);
  const [repoDetails, setRepoDetails] = useState(null);
  const [loadingRepoDetails, setLoadingRepoDetails] = useState(false);
  const [inspectorTab, setInspectorTab] = useState('diff'); // 'diff' | 'commits'
  const [actionLoading, setActionLoading] = useState(null); // 'fetch-<id>' | 'pull-<id>' | 'branch-<id>'
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  // Modal para Añadir / Crear Repositorios
  const [isAddRepoModalOpen, setIsAddRepoModalOpen] = useState(false);
  // Modal para Desvincular / Eliminar Repositorio
  const [repoToDelete, setRepoToDelete] = useState(null);

  const showToast = useCallback((msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const fetchDevOpsData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const [fleetRes, skillsRes] = await Promise.all([
        invoke('get_git_fleet_status'),
        invoke('get_skills_catalog')
      ]);
      setRepos(fleetRes || []);
      setSkills(skillsRes || []);
    } catch (err) {
      console.error('Error cargando telemetría DevOps:', err);
      setError(String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDevOpsData();
  }, [fetchDevOpsData]);

  const handleOpenSkill = useCallback(async (skill) => {
    setActiveSkillModal(skill);
    setLoadingSkillMd(true);
    try {
      const content = await invoke('read_skill_markdown', { skillId: skill.id });
      setSkillMarkdown(content);
    } catch (err) {
      console.error('Error leyendo manual SKILL.md:', err);
      setSkillMarkdown(`Error al leer manual: ${err}`);
    } finally {
      setLoadingSkillMd(false);
    }
  }, []);

  const handleCloseSkill = useCallback(() => {
    setActiveSkillModal(null);
    setSkillMarkdown('');
  }, []);

  // Abrir inspector detallado de repositorio
  const handleOpenRepoInspector = useCallback(async (repo) => {
    setActiveRepoInspector(repo);
    setLoadingRepoDetails(true);
    setInspectorTab('diff');
    try {
      const details = await invoke('get_git_repo_details', { path: repo.path });
      setRepoDetails(details);
    } catch (err) {
      console.error('Error cargando detalles de repositorio:', err);
      showToast(`Error al inspeccionar: ${err}`, true);
    } finally {
      setLoadingRepoDetails(false);
    }
  }, [showToast]);

  const handleCloseRepoInspector = useCallback(() => {
    setActiveRepoInspector(null);
    setRepoDetails(null);
  }, []);

  // Ejecutar git fetch
  const handleFetchRepo = useCallback(async (repo, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setActionLoading(`fetch-${repo.id}`);
    try {
      const res = await invoke('git_fetch_repo', { path: repo.path });
      showToast(res || 'Fetch completado con éxito');
      await fetchDevOpsData();
      if (activeRepoInspector && activeRepoInspector.id === repo.id) {
        const details = await invoke('get_git_repo_details', { path: repo.path });
        setRepoDetails(details);
      }
    } catch (err) {
      console.error('Error en fetch:', err);
      showToast(`Error en fetch: ${err}`, true);
    } finally {
      setActionLoading(null);
    }
  }, [showToast, fetchDevOpsData, activeRepoInspector]);

  // Ejecutar git pull
  const handlePullRepo = useCallback(async (repo, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setActionLoading(`pull-${repo.id}`);
    try {
      const res = await invoke('git_pull_repo', { path: repo.path });
      showToast(res || 'Pull completado con éxito');
      await fetchDevOpsData();
      if (activeRepoInspector && activeRepoInspector.id === repo.id) {
        const details = await invoke('get_git_repo_details', { path: repo.path });
        setRepoDetails(details);
      }
    } catch (err) {
      console.error('Error en pull:', err);
      showToast(`Error en pull: ${err}`, true);
    } finally {
      setActionLoading(null);
    }
  }, [showToast, fetchDevOpsData, activeRepoInspector]);

  // Cambiar de rama local (git checkout)
  const handleSwitchBranch = useCallback(async (branchName) => {
    if (!activeRepoInspector || !branchName) return;
    setActionLoading(`branch-${activeRepoInspector.id}`);
    try {
      const res = await invoke('git_checkout_branch', {
        path: activeRepoInspector.path,
        branch: branchName
      });
      showToast(res);
      await fetchDevOpsData();
      const details = await invoke('get_git_repo_details', { path: activeRepoInspector.path });
      setRepoDetails(details);
    } catch (err) {
      console.error('Error cambiando rama:', err);
      showToast(`Error: ${err}`, true);
    } finally {
      setActionLoading(null);
    }
  }, [activeRepoInspector, showToast, fetchDevOpsData]);

  // Abrir repo en Cursor, VS Code o Terminal
  const handleOpenInEditor = useCallback(async (repo, editor, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      await invoke('open_repo_in_editor', { path: repo.path, editor });
      const targetName = editor === 'cursor' ? 'Cursor' : editor === 'code' ? 'VS Code' : 'Terminal (Ptyxis)';
      showToast(`Abriendo ${repo.name} en ${targetName}...`);
    } catch (err) {
      console.error('Error abriendo entorno:', err);
      showToast(`Error al abrir: ${err}`, true);
    }
  }, [showToast]);

  // Copiar hash de commit
  const handleCopyHash = useCallback((hash, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  }, []);

  // Vincular repo local existente
  const handleAddFleetRepo = useCallback(async ({ name, path, role, warning }) => {
    setActionLoading('add-repo');
    try {
      const newRepoStatus = await invoke('add_fleet_repo', { name, path, role, warning });
      setRepos(prev => [...prev, newRepoStatus]);
      showToast(`Repositorio '${newRepoStatus.name}' vinculado a la flota`);
      await fetchDevOpsData();
    } catch (err) {
      console.error('Error vinculando repositorio:', err);
      showToast(String(err), true);
      throw err;
    } finally {
      setActionLoading(null);
    }
  }, [showToast, fetchDevOpsData]);

  // Desvincular / Eliminar repo de la flota (seguro o destructivo)
  const handleDeleteRepo = useCallback(async (repo, { deleteLocal, deleteRemote }) => {
    setActionLoading(`delete-${repo.id}`);
    try {
      const res = await invoke('delete_fleet_repo', {
        id: repo.id,
        deleteLocalDisk: Boolean(deleteLocal),
        deleteGithubRemote: Boolean(deleteRemote)
      });
      setRepos(prev => prev.filter(r => r.id !== repo.id));
      showToast(res || `'${repo.name}' procesado`);
      setRepoToDelete(null);
      if (activeRepoInspector && activeRepoInspector.id === repo.id) {
        setActiveRepoInspector(null);
      }
    } catch (err) {
      console.error('Error eliminando repositorio:', err);
      showToast(String(err), true);
    } finally {
      setActionLoading(null);
    }
  }, [showToast, activeRepoInspector]);

  // Crear e inicializar nuevo repositorio
  const handleCreateFleetRepo = useCallback(async ({ parentDir, name, role, warning, initCommit, createGithub, isPrivate }) => {
    setActionLoading('create-repo');
    try {
      const newRepoStatus = await invoke('create_fleet_repo', {
        parentDir,
        name,
        role,
        warning,
        initCommit,
        createGithub,
        isPrivate
      });
      setRepos(prev => [...prev, newRepoStatus]);
      showToast(`Repositorio '${newRepoStatus.name}' creado e inicializado`);
      await fetchDevOpsData();
    } catch (err) {
      console.error('Error creando repositorio:', err);
      showToast(String(err), true);
      throw err;
    } finally {
      setActionLoading(null);
    }
  }, [showToast, fetchDevOpsData]);

  const filteredSkills = useMemo(() => {
    if (!skillSearch.trim()) return skills;
    const q = skillSearch.toLowerCase();
    return skills.filter(
      (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }, [skills, skillSearch]);

  return {
    repos,
    skills,
    loading,
    refreshing,
    error,
    skillSearch,
    setSkillSearch,
    filteredSkills,
    activeSkillModal,
    skillMarkdown,
    loadingSkillMd,
    activeRepoInspector,
    repoDetails,
    loadingRepoDetails,
    inspectorTab,
    setInspectorTab,
    actionLoading,
    toastMessage,
    copiedHash,
    isAddRepoModalOpen,
    setIsAddRepoModalOpen,
    fetchDevOpsData,
    handleOpenSkill,
    handleCloseSkill,
    handleOpenRepoInspector,
    handleCloseRepoInspector,
    handleFetchRepo,
    handlePullRepo,
    handleSwitchBranch,
    handleOpenInEditor,
    handleCopyHash,
    handleAddFleetRepo,
    repoToDelete,
    setRepoToDelete,
    handleDeleteRepo,
    handleCreateFleetRepo,
    showToast
  };
}
