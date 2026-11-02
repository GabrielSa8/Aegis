import { Plus, Settings } from 'lucide-react';

export default function CategoryChipGrid({ 
  categories = [], 
  selectedCategory = '', 
  onSelectCategory,
  onOpenManager 
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.02em' }}>
          CATEGORÍA
        </label>
        <button
          type="button"
          onClick={onOpenManager}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.7rem',
            padding: '2px 4px',
            borderRadius: 'var(--radius-sm, 4px)',
            transition: 'color 0.15s ease'
          }}
          title="Administrar categorías"
        >
          <Settings size={12} />
          <span>Gestionar</span>
        </button>
      </div>

      <div 
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '0.35rem',
          maxHeight: '120px',
          overflowY: 'auto',
          paddingBottom: '2px'
        }}
        className="no-scrollbar"
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`cockpit-pill-btn ${isSelected ? 'selected' : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.28rem 0.6rem',
                borderRadius: 'var(--radius-sm, 6px)',
                fontSize: '0.73rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                border: isSelected 
                  ? '1px solid var(--accent, var(--primary))' 
                  : '1px solid var(--border-color, rgba(255,255,255,0.08))',
                background: isSelected 
                  ? 'color-mix(in srgb, var(--accent, var(--primary)) 18%, transparent)' 
                  : 'var(--bg-card, rgba(255,255,255,0.03))',
                color: isSelected ? 'var(--text-high)' : 'var(--text-muted)'
              }}
            >
              <span>{cat}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
