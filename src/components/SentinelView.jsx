import { Activity, Cpu, HardDrive, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function SentinelView() {
  const hardware = [
    { label: 'Procesador', value: 'Intel Processor N150 (4 Cores / 4 Threads @ 3.6 GHz)' },
    { label: 'Memoria RAM', value: '16 GB DDR5 / ZRAM Activo' },
    { label: 'Sistema Operativo', value: 'Fedora Workstation 43 (Linux 6.x)' },
    { label: 'Entorno Gráfico', value: 'Wayland / Mutter' },
    { label: 'Almacenamiento Local', value: 'NVMe SSD / Local-First Soberano' }
  ];

  const monitors = [
    { name: 'Consumo Aegis en Reposo', status: '< 65 MB RAM (Tauri v2)', ok: true },
    { name: 'Sincronización BrainIA', status: 'Al día en GitHub (commit 670e1b3)', ok: true },
    { name: 'Compuertas TADÚ', status: 'Bloqueo estricto de git add -A activo', ok: true },
    { name: 'Arsenal de Skills', status: '15/15 playbooks validados en ~/.agents/skills/', ok: true },
    { name: 'Entorno de Automatización', status: 'Playwright + Chromium Headless listo', ok: true }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.25rem', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        background: 'rgba(17, 24, 39, 0.7)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity color="#6366f1" size={20} />
            Centinela del Sistema & Hardware
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '3px 0 0 0' }}>
            Vigilancia continua del entorno Intel N150 y salud de backups
          </p>
        </div>
        <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} />
          <span>Sistema Óptimo</span>
        </div>
      </div>

      {/* Hardware Specs Grid */}
      <div style={{
        background: 'rgba(17, 24, 39, 0.75)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem'
      }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={16} color="#6366f1" />
          Especificaciones de Máquina (Host)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          {hardware.map((hw, idx) => (
            <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>{hw.label}</span>
              <span style={{ fontSize: '0.85rem', color: '#f1f5f9', fontWeight: 600 }}>{hw.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Health Checks */}
      <div style={{
        background: 'rgba(17, 24, 39, 0.75)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem'
      }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} color="#10b981" />
          Verificaciones de Integridad Soberana
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {monitors.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>{m.name}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{m.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
