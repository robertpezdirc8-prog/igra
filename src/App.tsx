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
  MobileControls
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
  const [settings, setSettings] = useState<Settings>({
    musicVolume: 0.5,
    sfxVolume: 0.6,
    showFPS: true,
    particles: 'high'
  });
  const [notifications, setNotifications] = useState<Array<{ id: number; message: string; type: 'success' | 'warning' | 'error' | 'info' }>>([]);
  const [highScore, setHighScore] = useState(0);
  const [webgpuSupported, setWebgpuSupported] = useState(false);

  const handleStateChange = useCallback((state: string) => {
    setGameState(state as GameState);
  }, []);

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
    };
    const handleMouseDown = (e: MouseEvent) => {
      engine.handleMouseDown(e.button);
      engine.handleClick(e.clientX, e.clientY);
    };
    const handleMouseUp = (e: MouseEvent) => {
      engine.handleMouseUp(e.button);
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
        className="absolute inset-0 w-full h-full cursor-crosshair"
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
          highScore={highScore}
          webgpuSupported={webgpuSupported}
        />
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
          score={engineRef.current?.getPlayer().score || 0}
          wave={engineRef.current?.getWave() || 1}
          enemiesKilled={0}
          totalDamage={0}
          survivalTime={0}
          maxCombo={engineRef.current?.getPlayer().combo || 1}
          seed="DEMO123"
          highScore={highScore}
          isNewHighScore={(engineRef.current?.getPlayer().score || 0) > highScore}
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
