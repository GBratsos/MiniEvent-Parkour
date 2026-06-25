import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Backend from './Backend';
import Display from './Display';
import type { Participant } from './types';
import { computeParticipant, parseLapTime } from './timeUtils';
import { loadParticipants, saveParticipants, isConfigured } from './lib/jsonbin';

const STORAGE_KEY = 'driving-academy-scoreboard-results';

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);

  const normalize = (p: Participant): Participant => ({
    ...p,
    lapTimes: [
      p.lapTimes?.[0] ?? '',
      p.lapTimes?.[1] ?? '',
      p.lapTimes?.[2] ?? '',
      p.lapTimes?.[3] ?? '',
    ],
  });

  useEffect(() => {
    const init = async () => {
      if (isConfigured()) {
        const remote = await loadParticipants();
        if (remote) { setParticipants(remote.map(normalize)); return; }
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { setParticipants((JSON.parse(saved) as Participant[]).map(normalize)); } catch {}
      }
    };
    init();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
  }, [participants]);

  const sortedParticipants = useMemo(
    () =>
      [...participants].sort((a, b) => {
        // Drivers with no times (0) go to the bottom
        if (a.bestLapMs === 0 && b.bestLapMs !== 0) return 1;
        if (b.bestLapMs === 0 && a.bestLapMs !== 0) return -1;
        if (a.bestLapMs !== b.bestLapMs) return a.bestLapMs - b.bestLapMs;
        return a.totalMs - b.totalMs;
      }),
    [participants]
  );

  const addParticipant = (name: string, lapTimes: [string, string, string, string]) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, message: 'Enter a driver name before adding a result.' };
    }

    const participant = computeParticipant(trimmedName, lapTimes);
    setParticipants((prev) => [...prev, participant]);
    return { success: true, message: 'Driver added.' };
  };

  const updateParticipant = (id: string, field: 'name' | 0 | 1 | 2 | 3, value: string) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (field === 'name') {
          const trimmed = value.trim();
          return trimmed ? { ...p, name: trimmed } : p;
        }
        const newLapTimes: [string, string, string, string] = [...p.lapTimes] as [string, string, string, string];
        newLapTimes[field] = value;
        const validMs = newLapTimes.map(parseLapTime).filter((v): v is number => v !== null);
        return {
          ...p,
          lapTimes: newLapTimes,
          totalMs: validMs.length > 0 ? validMs.reduce((s, v) => s + v, 0) : 0,
          bestLapMs: validMs.length > 0 ? Math.min(...validMs) : 0,
        };
      })
    );
  };

  const deleteParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((participant) => participant.id !== id));
  };

  const clearParticipants = () => {
    setParticipants([]);
  };

  const saveToCloud = async (): Promise<{ ok: boolean }> => {
    const ok = await saveParticipants(sortedParticipants);
    return { ok };
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Display participants={sortedParticipants} />} />
        <Route
          path="/backend"
          element={
            <Backend
              participants={sortedParticipants}
              addParticipant={addParticipant}
              updateParticipant={updateParticipant}
              deleteParticipant={deleteParticipant}
              clearParticipants={clearParticipants}
              saveToCloud={isConfigured() ? saveToCloud : undefined}
            />
          }
        />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
