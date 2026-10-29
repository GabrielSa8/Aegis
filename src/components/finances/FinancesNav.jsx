import { 
  ReceiptText, 
  CreditCard, 
  CalendarRange, 
  Calendar as CalendarIcon, 
  PieChart, 
  Target, 
  History 
} from 'lucide-react';
import TacticalButton from '../ui/TacticalButton';

export const FINANCES_SUBTABS = [
  { id: 'operations', label: 'Operaciones & Registro', icon: ReceiptText },
  { id: 'accounts', label: 'Cuentas, MSI & Recurrentes', icon: CreditCard },
  { id: 'timeline', label: 'Timeline Maestro (Hitos & Operaciones)', icon: CalendarRange },
  { id: 'calendar', label: 'Calendario Mensual', icon: CalendarIcon },
  { id: 'analytics', label: 'Métricas & Analítica', icon: PieChart },
  { id: 'budgets', label: 'Presupuestos & Respaldos', icon: Target }
];

export default function FinancesNav({
  subTab,
  onSelectSubTab,
  startDate,
  endDate,
  snapshotsCount,
  onOpenBackups
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.5rem 1rem',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      gap: '8px',
      flexWrap: 'wrap'
    }}>
      {/* Pills de Navegación */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {FINANCES_SUBTABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectSubTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                color: isActive ? 'var(--text-high)' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              <Icon size={14} color={isActive ? '#10b981' : '#788882'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Ciclo Info & Acciones Rápidas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {startDate && endDate && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Ciclo: {startDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} - {endDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          </span>
        )}
        <TacticalButton
          variant="secondary"
          size="sm"
          icon={History}
          onClick={onOpenBackups}
          title="Ver e importar copias automáticas locales"
        >
          Respaldos ({snapshotsCount})
        </TacticalButton>
      </div>
    </div>
  );
}
