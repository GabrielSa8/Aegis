import { useState, useMemo } from 'react';
import { Edit3, Trash2, CalendarRange, ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react';
import { isDateInRange } from '../../../utils/storage';
import InlineTxEditor from './InlineTxEditor';

export default function CycleAgendaDeck({
  transactions = [],
  startDate,
  endDate,
  cycleLabel,
  onSaveTransaction,
  onDeleteTx
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'expense' | 'income'
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTx, setEditingTx] = useState(null);

  // Filtrar todas las transacciones que caen en el ciclo seleccionado
  const cycleTxs = useMemo(() => {
    return (transactions || [])
      .filter((tx) => {
        if (!tx.date) return false;
        if (startDate && endDate && !isDateInRange(tx.date, startDate, endDate)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, startDate, endDate]);

  // Totales del ciclo completo seleccionado
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of cycleTxs) {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') income += amt;
      else expense += amt;
    }
    return {
      income,
      expense,
      balance: income - expense,
      count: cycleTxs.length
    };
  }, [cycleTxs]);

  // Filtrado por tipo y búsqueda
  const filteredTxs = useMemo(() => {
    return cycleTxs.filter((tx) => {
      if (filter !== 'all' && tx.type !== filter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desc = (tx.description || '').toLowerCase();
        const cat = (tx.category || '').toLowerCase();
        const method = (tx.paymentMethod || '').toLowerCase();
        return desc.includes(q) || cat.includes(q) || method.includes(q);
      }
      return true;
    });
  }, [cycleTxs, filter, searchQuery]);

  const handleSaveInline = async (updatedTx) => {
    if (onSaveTransaction) {
      await onSaveTransaction(updatedTx);
    }
    setEditingTx(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Resumen Financiero del Ciclo Seleccionado */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0.45rem 0.65rem',
          borderRadius: 'var(--radius-sm, 6px)',
          background: 'color-mix(in srgb, var(--accent, var(--primary)) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent, var(--primary)) 20%, transparent)',
          flexWrap: 'wrap',
          gap: '0.4rem'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Transacciones del Ciclo
          </span>
          {cycleLabel && (
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CalendarRange size={10} style={{ color: 'var(--accent, var(--primary))' }} />
              {cycleLabel}
            </span>
          )}
        </div>

        {/* Totales de Ingresos, Gastos y Balance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace' }}>
          <span style={{ color: 'var(--accent, var(--primary))', fontWeight: 700 }} title="Ingresos del ciclo">
            +${totals.income.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span style={{ color: 'var(--danger, #ef4444)', fontWeight: 700 }} title="Gastos del ciclo">
            -${totals.expense.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span 
            style={{ 
              fontWeight: 800, 
              color: totals.balance >= 0 ? 'var(--primary, #10b981)' : 'var(--danger, #ef4444)',
              padding: '1px 5px',
              borderRadius: '3px',
              background: 'color-mix(in srgb, var(--bg-card) 80%, transparent)'
            }}
            title="Balance neto del ciclo"
          >
            {totals.balance >= 0 ? '+' : ''}${totals.balance.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Controles de Filtro & Búsqueda */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '3px' }}>
          {[
            { id: 'all', label: `Todos (${cycleTxs.length})` },
            { id: 'expense', label: 'Gastos' },
            { id: 'income', label: 'Ingresos' }
          ].map((item) => {
            const isActive = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className="cockpit-filter-pill"
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.68rem',
                  fontWeight: isActive ? 700 : 500,
                  borderRadius: 'var(--radius-sm, 5px)',
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

        {/* Input de Búsqueda Rápida */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)', border: '1px solid var(--border-color, rgba(255,255,255,0.08))', borderRadius: 'var(--radius-sm, 5px)', padding: '2px 6px', gap: '4px' }}>
          <Search size={10} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar en ciclo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '0.66rem',
              color: 'var(--text-high)',
              width: '100px'
            }}
          />
        </div>
      </div>

      {/* Lista Scrolleable de Todas las Transacciones del Ciclo */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          paddingRight: '2px'
        }}
        className="no-scrollbar"
      >
        {filteredTxs.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
            No hay transacciones registradas en este ciclo con el filtro seleccionado.
          </div>
        ) : (
          filteredTxs.map((tx) => {
            const isIncome = tx.type === 'income';
            const amt = Number(tx.amount) || 0;
            const isBeingEdited = editingTx?.id === tx.id;
            const formattedDate = (tx.date || '').split('-').slice(1).reverse().join('/');

            return (
              <div
                key={tx.id}
                className="day-deck-tx-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.35rem 0.55rem',
                  borderRadius: 'var(--radius-sm, 5px)',
                  border: isBeingEdited
                    ? '1px solid var(--accent, var(--primary))'
                    : '1px solid var(--border-color, rgba(255,255,255,0.08))',
                  background: isBeingEdited
                    ? 'color-mix(in srgb, var(--accent, var(--primary)) 12%, var(--bg-card))'
                    : 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {formattedDate}
                    </span>
                    <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description || tx.category}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.63rem', color: 'var(--text-muted)' }}>
                    {tx.paymentMethod} • {tx.category}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 700,
                      color: isIncome ? 'var(--accent, var(--primary))' : 'var(--text-high)'
                    }}
                  >
                    {isIncome ? '+' : '-'}${amt.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setEditingTx(isBeingEdited ? null : tx)}
                      className="cockpit-filter-pill"
                      title="Editar transacción"
                      style={{
                        background: isBeingEdited ? 'var(--accent, var(--primary))' : 'transparent',
                        border: 'none',
                        color: isBeingEdited ? 'var(--bg-main)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        borderRadius: '3px',
                        touchAction: 'manipulation'
                      }}
                    >
                      <Edit3 size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingTx?.id === tx.id) setEditingTx(null);
                        onDeleteTx?.(tx);
                      }}
                      className="cockpit-filter-pill"
                      title="Eliminar"
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger, #ef4444)', cursor: 'pointer', padding: '2px' }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Editor Inline en la parte inferior si se pulsa Editar */}
      {editingTx && (
        <InlineTxEditor
          tx={editingTx}
          onSave={handleSaveInline}
          onCancel={() => setEditingTx(null)}
        />
      )}
    </div>
  );
}
