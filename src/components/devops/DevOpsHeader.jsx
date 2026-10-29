import React from 'react';
import { GitBranch, Search, X, RefreshCw } from 'lucide-react';
import { TacticalBadge, TacticalButton } from '../ui';

/**
 * DevOpsHeader — Barra superior de telemetría y control para DevOps.
 * Respeta 100% variables temáticas y reutiliza UI kit.
 */
export function DevOpsHeader({
  repoCount = 0,
  skillCount = 0,
  skillSearch = '',
  onSearchChange,
  onRefresh,
  refreshing = false
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.45rem 0.85rem',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      flexShrink: 0,
      flexWrap: 'wrap',
      gap: '8px'
    }}>
      {/* Izquierda: Título y Contadores */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <GitBranch color="var(--primary, #10b981)" size={15} />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Radar DevOps & Arsenal
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <TacticalBadge variant="success" size="sm">
            {repoCount} Repos Locales
          </TacticalBadge>
          <TacticalBadge variant="primary" size="sm">
            {skillCount} Skills Activas
          </TacticalBadge>
        </div>
      </div>

      {/* Derecha: Buscador de Skills y Refrescar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Buscador rápido de Skills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '3px 8px'
        }}>
          <Search size={12} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Buscar en el arsenal..."
            value={skillSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-high)',
              fontSize: '0.72rem',
              width: '150px'
            }}
          />
          {skillSearch && (
            <button 
              type="button"
              onClick={() => onSearchChange('')} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Botón Refrescar */}
        <TacticalButton
          variant="secondary"
          size="xs"
          icon={<RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />}
          onClick={onRefresh}
          disabled={refreshing}
          title="Escanear estado de Git y catálogo de skills"
          style={{ width: '28px', height: '28px', padding: 0, justifyContent: 'center' }}
        />
      </div>
    </div>
  );
}
