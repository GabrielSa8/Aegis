import React, { useState, useMemo } from 'react';
import { DownloadCloud, PackagePlus, Sparkles, Filter } from 'lucide-react';
import { SkillCard } from './SkillCard';
import { ModpackCard } from './ModpackCard';
import { TacticalButton } from '../ui';
import { SKILL_CATEGORIES, getSkillCategory } from './devopsHelpers';

/**
 * SkillsArsenalSection — Sección maestra para el catálogo de habilidades y Modpacks del agente.
 * Soporta filtrado por chips taxonómicos, gestión de modpacks y sincronización con el Agente IA.
 */
export function SkillsArsenalSection({
  skills = [],
  modpacks = [],
  skillSearch = '',
  onOpenSkill,
  onDeleteSkill,
  onToggleModpackMaster,
  onToggleModpackSubSkill,
  onActivateModpackInAgent,
  onOpenInstallModal,
  onOpenCreateModpackModal,
  onEditModpack,
  onDeleteModpack
}) {
  const [sectionTab, setSectionTab] = useState('skills'); // 'skills' | 'modpacks'
  const [activeCategory, setActiveCategory] = useState('all');

  // Conteo de skills por categoría
  const categoryCounts = useMemo(() => {
    const counts = { all: skills.length };
    skills.forEach(s => {
      const cat = getSkillCategory(s);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [skills]);

  // Filtrado por categoría y búsqueda
  const filteredSkills = useMemo(() => {
    return skills.filter(s => {
      const matchCat = activeCategory === 'all' || getSkillCategory(s) === activeCategory;
      const matchSearch = !skillSearch.trim() ||
        s.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
        s.description.toLowerCase().includes(skillSearch.toLowerCase()) ||
        s.id.toLowerCase().includes(skillSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [skills, activeCategory, skillSearch]);

  return (
    <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Barra de Cabecera y Selector de Pestaña Principal */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setSectionTab('skills')}
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: sectionTab === 'skills' ? 'var(--primary)' : 'transparent',
              color: sectionTab === 'skills' ? 'var(--bg-main)' : 'var(--text-muted)',
              fontSize: '0.68rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>🧩 Habilidades</span>
            <span style={{ fontSize: '0.6rem', opacity: 0.85 }}>({skills.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSectionTab('modpacks')}
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: sectionTab === 'modpacks' ? 'var(--primary)' : 'transparent',
              color: sectionTab === 'modpacks' ? 'var(--bg-main)' : 'var(--text-muted)',
              fontSize: '0.68rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>📦 Modpacks / Meta-Skills</span>
            <span style={{ fontSize: '0.6rem', opacity: 0.85 }}>({modpacks.length})</span>
          </button>
        </div>

        {/* Acciones de Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {sectionTab === 'skills' ? (
            <TacticalButton
              variant="secondary"
              size="xs"
              icon={<DownloadCloud size={12} />}
              onClick={onOpenInstallModal}
              style={{
                background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
                color: 'var(--primary)',
                fontWeight: 700
              }}
            >
              + Instalar Skill
            </TacticalButton>
          ) : (
            <TacticalButton
              variant="secondary"
              size="xs"
              icon={<PackagePlus size={12} />}
              onClick={onOpenCreateModpackModal}
              style={{
                background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
                color: 'var(--primary)',
                fontWeight: 700
              }}
            >
              + Nuevo Modpack
            </TacticalButton>
          )}
        </div>
      </div>

      {/* Pestaña: Habilidades Individuales con Chips Taxonómicos */}
      {sectionTab === 'skills' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Tira de Chips Taxonómicos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }} className="no-scrollbar">
            {SKILL_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id] || 0;
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-xs)',
                    border: isSelected
                      ? '1px solid color-mix(in srgb, var(--primary) 45%, transparent)'
                      : '1px solid var(--border-color)',
                    background: isSelected
                      ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                      : 'rgba(255, 255, 255, 0.02)',
                    color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: '0.64rem',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{cat.label}</span>
                  <span style={{ fontSize: '0.58rem', opacity: 0.7 }}>({count})</span>
                </button>
              );
            })}
          </div>

          {/* Grid de Habilidades */}
          {filteredSkills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              No se encontraron habilidades en esta categoría o búsqueda.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '0.55rem'
            }}>
              {filteredSkills.map((s) => (
                <SkillCard
                  key={s.id}
                  skill={s}
                  onOpen={onOpenSkill}
                  onDelete={onDeleteSkill}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Pestaña: Modpacks / Meta-Skills */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.65rem' }}>
          {modpacks.map((pack) => (
            <ModpackCard
              key={pack.id}
              modpack={pack}
              onToggleMaster={onToggleModpackMaster}
              onToggleSubSkill={onToggleModpackSubSkill}
              onActivateInAgent={onActivateModpackInAgent}
              onEdit={pack.isCustom ? onEditModpack : null}
              onDelete={pack.isCustom ? onDeleteModpack : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
