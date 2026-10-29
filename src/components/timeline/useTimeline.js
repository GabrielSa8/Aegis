import { useState, useMemo } from 'react';
import { getTodayLocalDateStr } from '../../utils/storage';
import { DEFAULT_DOMAINS, resolveDomainConfig } from './timelineHelpers';

export function useTimeline(events = [], onSaveEvent) {
  const [domainFilter, setDomainFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'completed'
  const [rangeFilter, setRangeFilter] = useState('all'); // 'all' | 'month' | 'q1' | 'q2'
  const [detailEvent, setDetailEvent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('work');
  const [eventType, setEventType] = useState('shift');
  const [date, setDate] = useState(getTodayLocalDateStr());
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [priority, setPriority] = useState('high');

  const todayStr = getTodayLocalDateStr();

  const filteredEvents = useMemo(() => {
    return (events || [])
      .filter(e => {
        if (domainFilter !== 'all' && e.domain !== domainFilter) return false;
        if (statusFilter === 'pending' && e.status === 'completed') return false;
        if (statusFilter === 'completed' && e.status !== 'completed') return false;

        // Filtro Quincenal / Mensual (v2.2.0)
        if (rangeFilter !== 'all' && e.date) {
          const parts = e.date.split('-');
          const currentParts = todayStr.split('-');
          const eventYear = parts[0];
          const eventMonth = parts[1];
          const currentYear = currentParts[0];
          const currentMonth = currentParts[1];
          const day = parseInt(parts[2], 10);

          if (rangeFilter === 'month') {
            if (eventYear !== currentYear || eventMonth !== currentMonth) return false;
          } else if (rangeFilter === 'q1') {
            if (eventYear !== currentYear || eventMonth !== currentMonth) return false;
            if (day > 15) return false;
          } else if (rangeFilter === 'q2') {
            if (eventYear !== currentYear || eventMonth !== currentMonth) return false;
            if (day < 16) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time || '').localeCompare(b.time || '');
      });
  }, [events, domainFilter, statusFilter, rangeFilter, todayStr]);

  // Descubrimiento dinámico de dominios operativos (Cero Hardcode)
  const availableDomains = useMemo(() => {
    const map = new Map();
    Object.entries(DEFAULT_DOMAINS).forEach(([k, cfg]) => {
      map.set(k, { key: k, count: 0, ...cfg });
    });
    (events || []).forEach(e => {
      const d = e.domain || 'general';
      if (!map.has(d)) {
        map.set(d, { key: d, count: 0, ...resolveDomainConfig(d) });
      }
      map.get(d).count++;
    });
    return Array.from(map.values());
  }, [events]);

  const stats = useMemo(() => {
    const list = events || [];
    return {
      total: list.length,
      pending: list.filter(e => e.status !== 'completed').length,
      completed: list.filter(e => e.status === 'completed').length
    };
  }, [events]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    if (onSaveEvent) {
      await onSaveEvent({
        id: '',
        title: title.trim(),
        domain,
        eventType,
        date,
        time: time.trim() || null,
        location: location.trim() || null,
        details: details.trim() || null,
        status: 'pending',
        priority
      });
    }
    setTitle('');
    setTime('');
    setLocation('');
    setDetails('');
    setShowAddModal(false);
  };

  return {
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
    eventType,
    setEventType,
    date,
    setDate,
    time,
    setTime,
    location,
    setLocation,
    details,
    setDetails,
    priority,
    setPriority,
    todayStr,
    filteredEvents,
    availableDomains,
    stats,
    handleCreate
  };
}
