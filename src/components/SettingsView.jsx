import { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Palette, 
  HardDrive, 
  Bot, 
  GitBranch, 
  Bell, 
  Gamepad2, 
  Save, 
  RotateCcw, 
  Check, 
  Plus, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  Sliders, 
  Keyboard, 
  Zap, 
  Folder, 
  X,
  Gauge
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';

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

const EMOJI_AVATARS = ['🛡️', '⚡', '💻', '🚀', '🦾', '🧠', '🎯', '🌌', '🕹️', '⚔️', '🦅', '🔥'];

const BILLING_LINKS = [
  { name: 'Google AI Studio', url: 'https://aistudio.google.com/', desc: 'Gemini API & Cuotas' },
  { name: 'Anthropic Console', url: 'https://console.anthropic.com/', desc: 'Claude API & Facturación' },
  { name: 'OpenAI Platform', url: 'https://platform.openai.com/usage', desc: 'GPT-4o & Consumo' },
  { name: 'OpenRouter Credits', url: 'https://openrouter.ai/credits', desc: 'Balance Multi-Proveedor' },
  { name: 'DeepSeek Platform', url: 'https://platform.deepseek.com/', desc: 'DeepSeek-V3 / R1 Cuotas' }
];

const MASTER_SHORTCUTS = [
  { key: 'Alt + 1..8', desc: 'Navegación instantánea entre pestañas de Aegis' },
  { key: 'Ctrl + K', desc: 'Abrir Paleta de Comandos Omnibar & Buscador' },
  { key: 'Alt + Z', desc: 'Modo Zen: Ocultar barra superior para 100% de pantalla' },
  { key: 'Ctrl + B', desc: 'Alternar panel lateral de carpetas en Bóveda' },
  { key: 'Ctrl + ,', desc: 'Acceso directo a este Centro de Configuración' },
  { key: 'Esc', desc: 'Cerrar modales, búsqueda o restaurar de Modo Zen' }
];

export default function SettingsView({ onClose, currentTheme, onThemeChange, isFullView = false }) {
  const [activeSection, setActiveSection] = useState('profile');
  const [config, setConfig] = useState(null);
  const [storageStats, setStorageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);
  const [purgeStatus, setPurgeStatus] = useState(null);

  // Formulario nuevo repositorio
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoPath, setNewRepoPath] = useState('');
  const [newRepoRole, setNewRepoRole] = useState('');
  const [newRepoWarning, setNewRepoWarning] = useState('');

  // Carga de configuración y estadísticas
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [cfg, stats] = await Promise.all([
        invoke('get_aegis_config').catch(() => null),
        invoke('get_storage_stats').catch(() => null)
      ]);
      setConfig(cfg);
      setStorageStats(stats);
    } catch (e) {
      console.error('Error cargando configuración:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Selección de tema
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

  // Cambio de escala de interfaz (Escalado DPI armónico y proporcional)
  const handleScaleChange = (scale) => {
    if (!config) return;
    const s = Number(scale) || 1.0;
    const updated = { ...config, uiScale: s };
    setConfig(updated);
    document.documentElement.style.zoom = '';
    document.documentElement.style.fontSize = `${16 * s}px`;
    document.documentElement.style.setProperty('--ui-scale', String(s));
    invoke('save_aegis_config', { config: updated }).catch(console.error);
  };

  // Guardar configuración completa
  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      const res = await invoke('save_aegis_config', { config });
      setConfig(res);
      setSaveStatus('Configuración soberana persistida con éxito.');
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (e) {
      setSaveStatus(`Error guardando: ${e}`);
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  // Purgar cachés temporales
  const handlePurgeCaches = async () => {
    try {
      const bytes = await invoke('purge_app_caches');
      const mb = (bytes / (1024 * 1024)).toFixed(2);
      setPurgeStatus(`Caché purgada: ${mb} MB liberados.`);
      loadData();
      setTimeout(() => setPurgeStatus(null), 3500);
    } catch (e) {
      setPurgeStatus(`Error: ${e}`);
      setTimeout(() => setPurgeStatus(null), 3500);
    }
  };

  // Repositorios
  const handleAddRepo = () => {
    if (!newRepoName.trim() || !newRepoPath.trim()) return;
    const newRepo = {
      id: `repo_${Date.now()}`,
      name: newRepoName.trim(),
      path: newRepoPath.trim(),
      role: newRepoRole.trim() || 'Proyecto Local',
      warning: newRepoWarning.trim() || null
    };
    setConfig(prev => ({
      ...prev,
      gitRepos: [...(prev.gitRepos || []), newRepo]
    }));
    setNewRepoName('');
    setNewRepoPath('');
    setNewRepoRole('');
    setNewRepoWarning('');
  };

  const handleRemoveRepo = (id) => {
    setConfig(prev => ({
      ...prev,
      gitRepos: (prev.gitRepos || []).filter(r => r.id !== id)
    }));
  };

  const handleOpenExternal = (url) => {
    openUrl(url).catch(() => window.open(url, '_blank'));
  };

  const sections = [
    { id: 'profile', label: 'Identidad & Perfil', icon: User },
    { id: 'appearance', label: 'Apariencia & Escala', icon: Palette },
    { id: 'storage', label: 'Rutas & Almacenamiento', icon: HardDrive },
    { id: 'ai', label: 'Motores IA & Presupuesto', icon: Bot },
    { id: 'devops', label: 'Flota Git & DevOps', icon: GitBranch },
    { id: 'notifications', label: 'Notificaciones SO', icon: Bell },
    { id: 'gaming', label: 'Modo Gaming', icon: Gamepad2 }
  ];

  // Helper para bytes legibles
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      maxWidth: '100%',
      maxHeight: '100%',
      background: 'var(--bg-main)',
      color: 'var(--text-high)',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* 🛡️ Header de Configuración */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 1.25rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(0,0,0,0.25)',
        flexShrink: 0,
        width: '100%',
        boxSizing: 'border-box',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <Sliders size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#fff', whiteSpace: 'nowrap' }}>
                Centro de Configuración & Soberanía del Sistema
              </h2>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                color: 'var(--primary)',
                background: 'var(--primary-glow)',
                padding: '0.1rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--primary)',
                whiteSpace: 'nowrap'
              }}>
                v2.8.0
              </span>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', whiteSpace: 'nowrap' }}>
              Ajustes globales, identidad, rutas de datos soberanas y presupuesto de recursos.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {saveStatus && (
            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {saveStatus}
            </span>
          )}
          <button
            onClick={handleSaveConfig}
            className="btn btn-primary"
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.74rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Save size={13} />
            <span>Guardar Todo</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="btn btn-secondary btn-icon"
              style={{ width: '1.75rem', height: '1.75rem' }}
              title="Cerrar (Esc)"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 🧭 Panel Dividido: Subnavegación Lateral + Contenido */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}>
        {/* Barra Lateral de Secciones */}
        <div style={{
          width: '13.5rem',
          borderRight: '1px solid var(--border-color)',
          background: 'rgba(0,0,0,0.15)',
          padding: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          flexShrink: 0
        }}>
          {sections.map(sec => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'var(--primary-glow)' : 'transparent',
                  border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                  color: isActive ? 'var(--text-high)' : 'var(--text-muted)',
                  fontSize: '0.74rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.12s ease'
                }}
              >
                <Icon size={14} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                <span>{sec.label}</span>
              </button>
            );
          })}

          <div style={{ marginTop: 'auto', padding: '8px 4px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.64rem' }}>
              <ShieldCheck size={12} color="var(--primary)" />
              <span>Cero Hardcode · 100% Soberano</span>
            </div>
          </div>
        </div>

        {/* Área de Configuración Activa */}
        <div style={{
          flex: 1,
          minWidth: 0,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {loading && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Cargando parámetros del sistema...
            </div>
          )}

          {/* ================= 👤 SECCIÓN 1: PERFIL & IDENTIDAD ================= */}
          {!loading && activeSection === 'profile' && config && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '720px' }}>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>
                  Identidad del Operador & Estilo de Trabajo
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                  Configura tu perfil soberano y las directrices para la interacción del agente.
                </p>
              </div>

              {/* Selector de Avatar Emoji */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Avatar / Emblema
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {EMOJI_AVATARS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setConfig({
                        ...config,
                        profile: { ...(config.profile || {}), avatarEmoji: emoji }
                      })}
                      style={{
                        fontSize: '1.25rem',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: config.profile?.avatarEmoji === emoji ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
                        border: config.profile?.avatarEmoji === emoji ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        cursor: 'pointer'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre y Rol */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Nombre o Alias</label>
                  <input
                    type="text"
                    value={config.profile?.name || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      profile: { ...(config.profile || {}), name: e.target.value }
                    })}
                    placeholder="Operador Soberano"
                    style={{ fontSize: '0.78rem' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Especialidad / Rol Profesional</label>
                  <input
                    type="text"
                    value={config.profile?.role || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      profile: { ...(config.profile || {}), role: e.target.value }
                    })}
                    placeholder="Ingeniero de Software"
                    style={{ fontSize: '0.78rem' }}
                  />
                </div>
              </div>

              {/* Modo de Comunicación del Agente */}
              <div className="form-group">
                <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                  Estilo de Respuesta Preferido del Agente IA
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  {[
                    { id: 'caveman', title: 'Caveman Full', desc: 'Ultra-comprimido, directo al código o comando, cero relleno.' },
                    { id: 'technical', title: 'Técnico Conciso', desc: 'Respuestas precisas con arquitectura y trade-offs técnicos.' },
                    { id: 'detailed', title: 'Formativo & Detallado', desc: 'Explicaciones paso a paso, razonamiento y contexto amplio.' }
                  ].map(style => {
                    const isSelected = (config.profile?.responseStyle || 'caveman') === style.id;
                    return (
                      <div
                        key={style.id}
                        onClick={() => setConfig({
                          ...config,
                          profile: { ...(config.profile || {}), responseStyle: style.id }
                        })}
                        style={{
                          padding: '10px',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isSelected ? 'var(--primary)' : '#fff' }}>
                            {style.title}
                          </span>
                          {isSelected && <Check size={12} color="var(--primary)" />}
                        </div>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.15' }}>
                          {style.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cheat Sheet de Atajos de Teclado */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Keyboard size={14} color="var(--primary)" />
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fff' }}>
                    Atajos Maestros de Teclado (Cheat Sheet)
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '6px' }}>
                  {MASTER_SHORTCUTS.map(sc => (
                    <div
                      key={sc.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.7rem'
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>{sc.desc}</span>
                      <kbd style={{
                        background: 'rgba(255,255,255,0.08)',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        color: 'var(--primary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.66rem',
                        fontWeight: 700
                      }}>
                        {sc.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= 🎨 SECCIÓN 2: APARIENCIA & ESCALA ================= */}
          {!loading && activeSection === 'appearance' && config && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '780px' }}>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>
                  Esquemas de Color Tácticos
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                  Personaliza la paleta visual para optimizar el contraste y el confort de lectura.
                </p>
              </div>

              {/* Grid de Temas */}
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
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: theme.card, border: '1px solid #444' }} title="Superficie" />
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: theme.accent }} title="Acento" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Escala de Interfaz / Zoom DPI */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '0.25rem' }}>
                  Escala de Interfaz (Zoom DPI Proporcional)
                </span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 0 0.65rem 0' }}>
                  Ajusta la densidad visual y tipográfica sin desbordar los límites de la ventana.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    { label: '90% Compacto', val: 0.9 },
                    { label: '100% Estándar', val: 1.0 },
                    { label: '110% Cómodo', val: 1.1 },
                    { label: '120% Amplio', val: 1.2 }
                  ].map(scale => {
                    const isSelected = Math.abs((config.uiScale || 1.0) - scale.val) < 0.02;
                    return (
                      <button
                        key={scale.val}
                        onClick={() => handleScaleChange(scale.val)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                          color: isSelected ? 'var(--text-high)' : 'var(--text-muted)',
                          fontSize: '0.74rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {isSelected && <Check size={12} color="var(--primary)" />}
                        <span>{scale.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= 📂 SECCIÓN 3: RUTAS & ALMACENAMIENTO ================= */}
          {!loading && activeSection === 'storage' && config && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '780px' }}>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>
                  Rutas y Almacenamiento Soberano
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                  Aegis opera sin intermediarios de nube. Todos los datos residen en el sistema local de archivos.
                </p>
              </div>

              {/* Métricas de Almacenamiento */}
              {storageStats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block' }}>Bóveda Obsidian</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {storageStats.vaultNotesCount} notas .md
                    </span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {storageStats.vaultPath}
                    </span>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block' }}>Base de Datos SQLite</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#60a5fa' }}>
                      {formatBytes(storageStats.dbSizeBytes)}
                    </span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {storageStats.dbPath}
                    </span>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block' }}>Caché Temporal</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fbbf24' }}>
                      {formatBytes(storageStats.cacheSizeBytes)}
                    </span>
                    <button
                      onClick={handlePurgeCaches}
                      style={{
                        marginTop: '4px',
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-muted)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.64rem',
                        cursor: 'pointer'
                      }}
                    >
                      Purgar Cachés
                    </button>
                  </div>
                </div>
              )}

              {purgeStatus && (
                <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                  {purgeStatus}
                </span>
              )}

              {/* Input de Bóveda Obsidian */}
              <div className="form-group">
                <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                  Ruta Local de la Bóveda de Obsidian
                </label>
                <input
                  type="text"
                  value={config.vaultPath}
                  onChange={(e) => setConfig({ ...config, vaultPath: e.target.value })}
                  placeholder="/home/usuario/Documentos/Mi Bóveda"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
                />
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Aegis lee y escribe directamente sobre los archivos Markdown sin sincronizaciones opacas.
                </p>
              </div>
            </div>
          )}

          {/* ================= 🤖 SECCIÓN 4: MOTORES IA & PRESUPUESTO ================= */}
          {!loading && activeSection === 'ai' && config && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '780px' }}>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>
                  Hub de Motores IA & Presupuesto de Tokens
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                  Controla qué agente ejecuta tus tareas y define topes para prevenir sobrecostos de API.
                </p>
              </div>

              {/* Selector de Agente */}
              <div className="form-group">
                <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Motor de Agente Activo</label>
                <select
                  value={config.agentType}
                  onChange={(e) => setConfig({ ...config, agentType: e.target.value })}
                  style={{ fontSize: '0.78rem' }}
                >
                  <option value="agy">Google Antigravity CLI (agy) — Integrado nativo</option>
                  <option value="claude">Claude Code (claude)</option>
                  <option value="ollama">Ollama Local (Offline / Privado)</option>
                  <option value="custom">Comando Shell Personalizado</option>
                </select>
              </div>

              {config.agentType === 'custom' && (
                <div className="form-group">
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Comando de Ejecución del Agente</label>
                  <input
                    type="text"
                    value={config.agentCustomCmd || ''}
                    onChange={(e) => setConfig({ ...config, agentCustomCmd: e.target.value })}
                    placeholder="ej. /usr/local/bin/custom-agent --stream"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
                  />
                </div>
              )}

              {/* Presupuesto de Tokens */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Gauge size={14} color="var(--primary)" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                    Control de Presupuesto & Topes de Consumo
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.7rem' }}>Límite Diario (Tokens)</label>
                    <input
                      type="number"
                      value={config.tokenBudget?.dailyLimit || 100000}
                      onChange={(e) => setConfig({
                        ...config,
                        tokenBudget: { ...(config.tokenBudget || {}), dailyLimit: Number(e.target.value) }
                      })}
                      style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.7rem' }}>Límite Semanal (Tokens)</label>
                    <input
                      type="number"
                      value={config.tokenBudget?.weeklyLimit || 500000}
                      onChange={(e) => setConfig({
                        ...config,
                        tokenBudget: { ...(config.tokenBudget || {}), weeklyLimit: Number(e.target.value) }
                      })}
                      style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.7rem' }}>Umbral de Alerta (%)</label>
                    <input
                      type="number"
                      value={config.tokenBudget?.warnThresholdPercent || 80}
                      onChange={(e) => setConfig({
                        ...config,
                        tokenBudget: { ...(config.tokenBudget || {}), warnThresholdPercent: Number(e.target.value) }
                      })}
                      style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Consolas Oficiales de Facturación */}
              <div>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '6px' }}>
                  Consolas Oficiales de Facturación y Cuotas
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px' }}>
                  {BILLING_LINKS.map(link => (
                    <div
                      key={link.name}
                      onClick={() => handleOpenExternal(link.url)}
                      style={{
                        padding: '8px 10px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fff', display: 'block' }}>
                          {link.name}
                        </span>
                        <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                          {link.desc}
                        </span>
                      </div>
                      <ExternalLink size={12} color="var(--primary)" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= 🌿 SECCIÓN 5: FLOTA GIT & DEVOPS ================= */}
          {!loading && activeSection === 'devops' && config && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '780px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>
                    Flota de Repositorios Vigilados ({config.gitRepos?.length || 0})
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                    Controla los repositorios monitoreados en el radar DevOps y sus políticas de commit.
                  </p>
                </div>
              </div>

              {/* Lista de Repositorios */}
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
                      {repo.warning && (
                        <span style={{ display: 'block', fontSize: '0.64rem', color: '#ef4444', fontWeight: 600, marginTop: '2px' }}>
                          ⚠️ {repo.warning}
                        </span>
                      )}
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

              {/* Añadir Nuevo Repositorio */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '8px' }}>
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
                    placeholder="Rol (ej. Backend / Móvil)"
                    style={{ fontSize: '0.75rem' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={newRepoPath}
                    onChange={(e) => setNewRepoPath(e.target.value)}
                    placeholder="Ruta local absoluta (ej. /home/usuario/proyectos/app)"
                    style={{ flex: 1, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newRepoWarning}
                    onChange={(e) => setNewRepoWarning(e.target.value)}
                    placeholder="Advertencia preventiva opcional (ej. Nunca usar git add -A)"
                    style={{ flex: 1, fontSize: '0.72rem' }}
                  />
                  <button
                    onClick={handleAddRepo}
                    className="btn btn-secondary"
                    style={{ padding: '4px 12px', fontSize: '0.72rem' }}
                  >
                    <Plus size={12} />
                    <span>Añadir</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 🔔 SECCIÓN 6: NOTIFICACIONES ================= */}
          {!loading && activeSection === 'notifications' && config && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '720px' }}>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>
                  Centro de Notificaciones Nativas del SO
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                  Activa alertas preventivas de escritorio para eventos críticos sin saturación sensorial.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  {
                    id: 'sentinelTempAlert',
                    title: 'Alerta Térmica de Centinela (> 85°C)',
                    desc: 'Notifica inmediatamente si la CPU alcanza umbrales de sobrecalentamiento o estrangulamiento térmico.'
                  },
                  {
                    id: 'taskDeadlinesAlert',
                    title: 'Recordatorio de Tareas Próximas a Vencer',
                    desc: 'Avisa sobre compromisos y checkboxes con fecha límite programada para hoy.'
                  },
                  {
                    id: 'financeCutoffsAlert',
                    title: 'Recordatorio de Cortes de Tarjetas y Pagos Fijos',
                    desc: 'Avisa con 48 horas de antelación sobre fechas de corte quincenales y mensuales.'
                  },
                  {
                    id: 'gitBranchAlerts',
                    title: 'Avisos de Divergencia Git (Ahead / Behind)',
                    desc: 'Alerta cuando una rama local esté detrás del remoto para evitar conflictos.'
                  }
                ].map(notif => {
                  const isChecked = config.notifications?.[notif.id] ?? true;
                  return (
                    <label
                      key={notif.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setConfig({
                          ...config,
                          notifications: {
                            ...(config.notifications || {}),
                            [notif.id]: e.target.checked
                          }
                        })}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', display: 'block' }}>
                          {notif.title}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {notif.desc}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= 🎮 SECCIÓN 7: MODO GAMING ================= */}
          {!loading && activeSection === 'gaming' && config && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '720px' }}>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>
                  Modo Gaming & Aceleración de Hardware
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                  Preconfigura las capas de aceleración agnóstica para tus lanzadores.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.enableGamemode}
                    onChange={(e) => setConfig({ ...config, enableGamemode: e.target.checked })}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', display: 'block' }}>
                      Activar Feral GameMode (`gamemoderun`) por defecto
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Optimiza el planificador del kernel (SCHED_ISO), gobernador de CPU e I/O de disco al ejecutar cualquier juego.
                    </span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.enableGamescopeFsr}
                    onChange={(e) => setConfig({ ...config, enableGamescopeFsr: e.target.checked })}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', display: 'block' }}>
                      Forzar escalado Gamescope FSR (720p 60fps → 1080p)
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Renderiza a resolución interna reducida aplicando AMD FidelityFX Super Resolution de forma transparente.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isFullView) {
    return content;
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-content glass" style={{ maxWidth: '920px', width: '92%', height: '88vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
        {content}
      </div>
    </div>
  );
}
