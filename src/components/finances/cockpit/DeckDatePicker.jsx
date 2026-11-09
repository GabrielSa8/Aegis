import { useState } from 'react';
import { Calendar, Zap, Clock } from 'lucide-react';
import MiniCalendarPopover from './MiniCalendarPopover';
import { getTodayLocalDateStr } from '../../../utils/storage';

export default function DeckDatePicker({
  value,
  onChange,
  showHeader = true,
  label = 'FECHA DE OPERACIÓN',
  showShortcut = true,
  dropUp = false
}) {
  const [showMiniCal, setShowMiniCal] = useState(false);

  // Fechas relativas locales (evitan desfase UTC)
  const todayStr = getTodayLocalDateStr();

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getTodayLocalDateStr(yesterdayDate);

  const isToday = value === todayStr;
  const isYesterday = value === yesterdayStr;
  const isOther = !isToday && !isYesterday;

  // Formateo humano de fecha seleccionada
  const formattedDisplay = (() => {
    if (!value) return 'Elegir fecha';
    const [y, m, d] = value.split('-');
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    return dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  })();

  const selectPredefined = (dateStr) => {
    setShowMiniCal(false);
    onChange(dateStr);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {showHeader && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.02em' }}>
            {label}
          </label>
          {showShortcut && (
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Atajo: <span className="tactical-kbd">Enter</span>
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', position: 'relative' }}>
        {/* Pastilla: Hoy */}
        <button
          type="button"
          onClick={() => selectPredefined(todayStr)}
          className={`cockpit-pill-btn ${isToday ? 'selected' : ''}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.28rem 0.65rem',
            borderRadius: 'var(--radius-sm, 6px)',
            fontSize: '0.74rem',
            fontWeight: isToday ? 700 : 500,
            cursor: 'pointer',
            border: isToday 
              ? '1px solid var(--accent, var(--primary))' 
              : '1px solid var(--border-color, rgba(255,255,255,0.08))',
            background: isToday 
              ? 'color-mix(in srgb, var(--accent, var(--primary)) 18%, transparent)' 
              : 'var(--bg-card, rgba(255,255,255,0.03))',
            color: isToday ? 'var(--text-high)' : 'var(--text-muted)'
          }}
        >
          <Zap size={11} style={{ color: isToday ? 'var(--accent, var(--primary))' : 'currentColor' }} />
          <span>Hoy</span>
        </button>

        {/* Pastilla: Ayer */}
        <button
          type="button"
          onClick={() => selectPredefined(yesterdayStr)}
          className={`cockpit-pill-btn ${isYesterday ? 'selected' : ''}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.28rem 0.65rem',
            borderRadius: 'var(--radius-sm, 6px)',
            fontSize: '0.74rem',
            fontWeight: isYesterday ? 700 : 500,
            cursor: 'pointer',
            border: isYesterday 
              ? '1px solid var(--accent, var(--primary))' 
              : '1px solid var(--border-color, rgba(255,255,255,0.08))',
            background: isYesterday 
              ? 'color-mix(in srgb, var(--accent, var(--primary)) 18%, transparent)' 
              : 'var(--bg-card, rgba(255,255,255,0.03))',
            color: isYesterday ? 'var(--text-high)' : 'var(--text-muted)'
          }}
        >
          <Clock size={11} style={{ opacity: 0.7 }} />
          <span>Ayer</span>
        </button>

        {/* Selector de Mini-Calendario Táctico */}
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <button
            type="button"
            onClick={() => setShowMiniCal((prev) => !prev)}
            className={`cockpit-pill-btn ${isOther || showMiniCal ? 'selected' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.28rem 0.65rem',
              borderRadius: 'var(--radius-sm, 6px)',
              fontSize: '0.74rem',
              fontWeight: isOther || showMiniCal ? 700 : 500,
              cursor: 'pointer',
              border: isOther || showMiniCal
                ? '1px solid var(--accent, var(--primary))' 
                : '1px solid var(--border-color, rgba(255,255,255,0.08))',
              background: isOther || showMiniCal
                ? 'color-mix(in srgb, var(--accent, var(--primary)) 18%, transparent)' 
                : 'var(--bg-card, rgba(255,255,255,0.03))',
              color: isOther || showMiniCal ? 'var(--text-high)' : 'var(--text-muted)'
            }}
          >
            <Calendar size={11} style={{ opacity: 0.8 }} />
            <span>{isOther ? formattedDisplay : 'Otra fecha'}</span>
          </button>

          {/* Mini-Ventana Popover con Cuadrícula de Días */}
          {showMiniCal && (
            <MiniCalendarPopover
              selectedDate={value}
              onSelectDate={(newDate) => {
                onChange(newDate);
                setShowMiniCal(false);
              }}
              onClose={() => setShowMiniCal(false)}
              dropUp={dropUp}
            />
          )}
        </div>
      </div>
    </div>
  );
}
