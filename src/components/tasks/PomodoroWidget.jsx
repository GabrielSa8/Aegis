import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export function PomodoroWidget() {
  const [pomoMode, setPomoMode] = useState('work'); // 'work' (25m), 'shortBreak' (5m)
  const [pomoTimeLeft, setPomoTimeLeft] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);
  const pomoTimerRef = useRef(null);

  useEffect(() => {
    if (pomoRunning) {
      pomoTimerRef.current = setInterval(() => {
        setPomoTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(pomoTimerRef.current);
            setPomoRunning(false);
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(587.33, ctx.currentTime);
              gain.gain.setValueAtTime(0.2, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
              osc.start();
              osc.stop(ctx.currentTime + 0.8);
            } catch (_) {}

            if (pomoMode === 'work') {
              setPomoMode('shortBreak');
              return 5 * 60;
            } else {
              setPomoMode('work');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (pomoTimerRef.current) clearInterval(pomoTimerRef.current);
    }
    return () => {
      if (pomoTimerRef.current) clearInterval(pomoTimerRef.current);
    };
  }, [pomoRunning, pomoMode]);

  const togglePomodoro = () => setPomoRunning((prev) => !prev);
  const resetPomodoro = () => {
    setPomoRunning(false);
    setPomoTimeLeft(pomoMode === 'work' ? 25 * 60 : 5 * 60);
  };
  const switchPomoMode = (mode) => {
    setPomoRunning(false);
    setPomoMode(mode);
    setPomoTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatPomoTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWork = pomoMode === 'work';
  const activeColor = isWork ? 'var(--primary)' : 'var(--accent)';
  const activeGlow = isWork ? 'color-mix(in srgb, var(--primary) 20%, transparent)' : 'color-mix(in srgb, var(--accent) 20%, transparent)';
  const activeBorder = isWork ? 'color-mix(in srgb, var(--primary) 50%, transparent)' : 'color-mix(in srgb, var(--accent) 50%, transparent)';

  return (
    <div
      className="pomo-widget"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
        border: pomoRunning ? `1px solid ${activeBorder}` : '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '2px 8px',
        boxShadow: pomoRunning ? `0 0 12px ${activeGlow}` : 'none',
        transition: 'all 0.2s ease'
      }}
    >
      <div
        className="pomo-status-dot"
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: pomoRunning ? activeColor : 'var(--text-muted)',
          boxShadow: pomoRunning ? `0 0 6px ${activeColor}` : 'none',
          flexShrink: 0
        }}
      />

      <button
        type="button"
        onClick={() => switchPomoMode(isWork ? 'shortBreak' : 'work')}
        className="pomo-mode-btn"
        style={{
          background: 'transparent',
          border: 'none',
          color: activeColor,
          fontSize: '0.64rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: '3px'
        }}
        title="Alternar entre Foco (25m) y Break (5m)"
      >
        {isWork ? 'Foco' : 'Break'}
      </button>

      <span
        className="pomo-timer-display"
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontWeight: 800,
          fontSize: '0.8rem',
          color: pomoRunning ? 'var(--text-high)' : 'var(--text-muted)',
          minWidth: '42px',
          textAlign: 'center',
          letterSpacing: '0.04em'
        }}
      >
        {formatPomoTime(pomoTimeLeft)}
      </span>

      <button
        type="button"
        onClick={togglePomodoro}
        title={pomoRunning ? 'Pausar' : 'Iniciar'}
        className={`pomo-toggle-btn ${pomoRunning ? 'is-running' : 'is-idle'}`}
        style={{
          background: pomoRunning ? 'color-mix(in srgb, var(--danger) 18%, transparent)' : 'color-mix(in srgb, var(--primary) 18%, transparent)',
          border: pomoRunning ? '1px solid color-mix(in srgb, var(--danger) 40%, transparent)' : '1px solid color-mix(in srgb, var(--primary) 40%, transparent)',
          borderRadius: '4px',
          color: pomoRunning ? 'var(--danger)' : 'var(--primary)',
          padding: '3px 5px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {pomoRunning ? <Pause size={10} /> : <Play size={10} />}
      </button>

      <button
        type="button"
        onClick={resetPomodoro}
        title="Reiniciar temporizador"
        className="pomo-reset-btn"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          padding: '3px',
          borderRadius: '3px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <RotateCcw size={10} />
      </button>
    </div>
  );
}
export default PomodoroWidget;
