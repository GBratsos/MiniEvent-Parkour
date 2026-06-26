import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Participant } from './types';
import { displayMs, parseLapTime, getPoints } from './timeUtils';

type BackendProps = {
  participants: Participant[];
  addParticipant: (name: string, lapTimes: [string, string, string, string]) => { success: boolean; message: string };
  updateParticipant: (id: string, field: 'name' | 0 | 1 | 2 | 3, value: string) => void;
  deleteParticipant: (id: string) => void;
  clearParticipants: () => void;
  saveToCloud?: () => Promise<{ ok: boolean }>;
};

type EditingCell = { id: string; field: 'name' | 0 | 1 | 2 | 3 };

export default function Backend({
  participants,
  addParticipant,
  updateParticipant,
  deleteParticipant,
  clearParticipants,
  saveToCloud,
}: BackendProps) {
  const [name, setName] = useState('');
  const [lap1, setLap1] = useState('');
  const [lap2, setLap2] = useState('');
  const [lap3, setLap3] = useState('');
  const [lap4, setLap4] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveToCloud = async () => {
    if (!saveToCloud) return;
    setSaving(true);
    const { ok } = await saveToCloud();
    setMessage(ok ? 'Saved — Display will update within 15 seconds.' : 'Save failed. Check your connection.');
    setSaving(false);
  };

  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = JSON.stringify(participants, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'da-results.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error();
        clearParticipants();
        parsed.forEach((p) => {
          if (p.name && Array.isArray(p.lapTimes)) {
            addParticipant(p.name, p.lapTimes as [string, string, string, string]);
          }
        });
        setMessage(`Imported ${parsed.length} results.`);
      } catch {
        setMessage('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAdd = () => {
    const result = addParticipant(name, [lap1, lap2, lap3, lap4]);
    setMessage(result.message);
    if (result.success) {
      setName('');
      setLap1('');
      setLap2('');
      setLap3('');
      setLap4('');
    }
  };

  const startEdit = (p: Participant, field: 'name' | 0 | 1 | 2 | 3) => {
    let current: string;
    if (field === 'name') {
      current = p.name;
    } else {
      current = p.lapTimes[field];
    }
    setEditingCell({ id: p.id, field });
    setEditingValue(current);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    if (!editingCell) return;
    updateParticipant(editingCell.id, editingCell.field, editingValue);
    setEditingCell(null);
  };

  const cancelEdit = () => {
    setEditingCell(null);
  };

  const isEditing = (id: string, field: 'name' | 0 | 1 | 2 | 3) => editingCell?.id === id && editingCell?.field === field;

  const lapLabel = (p: Participant, idx: 0 | 1 | 2 | 3) => {
    const ms = parseLapTime(p.lapTimes[idx] || '');
    return ms !== null ? displayMs(ms) : p.lapTimes[idx] || '—';
  };

  return (
    <div className="app-shell">
      <div className="page-top-bar">
        <div>
          <p className="page-label">Admin console</p>
          <h1>Backend entry</h1>
          <p className="page-subtitle">Enter the Mini Cooper lap times and manage the leaderboard.</p>
        </div>
        {/* <Link to="/" className="page-switch">
          View participant screen
        </Link> */}
      </div>

      <section className="form-panel">
        <div className="form-group">
          <label>Driver name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter driver name" />
        </div>
        <div className="lap-row">
          <div className="form-group">
            <label>
              Lap 1 <span className="optional-label">(optional)</span>
            </label>
            <input value={lap1} onChange={(e) => setLap1(e.target.value)} placeholder="1:12.345" />
          </div>
          <div className="form-group">
            <label>
              Lap 2 <span className="optional-label">(optional)</span>
            </label>
            <input value={lap2} onChange={(e) => setLap2(e.target.value)} placeholder="1:13.200" />
          </div>
          <div className="form-group">
            <label>
              Lap 3 <span className="optional-label">(optional)</span>
            </label>
            <input value={lap3} onChange={(e) => setLap3(e.target.value)} placeholder="1:11.987" />
          </div>
          <div className="form-group">
            <label>
              Lap 4 <span className="optional-label">(optional)</span>
            </label>
            <input value={lap4} onChange={(e) => setLap4(e.target.value)} placeholder="1:12.100" />
          </div>
        </div>

        <div className="form-actions">
          <button onClick={handleAdd}>
            <i className="fa-solid fa-plus" /> Add result
          </button>
        </div>

        {message ? <p className="message">{message}</p> : null}

        <div className="leaderboard-panel">
          <h2>Leaderboard</h2>
          {participants.length === 0 ? (
            <div className="empty-state">No times yet. Add the first driver to start the ranking.</div>
          ) : (
            <>
              <p className="edit-hint">
                <i className="fa-solid fa-pen-to-square" /> Click any cell to edit it.
              </p>
              <div className="table-wrap">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th className="col-rank">#</th>
                      <th className="col-driver">Driver</th>
                      <th>Lap 1</th>
                      <th>Lap 2</th>
                      <th>Lap 3</th>
                      <th>Lap 4</th>
                      <th>Best</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p, index) => (
                      <tr key={p.id}>
                        <td className="col-rank">{index + 1}</td>

                        {(['name', 0, 1, 2, 3] as const).map((field) => (
                          <td
                            key={field}
                            className={`editable-cell${field === 'name' ? ' col-driver' : ''}${isEditing(p.id, field) ? ' editing' : ''}`}
                            onClick={() => !isEditing(p.id, field) && startEdit(p, field)}
                          >
                            {isEditing(p.id, field) ? (
                              <input
                                ref={inputRef}
                                className="inline-edit-input"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    commitEdit();
                                  }
                                  if (e.key === 'Escape') {
                                    e.preventDefault();
                                    cancelEdit();
                                  }
                                }}
                              />
                            ) : (
                              <span>
                                {field === 'name' ? p.name : lapLabel(p, field)}
                                <i className="fa-solid fa-pen edit-icon" />
                              </span>
                            )}
                          </td>
                        ))}

                        <td>{displayMs(p.bestLapMs)}</td>
                        <td>
                          <button className="delete-button" onClick={() => deleteParticipant(p.id)}>
                            <i className="fa-solid fa-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="form-actions">
          <button className="secondary" onClick={handleExport} disabled={participants.length === 0}>
            <i className="fa-solid fa-file-export" /> Export JSON
          </button>
          <label className="button secondary import-label">
            <i className="fa-solid fa-file-import" /> Import JSON
            <input type="file" accept=".json" onChange={handleImport} hidden />
          </label>
          <button className="secondary danger" onClick={clearParticipants} disabled={participants.length === 0}>
            <i className="fa-solid fa-trash" /> Clear leaderboard
          </button>
          {saveToCloud && (
            <button onClick={handleSaveToCloud} disabled={saving || participants.length === 0}>
              <i className="fa-solid fa-cloud-arrow-up" /> {saving ? 'Saving...' : 'Save to cloud'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
