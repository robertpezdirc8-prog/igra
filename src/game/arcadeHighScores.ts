// ============= ARCADE HIGH SCORES =============
// Classic arcade hall-of-fame for the Klasični arkadni način.
// Pure module over localStorage — sanitizes every read (corrupt JSON,
// bad shapes, negative/NaN scores) so the table can never break the UI.
//
// Table format follows the arcade tradition: exactly 10 slots, each with
// 3-letter initials. An empty table is seeded with the house defaults
// ("ATR — ATHERIA crew"), so the attract-mode list is never blank and a
// fresh player has a reachable target to beat.

export interface ArcadeHighScoreEntry {
  initials: string; // exactly 3 letters, A-Z (falls back to '???')
  score: number;
  stage: number;
  date: number; // Date.now() when recorded
}

const HS_KEY = 'atheria_arcade_highscores';
export const ARCADE_SCORE_TABLE_SIZE = 10;

/** House defaults, lowest-first so the rookie target (5 000) is reachable. */
function defaultTable(): ArcadeHighScoreEntry[] {
  const seed = [
    { initials: 'ATR', score: 120000, stage: 8 },
    { initials: 'ZZT', score: 80000, stage: 6 },
    { initials: 'KAT', score: 55000, stage: 5 },
    { initials: 'MIA', score: 40000, stage: 4 },
    { initials: 'LOV', score: 30000, stage: 4 },
    { initials: 'NOV', score: 22000, stage: 3 },
    { initials: 'PIX', score: 16000, stage: 3 },
    { initials: 'ROK', score: 11000, stage: 2 },
    { initials: 'EVA', score: 7500, stage: 2 },
    { initials: 'AJS', score: 5000, stage: 1 }
  ];
  return seed.map(e => ({ ...e, date: 0 }));
}

function sanitizeEntry(raw: unknown): ArcadeHighScoreEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<ArcadeHighScoreEntry>;
  if (typeof r.score !== 'number' || !Number.isFinite(r.score) || r.score < 0) return null;
  const letters = typeof r.initials === 'string' ? r.initials.toUpperCase().replace(/[^A-Z]/g, '') : '';
  return {
    initials: (letters + '???').slice(0, 3),
    score: Math.floor(r.score),
    stage: typeof r.stage === 'number' && Number.isFinite(r.stage) && r.stage >= 1
      ? Math.floor(r.stage)
      : 1,
    date: typeof r.date === 'number' && Number.isFinite(r.date) ? r.date : 0
  };
}

/** Top-10 table, sanitized. Sorted by score desc; seeded when empty/corrupt. */
export function getArcadeHighScores(): ArcadeHighScoreEntry[] {
  try {
    const raw = localStorage.getItem(HS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const clean = parsed
          .map(sanitizeEntry)
          .filter((e): e is ArcadeHighScoreEntry => e !== null)
          .sort((a, b) => b.score - a.score)
          .slice(0, ARCADE_SCORE_TABLE_SIZE);
        if (clean.length > 0) return clean;
      }
    }
  } catch {
    // fall through to defaults
  }
  return defaultTable();
}

/** Would `score` make the table? (arcade rule: any score beats an empty slot) */
export function isArcadeHighScore(score: number): boolean {
  if (!Number.isFinite(score) || score <= 0) return false;
  const table = getArcadeHighScores();
  if (table.length < ARCADE_SCORE_TABLE_SIZE) return true;
  return score > table[table.length - 1].score;
}

/** Rank `score` would take on the current table (1-based; 0 = off the board). */
export function getArcadeHighScoreRank(score: number): number {
  if (!Number.isFinite(score) || score <= 0) return 0;
  const table = getArcadeHighScores();
  for (let i = 0; i < table.length; i++) {
    if (score > table[i].score) return i + 1;
  }
  return table.length < ARCADE_SCORE_TABLE_SIZE ? table.length + 1 : 0;
}

/** Insert a new entry (already-validated initials), return the updated table. */
export function addArcadeHighScore(initials: string, score: number, stage: number): ArcadeHighScoreEntry[] {
  const clean = sanitizeEntry({ initials, score, stage, date: Date.now() });
  if (!clean) return getArcadeHighScores();
  const table = getArcadeHighScores();
  table.push(clean);
  table.sort((a, b) => b.score - a.score);
  const top = table.slice(0, ARCADE_SCORE_TABLE_SIZE);
  try {
    localStorage.setItem(HS_KEY, JSON.stringify(top));
  } catch {
    // storage full/blocked — the in-memory table still works for this session
  }
  return top;
}
