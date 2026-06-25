import type { Participant } from './types';

export function parseLapTime(value: string): number | null {
  const raw = value.trim();
  if (!raw) {
    return null;
  }

  const parts = raw.split(':');
  let minutes = 0;
  let secondsValue = 0;

  if (parts.length === 1) {
    secondsValue = Number(parts[0]);
  } else if (parts.length === 2) {
    minutes = Number(parts[0]);
    secondsValue = Number(parts[1]);
  } else {
    return null;
  }

  if (!Number.isFinite(minutes) || !Number.isFinite(secondsValue)) {
    return null;
  }

  const wholeSeconds = Math.floor(secondsValue);
  const fraction = secondsValue - wholeSeconds;
  const millis = Math.round(fraction * 1000);
  return minutes * 60_000 + wholeSeconds * 1000 + millis;
}

export function formatMs(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const millis = ms % 1000;
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

export function formatMaybeMs(ms: number | null): string {
  if (ms === null) return '-';
  return formatMs(ms);
}

export function displayMs(ms: number): string {
  return ms === 0 ? '—' : formatMs(ms);
}

export function getPoints(position: number): number {
  if (position === 1) return 40;
  if (position === 2) return 36;
  if (position === 3) return 33;
  if (position === 4) return 30;
  if (position === 5) return 25;
  if (position === 6) return 21;
  if (position === 7) return 18;
  if (position === 8) return 15;
  if (position <= 16) return 10;
  if (position <= 18) return 5;
  return 0;
}

export function computeParticipant(name: string, lapTimes: [string, string, string, string]): Participant {
  const parsed = lapTimes.map(parseLapTime);
  const validMs = parsed.filter((v): v is number => v !== null);

  const totalMs = validMs.length > 0 ? validMs.reduce((sum, v) => sum + v, 0) : 0;
  const bestLapMs = validMs.length > 0 ? Math.min(...validMs) : 0;

  return {
    id: `${name}-${Date.now()}`,
    name: name.trim(),
    lapTimes,
    totalMs,
    bestLapMs,
    createdAt: new Date().toISOString()
  };
}
