import type { Participant } from '../types';

const BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID as string;
const API_KEY = import.meta.env.VITE_JSONBIN_API_KEY as string;

export const isConfigured = () => Boolean(BIN_ID && API_KEY);

export async function loadParticipants(): Promise<Participant[] | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': API_KEY },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.record) ? (data.record as Participant[]) : null;
  } catch {
    return null;
  }
}

export async function saveParticipants(participants: Participant[]): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY,
      },
      body: JSON.stringify(participants),
    });
    return res.ok;
  } catch {
    return false;
  }
}
