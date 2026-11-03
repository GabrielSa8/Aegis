import { Cpu, Flame, Zap, HardDrive, Wifi, Activity } from 'lucide-react';
import SparklineSvg from './SparklineSvg';
import { formatRateKbs } from './sentinelHelpers';

export default function HardwareGrid({ telemetry, thermalState, history }) {
  const cpuPercent = telemetry?.cpuPercent || 0;
  const cpuCol = cpuPercent > 80 ? 'var(--danger)' : cpuPercent > 60 ? 'var(--warning)' : 'var(--primary)';
  
  const ramUsagePercent = telemetry?.ramUsagePercent || 0;
  const ramCol = ramUsagePercent > 85 ? 'var(--danger)' : 'var(--accent)';

  const diskUsagePercent = telemetry?.diskUsagePercent || 0;
  const diskCol = diskUsagePercent > 85 ? 'var(--danger)' : 'color-mix(in srgb, var(--accent) 70%, var(--primary))';

  const netRx = telemetry?.netRxKbs || 0;
  const netTx = telemetry?.netTxKbs || 0;
  const diskRead = telemetry?.diskReadKbs || 0;
  const diskWrite = telemetry?.diskWriteKbs || 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
      {/* 1. Tarjeta CPU & Núcleos con Sparkline */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <Cpu size={15} color="var(--primary)" />
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-high)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {telemetry?.cpuModel || 'Procesador'}
              </span>
            </div>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: cpuCol, fontFamily: 'var(--font-mono)' }}>
              {cpuPercent}%
            </span>
          </div>

          <SparklineSvg
            data={history?.cpu || []}
            color={cpuCol}
            height={26}
            minVal={0}
            maxVal={100}
          />
        </div>

        {/* Grilla Adaptativa de Cores */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(42px, 1fr))`,
          gap: '4px'
        }}>
          {(telemetry?.cpuCores || []).map((core) => {
            const coreUsage = Math.round(core.usagePercent);
            const coreCol = coreUsage > 80 ? 'var(--danger)' : coreUsage > 50 ? 'var(--warning)' : 'var(--primary)';
            return (
              <div key={core.coreId} style={{ background: 'color-mix(in srgb, var(--bg-surface) 70%, transparent)', padding: '3px 4px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', display: 'block' }}>C{core.coreId}</span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: coreCol, fontFamily: 'var(--font-mono)' }}>
                  {coreUsage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Tarjeta Térmica con Sparkline */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={15} color={thermalState.color} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>Temperatura CPU</span>
            </div>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: thermalState.color, fontFamily: 'var(--font-mono)' }}>
              {telemetry?.cpuTempCelsius || 0}°C
            </span>
          </div>

          <SparklineSvg
            data={history?.temp || []}
            color={thermalState.color}
            height={26}
            minVal={25}
            maxVal={95}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          <span style={{ color: thermalState.color, fontWeight: 600 }}>{thermalState.label}</span>
          <span>TjMax: ~100°C</span>
        </div>
      </div>

      {/* 3. Tarjeta Memoria RAM & ZRAM con Sparkline */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={15} color="var(--accent)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
                Memoria RAM ({((telemetry?.ramTotalMb || 0) / 1024).toFixed(0)} GB)
              </span>
            </div>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: ramCol, fontFamily: 'var(--font-mono)' }}>
              {ramUsagePercent}%
            </span>
          </div>

          <SparklineSvg
            data={history?.ram || []}
            color={ramCol}
            height={26}
            minVal={0}
            maxVal={100}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          <span>RAM: {((telemetry?.ramUsedMb || 0) / 1024).toFixed(1)} / {((telemetry?.ramTotalMb || 0) / 1024).toFixed(1)} GB</span>
          <span>ZRAM: {((telemetry?.zramUsedMb || 0) / 1024).toFixed(1)} GB</span>
        </div>
      </div>

      {/* 4. Tarjeta Monitor de Red (RX / TX en vivo) */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wifi size={15} color="var(--primary)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>Tráfico de Red</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              ↓ {formatRateKbs(netRx)}
            </span>
          </div>

          <SparklineSvg
            data={history?.netRx || []}
            color="var(--primary)"
            height={26}
            minVal={0}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          <span>↓ RX: {formatRateKbs(netRx)}</span>
          <span>↑ TX: {formatRateKbs(netTx)}</span>
        </div>
      </div>

      {/* 5. Tarjeta Disco NVMe / I/O en vivo */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={15} color="var(--accent)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>I/O Disco en Vivo</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              R: {formatRateKbs(diskRead)}
            </span>
          </div>

          <SparklineSvg
            data={history?.diskRead || []}
            color="var(--accent)"
            height={26}
            minVal={0}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          <span>Lectura: {formatRateKbs(diskRead)}</span>
          <span>Escritura: {formatRateKbs(diskWrite)}</span>
        </div>
      </div>

      {/* 6. Tarjeta Almacenamiento Raíz (/) */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HardDrive size={15} color={diskCol} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>Almacenamiento Raíz (/)</span>
            </div>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: diskCol, fontFamily: 'var(--font-mono)' }}>
              {diskUsagePercent}%
            </span>
          </div>

          <div style={{ width: '100%', height: '6px', background: 'color-mix(in srgb, var(--border-color) 60%, transparent)', borderRadius: '3px', overflow: 'hidden', margin: '8px 0' }}>
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
