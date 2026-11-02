import { useState, useEffect } from 'react';
import { Check, X, Edit3, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { getCategories, getPaymentMethods } from '../../../utils/storage';

export default function InlineTxEditor({ tx, onSave, onCancel }) {
  const [amount, setAmount] = useState(tx?.amount ?? '');
  const [type, setType] = useState(tx?.type ?? 'expense');
  const [description, setDescription] = useState(tx?.description ?? '');
  const [category, setCategory] = useState(tx?.category ?? '');
  const [paymentMethod, setPaymentMethod] = useState(tx?.paymentMethod ?? '');
  const [date, setDate] = useState(tx?.date ?? '');
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([getCategories(), getPaymentMethods()])
      .then(([cats, pms]) => {
        if (mounted) {
          if (Array.isArray(cats)) setCategories(cats);
          if (Array.isArray(pms)) setPaymentMethods(pms);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    onSave({
      ...tx,
      amount: Number(amount),
      type,
      description: description.trim(),
      category: category || (categories[0] || 'Varios'),
      paymentMethod: paymentMethod || (paymentMethods[0]?.name || 'Efectivo'),
      date
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        borderRadius: 'var(--radius-md, 8px)',
        border: '1px solid color-mix(in srgb, var(--accent, var(--primary)) 40%, var(--border-color))',
        background: 'color-mix(in srgb, var(--bg-card) 95%, transparent)',
        padding: '0.65rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Cabecera del Editor */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Edit3 size={12} style={{ color: 'var(--accent, var(--primary))' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Editar Movimiento
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-tx-close-btn"
          title="Cerrar edición"
        >
          <X size={12} />
        </button>
      </div>

      {/* Fila 1: Monto y Tipo Gasto / Ingreso */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm, 5px)', padding: '2px 6px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '4px', fontFamily: 'JetBrains Mono, monospace' }}>$</span>
          <input
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-high)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}
          />
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`inline-tx-type-btn ${type === 'expense' ? 'active-expense' : ''}`}
          >
            <ArrowDownLeft size={11} />
            <span>Gasto</span>
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`inline-tx-type-btn ${type === 'income' ? 'active-income' : ''}`}
          >
            <ArrowUpRight size={11} />
            <span>Ingreso</span>
          </button>
        </div>
      </div>

      {/* Fila 2: Descripción y Categoría */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6px' }}>
        <input
          type="text"
          placeholder="Descripción..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            padding: '4px 6px',
            fontSize: '0.72rem',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm, 5px)',
            color: 'var(--text-high)',
            outline: 'none'
          }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: '4px 6px',
            fontSize: '0.72rem',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm, 5px)',
            color: 'var(--text-high)',
            outline: 'none'
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Fila 3: Método de Pago y Fecha */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6px' }}>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          style={{
            padding: '4px 6px',
            fontSize: '0.72rem',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm, 5px)',
            color: 'var(--text-high)',
            outline: 'none'
          }}
        >
          {paymentMethods.map((pm) => (
            <option key={pm.id || pm.name} value={pm.name}>{pm.name}</option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            padding: '3px 5px',
            fontSize: '0.7rem',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm, 5px)',
            color: 'var(--text-high)',
            outline: 'none'
          }}
        />
      </div>

      {/* Botones de Acción */}
      <div className="inline-tx-actions">
        <button
          type="button"
          onClick={onCancel}
          className="inline-tx-btn inline-tx-btn-cancel"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="inline-tx-btn inline-tx-btn-save"
        >
          <Check size={12} />
          <span>Guardar Cambios</span>
        </button>
      </div>
    </form>
  );
}
