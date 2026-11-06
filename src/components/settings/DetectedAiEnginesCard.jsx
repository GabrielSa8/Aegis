import React, { useState, useEffect } from 'react';
import { Users, UserCheck, AlertCircle, RefreshCw, LogIn, ExternalLink, Repeat, X, Award } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';

const CLI_ACCOUNT_ENGINES = new Set(['agy', 'claude', 'codex']);

export default function DetectedAiEnginesCard({ currentAgentType }) {
  const [engines, setEngines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState(null);

  const fetchEngines = async () => {
    try {
      setLoading(true);
      const res = await invoke('inspect_system_environment');
      const detected = res?.aiEngines || res?.ai_engines || [];
      setEngines(detected.filter((e) => CLI_ACCOUNT_ENGINES.has(e.id)));
    } catch (err) {
      console.warn('[DetectedAiEnginesCard] Error cargando sesiones CLI:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngines();
  }, []);

  const showTempMessage = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleTriggerLogin = async (engineId, engineName) => {
    try {
      await invoke('trigger_cli_account_login', { engineId });
      showTempMessage(`Terminal abierta para vincular cuenta en ${engineName}. Pulsa Refrescar al terminar.`);
    } catch (err) {
      showTempMessage(`Error al abrir login CLI: ${err}`);
    }
  };

  const handleSwitchAccount = async (engineId, email) => {
    try {
      const msg = await invoke('switch_cli_account', { engineId, email });
      showTempMessage(msg);
      await fetchEngines();
    } catch (err) {
      showTempMessage(`Error cambiando cuenta: ${err}`);
    }
  };

  const handleRemoveSavedAccount = async (engineId, email) => {
    try {
      await invoke('remove_saved_cli_account', { engineId, email });
      await fetchEngines();
    } catch (err) {
      console.warn('Error eliminando perfil guardado:', err);
    }
  };

  const handleOpenPlanPage = (engineId) => {
    const urls = {
      agy: 'https://aistudio.google.com/app/plan_information',
      claude: 'https://claude.ai/settings/usage',
      codex: 'https://chatgpt.com/#settings/Subscription'
    };
    const targetUrl = urls[engineId];
    if (targetUrl) {
      openUrl(targetUrl).catch(() => window.open(targetUrl, '_blank'));
    }
  };

  return (
    <div style={{
      background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
      padding: '14px 16px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={15} color="var(--primary)" />
          <span style={{ fontSize: '0.80rem', fontWeight: 800, color: 'var(--text-high)' }}>
            Cuentas & Sesiones de Motores CLI (Multi-Cuenta)
          </span>
        </div>

        <button
          type="button"
          onClick={fetchEngines}
          disabled={loading}
          style={{
            background: 'color-mix(in srgb, var(--bg-main) 60%, transparent)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xs)',
            color: 'var(--text-high)',
            cursor: 'pointer',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.65rem',
            fontWeight: 600
          }}
          title="Actualizar cuentas detectadas y respaldar sesiones activas"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          <span>Refrescar</span>
        </button>
      </div>

      <p style={{ fontSize: '0.69rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.35 }}>
        Inspecciona con qué correo y nivel de plan está autenticado cada CLI. Cuando vincules otra cuenta del mismo motor, Aegis respalda tus tokens para alternar entre cuentas en 1 clic al agotar cuotas.
      </p>

      {statusMsg && (
        <div style={{
          padding: '6px 10px',
          borderRadius: 'var(--radius-xs)',
          background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
          border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
          color: 'var(--primary)',
          fontSize: '0.68rem',
          fontWeight: 600
        }}>
          {statusMsg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {engines.map((eng) => {
          const isCurrentEngine =
            currentAgentType === eng.id ||
            (currentAgentType === 'anthropic' && eng.id === 'claude') ||
            (currentAgentType === 'openai' && eng.id === 'codex');

          const isAuth = eng.authStatus === 'authenticated';
          const isExpired = eng.authStatus === 'expired';
          const savedAccounts = eng.savedAccounts || [];

          return (
            <div
              key={eng.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: isCurrentEngine
                  ? 'color-mix(in srgb, var(--primary) 7%, var(--bg-main))'
                  : 'color-mix(in srgb, var(--bg-main) 45%, transparent)',
                border: `1px solid ${isCurrentEngine ? 'color-mix(in srgb, var(--primary) 45%, var(--border-color))' : 'var(--border-color)'}`
              }}
            >
              {/* Fila 1: Nombre del Motor + Nivel de Plan + Botón Vincular/Cambiar Cuenta */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-high)' }}>
                    {eng.name}
                  </span>

                  {eng.planType && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '0.62rem',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
                      color: 'var(--accent)',
                      fontWeight: 800
                    }}>
                      <Award size={10} />
                      <span>{eng.planType}</span>
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {eng.installed && (
                    <button
                      type="button"
                      onClick={() => handleTriggerLogin(eng.id, eng.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
                        color: 'var(--primary)',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Respaldar cuenta actual y abrir login del CLI para vincular o cambiar a otra cuenta"
                    >
                      <LogIn size={11} />
                      <span>{isAuth ? 'Cambiar / Vincular Cuenta' : 'Iniciar Sesión CLI'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenPlanPage(eng.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Ver plan y cuota oficial en navegador"
                  >
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>

              {/* Fila 2: Cuenta Activa Detectada y Estado de Token */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.69rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  {isAuth ? (
                    <UserCheck size={12} color="var(--primary)" />
                  ) : (
                    <AlertCircle size={12} color={isExpired ? 'var(--warning)' : 'var(--text-muted)'} />
                  )}
                  <span style={{ color: 'var(--text-muted)' }}>Cuenta en uso:</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: isAuth ? 'var(--text-high)' : 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {eng.accountEmail || 'Sin cuenta vinculada'}
                  </span>
                </div>

                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: isAuth ? 'var(--primary)' : isExpired ? 'var(--warning)' : 'var(--text-muted)'
                }}>
                  {isAuth ? '● Sesión Activa' : isExpired ? '⚠ Sesión Expirada (Re-autenticar)' : '○ No autenticado'}
                </span>
              </div>

              {/* Fila 3: Perfiles Multi-Cuenta Guardados para Cambio en 1-Clic */}
              {savedAccounts.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                  paddingTop: '6px',
                  borderTop: '1px dashed color-mix(in srgb, var(--border-color) 60%, transparent)'
                }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Repeat size={10} />
                    <span>Cuentas guardadas:</span>
                  </span>

                  {savedAccounts.map((acc) => {
                    const activeAcc = acc.isActive && isAuth;
                    return (
                      <div
                        key={acc.email}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 7px',
                          borderRadius: '999px',
                          fontSize: '0.63rem',
                          fontFamily: 'var(--font-mono)',
                          background: activeAcc
                            ? 'color-mix(in srgb, var(--primary) 18%, transparent)'
                            : 'color-mix(in srgb, var(--bg-card) 80%, transparent)',
                          border: `1px solid ${activeAcc ? 'var(--primary)' : 'var(--border-color)'}`,
                          color: activeAcc ? 'var(--primary)' : 'var(--text-high)'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => !activeAcc && handleSwitchAccount(eng.id, acc.email)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: 'inherit',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            fontWeight: activeAcc ? 800 : 600,
                            cursor: activeAcc ? 'default' : 'pointer'
                          }}
                          title={activeAcc ? 'Cuenta actualmente activa en el CLI' : `Cambiar el motor ${eng.id} a la cuenta ${acc.email}`}
                        >
                          {activeAcc ? `✓ ${acc.email}` : acc.email}
                        </button>
                        {!activeAcc && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSavedAccount(eng.id, acc.email)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Olvidar este perfil guardado"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
