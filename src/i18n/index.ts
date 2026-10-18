/**
 * i18n — lightweight Slovenian/English localization.
 *
 * Design notes:
 * - Flat dot-keyed dictionaries (sl = source of truth, en mirrors it).
 * - `t(key, vars)` resolves `{name}` placeholders; missing keys fall back
 *   to the OTHER language, then to the raw key (visible in dev, never a crash).
 * - Language lives in a tiny module store (localStorage `atheria.lang`),
 *   independent from SaveData — display language should not need save-game
 *   migration to travel with exports.
 * - React components subscribe via `useLang()` (useSyncExternalStore);
 *   canvas engines simply call `t()` every frame, so text swaps instantly.
 */

import { useSyncExternalStore } from 'react';

import { dict as metaDict } from './dicts/meta';
import { dict as progressDict } from './dicts/progress';
import { dict as worldDict } from './dicts/world';
import { dict as helpDict } from './dicts/help';
import { dict as engineDict } from './dicts/engine';

export type Language = 'sl' | 'en';
const LANGUAGES: Language[] = ['sl', 'en'];
export function isLanguage(v: unknown): v is Language {
  return typeof v === 'string' && (LANGUAGES as string[]).includes(v);
}

const LANG_KEY = 'atheria.lang';

function detectInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (isLanguage(saved)) return saved;
  } catch {
    /* storage unavailable — fall through to browser locale */
  }
  return navigator.language?.toLowerCase().startsWith('sl') ? 'sl' : 'en';
}

let current: Language = detectInitialLanguage();
const listeners = new Set<() => void>();

export function getLanguage(): Language {
  return current;
}

export function setLanguage(lang: Language): void {
  if (lang === current) return;
  current = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* non-fatal: language just won't persist */
  }
  listeners.forEach((fn) => fn());
}

export function subscribeLang(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Locale tag for toLocaleString() — groups/suffixes follow the UI language. */
export function localeTag(): string {
  return current === 'sl' ? 'sl-SI' : 'en-US';
}

const slBase = {
  // ── Common ──
  'common.mainMenu': 'GLAVNI MENI',
  'common.save': 'SHRANI',
  'common.cancel': 'PREKLIČI',
  'common.back': 'NAZAJ',

  // ── Settings ──
  'settings.title': 'NASTAVITVE',
  'settings.language': 'JEZIK',
  'settings.music': 'GLASBA',
  'settings.sfx': 'ZVOČNI EFEKTI',
  'settings.particles': 'KAKOVOST DELCEV',
  'settings.particlesLow': 'NIZKA',
  'settings.particlesMedium': 'SREDNJA',
  'settings.particlesHigh': 'VISOKA',
  'settings.showFps': 'PRIKAŽI FPS',
  'settings.bullets': 'VIDNOST NABOJEV',
  'settings.bulletsDesc': 'Nasprotnikovo streljanje jasneje vidno (dostopnost)',
  'settings.bulletsStandard': 'OBIČAJNO',
  'settings.bulletsContrast': 'KONTRAST',
  'settings.bulletsMono': 'ENOBARVNO',
  'settings.bulletsAriaStandard': 'Vidnost nabojev: Običajno',
  'settings.bulletsAriaContrast': 'Vidnost nabojev: Visok kontrast',
  'settings.bulletsAriaMono': 'Vidnost nabojev: Enobarvno',
  'settings.autoAim': 'AUTO-AIM',
  'settings.autoAimDesc': 'Samodejno namerjanje za mobilne naprave',
  'settings.mobileControls': '📱 MOBILNE KONTROLE',
  'settings.dragSensitivity': 'OBČUTLJIVOST VLEČENJA',
  'settings.dragSensitivityDesc': 'Kako hitro ladja sledi prstu',
  'settings.leftHanded': 'LEVIČARSKI NAČIN',
  'settings.leftHandedDesc': 'Gumbi na levi, vodenje z desno stranjo',
  'settings.bigButtons': 'VELIKI GUMBI',
  'settings.bigButtonsDesc': 'Večje ciljne površine za prste',

  // ── Main menu ──
  'menu.start': 'ZAČNI IGRO',
  'menu.subtitle': 'WebGPU vertikalni vesoljski strelec',
  'menu.guide': '📖 VODNIK',
  'menu.settings': '⚙️ NASTAVITVE',
  'menu.saveLoad': '💾 SHRANI/NALOŽI',
  'menu.stats': '📊 STATISTIKA',
  'menu.arcade': '🎯 ARKADNA IGRA',
  'menu.dailyRewards': '🎁 DNEVNE NAGRADE',
  'menu.shop': '🛍️ TRGOVINA',
  'menu.difficulty': '⚔️ TEŽAVNOST',
  'menu.meta': '🌳 META-PROGRESIJA',
  'menu.interactiveGuide': '📚 INTERAKTIVNI VODNIK',
  'menu.classic': '🕹️ KLASIČNI NAČIN',
  'menu.best': 'NAJBOLJŠI:',
  'menu.webgpuActive': '● WebGPU AKTIVEN',
  'menu.canvasMode': '● Canvas2D NAČIN',
  'menu.controlsHint': 'WASD = Gibanje | Miška = Streljanje | SPACE = Dash | ESC = Pavza',

  // ── Pause ──
  'pause.title': 'PAUZIRANO',
  'pause.resume': 'NADALJUJ',
  'pause.restart': 'PONOVNI ZAGON',
  'pause.escHint': 'Pritisni ESC za nadaljevanje',

  // ── Difficulty select ──
  'difficulty.title': '⚔️ IZBERI TEŽAVNOST',
  'difficulty.subtitle': 'Višja težavnost = večje nagrade',
  'difficulty.current': '✓ TRENUTNO',
  'difficulty.enemies': 'Sovražniki',
  'difficulty.player': 'Igralec',
  'difficulty.rewards': 'Nagrade',
  'difficulty.hp': 'HP',
  'difficulty.damage': 'Škoda',
  'difficulty.speed': 'Hitrost',
  'difficulty.gold': 'Zlato',
  'difficulty.points': 'Točke',
  'difficulty.locked': 'Zaklenjene težavnosti:',
  'difficulty.unlockLevel': 'Odklene se na nivoju {level}',
  'difficulty.name.easy': 'Lahko',
  'difficulty.name.normal': 'Običajno',
  'difficulty.name.hard': 'Težko',
  'difficulty.name.nightmare': 'Nočna mora',
  'difficulty.name.impossible': 'Nemogoče',
  'difficulty.desc.easy': 'Za začetnike',
  'difficulty.desc.normal': 'Standardna težavnost',
  'difficulty.desc.hard': 'Za izkušene igralce',
  'difficulty.desc.nightmare': 'Za prave mojstre',
  'difficulty.desc.impossible': 'Nemogoče - samo za norce',

  // ── Game over (rogue-lite run) ──
  'gameover.title': 'PRAZNINA ZMAGA',
  'gameover.subtitle': 'Tvoja pot se je končala v praznini',
  'gameover.newHighScore': '★ NOV NAJBOLJŠI REZULTAT ★',
  'gameover.statScore': 'Končni rezultat',
  'gameover.statLevel': 'Nivo igralca',
  'gameover.statWave': 'Val dosežen',
  'gameover.statKills': 'Sovražniki ubiti',
  'gameover.statDamage': 'Skupna škoda',
  'gameover.statTime': 'Čas preživetja',
  'gameover.statCombo': 'Največji combo',
  'gameover.statAccuracy': 'Natančnost',
  'gameover.statGraze': 'Odmiki',
  'gameover.statRecord': 'Osebni rekord',
  'gameover.shareSeed': 'Deli ta seed s prijatelji za izziv!',
  'gameover.retry': 'POSKUSI ZNOVA',

  // ── Mobile controls ──
  'mobile.dragHint1': 'povleci za let',
  'mobile.dragHint2': '🔥 strelja samodejno',
  'mobile.fireAriaAuto': 'Samodejno streljanje vklopljeno — tapni za ročno streljanje',
  'mobile.fireAriaManual': 'Ročno streljanje — drži za strel, tapni za samodejno',
  'mobile.badgeAuto': 'AVTO',
  'mobile.badgeManual': 'STREL',
  'mobile.bomb': 'Bomba',
  'mobile.waveTop': 'Valovni top',
  'mobile.gradius': 'Gradius kapsula',
  'mobile.special': 'Posebno orožje',

  // ── Classic arcade mode (React screens) ──
  'arcade.exit': '✕ IZHOD',
  'arcade.exitAria': 'Zapri arkadni način',
  'arcade.title': 'ARKADNI NAČIN',
  'arcade.desc': 'Klasični arkadni vertical shooter — življenja, stopnje, bossi',
  'arcade.highScores': '★ NAJBOLJŠI REZULTATI ★',
  'arcade.hintMove': 'WASD/Puščice = Premikanje',
  'arcade.hintShoot': 'Miška/Space = Streljanje',
  'arcade.hintBomb': 'B = Bomba',
  'arcade.hintPause': 'ESC = Pavza',
  'arcade.paused': 'PAVZA',
  'arcade.escHint': 'Pritisni ESC za nadaljevanje',
  'arcade.newRecord': '★ NOV REKORD ★',
  'arcade.rankLine': '{rank}. MESTO MED NAJBOLJŠIMI',
  'arcade.letterNextAria': 'Črka {n} naprej',
  'arcade.letterPrevAria': 'Črka {n} nazaj',
  'arcade.next': 'NAPREJ ▶',
  'arcade.enter': 'VPISI ▶',
  'arcade.typeHint': 'Tipkaj črke (A–Z) ali uporabi puščice • ENTER = vpis',
  'arcade.gameOver': 'KONEC IGRE',
  'arcade.enteredAt': 'Rezultat vpisan na {rank}. mesto',
  'arcade.tableName': 'IME',
  'arcade.tableScore': 'REZULTAT',
  'arcade.playAgain': 'IGRAJ ZNOVA',
  'arcade.finalScore': 'Končni rezultat: {score}',
  'arcade.stageReached': 'Dosežena stopnja: {stage}',
  'arcade.bestScore': 'Najboljši rezultat: {score} ({initials})',
  'arcade.stageClear': 'STOPNJA JASENA!',
  'arcade.scoreLine': 'Rezultat: {score}',
  'arcade.nextPrep': 'Priprava na naslednji stage...',

  // ── Classic arcade HUD (canvas) ──
  'classicHud.score': 'REZULTAT',
  'classicHud.lives': 'ŽIVLJENJA',
  'classicHud.stage': 'STOPNJA',
  'classicHud.wave': 'VAL',
  'classicHud.weapon': 'OROŽJE',
  'classicHud.armor': 'OKLEP',
  'classicHud.bombs': 'BOMBE',

  // ── Main engine canvas strings ──
  'hud.bomb': 'BOMBA',
  'hud.bombKey': 'BOMBA [X]',
  'hud.sectorClear': 'SEKTOR JASEN',
  'hud.warning': '\u26A0 POZOR! \u26A0',
  'hud.bigEnemyApproaching': 'VELIKI SOVRAŽNIK SE HITRO BLIŽA',
  'hud.midBoss': '\u26A0 MID BOSS — PREDSTRAŽA-{letter}',
  'hud.midBossSub': 'predstraža blokira pot',
  'hud.vanguardBroken': '\u26A0 PREBITA PREDSTRAŽA',
  'hud.vanguardRetreat': 'PREDSTRAŽA ODHAJA',
  'hud.shieldHit': 'ŠČIT!',
  'hud.weaponUp': 'OROŽJE +1!',
  'hud.sectorClearN': 'SEKTOR {n} JASEN',
  'tally.noHits': 'BREZ ZADETKOV',
  'tally.medals': 'MEDALJE ×{n}',
  'tally.total': 'SKUPAJ',
  'hud.waveClear': 'VAL JASEN +{bonus}',
  'hud.noHitsBonus': 'BREZ ZADETKOV +{bonus}',
  'hud.waveDetected': 'Zaznanih sovražnikov: {count}',
  'hud.waveLabel': 'Val',
  'hud.waveBoss': '⚠️ Boss Val',
  'hud.waveN': 'VAL {n}',
  'hud.levelUpN': 'NIVO {n}',
  'hud.levelUpSub': 'Izberi nadgradnjo!',
  'hud.ready': 'PRIPRAVLJENO',
  'app.challenges': '🎯 IZZIVI',
  'hud.shield': 'ŠČIT',
  'hud.time': 'ČAS',
  'hud.enemies': 'Sovražniki',
  'hud.primaryWeapon': 'Primarno orožje',
  'hud.secondaryWeapon': 'Sekundarno orožje',
  'hud.hintMouse': 'Miška',
  'hud.hintShoot': 'Streljanje',
  'hud.hintMove': 'Gibanje',
  'hud.hintDash': 'Dash',
  'hud.hintPause': 'Pavza',
  'hud.hintRightClick': 'Desni klik',
  'hud.hintSecondary': 'Sekundarno',
  'hud.hintControls': 'Kontrole',
  'title.subtitle': 'WebGPU vertikalni vesoljski strelec',
  'title.clickToStart': '[ KLIKNI ZA ZAČETEK ]',
  'title.controlsMove': 'WASD / puščice — premikanje',
  'title.controlsAim': 'Miška — ciljanje in streljanje',
  'title.controlsDash': 'Preslednica — dash (i-frames)',
  'title.controlsSecondary': 'Desni klik — sekundarno orožje',
  'title.controlsQ': 'Q — temporalna staza',
  'upgrade.title': 'IZBERI NADGRADNJO',
  'gameover2.top5': '— TOP 5 TEKI —',
  'gameover2.runLine': '{rank}. {score} · val {wave} · {seed} · {date}',
  'menu.webgpuActiveLong': '● WebGPU AKTIVEN — pospešeno na GPU',

  // ── App notifications ──
  'notify.skillLocked': 'Veščina še ni na voljo!',
  'notify.noSkillPoints': 'Nimaš dovolj skill točk!',
  'notify.itemOwned': 'Predmet je že last!',
  'notify.noFunds': 'Nimaš dovolj sredstev!',
  'notify.requiresLevel': 'Zahteva nivo {level}!',
  'notify.challengeDone': 'Izziv zaključen! Poglej nagrade.',
  'notify.rewardReceived': 'Prejel si {amount} {unit}!',
  'notify.rewardGems': 'draguljev',
  'notify.rewardSkillPoints': 'skill točk',
  'notify.rewardXp': 'XP za naslednjo igro',
  'notify.rewardGold': 'zlata',
  'notify.gameLoaded': 'Igra naložena!',
  'notify.guideDone': 'Vodnik končan!',
  'app.soundOn': 'Vklopi zvok',
  'app.soundOff': 'Utišaj zvok'
};

const enBase: Record<keyof typeof slBase, string> = {
  // ── Common ──
  'common.mainMenu': 'MAIN MENU',
  'common.save': 'SAVE',
  'common.cancel': 'CANCEL',
  'common.back': 'BACK',

  // ── Settings ──
  'settings.title': 'SETTINGS',
  'settings.language': 'LANGUAGE',
  'settings.music': 'MUSIC',
  'settings.sfx': 'SOUND EFFECTS',
  'settings.particles': 'PARTICLE QUALITY',
  'settings.particlesLow': 'LOW',
  'settings.particlesMedium': 'MEDIUM',
  'settings.particlesHigh': 'HIGH',
  'settings.showFps': 'SHOW FPS',
  'settings.bullets': 'BULLET VISIBILITY',
  'settings.bulletsDesc': 'Enemy fire made clearly visible (accessibility)',
  'settings.bulletsStandard': 'STANDARD',
  'settings.bulletsContrast': 'CONTRAST',
  'settings.bulletsMono': 'MONO',
  'settings.bulletsAriaStandard': 'Bullet visibility: Standard',
  'settings.bulletsAriaContrast': 'Bullet visibility: High contrast',
  'settings.bulletsAriaMono': 'Bullet visibility: Monochrome',
  'settings.autoAim': 'AUTO-AIM',
  'settings.autoAimDesc': 'Automatic aiming for mobile devices',
  'settings.mobileControls': '📱 MOBILE CONTROLS',
  'settings.dragSensitivity': 'DRAG SENSITIVITY',
  'settings.dragSensitivityDesc': 'How quickly the ship follows your finger',
  'settings.leftHanded': 'LEFT-HANDED MODE',
  'settings.leftHandedDesc': 'Buttons on the left, steering on the right',
  'settings.bigButtons': 'BIG BUTTONS',
  'settings.bigButtonsDesc': 'Larger touch targets for fingers',

  // ── Main menu ──
  'menu.start': 'START GAME',
  'menu.subtitle': 'WebGPU vertical space shooter',
  'menu.guide': '📖 GUIDE',
  'menu.settings': '⚙️ SETTINGS',
  'menu.saveLoad': '💾 SAVE/LOAD',
  'menu.stats': '📊 STATISTICS',
  'menu.arcade': '🎯 ARCADE GAME',
  'menu.dailyRewards': '🎁 DAILY REWARDS',
  'menu.shop': '🛍️ SHOP',
  'menu.difficulty': '⚔️ DIFFICULTY',
  'menu.meta': '🌳 META-PROGRESSION',
  'menu.interactiveGuide': '📚 INTERACTIVE GUIDE',
  'menu.classic': '🕹️ CLASSIC MODE',
  'menu.best': 'BEST:',
  'menu.webgpuActive': '● WebGPU ACTIVE',
  'menu.canvasMode': '● Canvas2D MODE',
  'menu.controlsHint': 'WASD = Move | Mouse = Shoot | SPACE = Dash | ESC = Pause',

  // ── Pause ──
  'pause.title': 'PAUSED',
  'pause.resume': 'RESUME',
  'pause.restart': 'RESTART',
  'pause.escHint': 'Press ESC to resume',

  // ── Difficulty select ──
  'difficulty.title': '⚔️ CHOOSE DIFFICULTY',
  'difficulty.subtitle': 'Higher difficulty = bigger rewards',
  'difficulty.current': '✓ CURRENT',
  'difficulty.enemies': 'Enemies',
  'difficulty.player': 'Player',
  'difficulty.rewards': 'Rewards',
  'difficulty.hp': 'HP',
  'difficulty.damage': 'Damage',
  'difficulty.speed': 'Speed',
  'difficulty.gold': 'Gold',
  'difficulty.points': 'Points',
  'difficulty.locked': 'Locked difficulties:',
  'difficulty.unlockLevel': 'Unlocks at level {level}',
  'difficulty.name.easy': 'Easy',
  'difficulty.name.normal': 'Normal',
  'difficulty.name.hard': 'Hard',
  'difficulty.name.nightmare': 'Nightmare',
  'difficulty.name.impossible': 'Impossible',
  'difficulty.desc.easy': 'For beginners',
  'difficulty.desc.normal': 'Standard difficulty',
  'difficulty.desc.hard': 'For experienced players',
  'difficulty.desc.nightmare': 'For true masters',
  'difficulty.desc.impossible': "Impossible - only for the crazy",

  // ── Game over (rogue-lite run) ──
  'gameover.title': 'THE VOID WINS',
  'gameover.subtitle': 'Your journey ended in the void',
  'gameover.newHighScore': '★ NEW HIGH SCORE ★',
  'gameover.statScore': 'Final score',
  'gameover.statLevel': 'Player level',
  'gameover.statWave': 'Wave reached',
  'gameover.statKills': 'Enemies killed',
  'gameover.statDamage': 'Total damage',
  'gameover.statTime': 'Survival time',
  'gameover.statCombo': 'Max combo',
  'gameover.statAccuracy': 'Accuracy',
  'gameover.statGraze': 'Grazes',
  'gameover.statRecord': 'Personal best',
  'gameover.shareSeed': 'Share this seed with friends for a challenge!',
  'gameover.retry': 'TRY AGAIN',

  // ── Mobile controls ──
  'mobile.dragHint1': 'drag to fly',
  'mobile.dragHint2': '🔥 fires automatically',
  'mobile.fireAriaAuto': 'Auto-fire engaged — tap for manual fire',
  'mobile.fireAriaManual': 'Manual fire — hold to shoot, tap for auto',
  'mobile.badgeAuto': 'AUTO',
  'mobile.badgeManual': 'FIRE',
  'mobile.bomb': 'Bomb',
  'mobile.waveTop': 'Wave cannon',
  'mobile.gradius': 'Gradius capsule',
  'mobile.special': 'Special weapon',

  // ── Classic arcade mode (React screens) ──
  'arcade.exit': '✕ EXIT',
  'arcade.exitAria': 'Close arcade mode',
  'arcade.title': 'ARCADE MODE',
  'arcade.desc': 'Classic arcade vertical shooter — lives, stages, bosses',
  'arcade.highScores': '★ HIGH SCORES ★',
  'arcade.hintMove': 'WASD/Arrows = Move',
  'arcade.hintShoot': 'Mouse/Space = Shoot',
  'arcade.hintBomb': 'B = Bomb',
  'arcade.hintPause': 'ESC = Pause',
  'arcade.paused': 'PAUSED',
  'arcade.escHint': 'Press ESC to resume',
  'arcade.newRecord': '★ NEW RECORD ★',
  'arcade.rankLine': 'RANK {rank} OF THE BEST',
  'arcade.letterNextAria': 'Letter {n} next',
  'arcade.letterPrevAria': 'Letter {n} back',
  'arcade.next': 'NEXT ▶',
  'arcade.enter': 'ENTER ▶',
  'arcade.typeHint': 'Type letters (A–Z) or use arrows • ENTER = confirm',
  'arcade.gameOver': 'GAME OVER',
  'arcade.enteredAt': 'Score entered at rank {rank}',
  'arcade.tableName': 'NAME',
  'arcade.tableScore': 'SCORE',
  'arcade.playAgain': 'PLAY AGAIN',
  'arcade.finalScore': 'Final score: {score}',
  'arcade.stageReached': 'Stage reached: {stage}',
  'arcade.bestScore': 'Best score: {score} ({initials})',
  'arcade.stageClear': 'STAGE CLEAR!',
  'arcade.scoreLine': 'Score: {score}',
  'arcade.nextPrep': 'Preparing for the next stage...',

  // ── Classic arcade HUD (canvas) ──
  'classicHud.score': 'SCORE',
  'classicHud.lives': 'LIVES',
  'classicHud.stage': 'STAGE',
  'classicHud.wave': 'WAVE',
  'classicHud.weapon': 'WEAPON',
  'classicHud.armor': 'ARMOR',
  'classicHud.bombs': 'BOMBS',

  // ── Main engine canvas strings ──
  'hud.bomb': 'BOMB',
  'hud.bombKey': 'BOMB [X]',
  'hud.sectorClear': 'SECTOR CLEAR',
  'hud.warning': '\u26A0 WARNING! \u26A0',
  'hud.bigEnemyApproaching': 'LARGE ENEMY APPROACHING FAST',
  'hud.midBoss': '\u26A0 MID BOSS — VANGUARD-{letter}',
  'hud.midBossSub': 'the vanguard blocks the path',
  'hud.vanguardBroken': '\u26A0 VANGUARD BROKEN',
  'hud.vanguardRetreat': 'VANGUARD RETREATING',
  'hud.shieldHit': 'SHIELD!',
  'hud.weaponUp': 'WEAPON +1!',
  'hud.sectorClearN': 'SECTOR {n} CLEAR',
  'tally.noHits': 'NO HITS TAKEN',
  'tally.medals': 'MEDALS ×{n}',
  'tally.total': 'TOTAL',
  'hud.waveClear': 'WAVE CLEAR +{bonus}',
  'hud.noHitsBonus': 'NO HITS +{bonus}',
  'hud.waveDetected': 'Enemies detected: {count}',
  'hud.waveLabel': 'Wave',
  'hud.waveBoss': '⚠️ Boss Wave',
  'hud.waveN': 'WAVE {n}',
  'hud.levelUpN': 'LEVEL {n}',
  'hud.levelUpSub': 'Choose an upgrade!',
  'hud.ready': 'READY',
  'app.challenges': '🎯 CHALLENGES',
  'hud.shield': 'SHIELD',
  'hud.time': 'TIME',
  'hud.enemies': 'Enemies',
  'hud.primaryWeapon': 'Primary weapon',
  'hud.secondaryWeapon': 'Secondary weapon',
  'hud.hintMouse': 'Mouse',
  'hud.hintShoot': 'Shoot',
  'hud.hintMove': 'Move',
  'hud.hintDash': 'Dash',
  'hud.hintPause': 'Pause',
  'hud.hintRightClick': 'Right click',
  'hud.hintSecondary': 'Secondary',
  'hud.hintControls': 'Controls',
  'title.subtitle': 'WebGPU vertical space shooter',
  'title.clickToStart': '[ CLICK TO START ]',
  'title.controlsMove': 'WASD / arrows — move',
  'title.controlsAim': 'Mouse — aim and shoot',
  'title.controlsDash': 'Space — dash (i-frames)',
  'title.controlsSecondary': 'Right click — secondary weapon',
  'title.controlsQ': 'Q — temporal rift',
  'upgrade.title': 'CHOOSE UPGRADE',
  'gameover2.top5': '— TOP 5 RUNS —',
  'gameover2.runLine': '{rank}. {score} · wave {wave} · {seed} · {date}',
  'menu.webgpuActiveLong': '● WebGPU ACTIVE — GPU accelerated',

  // ── App notifications ──
  'notify.skillLocked': 'Skill not yet available!',
  'notify.noSkillPoints': 'Not enough skill points!',
  'notify.itemOwned': 'Item already owned!',
  'notify.noFunds': 'Not enough funds!',
  'notify.requiresLevel': 'Requires level {level}!',
  'notify.challengeDone': 'Challenge complete! Check rewards.',
  'notify.rewardReceived': 'You received {amount} {unit}!',
  'notify.rewardGems': 'gems',
  'notify.rewardSkillPoints': 'skill points',
  'notify.rewardXp': 'XP for the next game',
  'notify.rewardGold': 'gold',
  'notify.gameLoaded': 'Game loaded!',
  'notify.guideDone': 'Guide complete!',
  'app.soundOn': 'Unmute sound',
  'app.soundOff': 'Mute sound'
};

/** Merged dictionaries — core (slBase/enBase) + Faza 2 modules (meta, progress, world, help). */
const sl = {
  ...slBase,
  ...metaDict.sl,
  ...progressDict.sl,
  ...worldDict.sl,
  ...helpDict.sl,
  ...engineDict.sl,
};

const en: Record<keyof typeof sl, string> = {
  ...enBase,
  ...metaDict.en,
  ...progressDict.en,
  ...worldDict.en,
  ...helpDict.en,
  ...engineDict.en,
};

type Dict = typeof sl;

export function t(key: keyof Dict | string, vars?: Record<string, string | number>): string {
  const dict = current === 'sl' ? sl : en;
  const other = current === 'sl' ? en : sl;
  let text = (dict as Record<string, string>)[key] ?? (other as Record<string, string>)[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
    }
  }
  return text;
}

/** React hook — subscribes the component to language changes. */
export function useLang(): Language {
  return useSyncExternalStore(subscribeLang, getLanguage, getLanguage);
}
