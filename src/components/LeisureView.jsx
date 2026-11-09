import React from 'react';
import { Gamepad2 } from 'lucide-react';
import {
  useGaming,
  GameCard,
  GamingHeader,
  GamingFilterBar,
  AccelerationBar,
  CustomGameModal,
  ActiveGameSessionBar,
  GameDetailModal,
  UnlockGamingVaultModal
} from './gaming';

export default function LeisureView() {
  const {
    gamingStatus,
    steamGames,
    customGames,
    gameStatsMap,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    hiddenCount,
    showHiddenVault,
    setShowHiddenVault,
    showUnlockModal,
    setShowUnlockModal,
    masterPasswordEnabled,
    isGameHidden,
    toggleHideGame,
    handleToggleVault,
    useGamescopeFsr,
    gamescopeRes,
    useMangohud,
    launchMessage,
    loading,
    activeSession,
    showGameModal,
    setShowGameModal,
    gameFormData,
    setGameFormData,
    selectedGameForDetail,
    gamepadConnected,
    fetchData,
    refreshStats,
    handleToggleGamescope,
    handleChangeRes,
    handleToggleMangohud,
    handleLaunchGame,
    handleStopSession,
    handleCancelSession,
    handleSaveCustomGame,
    handleDeleteCustomGame,
    handleInstallSteamGame,
    filteredSteam,
    filteredCustom,
    totalTitles,
    openNewGameModal,
    openGameDetail,
    closeGameDetail
  } = useGaming();

  return (
    <div className="gaming-view-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: '0.65rem',
      overflowY: 'auto',
      paddingRight: '2px'
    }}>
      {/* 🧭 Barra Superior: Buscador & Telemetría */}
      <GamingHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        launchMessage={launchMessage}
        gamingStatus={gamingStatus}
        gamepadConnected={gamepadConnected}
        onOpenNewGame={openNewGameModal}
        onLaunchSteam={() => handleLaunchGame('steam')}
        onRefresh={fetchData}
      />

      {/* 🚀 Barra de Aceleración: Gamescope & MangoHud */}
      <AccelerationBar
        useGamescopeFsr={useGamescopeFsr}
        onToggleGamescope={handleToggleGamescope}
        gamescopeRes={gamescopeRes}
        onChangeRes={handleChangeRes}
        useMangohud={useMangohud}
        onToggleMangohud={handleToggleMangohud}
        mangohudInstalled={gamingStatus?.mangohudInstalled}
      />

      {/* 🏷️ Barra de Navegación y Filtros: Categorías, Ordenamiento & Bóveda */}
      <GamingFilterBar
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        sortBy={sortBy}
        onSetSortBy={setSortBy}
        steamCount={steamGames.length}
        customCount={customGames.length}
        hiddenCount={hiddenCount}
        showHiddenVault={showHiddenVault}
        onToggleVault={handleToggleVault}
      />

      {/* ⏱️ HUD Flotante: Sesión Activa de Juego */}
      {activeSession && (
        <ActiveGameSessionBar
          activeSession={activeSession}
          onStopSession={handleStopSession}
          onCancelSession={handleCancelSession}
          onOpenDetails={() => {
            const isStm = activeSession.isSteam;
            const fullGame = isStm
              ? steamGames.find((g) => g.appId === activeSession.gameId)
              : customGames.find((g) => g.id === activeSession.gameId);
            openGameDetail(
              fullGame || {
                id: activeSession.gameId,
                appId: activeSession.gameId,
                name: activeSession.gameTitle,
                title: activeSession.gameTitle
              },
              isStm,
              'achievements'
            );
          }}
          onOpenCompanion={() => {
            const isStm = activeSession.isSteam;
            const fullGame = isStm
              ? steamGames.find((g) => g.appId === activeSession.gameId)
              : customGames.find((g) => g.id === activeSession.gameId);
            openGameDetail(
              fullGame || {
                id: activeSession.gameId,
                appId: activeSession.gameId,
                name: activeSession.gameTitle,
                title: activeSession.gameTitle
              },
              isStm,
              'companion'
            );
          }}
        />
      )}

      {/* 🎮 Cuadrícula: Cards Full Portada (2:3) Minimalistas */}
      <div className="gaming-grid-container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '12px',
        paddingBottom: '12px'
      }}>
        {filteredSteam.map((game) => (
          <GameCard
            key={game.appId}
            game={game}
            isSteam={true}
            gameStats={gameStatsMap[game.appId]}
            isHidden={isGameHidden(game, true)}
            onToggleHide={toggleHideGame}
            onLaunch={handleLaunchGame}
            onInstall={handleInstallSteamGame}
            onOpenDetails={openGameDetail}
          />
        ))}

        {filteredCustom.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            isSteam={false}
            gameStats={gameStatsMap[game.id]}
            isHidden={isGameHidden(game, false)}
            onToggleHide={toggleHideGame}
            onLaunch={handleLaunchGame}
            onDelete={handleDeleteCustomGame}
            onOpenDetails={openGameDetail}
          />
        ))}
      </div>

      {totalTitles === 0 && !loading && (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.82rem',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Gamepad2 size={32} color="var(--text-muted)" />
          <span>No se encontraron títulos en la biblioteca ni lanzadores que coincidan con la búsqueda.</span>
        </div>
      )}

      {/* 🪟 Modal Táctico: Agregar Nuevo Lanzador */}
      <CustomGameModal
        isOpen={showGameModal}
        onClose={() => setShowGameModal(false)}
        gameFormData={gameFormData}
        setGameFormData={setGameFormData}
        onSubmit={handleSaveCustomGame}
      />

      {/* 🪟 Modal Táctico: Desbloquear Bóveda de Juegos Encriptada */}
      <UnlockGamingVaultModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onUnlockSuccess={() => {
          setShowUnlockModal(false);
          setShowHiddenVault(true);
        }}
        masterPasswordEnabled={masterPasswordEnabled}
      />

      {/* 🪟 Modal Táctico: Detalle de Juego (Logros, Tiempos, Reseña & Obsidian) */}
      {selectedGameForDetail && (
        <GameDetailModal
          isOpen={Boolean(selectedGameForDetail)}
          onClose={closeGameDetail}
          game={selectedGameForDetail.game}
          isSteam={selectedGameForDetail.isSteam}
          initialTab={selectedGameForDetail.initialTab || 'achievements'}
          gameStats={
            gameStatsMap[
              selectedGameForDetail.isSteam
                ? selectedGameForDetail.game.appId
                : selectedGameForDetail.game.id
            ]
          }
          onRefreshStats={refreshStats}
        />
      )}
    </div>
  );
}
