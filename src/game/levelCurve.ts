/**
 * LEVEL CURVE 1–50 — podatkovno vodeno oblikovanje valov (10 sektorjev × 5 valov).
 *
 * Raziskava najboljših shmupov (Gradius rank sistem, Raiden, Sky Force
 * Reloaded, Danmaku Unlimited 3, DoDonPachi) uči petih pravil, ki jih
 * ta krivulja implementira:
 *
 * 1. VEČ GUMBOV, NE SAMO HP — Gradius "rank" stopnjuje hitrost sovražnikov,
 *    agresijo streljanja, hitrost metkov in gostoto SOČASNO, vsak svojim
 *    tempom. linearno dvigovanje samega HP je "res slaba" praksa.
 * 2. AVTORSKA KOMPOZICIJA — vsak sektor ima svojo mešanico Sovražnikov:
 *    nove tipe uvajamo postopoma (1. sektor brez Titanov!), ne naključno.
 * 3. BERLJIVOST — gostota ima strop; formacije rastejo potem ostanejo
 *    berljive (Danmaku 101: metki v skupinah/črtah, ne posamezni čarji).
 * 4. MEJNIKI — vsak sektor ima svojo identiteto in dogodek (Sky Force
 *    lekcija: "level design kar naprej stopnjuje — več raznolikosti").
 * 5. ZANKA PO 50 — Gradius Gaiden lekcija: zanka je težja, a obvladljiva,
 *    "ne le povečevanje hitrosti in gostote metkov" — zmerno 35 % bonus.
 */

export type FormationType = 'line' | 'sine' | 'vshape' | 'pincer' | 'circle' | 'spiral';

export interface WavePlan {
  wave: number;
  sector: number;
  /** Število sovražnikov v valu (brez boss/mid-boss dodatkov). */
  count: number;
  /** Množitelji NAD izbrano težavnostno stopnjo. */
  hpMul: number;
  dmgMul: number;
  speedMul: number;
  /** Agresivnost streljanja (delilci intervalov). */
  fireMul: number;
  bulletSpeedMul: number;
  /** Elitni aksi (Vampire Survivors spike momenti). */
  eliteChance: number;
  eliteCap: number;
  eliteMinWave: number;
  /** Hkratni potapljajoči sovražniki (fly-by cap). */
  diveMax: number;
  /** Avtorizirana mešanica tipov po sektorju (uteži se seštejejo v 1). */
  comp: { swarmer: number; sniper: number; titan: number };
  /** Avtorizirana formacija tega vala — vzorec, ne šum. */
  formation: FormationType;
  /** Razpon formacije (merilo razporeditve). */
  formationScale: number;
  /** Svetovni scroll naprej (px/s) — občutek hitrosti leta. */
  scroll: number;
  /** Strop asteroidov na ekranu. */
  asteroidCap: number;
  /** Kratki mejnik opis (v sektorski kartici). */
  milestone: string;
}

/** Mejniki po sektorjih — "kaj se dogaja" na vsaki stopnji pripovedi. */
const SECTOR_MILESTONES: ReadonlyArray<string> = [
  'VPAD — nauči se leteti in streljati',
  'prvi snajperji in elitne enote',
  'TITANI stopijo na sceno',
  'pospešek — hitrejši metki in potopi',
  'POL POT — peklenska sredina poti',
  'plazma zidovi — gostota se dviga',
  'agresivni psi — sovražniki divjajo',
  'titan dominantnost — težka pečata',
  'elitne legije — vsak valu je preizkus',
  'ZADNJI VZPON — dokler traja',
];

/** Avtorizirane mešanice tipov po sektorju — nove grožnje prihajajo
 *  postopoma (lekcija "Designing smart, meaningful SHMUPs": prvi val
 *  naj uči, ne kaznuje). */
const SECTOR_COMP: ReadonlyArray<{ swarmer: number; sniper: number; titan: number }> = [
  { swarmer: 0.85, sniper: 0.15, titan: 0.0 },  // S1: brez Titanov — učenje
  { swarmer: 0.70, sniper: 0.25, titan: 0.05 }, // S2: prvi Titani
  { swarmer: 0.60, sniper: 0.28, titan: 0.12 },
  { swarmer: 0.55, sniper: 0.30, titan: 0.15 },
  { swarmer: 0.50, sniper: 0.30, titan: 0.20 }, // S5: pol poti
  { swarmer: 0.45, sniper: 0.32, titan: 0.23 },
  { swarmer: 0.40, sniper: 0.33, titan: 0.27 },
  { swarmer: 0.35, sniper: 0.33, titan: 0.32 }, // S8: Titan dominantnost
  { swarmer: 0.32, sniper: 0.33, titan: 0.35 },
  { swarmer: 0.30, sniper: 0.32, titan: 0.38 }, // S10: finalna mešanica
];

/**
 * Avtorizirane formacije po valu znotraj sektorja (1..5):
 * w1 berljiva črta → w2 sine-kača (učenje toka) → w3 V-ščit (mid-boss
 * eskorta) → w4 klešče (pritisk s krili) → w5 boss-krog.
 * Sodi sektorji rotirajo zaporedje za 1 mesto — raznolikost brez kaosa.
 * Lekcija Gradius/Raiden: vsaka faza sektorja ima svojo OBLIKO;
 * 'random' ni kompozicija, zato ga ni več.
 */
const FORMATION_SEQUENCE: ReadonlyArray<FormationType> = [
  'line', 'sine', 'vshape', 'pincer', 'circle',
];

function formationFor(bw: number, sector: number): FormationType {
  const idx = (bw - 1) % FORMATION_SEQUENCE.length;
  const shift = (sector - 1) % FORMATION_SEQUENCE.length;
  return FORMATION_SEQUENCE[(idx + shift) % FORMATION_SEQUENCE.length] ?? 'line';
}

/**
 * Čist funkcija: val (1..50, nato zanka) → polni načrt vala.
 * Vse krivulje so gladke več-gumbne rasti s stropi — berljivost vedno zmaga.
 */
export function getWavePlan(wave: number): WavePlan {
  const w = Math.max(1, Math.floor(wave));
  // Zanka po 50. valu (Gradius Gaiden šola): enaka krivulja, zmerni bonusi.
  const loop = Math.floor((w - 1) / 50);
  const bw = ((w - 1) % 50) + 1;               // val znotraj zanke (1..50)
  const sector = Math.min(10, Math.ceil(bw / 5));
  const loopHp = 1 + loop * 0.35;
  const loopDmg = 1 + loop * 0.22;

  const base = SECTOR_COMP[sector - 1] ?? SECTOR_COMP[9];

  // ── Gostota: 5 → 22 sovražnikov (strop za berljivost) ──
  const count = Math.min(22, 5 + Math.round((bw - 1) * 0.35));

  // ── HP: polinomska krivulja 1.0 → ~5.9 (mehkejša začetek, strmejša konec) ──
  const hpMul = Math.min(6.0, (1 + (bw - 1) * 0.055 + Math.pow(bw / 50, 2) * 2.2) * loopHp);

  // ── Škoda: +2.5 % na val, strop 2.2 (eno zadetek nikoli ne usmrti takoj) ──
  const dmgMul = Math.min(2.2, 1 + (bw - 1) * 0.025) * loopDmg;

  // ── Hitrost sovražnikov: +1.2 % na val, strop 1.6 ──
  const speedMul = Math.min(1.6, 1 + (bw - 1) * 0.012) * (1 + loop * 0.12);

  // ── Agresivnost: +1.6 % na val, strop 1.85 (Gradius rank lekcija) ──
  const fireMul = Math.min(1.85, 1 + (bw - 1) * 0.016) * (1 + loop * 0.15);

  // ── Hitrost metkov: +5 % na sektor, strop 1.5 — vzorci ostanejo berljivi ──
  const bulletSpeedMul = Math.min(1.5, 1 + (sector - 1) * 0.05) * (1 + loop * 0.1);

  // ── Elita: od 4. vala, možnost do 26 %, do 3 na val v poznih sektorjih ──
  const eliteMinWave = 4;
  const eliteChance = bw < eliteMinWave ? 0 : Math.min(0.26, 0.04 + bw * 0.004);
  const eliteCap = bw < 6 ? 1 : bw < 15 ? 2 : 3;

  // ── Potopi: 2 → 7 hkratnih (pošten fly-by cap iz Anatomy of a Shmup) ──
  const diveMax = Math.min(7, 2 + Math.floor(sector / 2));

  // ── Formacija: raste do 2.2× razpona (ne 6× kot prej — berljivost!) ──
  const formationScale = 1 + (sector - 1) * 0.13 + loop * 0.1;

  // ── Scroll: 70 → 160 px/s po sektorjih (gladek pospešek leta) ──
  const scroll = 70 + Math.min(90, (sector - 1) * 10);

  // ── Asteroidi: 9 → 27 na ekranu ──
  const asteroidCap = Math.min(27, 7 + sector * 2);

  const milestone =
    loop > 0
      ? `ZANKA ${loop + 1} — ${SECTOR_MILESTONES[sector - 1]}`
      : SECTOR_MILESTONES[sector - 1];

  return {
    wave: w,
    sector,
    count,
    formation: formationFor(bw, sector),
    hpMul,
    dmgMul,
    speedMul,
    fireMul,
    bulletSpeedMul,
    eliteChance,
    eliteCap,
    eliteMinWave,
    diveMax,
    comp: { ...base },
    formationScale,
    scroll,
    asteroidCap,
    milestone,
  };
}

/** Uteženo izbiro tipa sovražnika po avtorizirani mešanici sektorja. */
export function pickEnemyType(comp: WavePlan['comp']): 'swarmer' | 'sniper' | 'titan' {
  const r = Math.random();
  if (r < comp.swarmer) return 'swarmer';
  if (r < comp.swarmer + comp.sniper) return 'sniper';
  return 'titan';
}
