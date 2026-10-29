import { Server, Search, Trash2 } from 'lucide-react';
import TacticalButton from '../ui/TacticalButton';

export default function ProcessManagerSection({
  processes,
  filteredProcesses,
  maxMemoryMb,
  processSearch,
  onSearchChange,
  onKillProcess
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Server size={14} color="var(--primary)" />
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-high)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            Top Procesos por Consumo de Memoria RAM
          </h3>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            ({filteredProcesses.length} de {processes.length})
          </span>
        </div>

        {/* Buscador de Procesos */}
        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={processSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filtrar proceso por nombre o PID..."
            style={{
              width: '100%',
              padding: '3px 8px 3px 26px',
              fontSize: '0.68rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'rgba(0,0,0,0.25)',
              color: 'var(--text-high)',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Lista de Procesos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
        {filteredProcesses.length > 0 ? (
          filteredProcesses.map((proc) => {
            const memRatio = Math.min(100, (proc.memoryMb / maxMemoryMb) * 100);
            const isHigh = proc.memoryMb > 500;

            return (
              <div
                key={proc.pid}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  gap: '8px',
                  overflow: 'hidden'
                }}
              >
                {/* Barra de fondo proporcional al consumo de memoria */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${memRatio}%`,
                  background: isHigh ? 'rgba(239, 68, 68, 0.08)' : 'rgba(56, 189, 248, 0.05)',
                  pointerEvents: 'none'
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, position: 'relative', zIndex: 1 }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: '45px', flexShrink: 0 }}>
                    {proc.pid}
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {proc.name}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={proc.cmdline}>
                    {proc.cmdline}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1, flexShrink: 0 }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: isHigh ? '#ef4444' : 'var(--text-high)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {proc.memoryMb} MB
                  </span>
                  <TacticalButton
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => onKillProcess(proc.pid)}
                    style={{
                      height: '22px',
                      padding: '2px 7px',
                      fontSize: '0.65rem'
                    }}
                    title={`Enviar SIGTERM/SIGKILL a proceso ${proc.pid}`}
                  >
                    Terminar
                  </TacticalButton>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
            No se encontraron procesos que coincidan con &quot;{processSearch}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
