import React, { useState, useMemo } from 'react';
import { DownloadCloud, PackagePlus, LayoutGrid, List } from 'lucide-react';
import { SkillCard } from './SkillCard';
import { SkillListView } from './SkillListView';
import { ModpackCard } from './ModpackCard';
import { TacticalButton } from '../ui';
import { SKILL_CATEGORIES, getSkillCategory } from './devopsHelpers';

/**
 * SkillsArsenalSection — Sección maestra para el catálogo de habilidades y Modpacks del agente.
 * Soporta vista dual (Cards Densas o Lista Táctica) para evitar sensación de vacío.
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
  onDeleteModpack,
  fillHeight = false
}) {
  const [sectionTab, setSectionTab] = useState('skills'); // 'skills' | 'modpacks'
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'list'

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      ...(fillHeight ? { flex: 1, minHeight: 0 } : {})
    }}>
      {/* Barra de Cabecera y Selector de Pestaña Principal */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setSectionTab('skills')}
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: sectionTab === 'skills' ? 'var(--primary)' : 'transparent',
              color: sectionTab === 'skills' ? 'var(--bg-main)' : 'var(--text-muted)',
              fontSize: '0.68rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>🧩 Habilidades</span>
            <span style={{ fontSize: '0.58rem', opacity: 0.85 }}>({skills.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSectionTab('modpacks')}
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: sectionTab === 'modpacks' ? 'var(--primary)' : 'transparent',
              color: sectionTab === 'modpacks' ? 'var(--bg-main)' : 'var(--text-muted)',
              fontSize: '0.68rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>📦 Modpacks</span>
            <span style={{ fontSize: '0.58rem', opacity: 0.85 }}>({modpacks.length})</span>
          </button>
        </div>

        {/* Acciones de Cabecera & Selector de Modo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {sectionTab === 'skills' && (
            <div style={{
              display: 'flex',
              background: 'color-mix(in srgb, var(--border-color) 20%, transparent)',
              padding: '2px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)'
            }}>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  background: viewMode === 'cards' ? 'var(--bg-card)' : 'transparent',
                  color: viewMode === 'cards' ? 'var(--primary)' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '2px 5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '0.6rem'
                }}
                title="Vista de Tarjetas Densas"
              >
                <LayoutGrid size={10} />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                style={{
                  background: viewMode === 'list' ? 'var(--bg-card)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '2px 5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '0.6rem'
                }}
                title="Vista de Lista de Alta Densidad"
              >
                <List size={10} />
                <span>Lista</span>
              </button>
            </div>
          )}

          {sectionTab === 'skills' ? (
            <TacticalButton
              variant="secondary"
              size="xs"
              icon={<DownloadCloud size={11} />}
              onClick={onOpenInstallModal}
              style={{
                background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.64rem',
                padding: '2px 7px'
              }}
            >
              + Instalar Skill
            </TacticalButton>
          ) : (
            <TacticalButton
              variant="secondary"
              size="xs"
              icon={<PackagePlus size={11} />}
              onClick={onOpenCreateModpackModal}
              style={{
                background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.64rem',
                padding: '2px 7px'
              }}
            >
              + Nuevo Modpack
            </TacticalButton>
          )}
        </div>
      </div>

      {/* Pestaña: Habilidades Individuales con Chips Taxonómicos */}
      {sectionTab === 'skills' ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          ...(fillHeight ? { flex: 1, minHeight: 0 } : {})
        }}>
          {/* Tira de Chips Taxonómicos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', paddingBottom: '2px', flexShrink: 0 }} className="no-scrollbar">
            {SKILL_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id] || 0;
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-xs)',
                    border: isSelected
                      ? '1px solid color-mix(in srgb, var(--primary) 45%, transparent)'
                      : '1px solid var(--border-color)',
                    background: isSelected
                      ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                      : 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                    color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: '0.62rem',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{cat.label}</span>
                  <span style={{ fontSize: '0.56rem', opacity: 0.7 }}>({count})</span>
                </button>
              );
            })}
          </div>

          {/* Grid o Lista de Habilidades */}
          {filteredSkills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              No se encontraron habilidades en esta categoría o búsqueda.
            </div>
          ) : viewMode === 'list' ? (
            <SkillListView
              skills={filteredSkills}
              onOpenSkill={onOpenSkill}
              fillHeight={fillHeight}
            />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 340px))',
              gap: '0.55rem',
              ...(fillHeight ? { flex: 1, overflowY: 'auto', minHeight: 0 } : {})
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 380px))',
          gap: '0.65rem',
          ...(fillHeight ? { flex: 1, overflowY: 'auto', minHeight: 0 } : {})
        }}>
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
