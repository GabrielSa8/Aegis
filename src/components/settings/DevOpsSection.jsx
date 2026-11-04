import { useState } from 'react';
import { Terminal, GitBranch } from 'lucide-react';
import FleetReposCard from './FleetReposCard';
import { EnvironmentSettingsSection } from './environment';

export default function DevOpsSection({
  config,
  setConfig,
  newRepoName,
  setNewRepoName,
  newRepoPath,
  setNewRepoPath,
  newRepoRole,
  setNewRepoRole,
  newRepoWarning,
  setNewRepoWarning,
  onAddRepo,
  onRemoveRepo
}) {
  const [subTab, setSubTab] = useState('environment'); // 'environment' | 'fleet'

  if (!config) return null;
  const repos = config.gitRepos || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '780px' }}>
      {/* Sub-navegación Táctica */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button
          onClick={() => setSubTab('environment')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            background: subTab === 'environment' ? 'var(--primary-glow)' : 'transparent',
            border: subTab === 'environment' ? '1px solid var(--primary)' : '1px solid transparent',
            color: subTab === 'environment' ? 'var(--text-high)' : 'var(--text-muted)',
            fontSize: '0.75rem',
            fontWeight: subTab === 'environment' ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Terminal size={13} color={subTab === 'environment' ? 'var(--primary)' : 'var(--text-muted)'} />
          <span>IDE & Terminal</span>
        </button>

        <button
          onClick={() => setSubTab('fleet')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            background: subTab === 'fleet' ? 'var(--primary-glow)' : 'transparent',
            border: subTab === 'fleet' ? '1px solid var(--primary)' : '1px solid transparent',
            color: subTab === 'fleet' ? 'var(--text-high)' : 'var(--text-muted)',
            fontSize: '0.75rem',
            fontWeight: subTab === 'fleet' ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <GitBranch size={13} color={subTab === 'fleet' ? 'var(--primary)' : 'var(--text-muted)'} />
          <span>Flota de Repositorios ({repos.length})</span>
        </button>
      </div>

      {subTab === 'environment' ? (
        <EnvironmentSettingsSection config={config} setConfig={setConfig} />
      ) : (
        <FleetReposCard
          repos={repos}
          newRepoName={newRepoName}
          setNewRepoName={setNewRepoName}
          newRepoPath={newRepoPath}
          setNewRepoPath={setNewRepoPath}
          newRepoRole={newRepoRole}
          setNewRepoRole={setNewRepoRole}
          newRepoWarning={newRepoWarning}
          setNewRepoWarning={setNewRepoWarning}
          onAddRepo={onAddRepo}
          onRemoveRepo={onRemoveRepo}
        />
      )}
    </div>
  );
}
