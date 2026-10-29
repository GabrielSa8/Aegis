import { useState, useMemo } from 'react';
import { 
  CalendarRange, 
  Plus, 
  CheckSquare, 
  Square, 
  Trash2, 
  Clock, 
  MapPin, 
  Tag, 
  AlertCircle, 
  Sparkles,
  Filter,
  CheckCircle2,
  Calendar as CalendarIcon,
  X
} from 'lucide-react';
import { getTodayLocalDateStr } from '../utils/storage';

const NORDIC_PALETTE = [
  '#34d399', '#38bdf8', '#818cf8', '#a78bfa', '#f472b6',
  '#fbbf24', '#fb923c', '#4ade80', '#2dd4bf', '#a3e635'
];

const DEFAULT_DOMAINS = {
  work: { label: 'Trabajo & Operaciones', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
  software: { label: 'Software & Dev', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' },
  certs: { label: 'Estudios & Certs', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
  personal: { label: 'Personal & Ocio', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)' }
};

export const resolveDomainConfig = (domain) => {
  if (DEFAULT_DOMAINS[domain]) return DEFAULT_DOMAINS[domain];
  if (!domain) return { label: 'General', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' };
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charCodeAt(i);
    hash |= 0;
  }
  const color = NORDIC_PALETTE[Math.abs(hash) % NORDIC_PALETTE.length];
  return {
    label: domain.charAt(0).toUpperCase() + domain.slice(1),
    color,
    bg: `${color}1f`,
    border: `${color}4d`
  };
};

const PRIORITY_BADGES = {
  high: { label: 'Alta', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  medium: { label: 'Media', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  low: { label: 'Baja', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' }
};

export default function TimelineView({ 
  events = [], 
  onToggleEvent, 
  onSaveEvent, 
  onDeleteEvent 
}) {
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
    setTitle('');
    setTime('');
    setLocation('');
    setDetails('');
    setShowAddModal(false);
  };

  const getRelativeDaysLabel = (targetDateStr) => {
    if (targetDateStr === todayStr) return { text: 'Hoy', color: '#10b981' };
    const d1 = new Date(todayStr);
    const d2 = new Date(targetDateStr);
    const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return { text: 'Mañana', color: '#38bdf8' };
    if (diffDays === -1) return { text: 'Ayer', color: '#9ca3af' };
    if (diffDays > 1) return { text: `En ${diffDays} días`, color: '#60a5fa' };
    return { text: `Hace ${Math.abs(diffDays)} días`, color: '#9ca3af' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 🧭 Barra Táctica de Filtros y Control */}
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

        {/* Status Pills & Add Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

          {/* Filtro Quincenal / Mensual (v2.2.0) */}
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

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ padding: '4px 10px', fontSize: '0.74rem', height: '28px', borderRadius: 'var(--radius-sm)' }}
          >
            <Plus size={13} />
            <span>Nuevo Hito</span>
          </button>
        </div>
      </div>

      {/* 🚀 Cronograma Maestro (Timeline Stream) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredEvents.length > 0 ? (
          filteredEvents.map((evt) => {
            const domainCfg = resolveDomainConfig(evt.domain);
            const priorityCfg = PRIORITY_BADGES[evt.priority] || PRIORITY_BADGES.medium;
            const relDay = getRelativeDaysLabel(evt.date);
            const isCompleted = evt.status === 'completed';

            return (
              <div
                key={evt.id}
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
                  onClick={() => setDetailEvent(evt)}
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
                  onClick={() => setDeletingId(evt.id)}
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
          })
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
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content glass" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarRange size={18} style={{ color: 'var(--primary)' }} />
                <h3>Nuevo Hito en Timeline</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn btn-secondary btn-icon"
                style={{ width: '28px', height: '28px' }}
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label>Título del Hito / Operación *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ej. Lanzamiento de Versión, Cierre Mensual o Sprint Review"
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Dominio</label>
                  <select value={domain} onChange={(e) => setDomain(e.target.value)}>
                    <option value="work">💼 Trabajo & Operaciones</option>
                    <option value="software">💻 Software & Dev</option>
                    <option value="certs">📚 Estudios & Certs</option>
                    <option value="personal">🌟 Personal & Ocio</option>
                    {availableDomains.filter(d => !['work', 'software', 'certs', 'personal'].includes(d.key)).map(d => (
                      <option key={d.key} value={d.key}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Prioridad</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Fecha *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Hora (Opcional)</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Ubicación / Entorno (Opcional)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="ej. Oficina Central, Sala Remota, Localhost, etc."
                />
              </div>

              <div className="form-group">
                <label>Detalles / Directrices</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Instrucciones operativas, enlaces de Obsidian o tareas clave..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Guardar Hito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔍 Modal Detalle del Hito (v2.2.0) */}
      {detailEvent && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass" style={{ maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: resolveDomainConfig(detailEvent.domain).color
                }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {resolveDomainConfig(detailEvent.domain).label}
                </span>
              </div>
              <button
                onClick={() => setDetailEvent(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
                {detailEvent.title}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CalendarIcon size={12} color="#10b981" />
                  {detailEvent.date}
                </span>
                {detailEvent.time && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    {detailEvent.time}
                  </span>
                )}
                {detailEvent.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} />
                    {detailEvent.location}
                  </span>
                )}
              </div>
            </div>

            {detailEvent.details && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                fontSize: '0.8rem',
                color: 'var(--text-normal)',
                lineHeight: '1.35rem'
              }}>
                {detailEvent.details}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
              <button
                onClick={() => {
                  onToggleEvent(detailEvent.id, detailEvent.status !== 'completed');
                  setDetailEvent(null);
                }}
                className={detailEvent.status === 'completed' ? 'btn btn-secondary' : 'btn btn-primary'}
                style={{ padding: '4px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle2 size={13} />
                <span>{detailEvent.status === 'completed' ? 'Reabrir Hito' : 'Marcar Completado'}</span>
              </button>

              <button
                onClick={() => {
                  setDeletingId(detailEvent.id);
                  setDetailEvent(null);
                }}
                className="btn btn-danger"
                style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Trash2 size={12} />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ Modal Confirmar Borrado */}
      {deletingId && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass" style={{ maxWidth: '380px', textAlign: 'center' }}>
            <AlertCircle size={32} style={{ color: 'var(--danger)', margin: '0 auto 8px auto' }} />
            <h4 style={{ margin: '0 0 6px 0' }}>¿Eliminar este hito del cronograma?</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              Esta acción no se puede deshacer en la base de datos local SQLite.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button onClick={() => setDeletingId(null)} className="btn btn-secondary">
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await onDeleteEvent(deletingId);
                  setDeletingId(null);
                }}
                className="btn btn-danger"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
