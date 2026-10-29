import { Sparkles, Download } from 'lucide-react';
import TacticalButton from '../ui/TacticalButton';

export default function CycleCloseBanner({ isToday22, onExportBackup }) {
  if (!isToday22) return null;

  return (
    <div 
      className="glass cycle-banner" 
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0.8rem 1.25rem', 
        background: 'rgba(168, 85, 247, 0.1)', 
        border: '1px solid rgba(168, 85, 247, 0.3)', 
        borderRadius: 'var(--radius-lg)' 
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Sparkles size={16} style={{ color: '#a855f7' }} />
        <div>
          <span style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.85rem' }}>
            ¡Hoy es cierre de ciclo financiero! 📦
          </span>
          <p style={{ fontSize: '0.75rem', color: '#d8b4fe', margin: '2px 0 0 0' }}>
            Te recomendamos exportar una copia física de tus datos.
          </p>
        </div>
      </div>
      <TacticalButton
        variant="primary"
        size="sm"
        icon={Download}
        onClick={onExportBackup}
        style={{
          background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
          borderColor: 'transparent'
        }}
      >
        Exportar Ahora
      </TacticalButton>
    </div>
  );
}
