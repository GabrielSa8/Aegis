import React from 'react';
import { CalendarRange } from 'lucide-react';
import ModalWrapper from '../ui/ModalWrapper';
import TacticalButton from '../ui/TacticalButton';

export default function NewEventModal({
  isOpen,
  onClose,
  title,
  setTitle,
  domain,
  setDomain,
  availableDomains,
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
  onSubmit
}) {
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Hito en Timeline"
      icon={CalendarRange}
      maxWidth="480px"
    >
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="form-group">
          <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
            Título del Hito / Operación *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ej. Lanzamiento de Versión, Cierre Mensual o Sprint Review"
            required
            autoFocus
            style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Dominio
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              style={{ width: '100%', fontSize: '0.75rem', padding: '6px 26px 6px 10px' }}
            >
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
            <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Prioridad
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{ width: '100%', fontSize: '0.75rem', padding: '6px 26px 6px 10px' }}
            >
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Fecha *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Hora (Opcional)
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
            Ubicación / Entorno (Opcional)
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="ej. Oficina Central, Sala Remota, Localhost, etc."
            style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}
          />
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
            Detalles / Directrices
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Instrucciones operativas, enlaces de Obsidian o tareas clave..."
            rows={3}
            style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
          <TacticalButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancelar
          </TacticalButton>
          <TacticalButton
            type="submit"
            variant="primary"
            size="sm"
          >
            Guardar Hito
          </TacticalButton>
        </div>
      </form>
    </ModalWrapper>
  );
}
