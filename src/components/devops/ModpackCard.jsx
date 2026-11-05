import React from 'react';
import { PackageCheck, PackageX, Sparkles, Send, Trash2, Edit3, Check } from 'lucide-react';
import { TacticalBadge, TacticalButton } from '../ui';

/**
 * ModpackCard — Tarjeta interactiva de un Meta-Skill / Modpack.
 * Integra toggle rey maestro, switches de sub-skills y sincronización al Agente IA.
 */
export function ModpackCard({
  modpack,
  onToggleMaster,
  onToggleSubSkill,
  onActivateInAgent,
  onEdit,
  onDelete
}) {
  const isMasterOn = Boolean(modpack.enabled);
  const disabledSub = modpack.disabledSubSkills || [];
  const activeSkillsCount = modpack.skills.filter(s => !disabledSub.includes(s)).length;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: isMasterOn
          ? '1px solid color-mix(in srgb, var(--primary) 40%, transparent)'
          : '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 0.85rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '8px',
        boxShadow: isMasterOn ? '0 0 16px color-mix(in srgb, var(--primary) 8%, transparent)' : 'none',
        transition: 'all 0.15s ease'
      }}
    >
      {/* Cabecera del Modpack */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.95rem' }}>📦</span>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-high)' }}>
                {modpack.name}
              </span>
            </div>
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px', lineHeight: '1.3' }}>
              {modpack.description}
            </span>
          </div>

          {/* Toggle Rey Maestro */}
          <button
            type="button"
            onClick={() => onToggleMaster(modpack.id)}
            className={`modpack-master-btn ${isMasterOn ? 'is-active' : 'is-inactive'}`}
            title={isMasterOn ? 'Desactivar Modpack completo' : 'Activar Modpack'}
          >
            {isMasterOn ? <PackageCheck size={12} /> : <PackageX size={12} />}
            {isMasterOn ? 'ACTIVO' : 'INACTIVO'}
          </button>
        </div>

        {/* Tira de Sub-Skills con Toggles */}
        <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {modpack.skills.map((skillId) => {
            const isSubActive = isMasterOn && !disabledSub.includes(skillId);
            return (
              <button
                key={skillId}
                type="button"
                onClick={() => onToggleSubSkill(modpack.id, skillId)}
                disabled={!isMasterOn}
                className={`modpack-subskill-chip ${isSubActive ? 'is-active' : 'is-inactive'}`}
                title={isSubActive ? `Desactivar ${skillId}` : `Activar ${skillId}`}
              >
                {isSubActive && <Check size={9} color="var(--primary)" />}
                <span>{skillId}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pie con Acciones y Telemetría */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '6px',
        marginTop: '4px'
      }}>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {activeSkillsCount}/{modpack.skills.length} skills activas
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(modpack)}
              className="devops-icon-action-btn"
              title="Editar modpack"
            >
              <Edit3 size={11} />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(modpack.id)}
              className="devops-icon-action-btn danger"
              title="Eliminar modpack"
            >
              <Trash2 size={11} />
            </button>
          )}

          <TacticalButton
            variant="secondary"
            size="xs"
            icon={<Send size={10} />}
            onClick={() => onActivateInAgent(modpack)}
            disabled={!isMasterOn || activeSkillsCount === 0}
            style={{
              background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
              borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
              color: 'var(--primary)',
              fontWeight: 700
            }}
            title="Sincronizar y cargar estas skills en el Agente IA de la Pestaña 1"
          >
            Cargar en Agente
          </TacticalButton>
        </div>
      </div>
    </div>
  );
}
