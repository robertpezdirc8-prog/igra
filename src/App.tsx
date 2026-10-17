import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import {
  LoadingScreen,
  MainMenu,
  PauseMenu,
  GameOverScreen,
  LevelUpScreen,
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
  BossHealthBar,
  DamageFlash,
  WaveProgress,
  StatsPanel,
  AchievementPanel,
  PerformanceMonitor,
  ControlsOverlay,
  WaveInfo,
  ComboDisplay,
  PowerUpNotificationDisplay,
  GameTimer,
  LevelDisplay,
  LevelInfo,
  LevelUpChoiceScreen,
  SkillTreeUI,
  DailyChallengesUI,
  SaveLoadUI,
  StatsLeaderboardUI
} from './components';
import { loadGame, saveGame, createDefaultSaveData, SaveData } from './game/saveSystem';
import { getLevelForPlayer } from './game/levels';
import { SKILL_TREE, findSkill, getSkillCost } from './game/skillTree';

type GameState = 'loading' | 'menu' | 'playing' | 'paused' | 'levelup' | 'levelchoice' | 'gameover';

interface Settings {
  musicVolume: number;
  sfxVolume: number;
  showFPS: boolean;
  particles: 'low' | 'medium' | 'high';
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>('loading');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [skillPoints, setSkillPoints] = useState(0);
  const [showDailyChallenges, setShowDailyChallenges] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [saveData, setSaveData] = useState<SaveData | null>(null);
  const [showStatsLeaderboard, setShowStatsLeaderboard] = useState(false);

  // Load save data on mount
  useEffect(() => {
    const loaded = loadGame();
    if (loaded) {
      setSaveData(loaded);
    } else {
      const defaultSave = createDefaultSaveData();
      setSaveData(defaultSave);
      saveGame(defaultSave);
    }
  }, []);

  const handleSave = () => {
    if (saveData) {
      saveGame(saveData);
      addNotification('Igra shranjena!', 'success');
    }
  };

  const handleLoad = () => {
    const loaded = loadGame();
    if (loaded) {
      setSaveData(loaded);
      addNotification('Igra naložena!', 'success');
    }
  };
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isShooting, setIsShooting] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    musicVolume: 0.5,
    sfxVolume: 0.6,
    showFPS: true,
    particles: 'high'
  });
  const [notifications, setNotifications] = useState<Array<{ id: number; message: string; type: 'success' | 'warning' | 'error' | 'info' }>>([]);
  const [highScore, setHighScore] = useState(0);
  const [webgpuSupported, setWebgpuSupported] = useState(false);
  const [playerStats, setPlayerStats] = useState({
    hp: 100, maxHp: 100,
    shield: 50, maxShield: 50,
    energy: 100, maxEnergy: 100,
    score: 0, wave: 1, combo: 1,
    weaponLevel: 1,
    secondaryWeapon: 'none' as 'none' | 'gravity' | 'chain' | 'temporal',
    secondaryCooldown: 0,
    dashCooldown: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 100
  });

  const handleStateChange = useCallback((state: string) => {
    setGameState(state as GameState);
  }, []);

  // Game loop za posodabljanje UI state
  useEffect(() => {
    const updateUI = () => {
      if (engineRef.current && gameState === 'playing') {
        const player = engineRef.current.getPlayer();
        if (player) {
          setPlayerStats({
            hp: player.hp,
            maxHp: player.maxHp,
            shield: player.shield,
            maxShield: player.maxShield,
            energy: player.energy,
            maxEnergy: player.maxEnergy,
            score: player.score,
            wave: engineRef.current.getWave(),
            combo: player.combo,
            weaponLevel: player.weaponLevel,
            secondaryWeapon: player.secondaryWeapon,
            secondaryCooldown: player.secondaryCooldown,
            dashCooldown: player.dashCooldown,
            level: engineRef.current.getPlayerLevel(),
            xp: engineRef.current.getPlayerXP(),
            xpToNextLevel: engineRef.current.getPlayerXPToNext()
          });
        }
      }
      requestAnimationFrame(updateUI);
    };
    const frameId = requestAnimationFrame(updateUI);
    return () => cancelAnimationFrame(frameId);
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, handleStateChange);
    engineRef.current = engine;

    const resize = () => {
      engine.resize(window.innerWidth, window.innerHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    engine.startLoop();
    engine.start();

    // Check WebGPU support
    const checkWebGPU = async () => {
      const nav = navigator as any;
      if (nav.gpu) {
        try {
          const adapter = await nav.gpu.requestAdapter();
          setWebgpuSupported(!!adapter);
        } catch (e) {
          setWebgpuSupported(false);
        }
      }
    };
    checkWebGPU();

    // Load high score
    try {
      const saved = localStorage.getItem('atheria_highscore');
      if (saved) setHighScore(parseInt(saved));
    } catch (e) {}

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      engine.handleKeyDown(e.key);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      engine.handleKeyUp(e.key);
    };
    const handleMouseMove = (e: MouseEvent) => {
      engine.handleMouseMove(e.clientX, e.clientY);
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    const handleMouseDown = (e: MouseEvent) => {
      engine.handleMouseDown(e.button);
      engine.handleClick(e.clientX, e.clientY);
      if (e.button === 0) setIsShooting(true);
    };
    const handleMouseUp = (e: MouseEvent) => {
      engine.handleMouseUp(e.button);
      if (e.button === 0) setIsShooting(false);
    };
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      engine.destroy();
    };
  }, [handleStateChange]);

  const addNotification = (message: string, type: 'success' | 'warning' | 'error' | 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleStartGame = () => {
    setGameState('playing');
    addNotification('Igra se je začela!', 'success');
  };

  const handleResume = () => {
    setGameState('playing');
  };

  const handleRestart = () => {
    setGameState('playing');
    addNotification('Ponovni zagon...', 'info');
  };

  const handleMainMenu = () => {
    setGameState('menu');
  };

  const handleUnlockSkill = (skillId: string) => {
    const skill = findSkill(skillId, SKILL_TREE);
    if (!skill) return;

    const cost = getSkillCost(skill);
    if (skillPoints >= cost) {
      setSkillPoints(prev => prev - cost);
      skill.currentLevel++;
      addNotification(`Odklenjeno: ${skill.name} (Level ${skill.currentLevel})`, 'success');
    }
  };

  // Award skill points on level up
  useEffect(() => {
    if (gameState === 'levelchoice') {
      setSkillPoints(prev => prev + 1);
    }
  }, [gameState]);

  const handleCompleteChallenge = (challengeId: string) => {
    if (!completedChallenges.includes(challengeId)) {
      setCompletedChallenges(prev => [...prev, challengeId]);
      addNotification('Izziv zaključen! Poglej nagrade.', 'success');
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none', cursor: gameState === 'playing' ? 'none' : 'default' }}
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
          highScore={highScore}
          webgpuSupported={webgpuSupported}
        />
      )}

      {/* In-Game UI */}
      {gameState === 'playing' && (
        <>
          {/* Level Display */}
          <LevelDisplay
            level={playerStats.level}
            xp={playerStats.xp}
            xpToNext={playerStats.xpToNextLevel}
          />

          {/* Level Info */}
          <LevelInfo
            level={getLevelForPlayer(playerStats.level)}
            playerLevel={playerStats.level}
          />

          {/* Health Bar */}
          <HealthBar
            hp={playerStats.hp}
            maxHp={playerStats.maxHp}
            shield={playerStats.shield}
            maxShield={playerStats.maxShield}
            energy={playerStats.energy}
            maxEnergy={playerStats.maxEnergy}
          />

          {/* Score Display */}
          <ScoreDisplay
            score={playerStats.score}
            wave={playerStats.wave}
            combo={playerStats.combo}
            fps={60}
            seed="DEMO123"
            webgpuSupported={webgpuSupported}
          />

          {/* Weapon Indicator */}
          <WeaponIndicator
            weaponLevel={playerStats.weaponLevel}
            secondaryWeapon={playerStats.secondaryWeapon}
            secondaryCooldown={playerStats.secondaryCooldown}
            dashCooldown={playerStats.dashCooldown}
          />

          {/* Mini Map */}
          <MiniMap
            playerX={400}
            playerY={300}
            enemies={[]}
            worldWidth={800}
            worldHeight={600}
          />

          {/* Crosshair */}
          <Crosshair
            x={mousePos.x}
            y={mousePos.y}
            isActive={isShooting}
          />

          {/* Keyboard Hints */}
          <KeyboardHints />

          {/* Damage Flash */}
          <DamageFlash
            isActive={damageFlash}
            intensity={0.5}
          />

          {/* Wave Info */}
          <WaveInfo
            wave={playerStats.wave}
            enemiesRemaining={10}
            totalEnemies={10}
            isBossWave={playerStats.wave % 5 === 0}
          />

          {/* Skill Tree Button */}
          <button
            onClick={() => setShowSkillTree(true)}
            className="fixed top-4 right-4 z-40 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-mono rounded transition-all hover:scale-110"
            style={{
              boxShadow: '0 0 15px rgba(168, 85, 247, 0.5)'
            }}
          >
            🌳 SKILLS ({skillPoints})
          </button>

          {/* Daily Challenges Button */}
          <button
            onClick={() => setShowDailyChallenges(true)}
            className="fixed top-4 right-48 z-40 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-mono rounded transition-all hover:scale-110"
            style={{
              boxShadow: '0 0 15px rgba(236, 72, 153, 0.5)'
            }}
          >
            🎯 IZZIVI
          </button>

          {/* Combo Display */}
          <ComboDisplay
            combo={playerStats.combo}
            multiplier={1 + playerStats.combo * 0.1}
          />

          {/* Game Timer */}
          <GameTimer
            startTime={Date.now()}
            isPaused={false}
          />
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

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <GameOverScreen
          score={playerStats.score}
          wave={playerStats.wave}
          enemiesKilled={0}
          totalDamage={0}
          survivalTime={0}
          maxCombo={playerStats.combo}
          seed="DEMO123"
          highScore={highScore}
          isNewHighScore={playerStats.score > highScore}
          playerLevel={playerStats.level}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Level Up Screen */}
      {gameState === 'levelup' && (
        <LevelUpScreen
          upgrades={[
            { name: 'Plasma Overcharge', description: '+25% damage, +1 weapon level', icon: '⚡' },
            { name: 'Neural Reflexes', description: '+15% movement speed', icon: '🧠' },
            { name: 'Void Shield', description: '+30 max shield, full restore', icon: '🛡️' }
          ]}
          onSelectUpgrade={(index) => {
            addNotification('Nadgradnja izbrana!', 'success');
            setGameState('playing');
          }}
        />
      )}

      {/* Level Choice Screen */}
      {gameState === 'levelchoice' && (
        <LevelUpChoiceScreen
          level={playerStats.level}
          choices={[
            {
              id: 'damage',
              name: 'Plasma Overcharge',
              description: '+25% škoda, +1 nivo orožja',
              icon: '⚡',
              rarity: 'rare'
            },
            {
              id: 'speed',
              name: 'Neural Reflexes',
              description: '+15% hitrost gibanja',
              icon: '🧠',
              rarity: 'common'
            },
            {
              id: 'shield',
              name: 'Void Shield',
              description: '+30 max ščit, polna obnovitev',
              icon: '🛡️',
              rarity: 'epic'
            }
          ]}
          onSelect={(choice) => {
            addNotification(`${choice.name} izbrana!`, 'success');
            setGameState('playing');
          }}
        />
      )}

      {/* Skill Tree */}
      <SkillTreeUI
        isOpen={showSkillTree}
        onClose={() => setShowSkillTree(false)}
        skillPoints={skillPoints}
        onUnlockSkill={handleUnlockSkill}
      />

      {/* Daily Challenges */}
      <DailyChallengesUI
        isOpen={showDailyChallenges}
        onClose={() => setShowDailyChallenges(false)}
        playerStats={{
          score: playerStats.score,
          level: playerStats.level,
          wave: playerStats.wave,
          enemiesKilled: 0,
          bossKills: 0,
          maxCombo: playerStats.combo,
          survivalTime: 0,
          damageDealt: 0,
          damageTaken: 0,
          itemsCollected: 0,
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
        onSave={handleSave}
        onLoad={handleLoad}
      />

      {/* Stats & Leaderboard */}
      <StatsLeaderboardUI
        isOpen={showStatsLeaderboard}
        onClose={() => setShowStatsLeaderboard(false)}
      />

      {/* Settings Menu */}
      <SettingsMenu
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />

      {/* Tutorial Overlay */}
      <TutorialOverlay
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      {/* Stats Panel */}
      <StatsPanel
        isOpen={showStats}
        stats={{
          totalDamage: 0,
          enemiesKilled: 0,
          shotsFired: 0,
          accuracy: 0,
          timePlayed: 0,
          upgradesCollected: 0
        }}
        onClose={() => setShowStats(false)}
      />

      {/* Achievement Panel */}
      <AchievementPanel
        isOpen={showAchievements}
        achievements={[]}
        onClose={() => setShowAchievements(false)}
      />

      {/* Controls Overlay */}
      <ControlsOverlay
        isVisible={showControls}
        onClose={() => setShowControls(false)}
      />

      {/* Performance Monitor */}
      <PerformanceMonitor isVisible={showPerformance} />

      {/* Notifications */}
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}

      {/* Mobile Controls */}
      <MobileControls
        onMove={(x, y) => {}}
        onShoot={() => {}}
        onDash={() => {}}
        onSecondary={() => {}}
        isVisible={gameState === 'playing'}
      />

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
