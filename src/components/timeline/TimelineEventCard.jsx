import React from 'react';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Clock, 
  MapPin, 
  Calendar as CalendarIcon 
} from 'lucide-react';
import { 
  resolveDomainConfig, 
  PRIORITY_BADGES, 
  getRelativeDaysLabel 
} from './timelineHelpers';

export default function TimelineEventCard({
  evt,
  todayStr,
  onToggleEvent,
  onSelectEvent,
  onDeleteClick
}) {
  const domainCfg = resolveDomainConfig(evt.domain);
  const priorityCfg = PRIORITY_BADGES[evt.priority] || PRIORITY_BADGES.medium;
  const relDay = getRelativeDaysLabel(evt.date, todayStr);
  const isCompleted = evt.status === 'completed';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '10px 14px',
        background: isCompleted ? 'rgba(18, 22, 20, 0.4)' : 'var(--bg-card)',
        border: isCompleted ? '1px solid rgba(255,255,255,0.04)' : `1px solid ${domainCfg.border}`,
        borderLeft: `4px solid ${domainCfg.color}`,
        borderRadius: 'var(--radius-md)',
        transition: 'var(--transition)',
        opacity: isCompleted ? 0.65 : 1
      }}
    >
      {/* Interactive Checkbox */}
      <button
        onClick={() => onToggleEvent(evt.id, !isCompleted)}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: isCompleted ? 'var(--primary)' : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          marginTop: '2px',
          transition: 'var(--transition)'
        }}
        title={isCompleted ? 'Marcar pendiente' : 'Marcar completado'}
      >
        {isCompleted ? <CheckSquare size={18} /> : <Square size={18} />}
      </button>

      {/* Event Core Info */}
      <div 
        onClick={() => onSelectEvent(evt)}
        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
        title="Haz clic para ver detalles del hito"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            fontWeight: 700,
            fontSize: '0.88rem',
            color: isCompleted ? 'var(--text-muted)' : '#ffffff',
            textDecoration: isCompleted ? 'line-through' : 'none'
          }}>
            {evt.title}
          </span>

          {/* Domain Badge */}
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            background: domainCfg.bg,
            color: domainCfg.color,
            border: `1px solid ${domainCfg.border}`
          }}>
            {domainCfg.label}
          </span>

          {/* Priority Badge */}
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            background: priorityCfg.bg,
            color: priorityCfg.color
          }}>
            {priorityCfg.label}
          </span>

          {/* Relative Badge */}
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 600,
            color: relDay.color,
            fontFamily: 'var(--font-mono)'
          }}>
            • {relDay.text}
          </span>
        </div>

        {/* Details / Description */}
        {evt.details && (
          <p style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            margin: '4px 0 0 0',
            lineHeight: '1.25rem'
          }}>
            {evt.details}
          </p>
        )}

        {/* Metadata Chips (Date, Time, Location) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
            <CalendarIcon size={12} />
            {evt.date}
          </span>
          {evt.time && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
              <Clock size={12} />
              {evt.time}
            </span>
          )}
          {evt.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} />
              {evt.location}
            </span>
          )}
        </div>
      </div>

      {/* Delete Action */}
      <button
        onClick={() => onDeleteClick(evt.id)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: 'var(--radius-sm)',
          transition: 'var(--transition)'
        }}
        title="Eliminar evento"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
