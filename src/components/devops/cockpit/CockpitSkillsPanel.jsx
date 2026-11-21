import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Sparkles, ArrowRight, Plug } from 'lucide-react';
import { TacticalButton } from '../../ui';

/**
 * CockpitSkillsPanel — Panel compacto de modpacks y habilidades para el Cockpit DevOps.
 */
export function CockpitSkillsPanel({
  skills = [],
  modpacks = [],
  onNavigateTab,
  onToggleModpackMaster,
  onOpenInstallSkillModal
}) {
  const [mcps, setMcps] = useState([]);

  const loadMcps = useCallback(async () => {
    try {
      const list = await invoke('mcp_list_servers');
      setMcps(Array.isArray(list) ? list : []);
    } catch {
      setMcps([]);
    }
  }, []);

  useEffect(() => {
    loadMcps();
  }, [loadMcps]);

  const handleToggleMcp = async (srv) => {
    try {
      await invoke('mcp_toggle_server', { name: srv.name, enabled: !srv.enabled });
      await loadMcps();
    } catch {}
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      overflow: 'hidden'
    }}>
      {/* Cabecera del Panel */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6rem 0.85rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'color-mix(in srgb, var(--border-color) 10%, transparent)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-high)' }}>
            Arsenal & Modpacks ({skills.length})
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('skills')}
          className="cockpit-view-all-btn"
        >
          <span>Ver arsenal</span>
          <ArrowRight size={11} />
        </button>
      </div>

      {/* Scroll Interno de MCPs, Modpacks y Skills */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {/* Servidores MCP (Visible arriba sin scroll) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Plug size={11} /> Servidores MCP ({mcps.length})
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('skills')}
              style={{ fontSize: '0.6rem', color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Gestionar
            </button>
          </div>
          {mcps.length === 0 ? (
            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', padding: '4px 6px' }}>
              Sin MCPs configurados aún.
            </div>
          ) : (
            mcps.map((srv) => (
              <div
                key={srv.name}
                style={{
                  background: 'color-mix(in srgb, var(--border-color) 8%, transparent)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-high)' }}>{srv.name}</div>
                  <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{srv.transport}</div>
                </div>
                <TacticalButton
                  variant={srv.enabled ? 'primary' : 'secondary'}
                  size="xs"
                  onClick={() => handleToggleMcp(srv)}
                  style={{ fontSize: '0.58rem', padding: '2px 6px' }}
                >
                  {srv.enabled ? 'Activo' : 'Off'}
                </TacticalButton>
              </div>
            ))
          )}
        </div>

        {/* Modpacks Activos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Modpacks ({modpacks.length})
          </span>
          {modpacks.map(pack => (
            <div
              key={pack.id}
              style={{
                background: 'color-mix(in srgb, var(--border-color) 8%, transparent)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 0.65rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-high)' }}>{pack.name}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{pack.skills?.length || 0} habilidades integradas</div>
              </div>

              <TacticalButton
                variant={pack.active ? 'primary' : 'secondary'}
                size="xs"
                onClick={() => onToggleModpackMaster(pack.id)}
                style={{ fontSize: '0.58rem', padding: '2px 6px' }}
              >
                {pack.active ? 'Activo' : 'Inactivo'}
              </TacticalButton>
            </div>
          ))}
        </div>

        {/* Acceso Rápido a Instalar Skill */}
        <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
          <TacticalButton
            variant="secondary"
            size="xs"
            onClick={onOpenInstallSkillModal}
            style={{
              width: '100%',
              justifyContent: 'center',
              color: 'var(--primary)',
              borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
              fontWeight: 700,
              fontSize: '0.68rem'
            }}
          >
            + Explorar / Instalar Skill
          </TacticalButton>
        </div>
      </div>
    </div>
  );
}
