import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, GameStats } from './game/engine';
import {
  LoadingScreen,
  MainMenu,
  PauseMenu,
  GameOverScreen,
  LevelUpScreen,
  LevelUpChoiceScreen,
  SettingsMenu,
  TutorialOverlay,
  Notification,
  AchievementNotification,
  MobileControls,
  HealthBar,
  ScoreDisplay,
  WeaponIndicator,
  MiniMap,
  KeyboardHints,
  Crosshair,
  DamageFlash,
  WaveInfo,
  ComboDisplay,
  GameTimer,
  LevelDisplay,
  LevelInfo,
  SkillTreeUI,
  DailyChallengesUI,
  SaveLoadUI,
  StatsLeaderboardUI,
  ArcadeGame,
  DailyRewardsUI,
  ShopUI,
  DifficultySelectUI,
  AchievementPanel,
  MetaProgressionUI,
  BloomEffect,
  ParticleOverlay,
  ChromaticAberration,
  InteractiveTutorial,
  WeatherDisplay,
  ActivePowerUpsDisplay,
  ClassicArcadeMode
} from './components';
import {
  loadGame,
  saveGame,
  createDefaultSaveData,
  updateSaveWithGameStats,
  updateSaveWithSkillTree,
  loadSkillTreeFromSave,
  SaveData
} from './game/saveSystem';
import { getLevelForPlayer } from './game/levels';
import {
  findSkill,
  getSkillCost,
  canUnlockSkill,
  computeSkillBonuses,
  SkillTree
} from './game/skillTree';
import { DIFFICULTY_MODES, DifficultyMode } from './game/difficulty';
import type { WeatherType } from './game/weatherSystem';
import { ALL_ACHIEVEMENTS, checkAchievements, Achievement } from './game/achievements';
import { CosmeticItem, canAffordCosmetic } from './game/cosmetics';
import { updateGameStats, addToLeaderboard } from './game/statsSystem';

type GameState = 'loading' | 'menu' | 'playing' | 'paused' | 'levelup' | 'levelchoice' | 'gameover';

interface Settings {
  musicVolume: number;
  sfxVolume: number;
  showFPS: boolean;
  particles: 'low' | 'medium' | 'high';
}

// Keys the game consumes - preventDefault is applied ONLY to these while
// playing, so browser shortcuts (F5, Tab, Ctrl+R, ...) keep working.
const GAME_KEYS = new Set([
  'w', 'a', 's', 'd', 'q',
  'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
  ' ', 'escape'
]);

const emptyStats: GameStats = {
  score: 0, wave: 1, enemiesKilled: 0, bossKills: 0,
  totalDamage: 0, survivalTime: 0, maxCombo: 1, combo: 1,
  enemiesRemaining: 0, totalWaveEnemies: 0,
  isBossWave: false, bossPresent: false,
  gold: 0, fps: 60, seed: '', gameStartTime: 0,
  shotsFired: 0, hitsLanded: 0, damageTaken: 0, itemsCollected: 0,
  webgpuSupported: false, playerLevel: 1, playerXp: 0, xpToNext: 100
};

// Module-level loaders keep impure reads (localStorage, Date) out of render.
function loadInitialSave(): SaveData {
  let data = loadGame();
  if (!data) {
    data = createDefaultSaveData();
    saveGame(data);
  }
  return data;
}

function getTodayChallenges(data: SaveData): string[] {
  const today = new Date().toISOString().slice(0, 10);
  return data.completedChallenges[today] ?? [];
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webgpuCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const saveDataRef = useRef<SaveData | null>(null);

  const [gameState, setGameState] = useState<GameState>('loading');
  // Lazy initializers: the save file is read exactly once, synchronously
  const [saveData, setSaveData] = useState<SaveData>(loadInitialSave);
  const [settings, setSettings] = useState<Settings>(() => ({ ...saveData.settings }));
  const [webgpuSupported, setWebgpuSupported] = useState(false);
  const [stats, setStats] = useState<GameStats>(emptyStats);
  const [player, setPlayer] = useState({
    hp: 100, maxHp: 100,
    shield: 50, maxShield: 50,
    energy: 100, maxEnergy: 100,
    combo: 1,
    weaponLevel: 1,
    secondaryWeapon: 'none' as 'none' | 'gravity' | 'chain' | 'temporal',
    secondaryCooldown: 0,
    dashCooldown: 0
  });
  const [minimap, setMinimap] = useState({
    playerX: 0, playerY: 0,
    enemies: [] as Array<{ x: number; y: number; type: string }>,
    worldWidth: 0, worldHeight: 0
  });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isShooting, setIsShooting] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: number; message: string; type: 'success' | 'warning' | 'error' | 'info' }>>([]);
  const [levelChoices, setLevelChoices] = useState<Array<{ name: string; description: string; icon: string }>>([]);

  // Overlay menus
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [showDailyChallenges, setShowDailyChallenges] = useState(false);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [showStatsLeaderboard, setShowStatsLeaderboard] = useState(false);
  const [showArcadeGame, setShowArcadeGame] = useState(false);
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showDifficultySelect, setShowDifficultySelect] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showMetaProgression, setShowMetaProgression] = useState(false);
  const [showInteractiveTutorial, setShowInteractiveTutorial] = useState(false);
  // Klasiki arkadni način (merged from webgpu-online-games-51d72)
  const [showClassicArcade, setShowClassicArcade] = useState(false);
  // Weather state (synced from engine at ~1 Hz via the throttled UI loop)
  const [currentWeather, setCurrentWeather] = useState<{ type: WeatherType; intensity: number; timeRemaining: number }>({
    type: 'clear',
    intensity: 1.0,
    timeRemaining: -1
  });
  // Power-up manager snapshot in state (refs must not be read during render)
  const [powerUpManager, setPowerUpManager] = useState<ReturnType<GameEngine['getPowerUpManager']> | null>(null);

  // Persistent meta derived from saveData (initialized lazily from the save)
  const [skillPoints, setSkillPoints] = useState(() => saveData.skillPoints);
  const [skillTree, setSkillTree] = useState<SkillTree>(() => loadSkillTreeFromSave(saveData));
  const [completedChallenges, setCompletedChallenges] = useState<string[]>(() => getTodayChallenges(saveData));
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  // Snapshot of final stats for the game-over screen
  const [finalStats, setFinalStats] = useState<GameStats | null>(null);
  const lastHpRef = useRef(100);
  const flashTimerRef = useRef<number | null>(null);

  const addNotification = useCallback((message: string, type: 'success' | 'warning' | 'error' | 'info') => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev.slice(-4), { id, message, type }]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // ============= SAVE DATA =============
  const persistSave = useCallback((updater: (data: SaveData) => SaveData) => {
    const current = saveDataRef.current;
    if (!current) return;
    const updated = updater(current);
    saveDataRef.current = updated;
    setSaveData(updated);
    saveGame(updated);
  }, []);

  // Sync the ref mirror + engine high-score key once on mount (no setState)
  useEffect(() => {
    saveDataRef.current = saveData;
    try {
      localStorage.setItem('atheria_highscore', String(saveData.player.highScore));
    } catch { /* ignore */ }
    // Runs exactly once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============= ENGINE LIFECYCLE =============
  const handleStateChange = useCallback((state: string) => {
    const engine = engineRef.current;
    setGameState(state as GameState);

    if (!engine) return;

    // Snapshot level-up choices for the React screens
    if (state === 'levelup' || state === 'levelchoice') {
      setLevelChoices(engine.getLevelChoices().map(u => ({
        name: u.name, description: u.description, icon: u.icon
      })));
      // Award a skill point for every XP level-up
      if (state === 'levelchoice') {
        setSkillPoints(prev => {
          const next = prev + 1;
          persistSave(data => ({ ...data, skillPoints: next }));
          return next;
        });
      }
    }

    // Game over: persist run statistics, gold, high score and check achievements
    if (state === 'gameover') {
      const runStats = engine.getGameStats();
      setFinalStats(runStats);

      // Aggregated lifetime statistics + leaderboard (statsSystem localStorage)
      updateGameStats({
        score: runStats.score,
        playTime: runStats.survivalTime,
        enemiesKilled: runStats.enemiesKilled,
        bossKills: runStats.bossKills,
        wave: runStats.wave,
        level: runStats.playerLevel,
        maxCombo: runStats.maxCombo,
        damageDealt: runStats.totalDamage,
        damageTaken: runStats.damageTaken,
        itemsCollected: runStats.itemsCollected
      });
      addToLeaderboard({
        name: 'Ti',
        score: runStats.score,
        wave: runStats.wave,
        level: runStats.playerLevel,
        date: new Date().toISOString().split('T')[0]
      });

      persistSave(data => {
        let updated = updateSaveWithGameStats(data, {
          score: runStats.score,
          playTime: runStats.survivalTime,
          enemiesKilled: runStats.enemiesKilled,
          bossKills: runStats.bossKills,
          wave: runStats.wave,
          level: runStats.playerLevel,
          maxCombo: runStats.maxCombo
        });
        // Gold earned during the run is added to the wallet
        updated = {
          ...updated,
          currency: { ...updated.currency, gold: updated.currency.gold + runStats.gold }
        };
        return updated;
      });

      // Achievement evaluation
      const unlocked = new Set(saveDataRef.current?.achievements ?? []);
      const newlyUnlocked = checkAchievements({
        level: runStats.playerLevel,
        totalXp: 0,
        enemiesKilled: runStats.enemiesKilled,
        bossKills: runStats.bossKills,
        maxCombo: runStats.maxCombo,
        wavesCompleted: runStats.wave,
        totalDamage: runStats.totalDamage,
        survivalTime: runStats.survivalTime,
        highestWave: Math.max(saveDataRef.current?.player.highestWave ?? 0, runStats.wave)
      }, unlocked);

      if (newlyUnlocked.length > 0) {
        persistSave(data => ({
          ...data,
          achievements: [...data.achievements, ...newlyUnlocked.map(a => a.id)]
        }));
        setNewAchievements(newlyUnlocked);
      }
    }
  }, [persistSave]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = webgpuCanvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, overlay, handleStateChange);
    engineRef.current = engine;
    // Expose the advanced-system manager via state for render-time use
    setPowerUpManager(engine.getPowerUpManager());

    const resize = () => {
      engine.resize(window.innerWidth, window.innerHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    engine.startLoop();
    engine.start();

    const isGameKey = (key: string) => GAME_KEYS.has(key.toLowerCase());

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameKey(e.key)) e.preventDefault();
      engine.handleKeyDown(e.key);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (isGameKey(e.key)) e.preventDefault();
      engine.handleKeyUp(e.key);
    };
    const handleMouseMove = (e: MouseEvent) => {
      engine.handleMouseMove(e.clientX, e.clientY);
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    const handleMouseDown = (e: MouseEvent) => {
      engine.handleMouseDown(e.button);
      if (e.button === 0) setIsShooting(true);
    };
    const handleMouseUp = (e: MouseEvent) => {
      engine.handleMouseUp(e.button);
      if (e.button === 0) setIsShooting(false);
    };
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
    };
    const handleBeforeUnload = () => {
      engine.setMobileMove(0, 0);
      engine.setMobileShooting(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      engine.destroy();
    };
  }, [handleStateChange]);

  // ============= THROTTLED UI SYNC =============
  // Instead of calling setState 60x/second, sample the engine at ~10 Hz and
  // only update React when something actually changed.
  useEffect(() => {
    let lastSync = 0;
    let rafId = 0;
    let prevFingerprint = '';

    const loop = (t: number) => {
      rafId = requestAnimationFrame(loop);
      if (t - lastSync < 100) return;
      lastSync = t;

      const engine = engineRef.current;
      if (!engine) return;

      const state = engine.getState();
      const gs = engine.getGameStats();
      const p = engine.getPlayer();

      // Weather snapshot (engine is the source of truth)
      const weatherSys = engine.getWeatherSystem();
      const weatherInfo = {
        type: weatherSys.getCurrentWeather(),
        intensity: weatherSys.getWeatherIntensity(),
        timeRemaining: weatherSys.getWeatherTimeRemaining()
      };

      // Damage flash detection (real HP drops only)
      if (p.hp < lastHpRef.current - 0.5) {
        setDamageFlash(true);
        if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
        flashTimerRef.current = window.setTimeout(() => setDamageFlash(false), 350);
      }
      lastHpRef.current = p.hp;

      const fingerprint = [
        state, gs.score, gs.wave, gs.enemiesRemaining, gs.fps, gs.gold,
        gs.playerLevel, Math.round(gs.playerXp), p.hp.toFixed(0), p.shield.toFixed(0),
        p.energy.toFixed(0), p.combo, p.weaponLevel, p.secondaryWeapon,
        p.secondaryCooldown.toFixed(1), p.dashCooldown.toFixed(1),
        p.x.toFixed(0), p.y.toFixed(0), p.maxHp, p.maxShield, p.maxEnergy,
        engine.isWebGPUSupported(), gs.gameStartTime,
        // Weather rarely changes - included so the UI updates only on change
        weatherInfo.type, weatherInfo.intensity.toFixed(1), Math.ceil(weatherInfo.timeRemaining)
      ].join('|');

      if (fingerprint === prevFingerprint) return;
      prevFingerprint = fingerprint;

      setCurrentWeather(weatherInfo);
      setStats(gs);
      setPlayer({
        hp: p.hp, maxHp: p.maxHp,
        shield: p.shield, maxShield: p.maxShield,
        energy: p.energy, maxEnergy: p.maxEnergy,
        combo: p.combo,
        weaponLevel: p.weaponLevel,
        secondaryWeapon: p.secondaryWeapon,
        secondaryCooldown: p.secondaryCooldown,
        dashCooldown: p.dashCooldown
      });
      setMinimap(engine.getMinimapData());
      setWebgpuSupported(engine.isWebGPUSupported());
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ============= GAME FLOW (engine is the source of truth) =============
  const handleStartGame = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const data = saveDataRef.current;
    if (data) {
      // Apply persistent bonuses, difficulty and starting XP
      engine.setSkillBonuses(computeSkillBonuses(skillTree));
      engine.setDifficulty(DIFFICULTY_MODES.find(m => m.id === data.difficulty) ?? null);
      engine.setStartingXp(data.currency.xp);
      // Consume the pending XP reward
      if (data.currency.xp > 0) {
        persistSave(d => ({ ...d, currency: { ...d.currency, xp: 0 } }));
      }
    }
    engine.restart();
  }, [skillTree, persistSave]);

  const handleResume = useCallback(() => engineRef.current?.resume(), []);
  const handleRestart = useCallback(() => engineRef.current?.restart(), []);
  const handleMainMenu = useCallback(() => engineRef.current?.goToMenu(), []);

  const handleChooseUpgrade = useCallback((index: number) => {
    engineRef.current?.chooseUpgrade(index);
  }, []);

  // ============= SKILL TREE (persistent, no module mutation) =============
  const handleUnlockSkill = useCallback((skillId: string) => {
    const skill = findSkill(skillId, skillTree);
    if (!skill) return;
    if (!canUnlockSkill(skill, skillTree)) {
      addNotification('Veščina še ni na voljo!', 'warning');
      return;
    }
    const cost = getSkillCost(skill);
    if (skillPoints < cost) {
      addNotification('Nimaš dovolj skill točk!', 'error');
      return;
    }

    // Immutable clone with the unlocked level applied
    const updatedTree: SkillTree = {
      offense: skillTree.offense.map(s =>
        s.id === skillId ? { ...s, currentLevel: s.currentLevel + 1 } : s),
      defense: skillTree.defense.map(s =>
        s.id === skillId ? { ...s, currentLevel: s.currentLevel + 1 } : s),
      utility: skillTree.utility.map(s =>
        s.id === skillId ? { ...s, currentLevel: s.currentLevel + 1 } : s)
    };

    setSkillTree(updatedTree);
    setSkillPoints(prev => {
      const next = prev - cost;
      persistSave(data => updateSaveWithSkillTree({ ...data, skillPoints: next }, updatedTree));
      return next;
    });
    addNotification(`Odklenjeno: ${skill.name} (Level ${skill.currentLevel + 1})`, 'success');
  }, [skillTree, skillPoints, persistSave, addNotification]);

  // ============= SHOP (validated + persistent) =============
  const handleBuyCosmetic = useCallback((item: CosmeticItem) => {
    const data = saveDataRef.current;
    if (!data) return;
    if (data.cosmetics.unlocked.includes(item.id)) {
      addNotification('Predmet je že last!', 'warning');
      return;
    }
    const playerLevel = data.player.highestLevel;
    if (item.unlockLevel > playerLevel) {
      addNotification(`Zahteva nivo ${item.unlockLevel}!`, 'error');
      return;
    }
    if (!canAffordCosmetic(item, data.currency.gold, data.currency.gems)) {
      addNotification('Nimaš dovolj sredstev!', 'error');
      return;
    }

    persistSave(d => ({
      ...d,
      currency: {
        ...d.currency,
        gold: item.currency === 'gold' ? d.currency.gold - item.price : d.currency.gold,
        gems: item.currency === 'gems' ? d.currency.gems - item.price : d.currency.gems
      },
      cosmetics: {
        ...d.cosmetics,
        unlocked: [...d.cosmetics.unlocked, item.id]
      }
    }));
    addNotification(`Kupil si ${item.name}!`, 'success');
  }, [persistSave, addNotification]);

  const handleEquipCosmetic = useCallback((item: CosmeticItem) => {
    persistSave(d => ({
      ...d,
      cosmetics: {
        ...d.cosmetics,
        equipped: { ...d.cosmetics.equipped, [item.type]: item.id }
      }
    }));
    addNotification(`Opremil si ${item.name}!`, 'success');
  }, [persistSave, addNotification]);

  // ============= DAILY CHALLENGES (persistent per date) =============
  const handleCompleteChallenge = useCallback((challengeId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    if (completedChallenges.includes(challengeId)) return;
    setCompletedChallenges(prev => [...prev, challengeId]);
    persistSave(d => ({
      ...d,
      completedChallenges: {
        ...d.completedChallenges,
        [today]: [...(d.completedChallenges[today] ?? []), challengeId]
      }
    }));
    addNotification('Izziv zaključen! Poglej nagrade.', 'success');
  }, [completedChallenges, persistSave, addNotification]);

  // ============= DAILY REWARDS (applied to wallet) =============
  const handleClaimReward = useCallback((reward: { reward: string; amount: number }) => {
    persistSave(d => {
      switch (reward.reward) {
        case 'gold':
          return { ...d, currency: { ...d.currency, gold: d.currency.gold + reward.amount } };
        case 'gem':
          return { ...d, currency: { ...d.currency, gems: d.currency.gems + reward.amount } };
        case 'skillPoint':
          return { ...d, skillPoints: d.skillPoints + reward.amount };
        case 'xp':
          return { ...d, currency: { ...d.currency, xp: d.currency.xp + reward.amount } };
        default:
          return d;
      }
    });
    if (reward.reward === 'skillPoint') {
      setSkillPoints(prev => prev + reward.amount);
    }
    addNotification(`Prejel si ${reward.amount} ${reward.reward === 'gem' ? 'draguljev' : reward.reward === 'skillPoint' ? 'skill točk' : reward.reward === 'xp' ? 'XP za naslednjo igro' : 'zlata'}!`, 'success');
  }, [persistSave, addNotification]);

  // ============= DIFFICULTY (persistent + unlock check) =============
  const handleSelectDifficulty = useCallback((difficulty: DifficultyMode) => {
    const highestLevel = saveDataRef.current?.player.highestLevel ?? 1;
    if (difficulty.unlockLevel > highestLevel) {
      addNotification(`Zaklenjeno! Doseži nivo ${difficulty.unlockLevel}.`, 'error');
      return;
    }
    engineRef.current?.setDifficulty(difficulty);
    persistSave(d => ({ ...d, difficulty: difficulty.id }));
    addNotification(`Težavnost nastavljena na: ${difficulty.name}`, 'info');
    setShowDifficultySelect(false);
  }, [persistSave, addNotification]);

  // ============= SETTINGS (persistent + applied to engine) =============
  const handleSettingsChange = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    engineRef.current?.applySettings(newSettings);
    persistSave(d => ({ ...d, settings: { ...d.settings, ...newSettings } }));
  }, [persistSave]);

  const handleSaveGame = useCallback(() => {
    if (saveDataRef.current) {
      saveGame(saveDataRef.current);
      addNotification('Igra shranjena!', 'success');
    }
  }, [addNotification]);

  const handleLoadGame = useCallback(() => {
    const loaded = loadGame();
    if (loaded) {
      saveDataRef.current = loaded;
      setSaveData(loaded);
      setSkillPoints(loaded.skillPoints);
      setSkillTree(loadSkillTreeFromSave(loaded));
      const today = new Date().toISOString().slice(0, 10);
      setCompletedChallenges(loaded.completedChallenges[today] ?? []);
      addNotification('Igra naložena!', 'success');
    }
  }, [addNotification]);

  const currentDifficulty = DIFFICULTY_MODES.find(m => m.id === saveData?.difficulty) ?? null;
  const allAchievements = ALL_ACHIEVEMENTS;
  const unlockedAchievementIds = new Set(saveData?.achievements ?? []);

  // Rarity labels for the level-choice screen (cosmetic only)
  const rarities: Array<'common' | 'rare' | 'epic'> = ['rare', 'common', 'epic'];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Main 2D canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none', cursor: gameState === 'playing' ? 'none' : 'default' }}
      />

      {/* Dedicated WebGPU overlay canvas for GPU-accelerated particles.
          A canvas can host only ONE context type, so particles get their own. */}
      <canvas
        ref={webgpuCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ touchAction: 'none' }}
      />

      {/* Loading Screen */}
      {gameState === 'loading' && (
        <LoadingScreen onComplete={() => setGameState('menu')} />
      )}

      {/* Main Menu */}
      {gameState === 'menu' && (
        <MainMenu
          onStartGame={handleStartGame}
          onShowTutorial={() => setShowTutorial(true)}
          onShowSettings={() => setShowSettings(true)}
          onShowSaveLoad={() => setShowSaveLoad(true)}
          onShowStats={() => setShowStatsLeaderboard(true)}
          onShowArcade={() => setShowArcadeGame(true)}
          onShowDailyRewards={() => setShowDailyRewards(true)}
          onShowShop={() => setShowShop(true)}
          onShowDifficulty={() => setShowDifficultySelect(true)}
          onShowMetaProgression={() => setShowMetaProgression(true)}
          onShowInteractiveTutorial={() => setShowInteractiveTutorial(true)}
          onShowClassicArcade={() => setShowClassicArcade(true)}
          highScore={saveData?.player.highScore ?? 0}
          webgpuSupported={webgpuSupported}
        />
      )}

      {/* Klasiki arkadni način — fullscreen overlay nad glavno igro */}
      {showClassicArcade && (
        <ClassicArcadeMode onExit={() => setShowClassicArcade(false)} />
      )}

      {/* In-Game UI (fed with REAL engine data) */}
      {gameState === 'playing' && (
        <>
          <LevelDisplay
            level={stats.playerLevel}
            xp={stats.playerXp}
            xpToNext={stats.xpToNext}
          />

          <LevelInfo
            level={getLevelForPlayer(stats.playerLevel)}
            playerLevel={stats.playerLevel}
          />

          <HealthBar
            hp={player.hp}
            maxHp={player.maxHp}
            shield={player.shield}
            maxShield={player.maxShield}
            energy={player.energy}
            maxEnergy={player.maxEnergy}
          />

          <ScoreDisplay
            score={stats.score}
            wave={stats.wave}
            combo={stats.combo}
            fps={stats.fps}
            seed={stats.seed}
            webgpuSupported={stats.webgpuSupported}
          />

          <WeaponIndicator
            weaponLevel={player.weaponLevel}
            secondaryWeapon={player.secondaryWeapon}
            secondaryCooldown={player.secondaryCooldown}
            dashCooldown={player.dashCooldown}
          />

          <MiniMap
            playerX={minimap.playerX}
            playerY={minimap.playerY}
            enemies={minimap.enemies}
            worldWidth={minimap.worldWidth || window.innerWidth}
            worldHeight={minimap.worldHeight || window.innerHeight}
          />

          <Crosshair
            x={mousePos.x}
            y={mousePos.y}
            isActive={isShooting}
          />

          <KeyboardHints />

          <DamageFlash
            isActive={damageFlash}
            intensity={0.5}
          />

          <WaveInfo
            wave={stats.wave}
            enemiesRemaining={stats.enemiesRemaining}
            totalEnemies={Math.max(stats.totalWaveEnemies, stats.enemiesRemaining)}
            isBossWave={stats.isBossWave}
          />

          {/* Meta buttons */}
          <div className="fixed top-4 right-4 z-40 flex gap-2">
            <button
              onClick={() => setShowSkillTree(true)}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-mono text-sm rounded transition-all hover:scale-110"
              style={{ boxShadow: '0 0 15px rgba(168, 85, 247, 0.5)' }}
            >
              🌳 SKILLS ({skillPoints})
            </button>
            <button
              onClick={() => setShowDailyChallenges(true)}
              className="px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white font-mono text-sm rounded transition-all hover:scale-110"
              style={{ boxShadow: '0 0 15px rgba(236, 72, 153, 0.5)' }}
            >
              🎯 IZZIVI
            </button>
            <button
              onClick={() => setShowAchievements(true)}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-mono text-sm rounded transition-all hover:scale-110"
              style={{ boxShadow: '0 0 15px rgba(245, 158, 11, 0.5)' }}
            >
              🏆
            </button>
            {/* Weather cycler (debug/demo control from webgpu branch) */}
            <button
              onClick={() => {
                if (engineRef.current) {
                  const weathers: WeatherType[] =
                    ['clear', 'rain', 'snow', 'storm', 'fog', 'sandstorm', 'meteor'];
                  const current = engineRef.current.getWeatherSystem().getCurrentWeather();
                  const currentIndex = weathers.indexOf(current);
                  const nextWeather = weathers[(currentIndex + 1) % weathers.length];
                  engineRef.current.setWeather(nextWeather, 1.0, 30);
                }
              }}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-mono text-sm rounded transition-all hover:scale-110"
              style={{ boxShadow: '0 0 15px rgba(20, 184, 166, 0.5)' }}
            >
              🌦️
            </button>
          </div>

          <ComboDisplay
            combo={player.combo}
            multiplier={1 + player.combo * 0.1}
          />

          <GameTimer
            startTime={stats.gameStartTime}
            isPaused={false}
          />

          {/* Weather Display (engine-synced) */}
          <WeatherDisplay
            currentWeather={currentWeather.type}
            intensity={currentWeather.intensity}
            timeRemaining={currentWeather.timeRemaining}
          />

          {/* Active Power-ups (self-polling from the engine manager) */}
          {powerUpManager && (
            <ActivePowerUpsDisplay
              powerUpManager={powerUpManager}
              updateInterval={100}
            />
          )}
        </>
      )}

      {/* Pause Menu */}
      {gameState === 'paused' && (
        <PauseMenu
          onResume={handleResume}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
          onSettings={() => setShowSettings(true)}
        />
      )}

      {/* Game Over Screen (real final stats) */}
      {gameState === 'gameover' && (
        <GameOverScreen
          score={finalStats?.score ?? 0}
          wave={finalStats?.wave ?? 1}
          enemiesKilled={finalStats?.enemiesKilled ?? 0}
          totalDamage={finalStats?.totalDamage ?? 0}
          survivalTime={finalStats?.survivalTime ?? 0}
          maxCombo={finalStats?.maxCombo ?? 1}
          seed={finalStats?.seed ?? ''}
          highScore={Math.max(saveData?.player.highScore ?? 0, finalStats?.score ?? 0)}
          isNewHighScore={(finalStats?.score ?? 0) > (saveData?.player.highScore ?? 0) && (finalStats?.score ?? 0) > 0}
          playerLevel={finalStats?.playerLevel ?? 1}
          onRestart={handleStartGame}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Level Up (wave milestone) - real engine choices */}
      {gameState === 'levelup' && (
        <LevelUpScreen
          upgrades={levelChoices}
          onSelectUpgrade={handleChooseUpgrade}
        />
      )}

      {/* Level Up (XP level) - real engine choices */}
      {gameState === 'levelchoice' && (
        <LevelUpChoiceScreen
          level={stats.playerLevel}
          choices={levelChoices.map((c, i) => ({
            id: `choice_${i}`,
            name: c.name,
            description: c.description,
            icon: c.icon,
            rarity: rarities[i % rarities.length]
          }))}
          onSelect={(_choice) => {
            // The engine owns the ordered choice list; map back by index.
            const idx = levelChoices.findIndex(c => c.name === _choice.name);
            handleChooseUpgrade(idx >= 0 ? idx : 0);
          }}
        />
      )}

      {/* Skill Tree (persistent state, passed in explicitly) */}
      <SkillTreeUI
        isOpen={showSkillTree}
        onClose={() => setShowSkillTree(false)}
        skillPoints={skillPoints}
        skillTree={skillTree}
        onUnlockSkill={handleUnlockSkill}
      />

      {/* Daily Challenges (real run stats) */}
      <DailyChallengesUI
        isOpen={showDailyChallenges}
        onClose={() => setShowDailyChallenges(false)}
        playerStats={{
          score: stats.score,
          level: stats.playerLevel,
          wave: stats.wave,
          enemiesKilled: stats.enemiesKilled,
          bossKills: stats.bossKills,
          maxCombo: stats.maxCombo,
          survivalTime: stats.survivalTime,
          damageDealt: stats.totalDamage,
          damageTaken: stats.damageTaken,
          itemsCollected: stats.itemsCollected,
          deaths: 0
        }}
        completedChallenges={completedChallenges}
        onCompleteChallenge={handleCompleteChallenge}
      />

      {/* Save/Load UI */}
      <SaveLoadUI
        isOpen={showSaveLoad}
        onClose={() => setShowSaveLoad(false)}
        saveData={saveData}
        onSave={handleSaveGame}
        onLoad={handleLoadGame}
      />

      {/* Stats & Leaderboard */}
      <StatsLeaderboardUI
        isOpen={showStatsLeaderboard}
        onClose={() => setShowStatsLeaderboard(false)}
      />

      {/* Arcade Game */}
      <ArcadeGame
        isOpen={showArcadeGame}
        onClose={() => setShowArcadeGame(false)}
        onComplete={(score) => {
          addNotification(`Arkadna igra končana! Točke: ${score}`, 'success');
        }}
      />

      {/* Daily Rewards (applies to persistent wallet) */}
      <DailyRewardsUI
        isOpen={showDailyRewards}
        onClose={() => setShowDailyRewards(false)}
        onClaim={handleClaimReward}
      />

      {/* Shop (validated + persistent) */}
      <ShopUI
        isOpen={showShop}
        onClose={() => setShowShop(false)}
        gold={saveData?.currency.gold ?? 0}
        gems={saveData?.currency.gems ?? 0}
        ownedItems={saveData?.cosmetics.unlocked ?? ['default']}
        equippedItems={saveData?.cosmetics.equipped ?? {}}
        onBuy={handleBuyCosmetic}
        onEquip={handleEquipCosmetic}
        playerLevel={saveData?.player.highestLevel ?? 1}
      />

      {/* Difficulty Select (persistent + unlock gating) */}
      <DifficultySelectUI
        isOpen={showDifficultySelect}
        onClose={() => setShowDifficultySelect(false)}
        onSelect={handleSelectDifficulty}
        playerLevel={saveData?.player.highestLevel ?? 1}
        currentDifficulty={currentDifficulty}
      />

      {/* Meta Progression (real run stats + persistent gem wallet) */}
      <MetaProgressionUI
        isOpen={showMetaProgression}
        onClose={() => setShowMetaProgression(false)}
        playerStats={{
          level: stats.playerLevel,
          maxCombo: stats.maxCombo,
          highestWave: stats.wave,
          bossKills: stats.bossKills
        }}
        currency={saveData?.currency.gems ?? 0}
        onUnlock={(nodeId) => {
          addNotification(`Odklenjeno: ${nodeId}`, 'success');
        }}
      />

      {/* Interactive Tutorial */}
      <InteractiveTutorial
        isOpen={showInteractiveTutorial}
        onClose={() => setShowInteractiveTutorial(false)}
        onComplete={() => {
          addNotification('Vodnik končan!', 'success');
        }}
      />

      {/* Settings Menu (persistent + applied to engine) */}
      <SettingsMenu
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      {/* Tutorial Overlay */}
      <TutorialOverlay
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      {/* Achievement Panel (real achievement list + unlock state) */}
      <AchievementPanel
        isOpen={showAchievements}
        achievements={allAchievements.map(a => ({
          ...a,
          unlocked: unlockedAchievementIds.has(a.id)
        }))}
        onClose={() => setShowAchievements(false)}
      />

      {/* Achievement toast notifications */}
      {newAchievements.map((achievement, i) => (
        <AchievementNotification
          key={`${achievement.id}_${i}`}
          achievement={achievement}
          onClose={() => setNewAchievements(prev => prev.filter(a => a.id !== achievement.id))}
        />
      ))}

      {/* Notifications */}
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}

      {/* Mobile Controls (wired to the engine) */}
      <MobileControls
        onMove={(x, y) => engineRef.current?.setMobileMove(x, y)}
        onShoot={(active) => engineRef.current?.setMobileShooting(active)}
        onDash={() => engineRef.current?.mobileDash()}
        onSecondary={() => engineRef.current?.mobileSecondary()}
        isVisible={gameState === 'playing' && !showClassicArcade}
      />

      {/* Visual Effects */}
      {gameState === 'playing' && (
        <>
          {/* Bloom Effect */}
          <BloomEffect intensity={1.2} threshold={0.8} />

          {/* Particle Overlay */}
          <ParticleOverlay isActive={true} />

          {/* Chromatic Aberration */}
          <ChromaticAberration intensity={2} isActive={true} />
        </>
      )}

      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none z-20 opacity-[0.03]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)'
        }}
      />
    </div>
  );
}
