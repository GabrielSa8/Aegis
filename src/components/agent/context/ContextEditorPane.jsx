import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Zap, Brain, AlertCircle, Folder, Shield } from 'lucide-react';
import { AVAILABLE_SKILLS } from './contextConstants';
import { ContextSkillsSection } from './ContextSkillsSection';

export function ContextEditorPane({
  activeCtx,
  onUpdateActive,
  onToggleSkill,
  errorMsg
}) {
  const [skillsCatalog, setSkillsCatalog] = useState(AVAILABLE_SKILLS);
  const [pickingFolder, setPickingFolder] = useState(false);

  useEffect(() => {
    invoke('get_skills_catalog')
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          const names = list.map((s) => s.name || s).filter(Boolean);
          const merged = Array.from(new Set([...names, ...AVAILABLE_SKILLS])).sort();
          setSkillsCatalog(merged);
        }
      })
      .catch(() => {});
  }, []);

  const handlePickDirectory = async () => {
    try {
      setPickingFolder(true);
      const selected = await invoke('pick_directory', {
        title: `Directorio de Trabajo: ${activeCtx.label || 'Contexto'}`,
        defaultPath: activeCtx.path || ''
      });
      if (selected && typeof selected === 'string') {
        onUpdateActive('path', selected);
      }
    } catch (err) {
      console.warn('Selector de directorio:', err);
    } finally {
      setPickingFolder(false);
    }
  };

  return (
    <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, boxSizing: 'border-box' }}>
      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.75rem'
          }}
        >
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Nombre */}
      <div className="form-group" style={{ margin: 0 }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)', marginBottom: '4px', display: 'block' }}>
          Nombre del Contexto
        </label>
        <input
          type="text"
          value={activeCtx.label || ''}
          onChange={(e) => onUpdateActive('label', e.target.value)}
          placeholder="Ej. Mi Proyecto (Backend)"
          style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem', width: '100%', boxSizing: 'border-box' }}
        />
      </div>

      {/* Ruta del Directorio */}
      <div className="form-group" style={{ margin: 0 }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)', marginBottom: '4px', display: 'block' }}>
          Ruta del Directorio de Trabajo (cwd)
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={activeCtx.path || ''}
            onChange={(e) => onUpdateActive('path', e.target.value)}
            placeholder="~/Proyectos/mi-proyecto..."
            style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', padding: '0.45rem 0.75rem', flex: 1, minWidth: 0, boxSizing: 'border-box' }}
          />
          <button
            type="button"
            onClick={handlePickDirectory}
            disabled={pickingFolder}
            className="tactical-button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
              color: 'var(--primary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
            title="Abrir explorador del sistema para seleccionar carpeta"
          >
            <Folder size={14} />
            <span>{pickingFolder ? 'Buscando...' : 'Examinar'}</span>
          </button>
        </div>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
          El agente se ejecutará dentro de esta carpeta para leer git y archivos locales.
        </span>
      </div>

      {/* Modo de Razonamiento Predeterminado */}
      <div className="form-group" style={{ margin: 0 }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)', marginBottom: '4px', display: 'block' }}>
          Nivel Cognitivo Predeterminado (Aegis Adaptive Harness)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onUpdateActive('effort', 'auto')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 10px',
              borderRadius: 'var(--radius-md)',
              background: (!activeCtx.effort || activeCtx.effort === 'auto') ? 'color-mix(in srgb, var(--primary) 20%, transparent)' : 'rgba(255, 255, 255, 0.02)',
              border: (!activeCtx.effort || activeCtx.effort === 'auto') ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              cursor: 'pointer',
              color: 'var(--text-high)',
              textAlign: 'left'
            }}
            title="Escalado dinámico paso a paso: L1 Flash para consultas ⇄ L3 Profundo para análisis de código"
          >
            <Shield size={15} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700 }}>🛡️ Auto (Harness)</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Escalado L1⇄L3</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdateActive('effort', 'low')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 10px',
              borderRadius: 'var(--radius-md)',
              background: activeCtx.effort === 'low' ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'rgba(255, 255, 255, 0.02)',
              border: activeCtx.effort === 'low' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              cursor: 'pointer',
              color: 'var(--text-high)',
              textAlign: 'left'
            }}
            title="Forzado en baja latencia para respuestas instantáneas"
          >
            <Zap size={15} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700 }}>⚡ Flash (L1)</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Rápido / Directo</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdateActive('effort', 'high')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 10px',
              borderRadius: 'var(--radius-md)',
              background: activeCtx.effort === 'high' ? 'color-mix(in srgb, var(--secondary, #38bdf8) 18%, transparent)' : 'rgba(255, 255, 255, 0.02)',
              border: activeCtx.effort === 'high' ? '1px solid var(--secondary, #38bdf8)' : '1px solid var(--border-color)',
              cursor: 'pointer',
              color: 'var(--text-high)',
              textAlign: 'left'
            }}
            title="Forzado en razonamiento profundo exhaustivo"
          >
            <Brain size={15} color="var(--secondary, #38bdf8)" />
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700 }}>🧠 Profundo (L3)</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Thinking extendido</div>
            </div>
          </button>
        </div>
      </div>

      {/* Selector Dual de Habilidades: Por Modpack o Sueltas */}
      <ContextSkillsSection
        skillsCatalog={skillsCatalog}
        activeSkills={activeCtx.skills || []}
        onToggleSkill={onToggleSkill}
        onUpdateActive={onUpdateActive}
      />
    </div>
  );
}
