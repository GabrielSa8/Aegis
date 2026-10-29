import React from 'react';
import { Zap, Brain, Check, AlertCircle } from 'lucide-react';
import { AVAILABLE_SKILLS } from './contextConstants';

export function ContextEditorPane({
  activeCtx,
  onUpdateActive,
  onToggleSkill,
  errorMsg
}) {
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
              background: activeCtx.effort === 'low' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
              border: activeCtx.effort === 'low' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              cursor: 'pointer',
              color: 'var(--text-high)',
              textAlign: 'left'
            }}
          >
            <Zap size={16} color="#10b981" />
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
              background: activeCtx.effort === 'high' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.02)',
              border: activeCtx.effort === 'high' ? '1px solid #a855f7' : '1px solid var(--border-color)',
              cursor: 'pointer',
              color: 'var(--text-high)',
              textAlign: 'left'
            }}
          >
            <Brain size={16} color="#a855f7" />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>🧠 Profundo (Thinking)</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Análisis exhaustivo y refactor</div>
            </div>
          </button>
        </div>
      </div>

      {/* Skills Vinculadas */}
      <div className="form-group" style={{ margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)', margin: 0 }}>
            Skills Vinculadas al Perfil ({activeCtx.skills?.length || 0} activas)
          </label>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Catálogo local de 20 skills
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            maxHeight: '170px',
            overflowY: 'auto',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          {AVAILABLE_SKILLS.map((skill) => {
            const isChecked = (activeCtx.skills || []).includes(skill);
            return (
              <button
                key={skill}
                type="button"
                onClick={() => onToggleSkill(skill)}
                style={{
                  fontSize: '0.7rem',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: isChecked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: isChecked ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isChecked ? '#a7f3d0' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'var(--transition)'
                }}
              >
                {isChecked && <Check size={11} color="#10b981" />}
                <span>{skill}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
