export const INITIAL_GAME_FORM = {
  id: '',
  title: '',
  category: 'Web Roguelike',
  launchType: 'url',
  launchTarget: '',
  description: '',
  bannerUrl: ''
};

export const SORT_OPTIONS = [
  { id: 'recent', label: 'Más recientes' },
  { id: 'playtime', label: 'Tiempo jugado (Horas)' },
  { id: 'title_asc', label: 'Nombre (A - Z)' },
  { id: 'title_desc', label: 'Nombre (Z - A)' },
  { id: 'achievements', label: 'Logros (% completado)' },
  { id: 'installed', label: 'Instalados primero' }
];

export const HIDDEN_GAMES_STORAGE_KEY = 'aegis_gaming_hidden_ids';

export function getHiddenGameIds() {
  try {
    const raw = localStorage.getItem(HIDDEN_GAMES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHiddenGameIds(ids) {
  try {
    localStorage.setItem(HIDDEN_GAMES_STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error('Error guardando ids de juegos ocultos:', err);
  }
}

export function getGameNormalizedId(game, isSteam = false) {
  if (!game) return '';
  if (isSteam || game.isSteam || Boolean(game.appId)) {
    return `steam_${game.appId}`;
  }
  return String(game.id || game.appId || '');
}

export function formatPlayDuration(seconds) {
  if (!seconds || seconds <= 0) return null;
  const hrs = seconds / 3600;
  if (hrs >= 1) {
    return `${hrs.toFixed(1)} h`;
  }
  const mins = Math.round(seconds / 60);
  return `${mins} m`;
}

export function formatSecondsTimer(totalSecs) {
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function checkGamepadConnected() {
  try {
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    return Array.from(gps).some((g) => g && g.connected);
  } catch {
    return false;
  }
}

export function sortGamesList(games, sortBy = 'recent', statsMap = {}) {
  if (!Array.isArray(games) || games.length === 0) return [];
  const list = [...games];

  return list.sort((a, b) => {
    const aNormId = getGameNormalizedId(a, a.isSteam);
    const bNormId = getGameNormalizedId(b, b.isSteam);
    const aStats = statsMap[aNormId] || statsMap[a.appId] || statsMap[a.id] || {};
    const bStats = statsMap[bNormId] || statsMap[b.appId] || statsMap[b.id] || {};

    const aTime = aStats.totalPlayTimeSeconds || a.totalPlayTimeSeconds || (a.play_time_minutes ? a.play_time_minutes * 60 : (a.playTimeMinutes ? a.playTimeMinutes * 60 : 0));
    const bTime = bStats.totalPlayTimeSeconds || b.totalPlayTimeSeconds || (b.play_time_minutes ? b.play_time_minutes * 60 : (b.playTimeMinutes ? b.playTimeMinutes * 60 : 0));

    const aTitle = (a.title || a.name || '').toLowerCase();
    const bTitle = (b.title || b.name || '').toLowerCase();

    const aAchTotal = aStats.achievementsTotal ?? a.achievementsTotal ?? 0;
    const aAchUnl = aStats.achievementsUnlocked ?? a.achievementsUnlocked ?? 0;
    const aAchPct = aAchTotal > 0 ? aAchUnl / aAchTotal : 0;

    const bAchTotal = bStats.achievementsTotal ?? b.achievementsTotal ?? 0;
    const bAchUnl = bStats.achievementsUnlocked ?? b.achievementsUnlocked ?? 0;
    const bAchPct = bAchTotal > 0 ? bAchUnl / bAchTotal : 0;

    const aInstalled = a.isInstalled ?? true;
    const bInstalled = b.isInstalled ?? true;

    const aLastPlayed = aStats.lastPlayed || a.last_played || a.lastPlayed || '';
    const bLastPlayed = bStats.lastPlayed || b.last_played || b.lastPlayed || '';

    switch (sortBy) {
      case 'playtime':
        if (bTime !== aTime) return bTime - aTime;
        return aTitle.localeCompare(bTitle);
      case 'title_asc':
        return aTitle.localeCompare(bTitle);
      case 'title_desc':
        return bTitle.localeCompare(aTitle);
      case 'achievements':
        if (bAchPct !== aAchPct) return bAchPct - aAchPct;
        if (bAchUnl !== aAchUnl) return bAchUnl - aAchUnl;
        return aTitle.localeCompare(bTitle);
      case 'installed':
        if (aInstalled !== bInstalled) return aInstalled ? -1 : 1;
        return aTitle.localeCompare(bTitle);
      case 'recent':
      default: {
        if (aLastPlayed && bLastPlayed) {
          const diff = new Date(bLastPlayed).getTime() - new Date(aLastPlayed).getTime();
          if (!isNaN(diff) && diff !== 0) return diff;
        }
        if (aLastPlayed && !bLastPlayed) return -1;
        if (!aLastPlayed && bLastPlayed) return 1;
        if (bTime !== aTime) return bTime - aTime;
        return aTitle.localeCompare(bTitle);
      }
    }
  });
}
