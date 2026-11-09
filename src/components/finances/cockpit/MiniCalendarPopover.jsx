import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayLocalDateStr } from '../../../utils/storage';

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function MiniCalendarPopover({ selectedDate, onSelectDate, onClose, dropUp = false }) {
  const popoverRef = useRef(null);
  const [effectiveDropUp, setEffectiveDropUp] = useState(dropUp);

  // Parsear fecha inicial
  const initialDate = (() => {
    if (selectedDate) {
      const [y, m, d] = selectedDate.split('-').map((n) => parseInt(n, 10));
      if (!isNaN(y) && !isNaN(m)) return new Date(y, m - 1, d || 1);
    }
    return new Date();
  })();

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Auto-detección de espacio en viewport si no se forzó dropUp
  useEffect(() => {
    if (dropUp) {
      setEffectiveDropUp(true);
      return;
    }
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      if (window.innerHeight - rect.bottom < 20) {
        setEffectiveDropUp(true);
      }
    }
  }, [dropUp]);

  // Click outside para cerrar
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Navegación de mes
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Cálculo de cuadrícula mensual (Lunes a Domingo)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // 0 = Lunes

  const todayStr = getTodayLocalDateStr();

  const handleDayClick = (day) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onSelectDate(`${viewYear}-${mm}-${dd}`);
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      className="mini-calendar-popover"
      style={{
        position: 'absolute',
        top: effectiveDropUp ? 'auto' : 'calc(100% + 6px)',
        bottom: effectiveDropUp ? 'calc(100% + 6px)' : 'auto',
        left: 0,
        zIndex: 100,
        width: '238px',
        padding: '0.65rem',
        borderRadius: 'var(--radius-md, 10px)',
        background: 'color-mix(in srgb, var(--surface-panel, var(--bg-card)) 98%, transparent)',
        border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.75), 0 0 16px color-mix(in srgb, var(--primary) 12%, transparent)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}
    >
      {/* Cabecera del Mes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={prevMonth}
          className="cockpit-filter-pill"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '4px'
          }}
        >
          <ChevronLeft size={14} />
        </button>

        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>

        <button
          type="button"
          onClick={nextMonth}
          className="cockpit-filter-pill"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '4px'
          }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Días de la Semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
        {WEEKDAYS.map((wd) => (
          <span key={wd} style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {wd}
          </span>
        ))}
      </div>

      {/* Cuadrícula de Días */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {/* Huecos vacíos antes del día 1 */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} style={{ width: '28px', height: '26px' }} />
        ))}

        {/* Recuadros de cada día */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = selectedDate === dateStr;
          const isCurrentToday = todayStr === dateStr;

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayClick(day)}
              className={`mini-cal-day-cell ${isSelected ? 'selected' : ''}`}
              style={{
                width: '28px',
                height: '26px',
                borderRadius: 'var(--radius-sm, 5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: isSelected || isCurrentToday ? 700 : 500,
                cursor: 'pointer',
                border: isSelected 
                  ? '1px solid var(--accent, var(--primary))' 
                  : isCurrentToday 
                    ? '1px dashed color-mix(in srgb, var(--accent, var(--primary)) 60%, transparent)' 
                    : '1px solid transparent',
                background: isSelected 
                  ? 'color-mix(in srgb, var(--accent, var(--primary)) 25%, transparent)' 
                  : isCurrentToday 
                    ? 'color-mix(in srgb, var(--accent, var(--primary)) 8%, transparent)' 
                    : 'transparent',
                color: isSelected 
                  ? 'var(--text-high)' 
                  : isCurrentToday 
                    ? 'var(--accent, var(--primary))' 
                    : 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
