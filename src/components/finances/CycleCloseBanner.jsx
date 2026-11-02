import { Sparkles, Download } from 'lucide-react';
import TacticalButton from '../ui/TacticalButton';

export default function CycleCloseBanner({ isToday22, isTodayCutoff, onExportBackup }) {
  const isCutoff = isTodayCutoff ?? isToday22;
  if (!isCutoff) return null;

  return (
    <div 
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0.65rem 1rem', 
        background: 'color-mix(in srgb, var(--accent, var(--primary)) 12%, transparent)', 
        border: '1px solid color-mix(in srgb, var(--accent, var(--primary)) 30%, transparent)', 
        borderRadius: 'var(--radius-md, 10px)' 
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={16} style={{ color: 'var(--accent, var(--primary))' }} />
        <div>
          <span style={{ fontWeight: '700', color: 'var(--text-high)', fontSize: '0.82rem' }}>
            ¡Hoy es cierre de ciclo financiero! 📦
          </span>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Te recomendamos exportar una copia física de tus datos.
          </p>
        </div>
      </div>
      <TacticalButton
        variant="primary"
        size="sm"
        icon={Download}
        onClick={onExportBackup}
      >
        Exportar Ahora
      </TacticalButton>
    </div>
  );
}
