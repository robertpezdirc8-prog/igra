/**
 * i18n dict — canvas motor (engine.ts + levelCurve.ts).
 * Vse, kar izriše canvas: imena sektorjev, elite afiksi, GRADIUS reže,
 * imena nadgradenj na level-up, plutajoča bojna sporočila, boss labele,
 * sektorski mejniki in živi graze števec.
 * Slovenščina = izvorno besedilo; angleščina = naraven gamerski prevod.
 */
const sl = {
  // ── Sektorji (Gradius stage kartice) ──
  'sector.1.name': 'PREDSTRAŽA',
  'sector.1.sub': 'mejni nadzor',
  'sector.2.name': 'ASTEROIDNA POLJA',
  'sector.2.sub': 'gost skalnat pas',
  'sector.3.name': 'ZAVESA MEGLENICE',
  'sector.3.sub': 'pas ionskih neviht',
  'sector.4.name': 'OLUPKOVNA FLOTA',
  'sector.4.sub': 'opuščena armada',
  'sector.5.name': 'CITADELA PRAZNINE',
  'sector.5.sub': 'sovražnikova trdnjava',
  'sector.fallback': 'PRAZNINA',
  'hud.sectorN': 'SEKTOR {n}',
  'hud.hostilesCount': '{n} sovražnikov',

  // ── Elite afiksi ──
  'elite.armored': '🛡 OKLEPEN',
  'elite.swift': '⚡ HITRI',
  'elite.menace': '💀 NEVAREN',
  'elite.gilded': '💎 ZLATEN',
  'elite.elder': '👁 STAREŠINA',

  // ── GRADIUS meter reže ──
  'gradius.speed': 'HITRO',
  'gradius.missile': 'RAKETA',
  'gradius.double': 'DVOJNIK',
  'gradius.laser': 'LASER',
  'gradius.option': 'OPCIJA',
  'gradius.shield': 'ŠČIT',

  // ── Nadgradnje na level-up ──
  'upg.plasmaCharge.name': 'Napolnjena plazma',
  'upg.plasmaCharge.desc': '+25% škode, +1 nivo orožja',
  'upg.neuralReflex.name': 'Nevronski refleksi',
  'upg.neuralReflex.desc': '+15% hitrosti premikanja',
  'upg.voidShield.name': 'Ščit praznine',
  'upg.voidShield.desc': '+30 max ščita, polna obnova',
  'upg.temporalCore.name': 'Temporalno jedro',
  'upg.temporalCore.desc': '+25 max energije, hitrejša regeneracija',
  'upg.critMatrix.name': 'Kritična matrika',
  'upg.critMatrix.desc': '+10% kritičnosti, +50% kritične škode',
  'upg.bioRecon.name': 'Bio-rekonstrukcija',
  'upg.bioRecon.desc': '+30 max HP, polno zdravljenje',
  'upg.splitPlasma.name': 'Razcepljena plazma',
  'upg.splitPlasma.desc': 'Izstrelki se razcepijo na 3',
  'upg.gravityWell.name': 'Gravitacijski vrtinec',
  'upg.gravityWell.desc': 'Odkleni gravitacijsko sekundarno orožje',
  'upg.chainLightning.name': 'Verižna molnja',
  'upg.chainLightning.desc': 'Odkleni verižno sekundarno orožje',
  'upg.temporalField.name': 'Temporalna staza',
  'upg.temporalField.desc': 'Odkleni zaustavitev časa',

  // ── Plutajoča bojna sporočila ──
  'hud.bombBlast': 'BOMBA!',
  'hud.antiBomb': 'PROTIBOMBA!',
  'hud.noCharges': 'PREMALO NABOJA',
  'hud.waveCannon': 'VALOVNI TOP!',
  'hud.noCapsules': 'NI KAPSUL',
  'hud.speedUp': 'HITROST +1!',
  'hud.bombUp': '+1 BOMBA',
  'hud.capsuleN': 'KAPSULA {n}/6',
  'hud.plasmaLaser': 'PLAZMA LASER!',
  'hud.graze': 'ODMIK',
  'score.graze': 'ODMIKI',
  'hud.dashReady': 'DASH PRIPRAVLJEN [SPACE]',

  // ── Sektorski mejniki (levelCurve) ──
  'mile.1': 'VPAD — nauči se leteti in streljati',
  'mile.2': 'prvi snajperji in elitne enote',
  'mile.3': 'TITANI stopijo na sceno',
  'mile.4': 'pospešek — hitrejši metki in potopi',
  'mile.5': 'POL POTa — peklenska sredina poti',
  'mile.6': 'plazma zidovi — gostota se dviga',
  'mile.7': 'agresivni psi — sovražniki divjajo',
  'mile.8': 'titan dominantnost — težka pečata',
  'mile.9': 'elitne legije — vsak valu je preizkus',
  'mile.10': 'ZADNJI VZPON — dokler traja',
  'mile.loop': 'ZANKA {n} — {mile}',

  // ── Boss labele (hp trak) ──
  'boss.vanguard': 'PREDSTRAŽA',
  'boss.skull': 'LOBANJA-NIČELA',
  'boss.station': 'POSTAJA NIČ',
  'boss.titan': 'VOID TITAN',
} as const;

type Keys = keyof typeof sl;

const en: Record<Keys, string> = {
  // ── Sectors (Gradius stage cards) ──
  'sector.1.name': 'VANGUARD',
  'sector.1.sub': 'border control',
  'sector.2.name': 'ASTEROID FIELDS',
  'sector.2.sub': 'dense rocky belt',
  'sector.3.name': 'NEBULA VEIL',
  'sector.3.sub': 'band of ion storms',
  'sector.4.name': 'HULL FLEET',
  'sector.4.sub': 'abandoned armada',
  'sector.5.name': 'VOID CITADEL',
  'sector.5.sub': 'the enemy fortress',
  'sector.fallback': 'THE VOID',
  'hud.sectorN': 'SECTOR {n}',
  'hud.hostilesCount': '{n} hostiles',

  // ── Elite affixes ──
  'elite.armored': '🛡 ARMORED',
  'elite.swift': '⚡ SWIFT',
  'elite.menace': '💀 MENACE',
  'elite.gilded': '💎 GILDED',
  'elite.elder': '👁 ELDER',

  // ── GRADIUS meter slots ──
  'gradius.speed': 'SPEED',
  'gradius.missile': 'MISSILE',
  'gradius.double': 'DOUBLE',
  'gradius.laser': 'LASER',
  'gradius.option': 'OPTION',
  'gradius.shield': 'SHIELD',

  // ── Level-up upgrades ──
  'upg.plasmaCharge.name': 'Charged Plasma',
  'upg.plasmaCharge.desc': '+25% damage, +1 weapon level',
  'upg.neuralReflex.name': 'Neural Reflexes',
  'upg.neuralReflex.desc': '+15% movement speed',
  'upg.voidShield.name': 'Void Shield',
  'upg.voidShield.desc': '+30 max shield, full restore',
  'upg.temporalCore.name': 'Temporal Core',
  'upg.temporalCore.desc': '+25 max energy, faster regen',
  'upg.critMatrix.name': 'Critical Matrix',
  'upg.critMatrix.desc': '+10% crit rate, +50% crit damage',
  'upg.bioRecon.name': 'Bio-Reconstruction',
  'upg.bioRecon.desc': '+30 max HP, full heal',
  'upg.splitPlasma.name': 'Splitting Plasma',
  'upg.splitPlasma.desc': 'Shots split into 3',
  'upg.gravityWell.name': 'Gravity Well',
  'upg.gravityWell.desc': 'Unlock gravity secondary weapon',
  'upg.chainLightning.name': 'Chain Lightning',
  'upg.chainLightning.desc': 'Unlock chain secondary weapon',
  'upg.temporalField.name': 'Temporal Field',
  'upg.temporalField.desc': 'Unlock time stop',

  // ── Floating combat messages ──
  'hud.bombBlast': 'BOMB!',
  'hud.antiBomb': 'COUNTER-BOMB!',
  'hud.noCharges': 'NOT ENOUGH CHARGES',
  'hud.waveCannon': 'WAVE CANNON!',
  'hud.noCapsules': 'NO CAPSULES',
  'hud.speedUp': 'SPEED +1!',
  'hud.bombUp': '+1 BOMB',
  'hud.capsuleN': 'CAPSULE {n}/6',
  'hud.plasmaLaser': 'PLASMA LASER!',
  'hud.graze': 'GRAZE',
  'score.graze': 'GRAZES',
  'hud.dashReady': 'DASH READY [SPACE]',

  // ── Sector milestones (levelCurve) ──
  'mile.1': 'INCURSION — learn to fly and shoot',
  'mile.2': 'first snipers and elite units',
  'mile.3': 'TITANS take the stage',
  'mile.4': 'speed-up — faster bullets and dives',
  'mile.5': 'HALFWAY — the hellish middle of the run',
  'mile.6': 'plasma walls — density rising',
  'mile.7': 'aggressive hounds — enemies rage',
  'mile.8': 'titan dominance — heavy seals',
  'mile.9': 'elite legions — every wave a trial',
  'mile.10': 'FINAL ASCENT — for as long as it lasts',
  'mile.loop': 'LOOP {n} — {mile}',

  // ── Boss labels (hp bar) ──
  'boss.vanguard': 'VANGUARD',
  'boss.skull': 'SKULL-NEXUS',
  'boss.station': 'STATION ZERO',
  'boss.titan': 'VOID TITAN',
};

export const dict = { sl, en };
