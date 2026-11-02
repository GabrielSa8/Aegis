import React from 'react';
import { Layers, Plus, Trash2, Zap, CheckCircle2 } from 'lucide-react';

export default function MsiPlansSection({ msiPlans = [], onAddClick, onPayInstallment, onDeleteMsi }) {
  return (
    <div style={{
      background: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.65rem'
    }}>
      {/* Cabecera y Botón Nuevo Plan */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={14} style={{ color: 'var(--accent, var(--primary))' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Compromisos & Meses Sin Intereses (MSI)
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            ({msiPlans.length})
          </span>
        </div>

        <button
          type="button"
          onClick={onAddClick}
          className="structure-action-btn"
          title="Registrar nuevo plan a meses sin intereses"
        >
          <Plus size={12} />
          <span>Nuevo Plan MSI</span>
        </button>
      </div>

      {msiPlans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
          No hay planes MSI activos. Pulsa en "Nuevo Plan MSI" para registrar una compra a meses.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {msiPlans.map((plan) => {
            const paidInstallments = plan.totalInstallments - plan.remainingInstallments;
            const progressPct = Math.min(100, Math.round((paidInstallments / plan.totalInstallments) * 100));
            const isCompleted = plan.remainingInstallments === 0;

            return (
              <div
                key={plan.id}
                className="structure-card"
                style={{
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}
              >
                {/* Columna Izquierda: Descripción + Tarjeta + Progreso */}
                <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
                      {plan.description}
                    </span>
                    <span style={{
                      fontSize: '0.62rem',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: 'color-mix(in srgb, var(--accent, var(--primary)) 15%, transparent)',
                      color: 'var(--accent, var(--primary))',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 600
                    }}>
                      {plan.paymentMethod}
                    </span>
                    {isCompleted && (
                      <span style={{
                        fontSize: '0.62rem',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                        color: 'var(--primary)',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <CheckCircle2 size={10} />
                        Liquidado
                      </span>
                    )}
                  </div>

                  {/* Barra de progreso de amortización */}
                  <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      flex: 1,
                      height: '4px',
                      background: 'color-mix(in srgb, var(--border-color) 80%, transparent)',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${progressPct}%`,
                        height: '100%',
                        background: isCompleted ? 'var(--primary)' : 'var(--accent, var(--primary))',
                        borderRadius: '2px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {paidInstallments}/{plan.totalInstallments} cuotas ({progressPct}%)
                    </span>
                  </div>
                </div>

                {/* Columna Derecha: Montos y Botones Tácticos */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-high)', fontFamily: 'JetBrains Mono, monospace' }}>
                      ${(plan.monthlyAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}/mes
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                      Total: ${(plan.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={() => onPayInstallment(plan.id)}
                      className="structure-action-btn"
                      style={{
                        background: 'color-mix(in srgb, var(--primary) 18%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--primary) 35%, transparent)',
                        color: 'var(--primary)'
                      }}
                      title="Registra el gasto de la cuota en SQLite y descuenta 1 mensualidad"
                    >
                      <Zap size={11} />
                      <span>Pagar Cuota</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteMsi(plan)}
                    className="structure-action-btn delete"
                    title="Eliminar plan MSI"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
