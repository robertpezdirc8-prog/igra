import { Button } from './Button';
import { t, useLang } from '../i18n';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onSettings: () => void;
}

export function PauseMenu({ onResume, onRestart, onMainMenu, onSettings }: PauseMenuProps) {
  useLang();
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-gray-900/95 border-2 border-cyan-400/50 rounded-lg p-4 sm:p-8 max-w-md w-[calc(100%-2rem)] mx-4 max-h-[85vh] overflow-y-auto">
        <h2
          className="text-4xl font-bold text-cyan-400 font-mono mb-8 text-center"
          style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}
        >
          {t('pause.title')}
        </h2>

        <div className="flex flex-col gap-4">
          <Button onClick={onResume} variant="primary" size="large" className="w-full">
            {t('pause.resume')}
          </Button>
          <Button onClick={onSettings} variant="secondary" size="medium" className="w-full">
            {t('settings.title')}
          </Button>
          <Button onClick={onRestart} variant="secondary" size="medium" className="w-full">
            {t('pause.restart')}
          </Button>
          <Button onClick={onMainMenu} variant="danger" size="medium" className="w-full">
            {t('common.mainMenu')}
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 font-mono text-xs">
            {t('pause.escHint')}
          </p>
        </div>
      </div>
    </div>
  );
}
