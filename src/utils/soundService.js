/**
 * soundService.js - Motor de Audio Táctico Sintetizado para Aegis
 * 
 * Implementación 100% nativa vía Web Audio API.
 * 0 assets binarios, 0 KB de dependencias externas.
 * Genera tonos senoidales y envolventes ADSR limpios y de grado militar/cockpit.
 */

class SoundService {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.5; // 0.0 a 1.0
  }

  _getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  configure({ enabled, volume }) {
    if (enabled !== undefined) this.enabled = Boolean(enabled);
    if (volume !== undefined) this.volume = Math.max(0, Math.min(1, Number(volume)));
  }

  /**
   * Chime armónico de éxito / resolución de tarea o inicio (dos tonos suaves)
   */
  playSuccess() {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this._getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.15, now);
    masterGain.connect(ctx.destination);

    // Nota 1: C6 (1046.5 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(1, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.23);

    // Nota 2: G6 (1567.98 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1567.98, now + 0.09);
    gain2.gain.setValueAtTime(0, now + 0.09);
    gain2.gain.linearRampToValueAtTime(1, now + 0.105);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.46);
  }

  /**
   * Alerta acústica para advertencias o límites (Centinela térmico, corte financiero próximo)
   */
  playAlert() {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this._getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.2, now);
    masterGain.connect(ctx.destination);

    // Tono de alerta con ligera modulación FM de aviso
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.25); // E5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  /**
   * Alarma de error o fallo crítico (falla de compilación, error agente, PIN incorrecto)
   */
  playError() {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this._getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.22, now);
    masterGain.connect(ctx.destination);

    // Doble tono descendente menor
    [0, 0.12].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const freq = idx === 0 ? 330 : 220; // E4 -> A3
      osc.frequency.setValueAtTime(freq, now + offset);

      // Filtro pasa-bajos para suavizar el diente de sierra
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now + offset);

      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.8, now + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(now + offset);
      osc.stop(now + offset + 0.19);
    });
  }

  /**
   * Ping discreto de notificación general (nueva tarea, mensaje entrante Telegram)
   */
  playNotification() {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this._getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.12, now);
    masterGain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1318.5, now); // E6
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08); // A6

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  /**
   * Disparo genérico por tipo de evento
   */
  play(type = 'notification') {
    switch (type) {
      case 'success':
      case 'done':
        this.playSuccess();
        break;
      case 'alert':
      case 'warn':
      case 'warning':
        this.playAlert();
        break;
      case 'error':
      case 'fail':
        this.playError();
        break;
      case 'notification':
      default:
        this.playNotification();
        break;
    }
  }
}

export const soundService = new SoundService();
