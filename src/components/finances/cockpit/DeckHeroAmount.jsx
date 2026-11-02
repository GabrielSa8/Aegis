import { forwardRef } from 'react';

const DeckHeroAmount = forwardRef(function DeckHeroAmount(
  { amount, onChange, type },
  ref
) {
  return (
    <div 
      className="cockpit-hero-amount"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.4rem 0.75rem',
        borderRadius: 'var(--radius-md, 8px)',
        border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
        background: 'color-mix(in srgb, var(--bg-card) 50%, transparent)'
      }}
    >
      <span 
        style={{ 
          fontSize: '1.4rem', 
          fontWeight: 700, 
          color: type === 'income' ? 'var(--accent, var(--primary))' : 'var(--text-muted)',
          fontFamily: 'JetBrains Mono, monospace'
        }}
      >
        $
      </span>
      <input
        ref={ref}
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        required
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: '1.45rem',
          fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--text-high)'
        }}
      />
    </div>
  );
});

export default DeckHeroAmount;
