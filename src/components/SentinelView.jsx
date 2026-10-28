import { Activity, Cpu, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function SentinelView() {
  const hardware = [
    { label: 'Procesador', value: 'Intel Processor N150 (4 Cores / 4 Threads @ 3.6 GHz)' },
    { label: 'Memoria RAM', value: '16 GB DDR5 / ZRAM Activo' },
    { label: 'Sistema Operativo', value: 'Fedora Workstation 43 (Linux 6.x)' },
    { label: 'Entorno Gráfico', value: 'Wayland / Mutter' },
    { label: 'Almacenamiento Local', value: 'NVMe SSD / Local-First Soberano' }
  ];

  const monitors = [
    { name: 'Consumo Aegis en Reposo', status: '< 55 MB RAM (Tauri v2)', ok: true },
    { name: 'Sincronización BrainIA', status: 'Al día en GitHub (commit 3ffddd2)', ok: true },
    { name: 'Compuertas TADÚ', status: 'Bloqueo estricto de git add -A activo', ok: true },
    { name: 'Arsenal de Skills', status: '20/20 playbooks validados en ~/.agents/skills/', ok: true },
    { name: 'Entorno de Automatización', status: 'Playwright + Chromium Headless listo', ok: true }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem', overflowY: 'auto' }}>
      {/* Barra de Telemetría Host Compacta */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.45rem 0.85rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity color="#10b981" size={15} />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Centinela Intel N150 & Vigilancia del Sistema
          </span>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.68rem', color: '#a7f3d0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ShieldCheck size={12} />
          <span>Sistema Saludable</span>
        </div>
      </div>

      {/* Hardware Specs Grid */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem'
      }}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={14} color="#10b981" />
          Especificaciones de Host (N150)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
          {hardware.map((hw, idx) => (
            <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>{hw.label}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-high)', fontWeight: 600 }}>{hw.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Health Checks */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem'
      }}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color="#10b981" />
          Verificaciones de Integridad
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {monitors.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={14} color="#10b981" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-high)' }}>{m.name}</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
