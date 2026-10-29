import React from 'react';
import { Layers, Plus, Trash2, Zap } from 'lucide-react';
import TacticalButton from '../../ui/TacticalButton';

export default function MsiPlansSection({ msiPlans, onAddClick, onPayInstallment, onDeleteMsi }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} color="#c084fc" />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-high)' }}>
            Compromisos & Meses Sin Intereses (MSI)
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            • Control de amortización y cuotas restantes
          </span>
        </div>

        <TacticalButton
          variant="secondary"
          size="xs"
          icon={Plus}
          onClick={onAddClick}
        >
          Nuevo Plan MSI
        </TacticalButton>
      </div>

      {msiPlans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          No hay planes MSI activos.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {msiPlans.map((plan) => {
            const paidInstallments = plan.totalInstallments - plan.remainingInstallments;
            const progressPct = (paidInstallments / plan.totalInstallments) * 100;
            const isCompleted = plan.remainingInstallments === 0;

            return (
              <div
                key={plan.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-high)' }}>
                      {plan.description}
                    </span>
                    <span style={{
                      fontSize: '0.62rem',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      background: 'rgba(168, 85, 247, 0.15)',
                      color: '#c084fc',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {plan.paymentMethod}
                    </span>
                    {isCompleted && (
                      <span style={{
                        fontSize: '0.62rem',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#a7f3d0'
                      }}>
                        Liquidado
                      </span>
                    )}
                  </div>

                  {/* Barra de progreso de amortización */}
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      flex: 1,
                      height: '5px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${progressPct}%`,
                        height: '100%',
                        background: isCompleted ? '#10b981' : '#c084fc',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {paidInstallments}/{plan.totalInstallments} cuotas
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#e9d5ff', fontFamily: 'var(--font-mono)' }}>
                      ${plan.monthlyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}/mes
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                      Total: ${plan.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {!isCompleted && (
                    <TacticalButton
                      variant="primary"
                      size="xs"
                      icon={Zap}
                      onClick={() => onPayInstallment(plan.id)}
                      title="Registra el gasto de la mensualidad en SQLite y descuenta 1 cuota"
                    >
                      Pagar Cuota
                    </TacticalButton>
                  )}

                  <button
                    onClick={() => onDeleteMsi(plan.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    title="Eliminar plan"
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
