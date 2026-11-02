import { Download, Upload } from 'lucide-react';
import Dashboard from '../Dashboard';
import TacticalButton from '../ui/TacticalButton';

export default function BudgetsSection({
  safeTransactions,
  selectedDate,
  cutoffDay,
  onBudgetChange,
  onExportBackup,
  onImportBackup
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Panel de Respaldos */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Copias de Seguridad Físicas</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
            Exporta tus transacciones en JSON o restaura un respaldo previo.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <TacticalButton
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={onExportBackup}
          >
            Exportar JSON
          </TacticalButton>
          <label 
            className="btn btn-secondary" 
            style={{ 
              cursor: 'pointer', 
              borderRadius: 'var(--radius-md)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              fontSize: '0.75rem',
              padding: '6px 12px'
            }}
          >
            <Upload size={14} />
            <span>Importar JSON</span>
            <input type="file" accept=".json" onChange={onImportBackup} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Panel de Presupuestos (Dashboard) */}
      <Dashboard 
        transactions={safeTransactions} 
        selectedDate={selectedDate} 
        cutoffDay={cutoffDay}
        onBudgetChange={onBudgetChange} 
        showBudgets={true}
        showStats={false}
      />
    </div>
  );
}
