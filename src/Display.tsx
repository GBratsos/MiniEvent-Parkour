import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import type { Participant } from './types';
import { formatMs, displayMs, parseLapTime, getPoints } from './timeUtils';
import { loadParticipants, isConfigured } from './lib/jsonbin';
import miniCooper from './assets/mini-cooper.svg';

const POLL_INTERVAL_MS = 15_000;

function sortParticipants(list: Participant[]): Participant[] {
  return [...list].sort((a, b) => {
    if (a.bestLapMs === 0 && b.bestLapMs !== 0) return 1;
    if (b.bestLapMs === 0 && a.bestLapMs !== 0) return -1;
    if (a.bestLapMs !== b.bestLapMs) return a.bestLapMs - b.bestLapMs;
    return a.totalMs - b.totalMs;
  });
}

type DisplayProps = {
  participants: Participant[];
};

export default function Display({ participants: propParticipants }: DisplayProps) {
  const [cloudParticipants, setCloudParticipants] = useState<Participant[] | null>(null);

  useEffect(() => {
    if (!isConfigured()) return;
    const poll = async () => {
      const data = await loadParticipants();
      if (data) setCloudParticipants(sortParticipants(data));
    };
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const participants = cloudParticipants ?? propParticipants;

  const leader = participants[0];

  const topFive = useMemo(() => participants.slice(0, 5), [participants]);

  const rankIcon = (idx: number) => {
    if (idx === 1) return <i className="fa-solid fa-medal" style={{ color: '#FFD700', fontSize: '1.3rem' }} />;
    if (idx === 2) return <i className="fa-solid fa-medal" style={{ color: '#C0C0C0', fontSize: '1.3rem' }} />;
    if (idx === 3) return <i className="fa-solid fa-medal" style={{ color: '#CD7F32', fontSize: '1.3rem' }} />;
    return <i className="fa-solid fa-star" style={{ color: '#606060', fontSize: '1.1rem' }} />;
  };

  return (
    <div className="display-page">
      <header className="display-header">
        <div className="display-branding">
          <img src={miniCooper} alt="Mini Cooper" className="mini-logo" />
          <div>
            <p className="brand-label">MINI John Cooper Works</p>
            <h1>Simracing Experience</h1>
            <p className="brand-subtitle">Assetto Corsa Evo · Classic Mini Cooper</p>
          </div>
        </div>
        <div className="display-summary">
          <div className="metric-card">
            <span>4 laps</span>
            <small>Time Trial</small>
          </div>
          <div className="metric-card">
            <span>{participants.length}</span>
            <small>results</small>
          </div>
          <div className="metric-card highlighted">
            <span>Live display</span>
          </div>
        </div>
      </header>

      <main className="display-content">
        {participants.length === 0 ? (
          <div className="display-empty">
            <h2>Waiting for the first lap times...</h2>
            <p>Enter results on the backend and this screen will update immediately.</p>
          </div>
        ) : (
          <>
            <div className="top-row">
              <section className="hero-board">
                <div className="podium-card">
                  <div className="podium-leader">
                    <p className="small-label">Current leader</p>
                    <div className="leader-top">
                      <div className="leader-info">
                        <h2>{leader?.name}</h2>
                        <p className="leader-lap-label">Best lap</p>
                        <p className="leader-time">{leader ? displayMs(leader.bestLapMs) : '—'}</p>
                        <p className="leader-subtext">Total {leader ? displayMs(leader.totalMs) : '—'}</p>
                      </div>
                      <div className="leader-icon">
                        <i className="fa-solid fa-trophy" />
                      </div>
                    </div>
                  </div>
                  <div className="next-podium">
                    {topFive.slice(1, 3).map((participant, idx) => {
                      const pos = idx + 2;
                      const medalColor = pos === 2 ? '#C0C0C0' : '#CD7F32';
                      return (
                        <div key={participant.id} className={`runner-card runner-card-${pos}`}>
                          <span className="runner-pos">{pos}</span>
                          <div className="runner-info">
                            <span className="runner-name">{participant.name}</span>
                            <span className="runner-time">{displayMs(participant.bestLapMs)}</span>
                            <span className="runner-subtext">Total {displayMs(participant.totalMs)}</span>
                          </div>
                          <i className="fa-solid fa-medal" style={{ color: medalColor, fontSize: '2rem' }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="standings-card">
                <h3>Top 5</h3>
                <ol className="top5-list">
                  {topFive.map((participant, idx) => (
                    <li key={participant.id} className="top5-item">
                      <span className="rank-icon">{rankIcon(idx + 1)}</span>
                      <span className="name">{participant.name}</span>
                      <strong className="time">{displayMs(participant.bestLapMs)}</strong>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <section className="display-table-panel">
              <table className="display-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Driver</th>
                    <th>Lap 1</th>
                    <th>Lap 2</th>
                    <th>Lap 3</th>
                    <th>Lap 4</th>
                    <th>Best</th>
                    <th>Total</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant, index) => (
                    <tr key={participant.id}>
                      <td>{index + 1}</td>
                      <td>{participant.name}</td>
                      <td>
                        {(() => {
                          const m = parseLapTime(participant.lapTimes[0]);
                          return m !== null ? formatMs(m) : '-';
                        })()}
                      </td>
                      <td>
                        {(() => {
                          const m = parseLapTime(participant.lapTimes[1]);
                          return m !== null ? formatMs(m) : '-';
                        })()}
                      </td>
                      <td>
                        {(() => {
                          const m = parseLapTime(participant.lapTimes[2]);
                          return m !== null ? formatMs(m) : '-';
                        })()}
                      </td>
                      <td>
                        {(() => {
                          const m = parseLapTime(participant.lapTimes[3] || '');
                          return m !== null ? formatMs(m) : '-';
                        })()}
                      </td>
                      <td>{displayMs(participant.bestLapMs)}</td>
                      <td>{displayMs(participant.totalMs)}</td>
                      <td>
                        <strong>{participant.bestLapMs > 0 ? getPoints(index + 1) : '—'}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>

      <footer className="display-footer no-print">
        <Link to="/backend" className="backend-link">
          Admin backend
        </Link>
      </footer>
    </div>
  );
}
