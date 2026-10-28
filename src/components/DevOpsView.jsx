import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  GitBranch, 
  ShieldAlert, 
  Zap, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUp, 
  ArrowDown, 
  FolderGit2, 
  FileText, 
  X,
  BookOpen,
  Terminal,
  Code2,
  Download,
  ExternalLink,
  GitCommit,
  FileDiff,
  Check,
  Copy
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import MarkdownViewer from './MarkdownViewer';

export default function DevOpsView() {
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

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

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

  // Cerrar modales con Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (activeRepoInspector) setActiveRepoInspector(null);
        if (activeSkillModal) setActiveSkillModal(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeRepoInspector, activeSkillModal]);

  // Cargar manual SKILL.md al hacer clic en una skill
  const handleOpenSkill = async (skill) => {
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
  };

  // Abrir inspector detallado de repositorio
  const handleOpenRepoInspector = async (repo) => {
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
  };

  // Ejecutar git fetch
  const handleFetchRepo = async (repo, e) => {
    if (e) e.stopPropagation();
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
  };

  // Ejecutar git pull
  const handlePullRepo = async (repo, e) => {
    if (e) e.stopPropagation();
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
  };

  // Cambiar de rama local (git checkout)
  const handleSwitchBranch = async (branchName) => {
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
  };

  // Abrir repo en Cursor, VS Code o Terminal
  const handleOpenInEditor = async (repo, editor, e) => {
    if (e) e.stopPropagation();
    try {
      await invoke('open_repo_in_editor', { path: repo.path, editor });
      const targetName = editor === 'cursor' ? 'Cursor' : editor === 'code' ? 'VS Code' : 'Terminal (Ptyxis)';
      showToast(`Abriendo ${repo.name} en ${targetName}...`);
    } catch (err) {
      console.error('Error abriendo entorno:', err);
      showToast(`Error al abrir: ${err}`, true);
    }
  };

  // Copiar hash de commit
  const handleCopyHash = (hash, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredSkills = useMemo(() => {
    if (!skillSearch.trim()) return skills;
    const q = skillSearch.toLowerCase();
    return skills.filter(
      (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }, [skills, skillSearch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.85rem', overflowY: 'auto' }}>
      {/* 🧭 Barra Superior de Control DevOps */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.45rem 0.85rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        flexShrink: 0,
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {/* Izquierda: Título y Contadores */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GitBranch color="#10b981" size={15} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)' }}>
              Radar DevOps & Arsenal
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ 
              fontSize: '0.64rem', 
              color: '#a7f3d0', 
              background: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '2px 7px', 
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600
            }}>
              {repos.length} Repos Locales
            </span>
            <span style={{ 
              fontSize: '0.64rem', 
              color: '#c084fc', 
              background: 'rgba(168, 85, 247, 0.1)', 
              border: '1px solid rgba(168, 85, 247, 0.25)',
              padding: '2px 7px', 
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600
            }}>
              {skills.length} Skills Activas
            </span>
          </div>
        </div>

        {/* Derecha: Buscador de Skills y Refrescar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Buscador rápido de Skills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 8px'
          }}>
            <Search size={12} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar en el arsenal..."
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-high)',
                fontSize: '0.72rem',
                width: '150px'
              }}
            />
            {skillSearch && (
              <button 
                onClick={() => setSkillSearch('')} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* Botón Refrescar */}
          <button
            onClick={fetchDevOpsData}
            disabled={refreshing}
            title="Escanear estado de Git y catálogo de skills"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'var(--transition)'
            }}
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ⚠️ Mensaje de error si falla */}
      {error && (
        <div style={{
          padding: '0.6rem 0.85rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius-md)',
          color: '#f87171',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={14} />
          <span>Error escaneando entorno DevOps: {error}</span>
        </div>
      )}

      {/* 🚢 SECCIÓN 1: Flota de Repositorios Locales (Live Git Fleet) */}
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
              <div
                key={repo.id}
                style={{
                  background: 'var(--bg-card)',
                  border: repo.warning ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '8px',
                  boxShadow: repo.warning ? '0 0 12px rgba(245, 158, 11, 0.05)' : 'none'
                }}
              >
                {/* Cabecera del Repo */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FolderGit2 size={14} color="#10b981" />
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-high)' }}>
                          {repo.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>
                        {repo.role}
                      </span>
                    </div>

                    {/* Badge de Rama */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.66rem',
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-sm)',
                      background: repo.is_git_repo ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      color: repo.is_git_repo ? '#a7f3d0' : 'var(--text-muted)',
                      border: repo.is_git_repo ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
                      fontWeight: 700,
                      whiteSpace: 'nowrap'
                    }}>
                      <GitBranch size={11} />
                      <span>{repo.branch}</span>
                    </div>
                  </div>

                  {/* Ruta en disco */}
                  <code style={{ 
                    fontSize: '0.62rem', 
                    color: '#64748b', 
                    background: 'rgba(0, 0, 0, 0.2)', 
                    padding: '2px 5px', 
                    borderRadius: '3px',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: '4px'
                  }}>
                    {repo.path}
                  </code>

                  {/* Advertencia Crítica (Compuerta TADÚ) */}
                  {repo.warning && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 7px',
                      marginTop: '6px',
                      fontSize: '0.66rem',
                      color: '#fbbf24',
                      fontWeight: 600
                    }}>
                      <ShieldAlert size={12} flexShrink={0} />
                      <span>{repo.warning}</span>
                    </div>
                  )}
                </div>

                {/* Telemetría de Estado y Último Commit */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* Estado Limpio vs Modificado y Ahead/Behind */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {repo.is_clean ? (
                        <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <CheckCircle2 size={12} /> Árbol Limpio
                        </span>
                      ) : (
                        <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <AlertCircle size={12} /> {repo.changed_files_count} cambios
                          {repo.untracked_files_count > 0 && ` (${repo.untracked_files_count} no rastreados)`}
                        </span>
                      )}
                    </div>

                    {/* Sincronización con Remoto */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {repo.ahead > 0 && (
                        <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                          <ArrowUp size={11} /> {repo.ahead}
                        </span>
                      )}
                      {repo.behind > 0 && (
                        <span style={{ color: '#fb923c', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                          <ArrowDown size={11} /> {repo.behind}
                        </span>
                      )}
                      {repo.ahead === 0 && repo.behind === 0 && repo.is_git_repo && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.64rem' }}>
                          Sincronizado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Último Commit */}
                  {repo.last_commit_hash && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.64rem', color: 'var(--text-muted)', overflow: 'hidden' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#34d399', fontWeight: 600 }}>
                        {repo.last_commit_hash}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {repo.last_commit_msg}
                      </span>
                      <span style={{ whiteSpace: 'nowrap', color: '#52615a' }}>
                        {repo.last_commit_time}
                      </span>
                    </div>
                  )}

                  {/* ⚡ Barra de Acciones Tácticas del Repo */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    marginTop: '4px',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <button
                      type="button"
                      onClick={() => handleOpenRepoInspector(repo)}
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: '#34d399',
                        borderRadius: 'var(--radius-sm)',
                        padding: '3px 8px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <FileDiff size={12} />
                      <span>Inspeccionar</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={(e) => handleFetchRepo(repo, e)}
                        disabled={actionLoading === `fetch-${repo.id}`}
                        title="Ejecutar git fetch"
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-high)',
                          padding: '3px 6px',
                          fontSize: '0.65rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <RefreshCw size={10} className={actionLoading === `fetch-${repo.id}` ? 'animate-spin' : ''} />
                        <span>Fetch</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handlePullRepo(repo, e)}
                        disabled={actionLoading === `pull-${repo.id}`}
                        title="Ejecutar git pull"
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#38bdf8',
                          padding: '3px 6px',
                          fontSize: '0.65rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Download size={10} className={actionLoading === `pull-${repo.id}` ? 'animate-bounce' : ''} />
                        <span>Pull</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleOpenInEditor(repo, 'cursor', e)}
                        title="Abrir repositorio en Cursor"
                        style={{
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#34d399',
                          padding: '3px 6px',
                          fontSize: '0.65rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <Code2 size={11} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleOpenInEditor(repo, 'terminal', e)}
                        title="Abrir terminal en la ruta del repositorio"
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-high)',
                          padding: '3px 6px',
                          fontSize: '0.65rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <Terminal size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ⚡ SECCIÓN 2: Arsenal Activo (~/.agents/skills/) */}
      <div style={{ marginTop: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', padding: '0 2px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Arsenal de Habilidades del Agente ({filteredSkills.length})
          </span>
          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
            Clic en cualquier habilidad para consultar su manual operativo
          </span>
        </div>

        {filteredSkills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            No se encontraron habilidades que coincidan con "{skillSearch}"
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.5rem'
          }}>
            {filteredSkills.map((s) => (
              <div
                key={s.id}
                onClick={() => handleOpenSkill(s)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.65rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease, background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.025)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'var(--bg-card)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Zap size={12} color="#10b981" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
                        {s.name}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.58rem',
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      color: 'var(--text-muted)'
                    }}>
                      v{s.version}
                    </span>
                  </div>

                  <p style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    margin: 0,
                    lineHeight: '1.35',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {s.description || 'Sin descripción disponible.'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.62rem', color: '#52615a', borderTop: '1px solid rgba(255, 255, 255, 0.03)', paddingTop: '4px', marginTop: '2px' }}>
                  <span>{s.file_count} archivos</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Ver manual →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📖 MODAL: Lector de Manual SKILL.md */}
      {activeSkillModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)'
          }}>
            {/* Cabecera del Modal */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1.25rem',
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(0, 0, 0, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={16} color="#10b981" />
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-high)' }}>
                  {activeSkillModal.name}
                </span>
                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  SKILL.md
                </span>
              </div>

              <button
                onClick={() => setActiveSkillModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenido Markdown del Manual */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
              {loadingSkillMd ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)', gap: '8px' }}>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Cargando manual...</span>
                </div>
              ) : (
                <MarkdownViewer content={skillMarkdown} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔍 MODAL: Inspector de Repositorio en Vivo (Diff, Commits, Ramas) */}
      {activeRepoInspector && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.25rem'
        }}>
          <div style={{
            background: 'var(--bg-card, #161a19)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '920px',
            height: '86vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.85)'
          }}>
            {/* Cabecera del Inspector */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(0, 0, 0, 0.25)',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderGit2 size={16} color="#10b981" />
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-high)' }}>
                  {activeRepoInspector.name}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  ({activeRepoInspector.role})
                </span>

                {/* Selector de Rama */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                  <GitBranch size={12} color="#10b981" />
                  <select
                    value={repoDetails?.branch || activeRepoInspector.branch}
                    onChange={(e) => handleSwitchBranch(e.target.value)}
                    disabled={actionLoading === `branch-${activeRepoInspector.id}`}
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#a7f3d0',
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {(repoDetails?.branches || [activeRepoInspector.branch]).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Acciones Rápidas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleFetchRepo(activeRepoInspector)}
                  disabled={actionLoading === `fetch-${activeRepoInspector.id}`}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-high)',
                    padding: '3px 8px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={11} className={actionLoading === `fetch-${activeRepoInspector.id}` ? 'animate-spin' : ''} />
                  <span>Fetch</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePullRepo(activeRepoInspector)}
                  disabled={actionLoading === `pull-${activeRepoInspector.id}`}
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#34d399',
                    padding: '3px 8px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Download size={11} className={actionLoading === `pull-${activeRepoInspector.id}` ? 'animate-bounce' : ''} />
                  <span>Pull</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenInEditor(activeRepoInspector, 'cursor')}
                  title="Abrir en Cursor"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#38bdf8',
                    padding: '3px 7px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Code2 size={12} />
                  <span>Cursor</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenInEditor(activeRepoInspector, 'terminal')}
                  title="Abrir en Terminal (Ptyxis)"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-high)',
                    padding: '3px 7px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Terminal size={12} />
                  <span>Terminal</span>
                </button>

                <button
                  onClick={() => setActiveRepoInspector(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '4px'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Selector de Pestañas del Inspector */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.4rem 1rem',
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(0, 0, 0, 0.15)'
            }}>
              <button
                type="button"
                onClick={() => setInspectorTab('diff')}
                style={{
                  background: inspectorTab === 'diff' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  border: inspectorTab === 'diff' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                  color: inspectorTab === 'diff' ? '#34d399' : 'var(--text-muted)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FileDiff size={12} />
                <span>Diff en Vivo & Modificaciones</span>
                {repoDetails && (
                  <span style={{
                    fontSize: '0.62rem',
                    background: repoDetails.status_files.length > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: repoDetails.status_files.length > 0 ? '#fbbf24' : '#34d399',
                    padding: '1px 5px',
                    borderRadius: '10px'
                  }}>
                    {repoDetails.status_files.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setInspectorTab('commits')}
                style={{
                  background: inspectorTab === 'commits' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  border: inspectorTab === 'commits' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                  color: inspectorTab === 'commits' ? '#34d399' : 'var(--text-muted)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <GitCommit size={12} />
                <span>Historial Reciente (Últimos Commits)</span>
                {repoDetails && (
                  <span style={{
                    fontSize: '0.62rem',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-high)',
                    padding: '1px 5px',
                    borderRadius: '10px'
                  }}>
                    {repoDetails.recent_commits.length}
                  </span>
                )}
              </button>
            </div>

            {/* Contenido del Inspector */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {loadingRepoDetails ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '250px', color: 'var(--text-muted)', gap: '8px' }}>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Inspeccionando diff y ramas de Git...</span>
                </div>
              ) : inspectorTab === 'diff' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
                  {/* Advertencia TADÚ si aplica */}
                  {activeRepoInspector.warning && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 10px',
                      fontSize: '0.72rem',
                      color: '#fbbf24',
                      fontWeight: 600
                    }}>
                      <ShieldAlert size={14} flexShrink={0} />
                      <span>{activeRepoInspector.warning} — Respeta la disciplina de staging puntual.</span>
                    </div>
                  )}

                  {/* Lista de archivos modificados */}
                  {repoDetails?.status_files && repoDetails.status_files.length > 0 ? (
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                        Archivos Pendientes ({repoDetails.status_files.length}):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {repoDetails.status_files.map((f, fi) => {
                          const isUntracked = f.status === '??';
                          const isModified = f.status.includes('M');
                          const isAdded = f.status.includes('A');
                          const isDeleted = f.status.includes('D');
                          const color = isUntracked ? '#fb923c' : isModified ? '#fbbf24' : isAdded ? '#34d399' : isDeleted ? '#f87171' : 'var(--text-muted)';
                          return (
                            <span
                              key={fi}
                              style={{
                                fontSize: '0.66rem',
                                fontFamily: 'var(--font-mono)',
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <span style={{ fontWeight: 800, color }}>{f.status}</span>
                              <span style={{ color: 'var(--text-high)' }}>{f.path}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '8px 12px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#34d399',
                      fontSize: '0.74rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <CheckCircle2 size={13} />
                      <span>Árbol de trabajo 100% limpio. No hay modificaciones pendientes en disco.</span>
                    </div>
                  )}

                  {/* Visor de Diff con Resaltado de Sintaxis */}
                  {repoDetails?.diff_text ? (
                    <div style={{
                      flex: 1,
                      overflow: 'auto',
                      background: '#090d0b',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      padding: '0.75rem',
                      fontFamily: 'monospace',
                      fontSize: '0.74rem',
                      lineHeight: '1.45',
                      boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.4)'
                    }}>
                      {repoDetails.diff_text.split('\n').map((line, li) => {
                        let color = '#94a3b8';
                        let bg = 'transparent';
                        if (line.startsWith('+') && !line.startsWith('+++')) {
                          color = '#34d399';
                          bg = 'rgba(16, 185, 129, 0.1)';
                        } else if (line.startsWith('-') && !line.startsWith('---')) {
                          color = '#f87171';
                          bg = 'rgba(239, 68, 68, 0.1)';
                        } else if (line.startsWith('@@')) {
                          color = '#38bdf8';
                          bg = 'rgba(56, 189, 248, 0.07)';
                        } else if (line.startsWith('diff --git') || line.startsWith('index ')) {
                          color = '#c084fc';
                          bg = 'rgba(168, 85, 247, 0.05)';
                        }

                        return (
                          <div
                            key={li}
                            style={{
                              color,
                              background: bg,
                              padding: '1px 4px',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all'
                            }}
                          >
                            {line || ' '}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ) : (
                /* Historial de Commits */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {repoDetails?.recent_commits && repoDetails.recent_commits.length > 0 ? (
                    repoDetails.recent_commits.map((c, ci) => (
                      <div
                        key={ci}
                        style={{
                          background: 'rgba(0, 0, 0, 0.25)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                          <button
                            type="button"
                            onClick={(e) => handleCopyHash(c.hash, e)}
                            title="Copiar hash de commit"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: copiedHash === c.hash ? '#34d399' : '#38bdf8',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            {copiedHash === c.hash ? <Check size={11} /> : <Copy size={11} />}
                            <span>{c.hash}</span>
                          </button>
                          <span style={{
                            fontSize: '0.74rem',
                            color: 'var(--text-high)',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {c.message}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.66rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          <span style={{ color: '#94a3b8' }}>{c.author}</span>
                          <span style={{ color: '#52615a' }}>{c.date}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      No se encontraron commits recientes en esta rama.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔔 Toast Flotante de Notificaciones */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: toastMessage.isError ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          padding: '8px 14px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          fontSize: '0.76rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 2000,
          animation: 'fadeIn 0.2s ease'
        }}>
          {toastMessage.isError ? <AlertCircle size={14} /> : <Check size={14} />}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
