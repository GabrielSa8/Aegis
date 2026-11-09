import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import ModalWrapper from '../ui/ModalWrapper';
import TacticalButton from '../ui/TacticalButton';

export default function UnlockGamingVaultModal({
  isOpen,
  onClose,
  onUnlockSuccess,
  masterPasswordEnabled = false
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!masterPasswordEnabled) {
      onUnlockSuccess();
      onClose();
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Ingresa la contraseña maestra para continuar');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      await invoke('unlock_vault', { password });
      setPassword('');
      onUnlockSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : 'Contraseña maestra incorrecta');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title={masterPasswordEnabled ? 'Bóveda de Juegos Encriptada' : 'Bóveda de Juegos Ocultos'}
      icon={Lock}
      maxWidth="440px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px 0' }}>
        {masterPasswordEnabled ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
              Esta sección contiene títulos resguardados bajo la <strong>Bóveda Criptográfica de Aegis</strong>. Ingresa tu Contraseña Maestra para desbloquear la sesión.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Contraseña Maestra *
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <KeyRound size={14} style={{ position: 'absolute', left: '10px', color: 'var(--primary)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Introduce tu clave maestra..."
                  style={{
                    width: '100%',
                    height: '32px',
                    paddingLeft: '32px',
                    paddingRight: '36px',
                    fontSize: '0.78rem',
                    background: 'color-mix(in srgb, var(--bg-card) 95%, black)',
                    border: `1px solid ${errorMsg ? 'var(--danger)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-high)',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.72rem',
                color: 'var(--danger)',
                background: 'color-mix(in srgb, var(--danger) 12%, transparent)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)'
              }}>
                <ShieldAlert size={13} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <TacticalButton type="button" variant="ghost" size="sm" onClick={handleClose}>
                Cancelar
              </TacticalButton>
              <TacticalButton type="submit" variant="primary" size="sm" disabled={loading}>
                <Unlock size={12} />
                <span>{loading ? 'Verificando...' : 'Desbloquear Bóveda'}</span>
              </TacticalButton>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
              La Bóveda te permite ocultar títulos específicos del catálogo general. Actualmente opera en <strong>modo local sin contraseña</strong>.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontSize: '0.72rem',
              color: 'var(--primary)',
              background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)'
            }}>
              <Lock size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>
                Para blindaje criptográfico con <strong>Argon2id y AES-256-GCM</strong>, puedes configurar tu Contraseña Maestra en <em>Ajustes &gt; Seguridad</em>.
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <TacticalButton type="button" variant="ghost" size="sm" onClick={handleClose}>
                Cerrar
              </TacticalButton>
              <TacticalButton type="button" variant="primary" size="sm" onClick={() => { onUnlockSuccess(); handleClose(); }}>
                <Unlock size={12} />
                <span>Acceder a la Bóveda</span>
              </TacticalButton>
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}
