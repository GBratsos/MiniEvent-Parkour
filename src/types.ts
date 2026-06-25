export type Participant = {
  id: string;
  name: string;
  lapTimes: [string, string, string, string];
  totalMs: number;
  bestLapMs: number;
  createdAt: string;
};
