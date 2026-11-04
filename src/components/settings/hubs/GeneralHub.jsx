import React from 'react';
import { UserCheck, Check, Terminal, FolderGit2 } from 'lucide-react';
import { RESPONSE_STYLES } from '../settingsHelpers';
import { EnvironmentSettingsSection } from '../environment';
import FleetReposCard from '../FleetReposCard';

export function GeneralHub({
  config,
  setConfig,
  updateProfile,
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
  if (!config) return null;
  const profile = config.profile || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Encabezado del Hub */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-high)' }}>
          Operador & Entorno de Trabajo
        </h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
          Define tu identidad soberana, el tono de ejecución del Agente IA y tus herramientas nativas de desarrollo.
        </p>
      </div>

      {/* Grid 2 Columnas: Identidad + Estilo IA */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '16px',
        alignItems: 'start'
      }}>
        {/* Identidad del Operador */}
        <div style={{
          background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCheck size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-high)' }}>
              Identidad Técnica del Operador
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Nombre o Alias
              </label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => updateProfile({ name: e.target.value })}
                placeholder="Operador Soberano"
                style={{ fontSize: '0.78rem' }}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Especialidad / Rol Técnico
              </label>
              <input
                type="text"
                value={profile.role || ''}
                onChange={(e) => updateProfile({ role: e.target.value })}
                placeholder="Ingeniero de Software"
                style={{ fontSize: '0.78rem' }}
              />
            </div>
          </div>
          <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
            El Agente IA adapta su razonamiento y permisos a este perfil de trabajo.
          </span>
        </div>

        {/* Estilo de Respuesta del Agente IA */}
        <div style={{
          background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-high)' }}>
            Estilo de Respuesta del Agente IA
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {RESPONSE_STYLES.map((style) => {
              const isSelected = (profile.responseStyle || 'caveman') === style.id;
              return (
                <div
                  key={style.id}
                  onClick={() => updateProfile({ responseStyle: style.id })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected
                      ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
                      : 'color-mix(in srgb, var(--bg-main) 40%, transparent)',
                    border: isSelected
                      ? '1px solid var(--primary)'
                      : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isSelected ? 'var(--primary)' : 'var(--text-high)' }}>
                      {style.title}
                    </span>
                    {isSelected && <Check size={13} color="var(--primary)" />}
                  </div>
                  <p style={{ fontSize: '0.67rem', color: 'var(--text-muted)', margin: '2px 0 0 0', lineHeight: '1.2' }}>
                    {style.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Herramientas de Entorno: IDE y Terminal */}
      <div style={{
        background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
        padding: '16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Terminal size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-high)' }}>
            Entorno de Lanzamiento (IDE & Terminal Nativas)
          </span>
        </div>
        <EnvironmentSettingsSection config={config} setConfig={setConfig} />
      </div>

      {/* Flota de Repositorios Git */}
      <div style={{
        background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
        padding: '16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FolderGit2 size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-high)' }}>
            Flota de Repositorios Git Vinculados
          </span>
        </div>
        <FleetReposCard
          repos={config.gitRepos || []}
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
      </div>
    </div>
  );
}
export default GeneralHub;
