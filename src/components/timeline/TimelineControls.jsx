import React from 'react';
import { Plus } from 'lucide-react';
import TacticalButton from '../ui/TacticalButton';

export default function TimelineControls({
  domainFilter,
  setDomainFilter,
  availableDomains,
  statusFilter,
  setStatusFilter,
  rangeFilter,
  setRangeFilter,
  stats,
  onOpenNewEvent
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.5rem 1rem',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      gap: '8px',
      flexWrap: 'wrap'
    }}>
      {/* Filtros por Dominio */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setDomainFilter('all')}
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-md)',
            background: domainFilter === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: domainFilter === 'all' ? '1px solid var(--text-muted)' : '1px solid transparent',
            color: domainFilter === 'all' ? '#fff' : 'var(--text-muted)',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Todos ({stats.total})
        </button>
        {availableDomains.map((dom) => {
          const count = dom.count;
          const isActive = domainFilter === dom.key;
          return (
            <button
              key={dom.key}
              onClick={() => setDomainFilter(dom.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
                background: isActive ? dom.bg : 'transparent',
                border: isActive ? `1px solid ${dom.color}` : '1px solid transparent',
                color: isActive ? dom.color : 'var(--text-muted)',
                fontSize: '0.74rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dom.color }} />
              <span>{dom.label}</span>
              <span style={{ opacity: 0.65, fontSize: '0.68rem' }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Status Pills, Range Filter & Add Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '3px 8px',
              fontSize: '0.7rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: statusFilter === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: statusFilter === 'all' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            style={{
              padding: '3px 8px',
              fontSize: '0.7rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: statusFilter === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              color: statusFilter === 'pending' ? '#f59e0b' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            Pendientes ({stats.pending})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            style={{
              padding: '3px 8px',
              fontSize: '0.7rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: statusFilter === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: statusFilter === 'completed' ? '#10b981' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            Completados ({stats.completed})
          </button>
        </div>

        {/* Filtro Quincenal / Mensual */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setRangeFilter('all')}
            style={{
              padding: '3px 7px',
              fontSize: '0.68rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: rangeFilter === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: rangeFilter === 'all' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            Todos
          </button>
          <button
            onClick={() => setRangeFilter('month')}
            style={{
              padding: '3px 7px',
              fontSize: '0.68rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: rangeFilter === 'month' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: rangeFilter === 'month' ? '#60a5fa' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            Mes
          </button>
          <button
            onClick={() => setRangeFilter('q1')}
            style={{
              padding: '3px 7px',
              fontSize: '0.68rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: rangeFilter === 'q1' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: rangeFilter === 'q1' ? '#a7f3d0' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            1ª Qna
          </button>
          <button
            onClick={() => setRangeFilter('q2')}
            style={{
              padding: '3px 7px',
              fontSize: '0.68rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: rangeFilter === 'q2' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
              color: rangeFilter === 'q2' ? '#c084fc' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            2ª Qna
          </button>
        </div>

        <TacticalButton
          variant="primary"
          size="xs"
          icon={Plus}
          onClick={onOpenNewEvent}
          style={{ height: '28px' }}
        >
          Nuevo Hito
        </TacticalButton>
      </div>
    </div>
  );
}
