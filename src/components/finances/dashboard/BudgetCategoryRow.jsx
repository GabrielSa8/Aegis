import React from 'react';
import { RotateCcw, DollarSign, Trash2, Check, X } from 'lucide-react';

/**
 * BudgetCategoryRow — Fila atómica de apartado de presupuesto.
 * Auto-expansión elástica determinista con CSS Grid Mirror:
 * - Base fija y compacta de 5 dígitos ('00000') sin espacio muerto excesivo ni recortes.
 * - Expansión pixel a pixel a partir del 6to dígito.
 * - Tope estricto en el 10mo dígito.
 */
export function BudgetCategoryRow({
  category,
  limitValue = '',
  spent = 0,
  isConfirmingDelete = false,
  onBudgetChange,
  onReset,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete
}) {
  const numLimit = parseFloat(limitValue) || 0;
  const pct = numLimit > 0 ? Math.round((spent / numLimit) * 100) : 0;

  // Espejo tipográfico para auto-dimensionamiento exacto
  const strVal = limitValue !== undefined && limitValue !== null ? String(limitValue) : '';
  const mirrorText = strVal.length <= 5 ? '00000' : strVal.slice(0, 10);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.7rem 1.1rem',
        borderRadius: 'var(--radius-md, 8px)',
        background: 'color-mix(in srgb, var(--bg-card) 92%, black)',
        border: '1px solid var(--border-color)',
        gap: '12px',
        flexWrap: 'wrap',
        transition: 'border-color 0.15s ease, background 0.15s ease'
      }}
    >
      {/* 🏷️ Columna Izquierda: Información del Apartado */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: '140px', flex: '1 1 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-high)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {category}
          </span>
          {numLimit > 0 && (
            <span
              style={{
                fontSize: '0.66rem',
                fontFamily: 'var(--font-mono)',
                padding: '1px 6px',
                borderRadius: '4px',
                background: pct > 100
                  ? 'color-mix(in srgb, var(--danger) 18%, transparent)'
                  : 'color-mix(in srgb, var(--primary) 14%, transparent)',
                color: pct > 100 ? 'var(--danger)' : 'var(--primary)',
                border: pct > 100
                  ? '1px solid color-mix(in srgb, var(--danger) 30%, transparent)'
                  : '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
                fontWeight: 600
              }}
            >
              {pct}%
            </span>
          )}
        </div>

        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px' }}>
          Gastado en ciclo: <strong style={{ color: 'var(--text-high)', fontFamily: 'var(--font-mono)' }}>${spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
        </span>
      </div>

      {/* ⚙️ Columna Derecha: Cluster de Controles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Reset / Quitar Límite (visible cuando hay límite asignado) */}
        {numLimit > 0 && (
          <button
            type="button"
            onClick={() => onReset(category)}
            className="structure-action-btn"
            style={{
              padding: '0 8px',
              height: '30px',
              minHeight: '30px',
              minWidth: '30px',
              borderRadius: '5px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
            title="Quitar límite (Sin límite)"
          >
            <RotateCcw size={12} />
          </button>
        )}

        {/* Input de Monto con Espejo Grid (Ajuste Táctico Exacto) */}
        <div
          className="budget-inline-edit-wrapper"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            height: '30px',
            boxSizing: 'border-box'
          }}
        >
          <DollarSign size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <div
            style={{
              display: 'inline-grid',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            {/* Espejo tipográfico invisible */}
            <span
              aria-hidden="true"
              style={{
                gridArea: '1 / 1',
                visibility: 'hidden',
                whiteSpace: 'pre',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.84rem',
                fontWeight: 700,
                padding: '0 2px',
                pointerEvents: 'none',
                userSelect: 'none'
              }}
            >
              {mirrorText}
            </span>

            {/* Input activo auto-escalado exactamente por el espejo */}
            <input
              type="number"
              placeholder="0"
              value={limitValue}
              onChange={(e) => onBudgetChange(category, e.target.value)}
              className="budget-inline-input"
              style={{
                gridArea: '1 / 1',
                width: '100%',
                height: '100%',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.84rem',
                fontWeight: 700,
                padding: '0 2px',
                margin: 0,
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Zona de Borrado / Confirmación Inline */}
        <div
          style={{
            minWidth: '32px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}
        >
          {isConfirmingDelete ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 7px',
                borderRadius: '5px',
                background: 'color-mix(in srgb, var(--danger) 14%, transparent)',
                border: '1px solid color-mix(in srgb, var(--danger) 32%, transparent)',
                boxShadow: '0 0 10px color-mix(in srgb, var(--danger) 20%, transparent)'
              }}
            >
              <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--danger)' }}>
                ¿Borrar?
              </span>
              <button
                type="button"
                onClick={() => onConfirmDelete(category)}
                className="budget-edit-btn confirm"
                style={{ width: '26px', height: '26px', minWidth: '26px', minHeight: '26px', cursor: 'pointer', touchAction: 'manipulation' }}
                title="Confirmar eliminación"
              >
                <Check size={12} />
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                className="budget-edit-btn cancel"
                style={{ width: '26px', height: '26px', minWidth: '26px', minHeight: '26px', cursor: 'pointer', touchAction: 'manipulation' }}
                title="Cancelar"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onRequestDelete(category)}
              className="structure-action-btn delete"
              style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', padding: 0, borderRadius: '6px', cursor: 'pointer', touchAction: 'manipulation' }}
              title={`Eliminar apartado ${category}`}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
