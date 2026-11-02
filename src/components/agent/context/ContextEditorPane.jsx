import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Zap, Brain, AlertCircle } from 'lucide-react';
import { AVAILABLE_SKILLS } from './contextConstants';
import { ContextSkillsSection } from './ContextSkillsSection';

export function ContextEditorPane({
  activeCtx,
  onUpdateActive,
  onToggleSkill,
  errorMsg
}) {
  const [skillsCatalog, setSkillsCatalog] = useState(AVAILABLE_SKILLS);

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

  return (
    <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.2rem', flex: 1 }}>
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
          style={{ fontSize: '0.85rem', padding: '0.5rem 0.8rem', width: '100%' }}
        />
      </div>

      {/* Ruta del Directorio */}
      <div className="form-group" style={{ margin: 0 }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)', marginBottom: '4px', display: 'block' }}>
          Ruta del Directorio de Trabajo (cwd)
        </label>
        <input
          type="text"
          value={activeCtx.path || ''}
          onChange={(e) => onUpdateActive('path', e.target.value)}
          placeholder="~/Proyectos/mi-proyecto..."
          style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', padding: '0.5rem 0.8rem', width: '100%' }}
        />
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
          El agente se ejecutará dentro de esta carpeta para leer git y archivos locales.
        </span>
      </div>

      {/* Modo de Razonamiento Predeterminado */}
      <div className="form-group" style={{ margin: 0 }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)', marginBottom: '4px', display: 'block' }}>
          Modo / Esfuerzo Predeterminado
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            type="button"
            onClick={() => onUpdateActive('effort', 'low')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: activeCtx.effort === 'low' ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'rgba(255, 255, 255, 0.02)',
              border: activeCtx.effort === 'low' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              cursor: 'pointer',
              color: 'var(--text-high)',
              textAlign: 'left'
            }}
          >
            <Zap size={16} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>⚡ Flash (Rápido)</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Consultas y comandos ágiles</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdateActive('effort', 'high')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: activeCtx.effort === 'high' ? 'color-mix(in srgb, var(--secondary) 15%, transparent)' : 'rgba(255, 255, 255, 0.02)',
              border: activeCtx.effort === 'high' ? '1px solid var(--secondary)' : '1px solid var(--border-color)',
              cursor: 'pointer',
              color: 'var(--text-high)',
              textAlign: 'left'
            }}
          >
            <Brain size={16} color="var(--secondary)" />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>🧠 Profundo (Thinking)</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Análisis exhaustivo y refactor</div>
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
