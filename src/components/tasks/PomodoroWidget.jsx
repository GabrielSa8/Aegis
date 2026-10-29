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
  const activeColor = isWork ? '#34d399' : '#38bdf8';
  const activeGlow = isWork ? 'rgba(52, 211, 153, 0.2)' : 'rgba(56, 189, 248, 0.2)';
  const activeBorder = isWork ? 'rgba(52, 211, 153, 0.5)' : 'rgba(56, 189, 248, 0.5)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(0, 0, 0, 0.45)',
        border: pomoRunning ? `1px solid ${activeBorder}` : '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '2px 8px',
        boxShadow: pomoRunning ? `0 0 12px ${activeGlow}` : 'none',
        transition: 'all 0.2s ease'
      }}
    >
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: pomoRunning ? activeColor : '#64748b',
          boxShadow: pomoRunning ? `0 0 6px ${activeColor}` : 'none'
        }}
      />

      <button
        type="button"
        onClick={() => switchPomoMode(isWork ? 'shortBreak' : 'work')}
        style={{
          background: 'transparent',
          border: 'none',
          color: activeColor,
          fontSize: '0.64rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          cursor: 'pointer',
          padding: '2px 4px'
        }}
        title="Alternar entre Foco (25m) y Break (5m)"
      >
        {isWork ? 'Foco' : 'Break'}
      </button>

      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontWeight: 800,
          fontSize: '0.8rem',
          color: pomoRunning ? '#f1f5f9' : 'var(--text-muted)',
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
        style={{
          background: pomoRunning ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
          border: 'none',
          borderRadius: '3px',
          color: pomoRunning ? '#f87171' : '#34d399',
          padding: '3px 5px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {pomoRunning ? <Pause size={10} /> : <Play size={10} />}
      </button>

      <button
        type="button"
        onClick={resetPomodoro}
        title="Reiniciar temporizador"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          padding: '3px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <RotateCcw size={10} />
      </button>
    </div>
  );
}
