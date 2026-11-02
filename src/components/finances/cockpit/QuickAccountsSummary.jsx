import { useMemo, useState, useEffect } from 'react';
import { CreditCard, Wallet, Banknote } from 'lucide-react';
import { getPaymentMethods } from '../../../utils/storage';

export default function QuickAccountsSummary({ monthlyTxs = [] }) {
  const [methods, setMethods] = useState([]);

  useEffect(() => {
    let mounted = true;
    getPaymentMethods()
      .then((res) => {
        if (mounted && Array.isArray(res)) setMethods(res);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Mapear gastos del ciclo activo agrupados por método de pago
  const spentByMethod = useMemo(() => {
    const map = new Map();
    for (const tx of monthlyTxs) {
      if (tx.type === 'expense') {
        const rawMethod = (tx.paymentMethod || '').trim().toLowerCase();
        const amt = Number(tx.amount) || 0;
        if (rawMethod) {
          map.set(rawMethod, (map.get(rawMethod) || 0) + amt);
        }
      }
    }
    return map;
  }, [monthlyTxs]);

  // Cruzar las tarjetas registradas con sus gastos del ciclo y límites
  const cardsData = useMemo(() => {
    if (!methods || methods.length === 0) return [];

    return methods.map((pm) => {
      const isCredit = pm.type === 'credit';
      const name = pm.name || 'Tarjeta';
      const nameKey = name.toLowerCase();
      const idKey = (pm.id || '').toLowerCase();

      // Buscar gasto por nombre exacto o por id
      const spent = spentByMethod.get(nameKey) || spentByMethod.get(idKey) || 0;

      // Saldo total / límite según el tipo
      const total = Number(isCredit ? pm.creditLimit || pm.balance || 0 : pm.balance || 0);

      // Porcentaje de uso sobre el total
      const pct = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;

      return {
        id: pm.id || name,
        name,
        type: pm.type || 'debit',
        isCredit,
        total,
        spent,
        pct
      };
    });
  }, [methods, spentByMethod]);

  const getUsageColor = (pct) => {
    if (pct >= 85) return 'var(--danger, #ef4444)';
    if (pct >= 60) return 'var(--warning, #d97706)';
    return 'var(--primary, #10b981)';
  };

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md, 8px)',
        border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        background: 'var(--bg-card, rgba(255,255,255,0.02))',
        padding: '0.65rem 0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        flexShrink: 0
      }}
    >
      {/* Cabecera del Panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', paddingBottom: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <CreditCard size={13} style={{ color: 'var(--accent, var(--primary))' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-high)', letterSpacing: '0.02em' }}>
            TARJETAS & SALDOS EN SISTEMA
          </span>
        </div>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          {cardsData.length} registradas
        </span>
      </div>

      {/* Lista de Tarjetas con Límite, Gasto y Barra de % */}
      {cardsData.length === 0 ? (
        <div style={{ padding: '0.6rem 0', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Sin tarjetas registradas en sistema. Puedes agregarlas en la pestaña Estructura (3).
        </div>
      ) : (
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.45rem', 
            maxHeight: '190px', 
            overflowY: 'auto' 
          }} 
          className="no-scrollbar"
        >
          {cardsData.map((card) => {
            const barColor = getUsageColor(card.pct);
            const Icon = card.isCredit ? CreditCard : (card.type === 'cash' ? Banknote : Wallet);

            return (
              <div
                key={card.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  padding: '0.35rem 0.5rem',
                  borderRadius: 'var(--radius-sm, 5px)',
                  background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.05))'
                }}
              >
                {/* Fila Superior: Nombre + Gastado / Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.69rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Icon size={11} style={{ color: card.isCredit ? 'var(--accent, var(--primary))' : 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>{card.name}</span>
                    <span 
                      style={{ 
                        fontSize: '0.58rem', 
                        padding: '1px 3px', 
                        borderRadius: '3px', 
                        background: card.isCredit 
                          ? 'color-mix(in srgb, var(--accent, var(--primary)) 15%, transparent)' 
                          : 'color-mix(in srgb, var(--text-muted) 12%, transparent)',
                        color: card.isCredit ? 'var(--accent, var(--primary))' : 'var(--text-muted)',
                        fontWeight: 500
                      }}
                    >
                      {card.isCredit ? 'Crédito' : (card.type === 'cash' ? 'Efectivo' : 'Débito')}
                    </span>
                  </div>

                  {/* Cifras: Gastado / Total y % */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem' }}>
                    <span style={{ color: card.spent > 0 ? 'var(--text-high)' : 'var(--text-muted)', fontWeight: 600 }}>
                      ${card.spent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>/</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {card.total > 0 
                        ? `$${card.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` 
                        : 'S/L'}
                    </span>
                    {card.total > 0 && (
                      <span 
                        style={{ 
                          fontSize: '0.62rem', 
                          fontWeight: 700, 
                          color: barColor,
                          marginLeft: '2px'
                        }}
                      >
                        {card.pct}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Línea de Porcentaje de Uso sobre Total */}
                <div
                  style={{
                    width: '100%',
                    height: '4px',
                    borderRadius: '2px',
                    background: 'color-mix(in srgb, var(--border-color) 85%, transparent)',
                    overflow: 'hidden'
                  }}
                  title={card.total > 0 ? `Uso: ${card.pct}% ($${card.spent} de $${card.total})` : `Gastado: $${card.spent}`}
                >
                  <div
                    style={{
                      width: `${card.total > 0 ? card.pct : (card.spent > 0 ? 100 : 0)}%`,
                      height: '100%',
                      borderRadius: '2px',
                      background: card.total > 0 ? barColor : 'color-mix(in srgb, var(--text-muted) 40%, transparent)',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
