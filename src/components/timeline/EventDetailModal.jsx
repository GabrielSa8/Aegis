import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Trash2 
} from 'lucide-react';
import ModalWrapper from '../ui/ModalWrapper';
import TacticalButton from '../ui/TacticalButton';
import { resolveDomainConfig } from './timelineHelpers';

export default function EventDetailModal({
  event,
  isOpen,
  onClose,
  onToggleEvent,
  onDeleteClick
}) {
  if (!event) return null;

  const domainCfg = resolveDomainConfig(event.domain);
  const isCompleted = event.status === 'completed';

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={event.title}
      maxWidth="440px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: domainCfg.color
          }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: domainCfg.color, textTransform: 'uppercase' }}>
            {domainCfg.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CalendarIcon size={12} color="#10b981" />
            {event.date}
          </span>
          {event.time && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
              {event.time}
            </span>
          )}
          {event.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} />
              {event.location}
            </span>
          )}
        </div>

        {event.details && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            fontSize: '0.8rem',
            color: 'var(--text-normal)',
            lineHeight: '1.35rem'
          }}>
            {event.details}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          <TacticalButton
            variant={isCompleted ? 'secondary' : 'primary'}
            size="sm"
            icon={CheckCircle2}
            onClick={() => {
              onToggleEvent(event.id, !isCompleted);
              onClose();
            }}
          >
            {isCompleted ? 'Reabrir Hito' : 'Marcar Completado'}
          </TacticalButton>

          <TacticalButton
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => {
              onDeleteClick(event.id);
              onClose();
            }}
          >
            Eliminar
          </TacticalButton>
        </div>
      </div>
    </ModalWrapper>
  );
}
