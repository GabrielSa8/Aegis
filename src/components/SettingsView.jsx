import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Palette, 
  BookOpen, 
  Bot, 
  GitBranch, 
  Gamepad2, 
  Save, 
  RotateCcw, 
  Check, 
  Folder, 
  Plus, 
  Trash2, 
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

const THEMES = [
  {
    id: 'nordic-moss',
    name: 'Nordic Slate & Moss',
    desc: 'Verde esmeralda salvia sobre pizarra nórdica. Alta densidad y concentración.',
    bg: '#0f1211',
    card: '#161a19',
    accent: '#10b981'
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    desc: 'Índigo profundo con acentos cian y violeta neón estilo cyberpunk.',
    bg: '#13141f',
    card: '#1a1b26',
    accent: '#7dcfff'
  },
  {
    id: 'oled-black',
    name: 'OLED Pure Black',
    desc: 'Negro puro al 100% con contraste esmeralda láser. Máximo ahorro energético.',
    bg: '#000000',
    card: '#0a0a0a',
    accent: '#00ff88'
  },
  {
    id: 'amber-terminal',
    name: 'Amber Terminal',
    desc: 'Monocromo hacker ámbar cálido sobre carbón ultra-oscuro.',
    bg: '#0a0802',
    card: '#141005',
    accent: '#f59e0b'
  },
  {
    id: 'dracula',
    name: 'Dracula Dark',
    desc: 'Gótico elegante con tonos púrpura y magenta vampírico.',
    bg: '#21222c',
    card: '#282a36',
    accent: '#bd93f9'
  }
];

export default function SettingsView({ onClose, currentTheme, onThemeChange }) {
  const [activeTab, setActiveTab] = useState('appearance'); // 'appearance' | 'vault' | 'agent' | 'devops' | 'gaming'
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);

  // New Repo Form State
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoPath, setNewRepoPath] = useState('');
  const [newRepoRole, setNewRepoRole] = useState('');

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const cfg = await invoke('get_aegis_config');
        setConfig(cfg);
      } catch (e) {
        console.error('Error cargando configuración:', e);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSelectTheme = async (themeId) => {
    onThemeChange(themeId);
    if (config) {
      const updated = { ...config, theme: themeId };
      setConfig(updated);
      try {
        await invoke('save_aegis_config', { config: updated });
      } catch (e) {
        console.error('Error guardando tema:', e);
      }
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      const res = await invoke('save_aegis_config', { config });
      setConfig(res);
      setSaveStatus('Guardado correctamente en $XDG_CONFIG_HOME/aegis/config.json');
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (e) {
      setSaveStatus(`Error guardando: ${e}`);
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  const handleAddRepo = () => {
    if (!newRepoName.trim() || !newRepoPath.trim()) return;
    const newRepo = {
      id: `repo_${Date.now()}`,
      name: newRepoName.trim(),
      path: newRepoPath.trim(),
      role: newRepoRole.trim() || 'Proyecto Local',
      warning: null
    };
    setConfig(prev => ({
      ...prev,
      gitRepos: [...(prev.gitRepos || []), newRepo]
    }));
    setNewRepoName('');
    setNewRepoPath('');
    setNewRepoRole('');
  };

  const handleRemoveRepo = (id) => {
    setConfig(prev => ({
      ...prev,
      gitRepos: (prev.gitRepos || []).filter(r => r.id !== id)
    }));
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-content glass" style={{ maxWidth: '780px', width: '92%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: '0' }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SettingsIcon size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              Ajustes y Configuración Global de Aegis
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-icon"
            style={{ width: '28px', height: '28px' }}
            title="Cerrar (Esc)"
          >
            <X size={14} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '8px 18px',
          background: 'rgba(0,0,0,0.1)',
          borderBottom: '1px solid var(--border-color)',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'appearance', label: 'Apariencia & Temas', icon: Palette },
            { id: 'vault', label: 'Bóveda Obsidian', icon: BookOpen },
            { id: 'agent', label: 'Agente de IA', icon: Bot },
            { id: 'devops', label: 'Repositorios Git', icon: GitBranch },
            { id: 'gaming', label: 'Modo Gaming', icon: Gamepad2 }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--primary-glow)' : 'transparent',
                  border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                  color: isActive ? 'var(--text-high)' : 'var(--text-muted)',
                  fontSize: '0.74rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                <Icon size={13} color={isActive ? 'var(--primary)' : '#9ca3af'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* ================= 🎨 PESTAÑA 1: APARIENCIA & TEMAS ================= */}
          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'block' }}>
                  Esquemas de Color Tácticos
                </span>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  El cambio de tema se aplica instantáneamente y persiste en tu configuración local.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {THEMES.map(theme => {
                  const isSelected = currentTheme === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme.id)}
                      style={{
                        background: theme.bg,
                        border: isSelected ? `2px solid ${theme.accent}` : '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '8px',
                        boxShadow: isSelected ? `0 0 12px ${theme.accent}33` : 'none'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>
                            {theme.name}
                          </span>
                          {isSelected && <Check size={14} color={theme.accent} />}
                        </div>
                        <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: '4px 0 0 0', lineHeight: '1.15rem' }}>
                          {theme.desc}
                        </p>
                      </div>

                      {/* Swatches */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: theme.bg, border: '1px solid #444' }} title="Fondo" />
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: theme.card, border: '1px solid #444' }} title="Tarjetas" />
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: theme.accent }} title="Acento Primario" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= 📚 PESTAÑA 2: BÓVEDA OBSIDIAN ================= */}
          {activeTab === 'vault' && config && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                  Ruta Local de la Bóveda de Obsidian
                </label>
                <input
                  type="text"
                  value={config.vaultPath}
                  onChange={(e) => setConfig({ ...config, vaultPath: e.target.value })}
                  placeholder="/home/usuario/Documentos/Mi Boveda"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Aegis lee y escribe directamente sobre los archivos `.md` de esta carpeta sin duplicar almacenamiento.
                </p>
              </div>
            </div>
          )}

          {/* ================= 🤖 PESTAÑA 3: AGENTE DE IA ================= */}
          {activeTab === 'agent' && config && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                  Motor de Agente CLI Preferido
                </label>
                <select
                  value={config.agentType}
                  onChange={(e) => setConfig({ ...config, agentType: e.target.value })}
                >
                  <option value="agy">Google Antigravity CLI (agy) — Integrado nativo</option>
                  <option value="claude">Claude Code (claude)</option>
                  <option value="ollama">Ollama Local (CLI)</option>
                  <option value="custom">Comando Shell Personalizado</option>
                </select>
              </div>

              {config.agentType === 'custom' && (
                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                    Comando de Ejecución del Agente
                  </label>
                  <input
                    type="text"
                    value={config.agentCustomCmd || ''}
                    onChange={(e) => setConfig({ ...config, agentCustomCmd: e.target.value })}
                    placeholder="ej. /usr/local/bin/my-agent --prompt"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ================= 🌿 PESTAÑA 4: REPOSITORIOS GIT ================= */}
          {activeTab === 'devops' && config && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                  Flota de Repositorios Vigilados ({config.gitRepos?.length || 0})
                </span>
              </div>

              {/* Lista de Repos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(config.gitRepos || []).map(repo => (
                  <div
                    key={repo.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{repo.name}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>({repo.role})</span>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {repo.path}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveRepo(repo.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      title="Eliminar de la vigilancia"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Agregar Nuevo Repo Form */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '8px' }}>
                  + Añadir Repositorio a la Flota
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                    placeholder="Nombre del Repo (ej. Mi App)"
                    style={{ fontSize: '0.75rem' }}
                  />
                  <input
                    type="text"
                    value={newRepoRole}
                    onChange={(e) => setNewRepoRole(e.target.value)}
                    placeholder="Rol (ej. Backend / Web)"
                    style={{ fontSize: '0.75rem' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newRepoPath}
                    onChange={(e) => setNewRepoPath(e.target.value)}
                    placeholder="Ruta local absoluta (ej. /home/usuario/proyectos/miapp)"
                    style={{ flex: 1, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}
                  />
                  <button
                    onClick={handleAddRepo}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                  >
                    <Plus size={12} />
                    <span>Añadir</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 🎮 PESTAÑA 5: MODO GAMING ================= */}
          {activeTab === 'gaming' && config && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem', color: '#fff' }}>
                  <input
                    type="checkbox"
                    checked={config.enableGamemode}
                    onChange={(e) => setConfig({ ...config, enableGamemode: e.target.checked })}
                  />
                  <span>Activar Feral GameMode (`gamemoderun`) por defecto al lanzar juegos</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem', color: '#fff' }}>
                  <input
                    type="checkbox"
                    checked={config.enableGamescopeFsr}
                    onChange={(e) => setConfig({ ...config, enableGamescopeFsr: e.target.checked })}
                  />
                  <span>Forzar escalado Gamescope FSR (720p 60fps → 1080p)</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 18px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <div>
            {saveStatus && (
              <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                {saveStatus}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.75rem' }}>
              Cerrar
            </button>
            <button onClick={handleSaveConfig} className="btn btn-primary" style={{ padding: '5px 14px', fontSize: '0.75rem' }}>
              <Save size={13} />
              <span>Guardar Ajustes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
