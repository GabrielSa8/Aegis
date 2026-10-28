import { useState } from 'react';
import { X, Plus, Trash2, Check, Folder, Zap, Brain, Shield, Sparkles } from 'lucide-react';

export const AVAILABLE_SKILLS = [
  'tadu-backend',
  'jetpack-compose-patterns',
  'obsidian-vault-architect',
  'react-ts-performance',
  'clean-code-security',
  'tdd-practitioner',
  'frontend-design',
  'impeccable',
  'ponytail',
  'superpowers',
  'browser-automation',
  'diagram-design',
  'feynman-technique-mentor',
  'find-skills',
  'spaced-repetition-generator',
  'project-architect-ideation',
  'project-postmortem-retrospective',
  'skill-project-router',
  'cavecrew',
  'caveman'
];

export const DEFAULT_CONTEXTS = [
  {
    id: 'general',
    label: 'General',
    path: '/home/zabrielsa/.local/share/aegis/contexts/general',
    effort: 'low',
    skills: ['obsidian-vault-architect', 'caveman']
  },
  {
    id: 'tadu',
    label: 'TADÚ (SAM)',
    path: '/home/zabrielsa/Proyects/projects/TADU',
    effort: 'high',
    skills: ['tadu-backend', 'clean-code-security', 'tdd-practitioner']
  },
  {
    id: 'meli',
    label: 'MELI Hub',
    path: '/home/zabrielsa/Documentos/Obsidian Vault/01 Operaciones MELI',
    effort: 'low',
    skills: ['obsidian-vault-architect']
  },
  {
    id: 'granja',
    label: 'Granja (Kotlin)',
    path: '/home/zabrielsa/AndroidStudioProjects/granja',
    effort: 'high',
    skills: ['jetpack-compose-patterns', 'clean-code-security']
  },
  {
    id: 'vault',
    label: 'BrainIA (Bóveda)',
    path: '/home/zabrielsa/Documentos/Obsidian Vault',
    effort: 'low',
    skills: ['obsidian-vault-architect', 'feynman-technique-mentor']
  },
  {
    id: 'aegis',
    label: 'Aegis Core',
    path: '/home/zabrielsa/Proyects/projects/Aegis',
    effort: 'high',
    skills: ['react-ts-performance', 'impeccable', 'frontend-design']
  }
];

export default function ContextManagerModal({
  isOpen,
  onClose,
  contexts,
  onSaveContexts,
  currentContextId,
  onSelectContext
}) {
  const [editingList, setEditingList] = useState(contexts || DEFAULT_CONTEXTS);
  const [selectedId, setSelectedId] = useState(currentContextId || 'general');

  if (!isOpen) return null;

  const activeCtx = editingList.find((c) => c.id === selectedId) || editingList[0] || {
    id: 'nuevo',
    label: 'Nuevo Contexto',
    path: '/home/zabrielsa',
    effort: 'low',
    skills: []
  };

  const handleUpdateActive = (key, value) => {
    setEditingList((prev) =>
      prev.map((item) => (item.id === selectedId ? { ...item, [key]: value } : item))
    );
  };

  const handleToggleSkill = (skill) => {
    const currentSkills = activeCtx.skills || [];
    const nextSkills = currentSkills.includes(skill)
      ? currentSkills.filter((s) => s !== skill)
      : [...currentSkills, skill];
    handleUpdateActive('skills', nextSkills);
  };

  const handleAddNew = () => {
    const newId = 'ctx_' + Date.now();
    const newCtx = {
      id: newId,
      label: 'Nuevo Proyecto',
      path: '/home/zabrielsa',
      effort: 'low',
      skills: []
    };
    setEditingList((prev) => [...prev, newCtx]);
    setSelectedId(newId);
  };

  const handleDelete = (id) => {
    if (editingList.length <= 1) {
      alert('Debe existir al menos un contexto activo.');
      return;
    }
    const remaining = editingList.filter((c) => c.id !== id);
    setEditingList(remaining);
    if (selectedId === id) {
      setSelectedId(remaining[0].id);
    }
  };

  const handleSaveAll = () => {
    onSaveContexts(editingList);
    onSelectContext(selectedId);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div
        className="modal-content glass"
        style={{
          width: '780px',
          maxWidth: '92vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Folder size={18} color="#10b981" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
              Administrador de Contextos del Agente
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-icon"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Split */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left Column: Context List */}
          <div
            style={{
              borderRight: '1px solid var(--border-color)',
              background: 'rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              padding: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Perfiles ({editingList.length})
              </span>
              <button
                onClick={handleAddNew}
                className="btn btn-primary"
                style={{ padding: '3px 8px', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={12} />
                <span>Añadir</span>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {editingList.map((ctx) => {
                const isSelected = ctx.id === selectedId;
                return (
                  <div
                    key={ctx.id}
                    onClick={() => setSelectedId(ctx.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <Folder size={14} color={isSelected ? '#10b981' : '#788882'} />
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--text-high)' : 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {ctx.label}
                        </span>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                          {ctx.effort === 'high' ? '🧠 Profundo' : '⚡ Flash'}
                        </span>
                      </div>
                    </div>

                    {editingList.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(ctx.id);
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '2px' }}
                        title="Eliminar perfil"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Editor */}
          <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* Nombre */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)', marginBottom: '4px' }}>
                Nombre del Contexto
              </label>
              <input
                type="text"
                value={activeCtx.label || ''}
                onChange={(e) => handleUpdateActive('label', e.target.value)}
                placeholder="Ej. TADÚ (Backend)"
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.8rem' }}
              />
            </div>

            {/* Ruta del Directorio */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)', marginBottom: '4px' }}>
                Ruta del Directorio de Trabajo (cwd)
              </label>
              <input
                type="text"
                value={activeCtx.path || ''}
                onChange={(e) => handleUpdateActive('path', e.target.value)}
                placeholder="/home/zabrielsa/Proyects/..."
                style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', padding: '0.5rem 0.8rem' }}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                El agente `agy` se ejecutará dentro de esta carpeta para leer git y archivos locales.
              </span>
            </div>

            {/* Modo de Razonamiento Predeterminado */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)', marginBottom: '4px' }}>
                Modo / Esfuerzo Predeterminado
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleUpdateActive('effort', 'low')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: activeCtx.effort === 'low' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: activeCtx.effort === 'low' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    color: 'var(--text-high)'
                  }}
                >
                  <Zap size={16} color="#10b981" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>⚡ Flash (Rápido)</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>1.9s, consultas y comandos ágiles</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateActive('effort', 'high')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: activeCtx.effort === 'high' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: activeCtx.effort === 'high' ? '1px solid #a855f7' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    color: 'var(--text-high)'
                  }}
                >
                  <Brain size={16} color="#a855f7" />
                  <div style={{ textAlign: 'left' }}>
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
                      onClick={() => handleToggleSkill(skill)}
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
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            padding: '0.8rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            background: 'rgba(0, 0, 0, 0.3)'
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: 'var(--radius-md)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveAll}
            className="btn btn-primary"
            style={{ padding: '6px 16px', fontSize: '0.8rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Check size={14} />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </div>
    </div>
  );
}
