import { Cpu, Flame, Zap, HardDrive } from 'lucide-react';

export default function HardwareGrid({ telemetry, thermalState }) {
  const cpuPercent = telemetry?.cpuPercent || 0;
  const cpuCol = cpuPercent > 80 ? '#ef4444' : cpuPercent > 60 ? '#f59e0b' : '#10b981';
  
  const ramUsagePercent = telemetry?.ramUsagePercent || 0;
  const ramCol = ramUsagePercent > 85 ? '#ef4444' : '#38bdf8';

  const diskUsagePercent = telemetry?.diskUsagePercent || 0;
  const diskCol = diskUsagePercent > 85 ? '#ef4444' : '#a855f7';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
      {/* 1. Tarjeta CPU & Núcleos */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <Cpu size={15} color="#10b981" />
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {telemetry?.cpuModel || 'Procesador'}
              </span>
            </div>
            <span style={{
              fontSize: '0.88rem',
              fontWeight: 800,
              color: cpuCol,
              fontFamily: 'var(--font-mono)'
            }}>
              {cpuPercent}%
            </span>
          </div>

          {/* Barra Global de Uso */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{
              width: `${Math.min(100, cpuPercent)}%`,
              height: '100%',
              background: cpuCol,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* Grilla Adaptativa de Cores */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(46px, 1fr))`,
          gap: '4px'
        }}>
          {(telemetry?.cpuCores || []).map((core) => {
            const coreUsage = Math.round(core.usagePercent);
            const coreCol = coreUsage > 80 ? '#ef4444' : coreUsage > 50 ? '#f59e0b' : '#34d399';
            return (
              <div key={core.coreId} style={{ background: 'rgba(0,0,0,0.25)', padding: '4px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>C{core.coreId}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: coreCol, fontFamily: 'var(--font-mono)' }}>
                  {coreUsage}%
                </span>
                <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '1.5px', overflow: 'hidden', marginTop: '2px' }}>
                  <div style={{ width: `${coreUsage}%`, height: '100%', background: coreCol }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Tarjeta Térmica */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={15} color={thermalState.color} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>Temperatura CPU</span>
            </div>
            <span style={{
              fontSize: '0.88rem',
              fontWeight: 800,
              color: thermalState.color,
              fontFamily: 'var(--font-mono)'
            }}>
              {telemetry?.cpuTempCelsius || 0}°C
            </span>
          </div>

          {/* Barra Térmica Proporcional (25°C - 100°C) */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{
              width: `${Math.min(100, Math.max(5, (((telemetry?.cpuTempCelsius || 40) - 25) / 75) * 100))}%`,
              height: '100%',
              background: thermalState.color,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          <span style={{ color: thermalState.color, fontWeight: 600 }}>{thermalState.label}</span>
          <span>TjMax: ~100°C</span>
        </div>
      </div>

      {/* 3. Tarjeta Memoria RAM & Swap (ZRAM) */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={15} color="#38bdf8" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                Memoria RAM ({((telemetry?.ramTotalMb || 0) / 1024).toFixed(0)} GB)
              </span>
            </div>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              {ramUsagePercent}%
            </span>
          </div>

          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{
              width: `${Math.min(100, ramUsagePercent)}%`,
              height: '100%',
              background: ramCol,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          <span>RAM: {((telemetry?.ramUsedMb || 0) / 1024).toFixed(1)} / {((telemetry?.ramTotalMb || 0) / 1024).toFixed(1)} GB</span>
          <span>Swap/ZRAM: {((telemetry?.zramUsedMb || 0) / 1024).toFixed(1)} GB</span>
        </div>
      </div>

      {/* 4. Tarjeta Almacenamiento Raíz (/) */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HardDrive size={15} color="#a855f7" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>Almacenamiento Raíz (/)</span>
            </div>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#a855f7', fontFamily: 'var(--font-mono)' }}>
              {diskUsagePercent}%
            </span>
          </div>

          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{
              width: `${Math.min(100, diskUsagePercent)}%`,
              height: '100%',
              background: diskCol,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          <span>Libre: {telemetry?.diskAvailableGb || 0} GB</span>
          <span>Total: {telemetry?.diskTotalGb || 0} GB</span>
        </div>
      </div>
    </div>
  );
}
