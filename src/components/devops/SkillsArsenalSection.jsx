import React from 'react';
import { SkillCard } from './SkillCard';

/**
 * SkillsArsenalSection — Sección de catálogo de habilidades del agente (~/.agents/skills/).
 */
export function SkillsArsenalSection({
  skills = [],
  skillSearch = '',
  onOpenSkill
}) {
  return (
    <div style={{ marginTop: '0.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', padding: '0 2px' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Arsenal de Habilidades del Agente ({skills.length})
        </span>
        <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
          Clic en cualquier habilidad para consultar su manual operativo
        </span>
      </div>

      {skills.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          No se encontraron habilidades que coincidan con "{skillSearch}"
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '0.5rem'
        }}>
          {skills.map((s) => (
            <SkillCard key={s.id} skill={s} onOpen={onOpenSkill} />
          ))}
        </div>
      )}
    </div>
  );
}
