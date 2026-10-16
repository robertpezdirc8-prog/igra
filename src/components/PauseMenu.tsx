import { Button } from './Button';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onSettings: () => void;
}

export function PauseMenu({ onResume, onRestart, onMainMenu, onSettings }: PauseMenuProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-gray-900/95 border-2 border-cyan-400/50 rounded-lg p-8 max-w-md w-full mx-4">
        <h2
          className="text-4xl font-bold text-cyan-400 font-mono mb-8 text-center"
          style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}
        >
          PAUZIRANO
        </h2>

        <div className="flex flex-col gap-4">
          <Button onClick={onResume} variant="primary" size="large" className="w-full">
            NADALJUJ
          </Button>
          <Button onClick={onSettings} variant="secondary" size="medium" className="w-full">
            NASTAVITVE
          </Button>
          <Button onClick={onRestart} variant="secondary" size="medium" className="w-full">
            PONOVNI ZAGON
          </Button>
          <Button onClick={onMainMenu} variant="danger" size="medium" className="w-full">
            GLAVNI MENI
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 font-mono text-xs">
            Pritisni ESC za nadaljevanje
          </p>
        </div>
      </div>
    </div>
  );
}
