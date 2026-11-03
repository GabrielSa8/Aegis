import { ShieldCheck } from 'lucide-react';

export default function AegisProcessFootprint({ telemetry, formattedUptime }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px'
    }}>
      <h3 style={{ 
        fontSize: '0.74rem', 
        fontWeight: 700, 
        color: 'var(--text-muted)', 
        textTransform: 'uppercase', 
        letterSpacing: '0.04em', 
        marginBottom: '8px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px' 
      }}>
        <ShieldCheck size={14} color="var(--primary)" />
        Telemetría del Proceso Aegis & Entorno Operativo
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
        {/* VmRSS Aegis */}
        <div style={{ background: 'color-mix(in srgb, var(--bg-surface) 60%, transparent)', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Consumo RAM Aegis (VmRSS)</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--primary)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {telemetry?.aegisRamMb || 48} MB
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>(Objetivo ≤ 55 MB)</span>
          </div>
        </div>

        {/* Uptime Host */}
        <div style={{ background: 'color-mix(in srgb, var(--bg-surface) 60%, transparent)', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Uptime del Host</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-high)', fontWeight: 700, fontFamily: 'var(--font-mono)', display: 'block', marginTop: '2px' }}>
            {formattedUptime}
          </span>
        </div>

        {/* Load Avg */}
        <div style={{ background: 'color-mix(in srgb, var(--bg-surface) 60%, transparent)', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Carga Promedio (1m • 5m • 15m)</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-high)', fontWeight: 700, fontFamily: 'var(--font-mono)', display: 'block', marginTop: '2px' }}>
            {telemetry?.loadAvg1m || 0.5} • {telemetry?.loadAvg5m || 0.5} • {telemetry?.loadAvg15m || 0.5}
          </span>
        </div>

        {/* Protección Git */}
        <div style={{ background: 'color-mix(in srgb, var(--bg-surface) 60%, transparent)', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Protección de Repositorios Git</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 700, display: 'block', marginTop: '2px' }}>
            Compuertas y Bloqueos de Seguridad ACTIVOS
          </span>
        </div>
      </div>
    </div>
  );
}
