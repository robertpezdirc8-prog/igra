import { useState } from 'react';
import { SaveData, exportSave, importSave, deleteSave, hasSaveData } from '../game/saveSystem';

interface SaveLoadUIProps {
  isOpen: boolean;
  onClose: () => void;
  saveData: SaveData | null;
  onSave: () => void;
  onLoad: () => void;
}

export function SaveLoadUI({ isOpen, onClose, saveData, onSave, onLoad }: SaveLoadUIProps) {
  const [importCode, setImportCode] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const code = exportSave();
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        setMessage({ text: 'Koda kopirana v odložišče!', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      });
    }
  };

  const handleImport = () => {
    if (importCode.trim()) {
      const success = importSave(importCode.trim());
      if (success) {
        setMessage({ text: 'Shranjena igra uspešno uvožena!', type: 'success' });
        setImportCode('');
        setShowImport(false);
        setTimeout(() => {
          setMessage(null);
          onClose();
          window.location.reload();
        }, 2000);
      } else {
        setMessage({ text: 'Napaka pri uvozu. Preverite kodo.', type: 'error' });
        setTimeout(() => setMessage(null), 3000);
      }
    }
  };

  const handleDelete = () => {
    if (confirm('Ali ste prepričani? Vsi napredki bodo izgubljeni!')) {
      deleteSave();
      setMessage({ text: 'Shranjena igra izbrisana.', type: 'success' });
      setTimeout(() => {
        setMessage(null);
        onClose();
        window.location.reload();
      }, 2000);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('sl-SI');
  };

  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="relative w-[90vw] max-w-2xl bg-gradient-to-br from-gray-900 to-black border-2 border-cyan-500 rounded-lg overflow-hidden">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-cyan-600 to-blue-600 p-6">
          <h2 className="text-3xl font-bold font-mono text-white">
            💾 SHRANJEVANJE IGRE
          </h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white font-mono rounded-full transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg font-mono text-center ${
                message.type === 'success' 
                  ? 'bg-green-900/50 border border-green-500 text-green-300'
                  : 'bg-red-900/50 border border-red-500 text-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Current Save Info */}
          {saveData && (
            <div className="bg-black/60 border border-cyan-500/50 rounded-lg p-4">
              <h3 className="text-xl font-bold font-mono text-cyan-400 mb-4">
                Trenutna shranjena igra
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                <div>
                  <span className="text-gray-400">Nazadnje shranjeno:</span>
                  <div className="text-white">{formatDate(saveData.timestamp)}</div>
                </div>
                <div>
                  <span className="text-gray-400">Najboljši rezultat:</span>
                  <div className="text-yellow-400">{saveData.player.highScore.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-400">Skupni čas igranja:</span>
                  <div className="text-white">{formatPlayTime(saveData.player.totalPlayTime)}</div>
                </div>
                <div>
                  <span className="text-gray-400">Odigrane igre:</span>
                  <div className="text-white">{saveData.player.totalGamesPlayed}</div>
                </div>
                <div>
                  <span className="text-gray-400">Najvišji val:</span>
                  <div className="text-purple-400">{saveData.player.highestWave}</div>
                </div>
                <div>
                  <span className="text-gray-400">Najvišji nivo:</span>
                  <div className="text-purple-400">{saveData.player.highestLevel}</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onSave}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-mono font-bold rounded transition-all hover:scale-105"
              style={{ boxShadow: '0 0 20px rgba(74, 222, 128, 0.3)' }}
            >
              💾 SHRANI IGRO
            </button>

            {hasSaveData() && (
              <button
                onClick={onLoad}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-mono font-bold rounded transition-all hover:scale-105"
                style={{ boxShadow: '0 0 20px rgba(96, 165, 250, 0.3)' }}
              >
                📂 NALOŽI IGRO
              </button>
            )}

            <button
              onClick={() => setShowImport(!showImport)}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-mono font-bold rounded transition-all hover:scale-105"
              style={{ boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)' }}
            >
              📤 IZVOZI / UVOZI
            </button>

            {hasSaveData() && (
              <button
                onClick={handleDelete}
                className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-mono font-bold rounded transition-all hover:scale-105"
                style={{ boxShadow: '0 0 20px rgba(248, 113, 113, 0.3)' }}
              >
                🗑️ IZBRIŠI SHRANJENO IGRO
              </button>
            )}
          </div>

          {/* Import/Export Section */}
          {showImport && (
            <div className="bg-black/60 border border-purple-500/50 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-purple-400 font-mono text-sm mb-2">
                  Izvozi shranjeno igro:
                </label>
                <button
                  onClick={handleExport}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-mono rounded transition-colors"
                >
                  Kopiraj kodo v odložišče
                </button>
              </div>

              <div>
                <label className="block text-purple-400 font-mono text-sm mb-2">
                  Uvozi shranjeno igro:
                </label>
                <textarea
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value)}
                  placeholder="Prilepite kodo tukaj..."
                  className="w-full h-24 px-4 py-2 bg-black/80 border border-purple-500/50 rounded text-white font-mono text-sm resize-none focus:outline-none focus:border-purple-400"
                />
                <button
                  onClick={handleImport}
                  disabled={!importCode.trim()}
                  className="w-full mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-mono rounded transition-colors"
                >
                  Uvozi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-black/60 p-4 border-t border-cyan-500/50">
          <p className="text-center text-gray-400 font-mono text-xs">
            Shranjena igra se samodejno shrani v brskalnik. Uporabite izvoz/uvoz za prenos med napravami.
          </p>
        </div>
      </div>
    </div>
  );
}
