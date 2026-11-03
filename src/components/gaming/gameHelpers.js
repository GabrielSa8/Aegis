export const INITIAL_GAME_FORM = {
  id: '',
  title: '',
  category: 'Web Roguelike',
  launchType: 'url',
  launchTarget: '',
  description: '',
  bannerUrl: ''
};

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
