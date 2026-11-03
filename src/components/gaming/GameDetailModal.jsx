import React, { useState } from 'react';
import { Gamepad2, Trophy, Clock, BookOpen } from 'lucide-react';
import ModalWrapper from '../ui/ModalWrapper';
import TabsBar from '../ui/TabsBar';
import GameAchievementsTab from './GameAchievementsTab';
import GameSessionsTab from './GameSessionsTab';
import GameReviewTab from './GameReviewTab';

export default function GameDetailModal({
  isOpen,
  onClose,
  game,
  isSteam,
  gameStats,
  onRefreshStats
}) {
  const [activeTab, setActiveTab] = useState('achievements');

  if (!game) return null;

  const gameId = isSteam ? game.appId : game.id;
  const gameTitle = game.name || game.title;

  const formatHours = (seconds) => {
    if (!seconds || seconds <= 0) return '0 h';
    const hours = (seconds / 3600).toFixed(1);
    return `${hours} h`;
  };

  const tabs = [
    { id: 'achievements', label: 'Logros', icon: Trophy },
    { id: 'sessions', label: 'Tiempos & Sesiones', icon: Clock },
    { id: 'review', label: 'Bitácora & Reseña', icon: BookOpen }
  ];

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={gameTitle}
      icon={Gamepad2}
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* 🧭 Header Táctico con Métricas Resumen */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'color-mix(in srgb, var(--bg-card) 90%, black)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              background: isSteam ? 'var(--primary-glow)' : 'color-mix(in srgb, var(--accent) 15%, transparent)',
              color: isSteam ? 'var(--primary)' : 'var(--accent)',
              border: `1px solid ${isSteam ? 'var(--primary)' : 'var(--accent)'}`
            }}>
              {isSteam ? 'STEAM' : (game.category || 'CUSTOM').toUpperCase()}
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {isSteam ? `AppID: ${game.appId}` : (game.launchType || 'URL').toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} color="var(--primary)" />
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-high)' }}>
                {formatHours(gameStats?.totalPlayTimeSeconds)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.74rem' }}>⭐</span>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-high)' }}>
                {gameStats?.rating ? `${gameStats.rating}/5` : '-'}
              </span>
            </div>

            {gameStats?.sessionsCount > 0 && (
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {gameStats.sessionsCount} partida{gameStats.sessionsCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* 📑 Navegación por Tabs */}
        <TabsBar
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          size="sm"
        />

        {/* Contenido de Tabs */}
        <div style={{ marginTop: '2px' }}>
          {activeTab === 'achievements' && (
            <GameAchievementsTab
              gameId={gameId}
              isSteam={isSteam}
              onAchievementsChanged={onRefreshStats}
            />
          )}

          {activeTab === 'sessions' && (
            <GameSessionsTab
              gameId={gameId}
              gameTitle={gameTitle}
              isSteam={isSteam}
              onSessionRecorded={onRefreshStats}
            />
          )}

          {activeTab === 'review' && (
            <GameReviewTab
              gameId={gameId}
              gameTitle={gameTitle}
              isSteam={isSteam}
              gameStats={gameStats}
              onReviewSaved={onRefreshStats}
            />
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}
