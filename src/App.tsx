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
  GameTimer
} from './components';

type GameState = 'loading' | 'menu' | 'playing' | 'paused' | 'levelup' | 'gameover';

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
    dashCooldown: 0
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
            dashCooldown: player.dashCooldown
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
          highScore={highScore}
          webgpuSupported={webgpuSupported}
        />
      )}

      {/* In-Game UI */}
      {gameState === 'playing' && (
        <>
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
