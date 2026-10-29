import React from 'react';
import { CalendarRange } from 'lucide-react';
import {
  useTimeline,
  TimelineControls,
  TimelineEventCard,
  NewEventModal,
  EventDetailModal,
  DeleteConfirmModal,
  resolveDomainConfig
} from './timeline';

export { resolveDomainConfig };

export default function TimelineView({ 
  events = [], 
  onToggleEvent, 
  onSaveEvent, 
  onDeleteEvent 
}) {
  const {
    domainFilter,
    setDomainFilter,
    statusFilter,
    setStatusFilter,
    rangeFilter,
    setRangeFilter,
    detailEvent,
    setDetailEvent,
    showAddModal,
    setShowAddModal,
    deletingId,
    setDeletingId,
    title,
    setTitle,
    domain,
    setDomain,
    priority,
    setPriority,
    date,
    setDate,
    time,
    setTime,
    location,
    setLocation,
    details,
    setDetails,
    todayStr,
    filteredEvents,
    availableDomains,
    stats,
    handleCreate
  } = useTimeline(events, onSaveEvent);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 🧭 Barra Táctica de Filtros y Control */}
      <TimelineControls
        domainFilter={domainFilter}
        setDomainFilter={setDomainFilter}
        availableDomains={availableDomains}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        rangeFilter={rangeFilter}
        setRangeFilter={setRangeFilter}
        stats={stats}
        onOpenNewEvent={() => setShowAddModal(true)}
      />

      {/* 🚀 Cronograma Maestro (Timeline Stream) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredEvents.length > 0 ? (
          filteredEvents.map((evt) => (
            <TimelineEventCard
              key={evt.id}
              evt={evt}
              todayStr={todayStr}
              onToggleEvent={onToggleEvent}
              onSelectEvent={setDetailEvent}
              onDeleteClick={setDeletingId}
            />
          ))
        ) : (
          <div style={{
            padding: '3rem 1rem',
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-muted)'
          }}>
            <CalendarRange size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
            <p style={{ fontSize: '0.85rem' }}>No hay hitos u operaciones que coincidan con los filtros.</p>
          </div>
        )}
      </div>

      {/* 📝 Modal Agregar Hito */}
      <NewEventModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={title}
        setTitle={setTitle}
        domain={domain}
        setDomain={setDomain}
        availableDomains={availableDomains}
        priority={priority}
        setPriority={setPriority}
        date={date}
        setDate={setDate}
        time={time}
        setTime={setTime}
        location={location}
        setLocation={setLocation}
        details={details}
        setDetails={setDetails}
        onSubmit={handleCreate}
      />

      {/* 🔍 Modal Detalle del Hito */}
      <EventDetailModal
        event={detailEvent}
        isOpen={Boolean(detailEvent)}
        onClose={() => setDetailEvent(null)}
        onToggleEvent={onToggleEvent}
        onDeleteClick={setDeletingId}
      />

      {/* 🗑️ Modal Confirmar Borrado */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={async () => {
          if (onDeleteEvent && deletingId) {
            await onDeleteEvent(deletingId);
          }
          setDeletingId(null);
        }}
      />
    </div>
  );
}
