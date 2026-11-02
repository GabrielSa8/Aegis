import React from 'react';
import { Sparkles, ArrowRight, Package } from 'lucide-react';
import { TacticalButton } from '../../ui';

/**
 * CockpitSkillsPanel — Panel compacto de modpacks y habilidades para el Cockpit DevOps.
 */
export function CockpitSkillsPanel({
  skills = [],
  modpacks = [],
  onNavigateTab,
  onToggleModpackMaster,
  onOpenInstallSkillModal
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      overflow: 'hidden'
    }}>
      {/* Cabecera del Panel */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6rem 0.85rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'color-mix(in srgb, var(--border-color) 10%, transparent)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-high)' }}>
            Arsenal & Modpacks ({skills.length})
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('skills')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '0.65rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            padding: '2px 4px'
          }}
        >
          <span>Ver arsenal</span>
          <ArrowRight size={11} />
        </button>
      </div>

      {/* Scroll Interno de Modpacks y Skills */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {/* Modpacks Activos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Modpacks Tácticos ({modpacks.length})
          </span>
          {modpacks.map(pack => (
            <div
              key={pack.id}
              style={{
                background: 'color-mix(in srgb, var(--border-color) 8%, transparent)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 0.65rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-high)' }}>{pack.name}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{pack.skills?.length || 0} habilidades integradas</div>
              </div>

              <TacticalButton
                variant={pack.active ? 'primary' : 'secondary'}
                size="xs"
                onClick={() => onToggleModpackMaster(pack.id)}
                style={{ fontSize: '0.58rem', padding: '2px 6px' }}
              >
                {pack.active ? 'Activo' : 'Inactivo'}
              </TacticalButton>
            </div>
          ))}
        </div>

        {/* Acceso Rápido a Instalar Skill */}
        <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
          <TacticalButton
            variant="secondary"
            size="xs"
            onClick={onOpenInstallSkillModal}
            style={{
              width: '100%',
              justifyContent: 'center',
              color: 'var(--primary)',
              borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
              fontWeight: 700,
              fontSize: '0.68rem'
            }}
          >
            + Explorar / Instalar Skill
          </TacticalButton>
        </div>
      </div>
    </div>
  );
}
