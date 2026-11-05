import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Trophy, Plus, RefreshCw, Search, CheckCircle2, Lock } from 'lucide-react';
import TacticalButton from '../ui/TacticalButton';
import TacticalBadge from '../ui/TacticalBadge';
import AchievementItemRow from './AchievementItemRow';
import NewAchievementForm from './NewAchievementForm';

export default function GameAchievementsTab({ gameId, isSteam, onAchievementsChanged }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'locked' | 'unlocked'

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await invoke('get_game_achievements', { gameId: String(gameId), isSteam: Boolean(isSteam) });
      setReport(res);
    } catch (err) {
      console.error('Error cargando logros:', err);
    } finally {
      setLoading(false);
    }
  }, [gameId, isSteam]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const handleToggle = async (item) => {
    try {
      const nextUnlocked = !item.unlocked;
      if (item.isCustom) {
        await invoke('toggle_custom_achievement', { id: item.id });
      } else {
        await invoke('toggle_game_achievement', {
          gameId: String(gameId),
          achievementId: item.id,
          unlocked: nextUnlocked
        });
      }
      // Actualización optimista inmediata en local
      setReport(prev => {
        if (!prev) return prev;
        const updatedItems = prev.items.map(it => {
          if (it.id === item.id) {
            return { ...it, unlocked: nextUnlocked };
          }
          return it;
        });
        const newUnlockedCount = updatedItems.filter(it => it.unlocked).length;
        const total = prev.total || updatedItems.length;
        return {
          ...prev,
          items: updatedItems,
          unlocked: newUnlockedCount,
          percentage: total > 0 ? (newUnlockedCount / total) * 100 : 0
        };
      });
      onAchievementsChanged?.();
    } catch (err) {
      alert(`Error alternando estado del logro: ${err}`);
      fetchAchievements();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este logro personalizado?')) return;
    try {
      await invoke('delete_custom_achievement', { id });
      fetchAchievements();
      onAchievementsChanged?.();
    } catch (err) {
      alert(`Error eliminando logro: ${err}`);
    }
  };

  const handleCreate = async (title, description) => {
    try {
      await invoke('create_custom_achievement', {
        gameId: String(gameId),
        title,
        description
      });
      setShowAddForm(false);
      fetchAchievements();
      onAchievementsChanged?.();
    } catch (err) {
      alert(`Error creando logro: ${err}`);
    }
  };

  const rawItems = report?.items || [];
  const total = report?.total || rawItems.length;
  const unlocked = report?.unlocked || rawItems.filter(i => i.unlocked).length;
  const locked = total >= unlocked ? total - unlocked : 0;
  const percentage = total > 0 ? (unlocked / total) * 100 : 0;

  // Filtrado reactivo por texto y estado
  const filteredItems = useMemo(() => {
    return rawItems.filter(item => {
      const matchSearch = searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (filterTab === 'unlocked') return item.unlocked;
      if (filterTab === 'locked') return !item.unlocked;
      return true;
    });
  }, [rawItems, searchQuery, filterTab]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
        <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px' }} />
        <span>Cargando logros e inspeccionando caché offline...</span>
      </div>
    );
  }

  return (
    <div className="gaming-achievements-tab" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 📊 Barra de Progreso y Acciones */}
      <div className="gaming-ach-progress-card" style={{
        background: 'color-mix(in srgb, var(--bg-card) 80%, black)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div className="gaming-ach-progress-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trophy size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
              Progreso de Logros
            </span>
          </div>
          <div className="gaming-ach-progress-badges" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TacticalBadge variant={unlocked === total && total > 0 ? 'primary' : 'secondary'} size="sm">
              {unlocked} / {total} ({percentage.toFixed(0)}%)
            </TacticalBadge>
            <TacticalButton
              variant="ghost"
              size="xs"
              icon={Plus}
              onClick={() => setShowAddForm(!showAddForm)}
              className="gaming-action-btn"
              style={{ height: '22px' }}
            >
              + Personalizado
            </TacticalButton>
          </div>
        </div>

        <div style={{
          width: '100%',
          height: '6px',
          background: 'var(--border-color)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 70%, white))',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* 🔍 Buscador y Tabs de Filtro */}
        <div className="gaming-ach-filter-bar" style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
          <div className="gaming-ach-search-input-wrap" style={{
            flex: 1,
            minWidth: '180px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 8px'
          }}>
            <Search size={12} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar entre logros existentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-high)',
                fontSize: '0.72rem'
              }}
            />
          </div>

          <div className="gaming-ach-filter-pills" style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterTab('all')}
              className="gaming-filter-tab-btn"
              style={{
                padding: '3px 7px',
                fontSize: '0.64rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: filterTab === 'all' ? 'var(--primary-glow)' : 'transparent',
                color: filterTab === 'all' ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              Todos ({total})
            </button>
            <button
              onClick={() => setFilterTab('locked')}
              className="gaming-filter-tab-btn"
              style={{
                padding: '3px 7px',
                fontSize: '0.64rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: filterTab === 'locked' ? 'var(--primary-glow)' : 'transparent',
                color: filterTab === 'locked' ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              Bloqueados ({locked})
            </button>
            <button
              onClick={() => setFilterTab('unlocked')}
              className="gaming-filter-tab-btn"
              style={{
                padding: '3px 7px',
                fontSize: '0.64rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: filterTab === 'unlocked' ? 'var(--primary-glow)' : 'transparent',
                color: filterTab === 'unlocked' ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              Desbloqueados ({unlocked})
            </button>
          </div>
        </div>
      </div>

      {/* ➕ Formulario Opcional para Logros Personalizados */}
      {showAddForm && (
        <NewAchievementForm
          onSubmit={handleCreate}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* 📋 Lista de Logros Detectados */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        maxHeight: '380px',
        overflowY: 'auto',
        paddingRight: '3px'
      }}>
        {filteredItems.length === 0 ? (
          <div style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.74rem',
            background: 'color-mix(in srgb, var(--bg-card) 50%, transparent)',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-color)'
          }}>
            {rawItems.length === 0 ? (
              <>
                <p style={{ margin: 0, fontWeight: 600 }}>No se detectaron logros para este título.</p>
                <p style={{ margin: '4px 0 10px', fontSize: '0.68rem' }}>Puedes añadir logros propios con "+ Personalizado".</p>
                <TacticalButton size="xs" variant="primary" icon={Plus} onClick={() => setShowAddForm(true)}>
                  Crear Mi Primer Logro
                </TacticalButton>
              </>
            ) : (
              <p style={{ margin: 0 }}>No hay logros que coincidan con la búsqueda o filtro activo.</p>
            )}
          </div>
        ) : (
          filteredItems.map(item => (
            <AchievementItemRow
              key={item.id}
              item={item}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
