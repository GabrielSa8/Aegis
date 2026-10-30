import { Plus } from 'lucide-react';

export default function MacroDeck({
  macros,
  loading,
  onExecuteMacro,
  onOpenMacroModal
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      padding: '0.3rem 1.75rem 0.4rem 1.75rem',
      flexShrink: 0
    }}>
      <div 
        className="no-scrollbar" 
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', flex: 1 }}
      >
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>MACROS:</span>
        {macros.map((macro, idx) => (
          <button
            key={macro.id || idx}
            onClick={() => onExecuteMacro(macro.text)}
            disabled={loading}
            className="terminal-btn"
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            <kbd className="tactical-kbd" style={{ fontSize: '0.55rem', padding: '0 4px' }}>{idx + 1}</kbd>
            <span>{macro.label}</span>
          </button>
        ))}
        <button
          onClick={onOpenMacroModal}
          className="terminal-btn"
          style={{ padding: '3px 7px' }}
          title="Administrar macros personalizados (CRUD)"
        >
          <Plus size={11} color="var(--primary)" />
          <span>Editar</span>
        </button>
      </div>
    </div>
  );
}
