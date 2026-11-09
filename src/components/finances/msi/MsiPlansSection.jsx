import React from 'react';
import { Layers, Plus, Trash2, Zap, CheckCircle2, Pencil } from 'lucide-react';

export default function MsiPlansSection({ msiPlans = [], onAddClick, onEditMsi, onPayInstallment, onDeleteMsi }) {
  return (
    <div style={{
      background: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      height: '100%',
      minHeight: 0
    }}>
      {/* Cabecera y Botón Nuevo Plan */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
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
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          color: 'var(--text-muted)',
          fontSize: '0.74rem',
          textAlign: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'color-mix(in srgb, var(--border-color) 40%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}>
            <Layers size={18} />
          </div>
          <span>No hay planes MSI activos. Pulsa en "Nuevo Plan MSI" para registrar una compra a meses.</span>
        </div>
      ) : (
        <div className="structure-list-container no-scrollbar">
          {msiPlans.map((plan) => {
            const paidInstallments = plan.totalInstallments - plan.remainingInstallments;
            const progressPct = Math.min(100, Math.round((paidInstallments / plan.totalInstallments) * 100));
            const isCompleted = plan.remainingInstallments === 0;

            return (
              <div
                key={plan.id}
                className="structure-card structure-elastic-card"
              >
                {/* Fila 1: Título + Badge de Tarjeta + Liquidado/Cuotas + Acciones */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-sm, 6px)',
                      background: 'color-mix(in srgb, var(--accent, var(--primary)) 16%, transparent)',
                      flexShrink: 0
                    }}>
                      <Layers size={13} style={{ color: 'var(--accent, var(--primary))' }} />
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {plan.description}
                    </span>
                    <span style={{
                      fontSize: '0.62rem',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: 'color-mix(in srgb, var(--accent, var(--primary)) 15%, transparent)',
                      color: 'var(--accent, var(--primary))',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600
                    }}>
                      {plan.paymentMethod}
                    </span>
                    {isCompleted ? (
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
                    ) : (
                      <span style={{
                        fontSize: '0.62rem',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: 'color-mix(in srgb, var(--border-color) 45%, transparent)',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600
                      }}>
                        {paidInstallments}/{plan.totalInstallments} cuotas ({progressPct}%)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
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
                      onClick={() => onEditMsi && onEditMsi(plan)}
                      className="structure-action-btn"
                      title="Editar plan MSI"
                      style={{ padding: '3px 7px', fontSize: '0.66rem' }}
                    >
                      <Pencil size={11} style={{ color: 'var(--accent, var(--primary))' }} />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteMsi(plan)}
                      className="structure-action-btn delete"
                      title="Eliminar plan MSI"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Fila 2: Barra de progreso de amortización */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '3px 0' }}>
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
                </div>

                {/* Fila 3: Detalle de montos y cuota mensual */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.67rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>Total: <strong style={{ color: 'var(--text-high)', fontFamily: 'var(--font-mono)' }}>${(plan.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                    <span>·</span>
                    <span>Restante: <strong style={{ color: 'var(--text-high)', fontFamily: 'var(--font-mono)' }}>${Number((plan.monthlyAmount || 0) * plan.remainingInstallments).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                    {!isCompleted && plan.nextDueDate && (
                      <>
                        <span>·</span>
                        <span title="Día en que se registra el cobro automático de este mes">
                          Cobro auto: <strong style={{ color: 'var(--accent, var(--primary))' }}>{plan.nextDueDate}</strong>
                        </span>
                      </>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '5px' }}>
                      Mensualidad
                    </span>
                    <span style={{
                      fontSize: 'clamp(0.92rem, 1.8vh, 1.15rem)',
                      fontWeight: 800,
                      color: isCompleted ? 'var(--text-muted)' : 'var(--accent, var(--primary))',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      ${(plan.monthlyAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
