import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Plug, Plus, Trash2, RefreshCw, Check } from 'lucide-react';

/**
 * ContextMcpSection — Administrador de servidores MCP (stdio / http) y su vinculación por contexto.
 */
export function ContextMcpSection({ activeMcps = [], onToggleMcp }) {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [transport, setTransport] = useState('stdio');
  const [target, setTarget] = useState('');
  const [argsText, setArgsText] = useState('');
  const [envText, setEnvText] = useState('');

  const loadServers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await invoke('mcp_list_servers');
      setServers(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(null);
    const args = argsText.split(/\s+/).filter(Boolean);
    const envVars = envText.split('\n').map((l) => l.trim()).filter(Boolean);
    try {
      await invoke('mcp_add_server', {
        name,
        transport,
        target,
        args,
        envVars,
        headers: [],
      });
      setName('');
      setTarget('');
      setArgsText('');
      setEnvText('');
      setShowAdd(false);
      await loadServers();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleToggleGlobal = async (srv) => {
    setError(null);
    try {
      await invoke('mcp_toggle_server', { name: srv.name, enabled: !srv.enabled });
      await loadServers();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleRemove = async (srvName) => {
    setError(null);
    try {
      await invoke('mcp_remove_server', { name: srvName });
      await loadServers();
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div className="form-group" style={{ margin: '10px 0 0 0', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plug size={14} color="var(--secondary, var(--primary))" />
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)', margin: 0, display: 'block' }}>
              Servidores MCP ({servers.length} configurados)
            </label>
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
              Activa/desactiva servidores globales o vincúlalos al contexto
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={loadServers}
            title="Recargar MCPs"
            style={{
              padding: '4px 7px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-main)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <RefreshCw size={12} />
          </button>
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '4px 9px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--primary)',
              background: showAdd ? 'var(--primary)' : 'color-mix(in srgb, var(--primary) 15%, transparent)',
              color: showAdd ? 'var(--bg-main)' : 'var(--primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Plus size={12} /> {showAdd ? 'Cancelar' : 'Nuevo MCP'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ fontSize: '0.7rem', color: 'var(--warning, var(--primary))', marginBottom: '8px', padding: '6px 8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
          {error}
        </div>
      )}

      {showAdd && (
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', marginBottom: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '6px' }}>
            <input
              type="text"
              placeholder="Nombre (ej. github, fs, postgres)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ fontSize: '0.74rem', padding: '5px 8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-high)' }}
            />
            <select
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
              style={{ fontSize: '0.74rem', padding: '5px 6px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-high)' }}
            >
              <option value="stdio">stdio</option>
              <option value="http">http</option>
            </select>
          </div>
          <input
            type="text"
            placeholder={transport === 'http' ? 'URL (https://...)' : 'Ejecutable (ej. npx, docker, uvx)'}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
            style={{ fontSize: '0.74rem', padding: '5px 8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-high)' }}
          />
          {transport === 'stdio' && (
            <input
              type="text"
              placeholder="Argumentos (ej. -y @modelcontextprotocol/server-filesystem /ruta)"
              value={argsText}
              onChange={(e) => setArgsText(e.target.value)}
              style={{ fontSize: '0.74rem', padding: '5px 8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-high)' }}
            />
          )}
          <textarea
            rows={2}
            placeholder="Variables ENV opcionales (una por línea: KEY=valor)"
            value={envText}
            onChange={(e) => setEnvText(e.target.value)}
            style={{ fontSize: '0.72rem', padding: '5px 8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-high)', resize: 'vertical' }}
          />
          <button
            type="submit"
            style={{ alignSelf: 'flex-end', fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px', borderRadius: 'var(--radius-xs)', border: 'none', background: 'var(--primary)', color: 'var(--bg-main)', cursor: 'pointer' }}
          >
            Guardar MCP
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '6px 0' }}>Cargando servidores MCP...</div>
      ) : servers.length === 0 ? (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '6px 0' }}>
          Sin servidores MCP configurados aún. Usa &quot;Nuevo MCP&quot; para añadir uno.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {servers.map((srv) => {
            const linked = activeMcps.includes(srv.name);
            return (
              <div
                key={srv.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 9px',
                  borderRadius: 'var(--radius-xs)',
                  border: `1px solid ${srv.enabled ? 'color-mix(in srgb, var(--primary) 45%, var(--border-color))' : 'var(--border-color)'}`,
                  background: 'var(--bg-main)',
                  gap: '8px',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-high)' }}>{srv.name}</span>
                    <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      {srv.transport}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {srv.target || '—'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {onToggleMcp && (
                    <button
                      type="button"
                      onClick={() => onToggleMcp(srv.name)}
                      title="Vincular al contexto activo"
                      style={{
                        fontSize: '0.64rem',
                        padding: '3px 7px',
                        borderRadius: 'var(--radius-xs)',
                        border: `1px solid ${linked ? 'var(--primary)' : 'var(--border-color)'}`,
                        background: linked ? 'color-mix(in srgb, var(--primary) 18%, transparent)' : 'transparent',
                        color: linked ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {linked && <Check size={10} />} Contexto
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleToggleGlobal(srv)}
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-xs)',
                      border: 'none',
                      background: srv.enabled ? 'var(--primary)' : 'var(--bg-card)',
                      color: srv.enabled ? 'var(--bg-main)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {srv.enabled ? 'Activo' : 'Off'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(srv.name)}
                    title="Eliminar MCP"
                    style={{
                      padding: '4px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-color)',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
