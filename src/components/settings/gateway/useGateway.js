import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export function useGateway() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState({
    running: false,
    authorizedChatId: null,
    pairingCode: '582914',
    botUsername: null,
    lastActiveAt: null,
    errorMessage: null
  });
  const [botTokenInput, setBotTokenInput] = useState('');
  const [testingToken, setTestingToken] = useState(false);
  const [tokenValidationResult, setTokenValidationResult] = useState(null);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  const fetchStatusAndConfig = async () => {
    try {
      const [cfg, stat] = await Promise.all([
        invoke('get_aegis_config'),
        invoke('get_telegram_gateway_status')
      ]);
      setConfig(cfg);
      if (cfg?.telegramGateway) {
        setBotTokenInput(cfg.telegramGateway.botToken || '');
      }
      setStatus(stat);
    } catch (err) {
      console.error('Error cargando estado de Telegram Gateway:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndConfig();

    let unlistenPair;
    let unlistenTx;
    let isMounted = true;

    const setupListeners = async () => {
      unlistenPair = await listen('aegis:gateway-paired', (e) => {
        if (!isMounted) return;
        setStatus(prev => ({ ...prev, authorizedChatId: e.payload }));
      });
      unlistenTx = await listen('aegis:financial-tx-added', () => {
        // Notificación pasiva
      });
    };

    setupListeners();

    return () => {
      isMounted = false;
      if (unlistenPair) unlistenPair();
      if (unlistenTx) unlistenTx();
    };
  }, []);

  const handleTestToken = async () => {
    if (!botTokenInput.trim()) return;
    setTestingToken(true);
    setTokenValidationResult(null);
    try {
      const username = await invoke('test_telegram_bot_token', { botToken: botTokenInput.trim() });
      setTokenValidationResult({ success: true, message: `Conectado exitosamente con ${username}` });
    } catch (err) {
      setTokenValidationResult({ success: false, message: String(err) });
    } finally {
      setTestingToken(false);
    }
  };

  const handleToggleDaemon = async () => {
    if (!config) return;
    setStatusActionLoading(true);
    try {
      if (status.running) {
        await invoke('stop_telegram_gateway_daemon');
        setStatus(prev => ({ ...prev, running: false }));
      } else {
        // Asegurar que el token en config esté actualizado antes de iniciar
        const updatedConfig = {
          ...config,
          telegramGateway: {
            ...config.telegramGateway,
            botToken: botTokenInput.trim(),
            enabled: true
          }
        };
        await invoke('save_aegis_config', { config: updatedConfig });
        setConfig(updatedConfig);
        await invoke('start_telegram_gateway_daemon');
        setStatus(prev => ({ ...prev, running: true }));
      }
    } catch (err) {
      alert(`Error alternando Gateway: ${err}`);
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleUpdateGatewayConfig = async (patch) => {
    if (!config) return;
    try {
      const updated = {
        ...config,
        telegramGateway: {
          ...config.telegramGateway,
          ...patch
        }
      };
      await invoke('save_aegis_config', { config: updated });
      setConfig(updated);
    } catch (err) {
      console.error('Error guardando configuración de Gateway:', err);
    }
  };

  const handleGenerateNewPin = async () => {
    try {
      const newPin = await invoke('generate_new_gateway_pairing_pin');
      setStatus(prev => ({ ...prev, pairingCode: newPin }));
      if (config) {
        setConfig({
          ...config,
          telegramGateway: { ...config.telegramGateway, pairingCode: newPin }
        });
      }
    } catch (err) {
      console.error('Error generando nuevo PIN:', err);
    }
  };

  const handleUnpairChat = async () => {
    if (!confirm('¿Deseas desvincular el dispositivo móvil actual?')) return;
    try {
      await invoke('unpair_telegram_gateway_chat');
      setStatus(prev => ({ ...prev, authorizedChatId: null }));
      if (config) {
        setConfig({
          ...config,
          telegramGateway: { ...config.telegramGateway, authorizedChatId: null }
        });
      }
    } catch (err) {
      console.error('Error desvinculando chat:', err);
    }
  };

  return {
    loading,
    config,
    status,
    botTokenInput,
    setBotTokenInput,
    testingToken,
    tokenValidationResult,
    statusActionLoading,
    handleTestToken,
    handleToggleDaemon,
    handleUpdateGatewayConfig,
    handleGenerateNewPin,
    handleUnpairChat
  };
}
