import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Settings2, Check } from 'lucide-react';

export default function LedgerHeaderFilter({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  visibleCount = 0,
  totalCount = 0,
  startDate,
  endDate,
  cutoffDay = 22,
  onUpdateCutoffDay,
  onShiftCycle
}) {
  const [showCutoffPopover, setShowCutoffPopover] = useState(false);
  const [tempCutoffDay, setTempCutoffDay] = useState(cutoffDay);

  useEffect(() => {
    setTempCutoffDay(cutoffDay);
  }, [cutoffDay]);

  const formattedCycle = (() => {
    if (!startDate || !endDate) return 'Ciclo mensual';
    const sStr = startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const eStr = endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    return `${sStr} — ${eStr}`;
  })();

  const handleSaveCutoff = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const val = parseInt(tempCutoffDay, 10);
    if (!isNaN(val) && val >= 1 && val <= 31) {
      onUpdateCutoffDay?.(val);
      setShowCutoffPopover(false);
    }
  };

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '0.65rem 0.85rem',
        borderRadius: 'var(--radius-md, 8px)',
        border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        background: 'var(--bg-card, rgba(255,255,255,0.02))'
      }}
    >
      {/* Fila 1: Control de Ciclo Financiero Configurable */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {/* Navegación de Ciclo Anterior / Siguiente */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button
              type="button"
              onClick={() => onShiftCycle?.(-1)}
              className="cockpit-filter-pill"
              title="Ciclo anterior"
              style={{ background: 'transparent', border: '1px solid var(--border-color, rgba(255,255,255,0.08))', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 5px', borderRadius: 'var(--radius-sm, 4px)' }}
            >
              <ChevronLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => onShiftCycle?.(1)}
              className="cockpit-filter-pill"
              title="Ciclo siguiente"
              style={{ background: 'transparent', border: '1px solid var(--border-color, rgba(255,255,255,0.08))', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 5px', borderRadius: 'var(--radius-sm, 4px)' }}
            >
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Rango del Ciclo */}
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--text-high)',
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--radius-sm, 4px)',
              background: 'color-mix(in srgb, var(--accent, var(--primary)) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent, var(--primary)) 25%, transparent)'
            }}
          >
            Ciclo: {formattedCycle}
          </span>

          {/* Botón Configurar Día de Corte */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => {
                setTempCutoffDay(cutoffDay);
                setShowCutoffPopover((prev) => !prev);
              }}
              className="cockpit-filter-pill"
              title="Configurar día de corte mensual"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.7rem',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-sm, 4px)',
                border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <Settings2 size={12} />
              <span>Corte: día {cutoffDay}</span>
            </button>

            {/* Popover Configurar Corte */}
            {showCutoffPopover && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 59 }}
                  onClick={() => setShowCutoffPopover(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    zIndex: 60,
                    width: '190px',
                    padding: '0.55rem',
                    borderRadius: 'var(--radius-sm, 6px)',
                    background: 'color-mix(in srgb, var(--surface-panel, var(--bg-card)) 98%, transparent)',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-high)', fontWeight: 600 }}>
                  Día de corte mensual (1-31):
                </span>
                <form onSubmit={handleSaveCutoff} style={{ display: 'flex', gap: '0.3rem' }}>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={tempCutoffDay}
                    onChange={(e) => setTempCutoffDay(e.target.value)}
                    autoFocus
                    className="cockpit-cutoff-input"
                    style={{
                      width: '60px',
                      background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                      borderRadius: 'var(--radius-sm, 4px)',
                      color: 'var(--text-high)',
                      fontSize: '0.75rem',
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: '0.2rem 0.4rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    aria-label="Guardar corte"
                    className="cockpit-filter-pill cutoff-save-btn"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      background: 'color-mix(in srgb, var(--accent, var(--primary)) 20%, transparent)',
                      border: '1px solid var(--accent, var(--primary))',
                      color: 'var(--text-high)',
                      fontSize: '0.7rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm, 4px)',
                      cursor: 'pointer'
                    }}
                  >
                    <Check size={12} />
                    <span>OK</span>
                  </button>
                </form>
              </div>
            </>
          )}
          </div>
        </div>

        {/* Contador */}
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          {visibleCount}/{totalCount} registros en ciclo
        </span>
      </div>

      {/* Fila 2: Buscador + Filtros por Tipo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
        {/* Buscador Rápido */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            flex: '1 1 180px',
            maxWidth: '300px',
            padding: '0.22rem 0.55rem',
            borderRadius: 'var(--radius-sm, 6px)',
            border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
            background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)'
          }}
        >
          <Search size={13} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar concepto o categoría..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-high)',
              fontSize: '0.75rem',
              width: '100%'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.7rem',
                padding: '0 2px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros Tipo */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'expense', label: 'Gastos (-)' },
            { id: 'income', label: 'Ingresos (+)' }
          ].map((item) => {
            const isActive = typeFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTypeFilterChange(item.id)}
                className="cockpit-filter-pill"
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.72rem',
                  fontWeight: isActive ? 700 : 500,
                  borderRadius: 'var(--radius-sm, 6px)',
                  cursor: 'pointer',
                  border: isActive 
                    ? '1px solid var(--accent, var(--primary))' 
                    : '1px solid var(--border-color, rgba(255,255,255,0.08))',
                  background: isActive 
                    ? 'color-mix(in srgb, var(--accent, var(--primary)) 15%, transparent)' 
                    : 'transparent',
                  color: isActive ? 'var(--text-high)' : 'var(--text-muted)'
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
