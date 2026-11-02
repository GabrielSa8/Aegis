import React, { useState, useEffect } from 'react';
import { Check, Package, Sparkles } from 'lucide-react';
import { loadStoredModpacks } from '../../devops/devopsHelpers';

/**
 * ContextSkillsSection — Selector dual de habilidades: por Modpacks o Skills sueltas.
 * Permite aplicar paquetes completos en 1 clic o micro-ajustar habilidades individuales.
 */
export function ContextSkillsSection({
  skillsCatalog = [],
  activeSkills = [],
  onToggleSkill,
  onUpdateActive
}) {
  const [mode, setMode] = useState('modpack'); // 'modpack' | 'individual'
  const [modpacks, setModpacks] = useState(() => loadStoredModpacks());

  // Escuchar si se actualizaron los modpacks desde la pestaña DevOps
  useEffect(() => {
    const handleUpdate = () => setModpacks(loadStoredModpacks());
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('aegis:modpack-activated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('aegis:modpack-activated', handleUpdate);
    };
  }, []);

  const handleToggleModpack = (pack) => {
    const disabled = pack.disabledSubSkills || [];
    const packActiveSkills = pack.skills.filter(s => !disabled.includes(s));
    const isApplied = packActiveSkills.length > 0 && packActiveSkills.every(s => activeSkills.includes(s));

    if (isApplied) {
      // Desactivar las skills pertenecientes a este modpack
      const remaining = activeSkills.filter(s => !packActiveSkills.includes(s));
      onUpdateActive('skills', remaining);
    } else {
      // Activar / sumar las skills de este modpack
      const merged = Array.from(new Set([...activeSkills, ...packActiveSkills]));
      onUpdateActive('skills', merged);
    }
  };

  return (
    <div className="form-group" style={{ margin: 0 }}>
      {/* Cabecera y Selector de Modo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)', margin: 0, display: 'block' }}>
            Habilidades Vinculadas ({activeSkills.length} activas)
          </label>
          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
            {mode === 'modpack' ? 'Presets por modpack táctico' : `Catálogo de ${skillsCatalog.length} skills sueltas`}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-main)', padding: '2px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setMode('modpack')}
            style={{
              fontSize: '0.66rem',
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: mode === 'modpack' ? 'var(--primary)' : 'transparent',
              color: mode === 'modpack' ? 'var(--bg-main)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Package size={11} />
            <span>Por Modpack</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('individual')}
            style={{
              fontSize: '0.66rem',
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: mode === 'individual' ? 'var(--primary)' : 'transparent',
              color: mode === 'individual' ? 'var(--bg-main)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Sparkles size={11} />
            <span>Skills Sueltas</span>
          </button>
        </div>
      </div>

      {/* Modo: Por Modpack */}
      {mode === 'modpack' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px' }}>
          {modpacks.map((pack) => {
            const disabled = pack.disabledSubSkills || [];
            const packActiveSkills = pack.skills.filter(s => !disabled.includes(s));
            const isApplied = packActiveSkills.length > 0 && packActiveSkills.every(s => activeSkills.includes(s));

            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => handleToggleModpack(pack)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: isApplied
                    ? '1px solid color-mix(in srgb, var(--primary) 50%, transparent)'
                    : '1px solid var(--border-color)',
                  background: isApplied
                    ? 'color-mix(in srgb, var(--primary) 14%, transparent)'
                    : 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: isApplied ? 'var(--primary)' : 'var(--text-high)' }}>
                    📦 {pack.name}
                  </span>
                  {isApplied && <Check size={12} color="var(--primary)" />}
                </div>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: '1.25' }}>
                  {pack.description}
                </span>
                <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: isApplied ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {packActiveSkills.length} skills ({isApplied ? 'Vinculado' : 'Clic para vincular'})
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        /* Modo: Skills Sueltas */
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '5px',
            maxHeight: '170px',
            overflowY: 'auto',
            padding: '8px',
            background: 'color-mix(in srgb, var(--bg-main) 65%, transparent)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          {skillsCatalog.map((skill) => {
            const isChecked = activeSkills.includes(skill);
            return (
              <button
                key={skill}
                type="button"
                onClick={() => onToggleSkill(skill)}
                style={{
                  fontSize: '0.68rem',
                  padding: '3px 7px',
                  borderRadius: 'var(--radius-xs)',
                  background: isChecked
                    ? 'color-mix(in srgb, var(--primary) 18%, transparent)'
                    : 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
                  border: isChecked
                    ? '1px solid color-mix(in srgb, var(--primary) 50%, transparent)'
                    : '1px solid var(--border-color)',
                  color: isChecked ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                {isChecked && <Check size={10} color="var(--primary)" />}
                <span>{skill}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
