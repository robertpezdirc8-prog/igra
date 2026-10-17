import { useState } from 'react';
import { UNLOCK_TREE, UnlockNode, MetaProgressionSystem } from '../game/metaProgression';

interface MetaProgressionUIProps {
  isOpen: boolean;
  onClose: () => void;
  playerStats: {
    level: number;
    maxCombo: number;
    highestWave: number;
    bossKills: number;
  };
  currency: number;
  onUnlock: (nodeId: string) => void;
}

export function MetaProgressionUI({ 
  isOpen, 
  onClose, 
  playerStats, 
  currency,
  onUnlock 
}: MetaProgressionUIProps) {
  const [selectedNode, setSelectedNode] = useState<UnlockNode | null>(null);
  const [progression] = useState(() => new MetaProgressionSystem());

  if (!isOpen) return null;

  const progress = progression.getProgress();
  const availableUnlocks = progression.getAvailableUnlocks(playerStats);

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return '#00ffff';
      case 2: return '#00ff88';
      case 3: return '#ffaa00';
      case 4: return '#ff4444';
      case 5: return '#ff00ff';
      default: return '#888888';
    }
  };

  const getTypeIcon = (type: UnlockNode['type']) => {
    switch (type) {
      case 'character': return '👤';
      case 'weapon': return '🔫';
      case 'ability': return '⚡';
      case 'cosmetic': return '✨';
      case 'mechanic': return '⚙️';
      default: return '📦';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
      <div className="relative w-[95vw] max-w-7xl h-[90vh] bg-gradient-to-br from-purple-900 via-black to-blue-900 border-2 border-purple-500 rounded-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold font-mono text-white mb-2">
                🌳 META-PROGRESIJA
              </h2>
              <p className="text-purple-200 font-mono text-sm">
                Odkleni nove sposobnosti in izboljšave
              </p>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 font-mono text-2xl font-bold">
                💎 {currency}
              </div>
              <div className="text-purple-300 font-mono text-sm mt-1">
                Napredek: {progress.unlocked}/{progress.total} ({progress.percentage.toFixed(1)}%)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white font-mono rounded-full transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 bg-black/40 border-b border-purple-500/50 flex-shrink-0">
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 transition-all duration-500"
              style={{
                width: `${progress.percentage}%`,
                boxShadow: '0 0 10px rgba(168, 85, 247, 0.8)'
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Unlock tree */}
          <div className="flex-1 overflow-auto p-6">
            <div className="relative min-w-[800px] min-h-[600px]">
              {/* Draw connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {UNLOCK_TREE.map(node => {
                  if (node.tier === 1) return null;
                  
                  const parent = UNLOCK_TREE.find(p => p.unlocks.includes(node.id));
                  if (!parent) return null;

                  const parentX = parent.position.x * 150 + 400;
                  const parentY = parent.position.y * 120 + 100;
                  const nodeX = node.position.x * 150 + 400;
                  const nodeY = node.position.y * 120 + 100;

                  const isUnlocked = progression.isUnlocked(node.id);
                  const parentUnlocked = progression.isUnlocked(parent.id);

                  return (
                    <line
                      key={`${parent.id}-${node.id}`}
                      x1={parentX}
                      y1={parentY}
                      x2={nodeX}
                      y2={nodeY}
                      stroke={isUnlocked ? '#00ff88' : parentUnlocked ? '#ffaa00' : '#444444'}
                      strokeWidth="2"
                      strokeDasharray={isUnlocked ? '0' : '5,5'}
                    />
                  );
                })}
              </svg>

              {/* Nodes */}
              {UNLOCK_TREE.map(node => {
                const isUnlocked = progression.isUnlocked(node.id);
                const canUnlock = progression.canUnlock(node, playerStats);
                const color = getTierColor(node.tier);

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`absolute w-20 h-20 rounded-lg border-2 cursor-pointer transition-all hover:scale-110 ${
                      isUnlocked
                        ? 'bg-green-900/50 border-green-500'
                        : canUnlock
                        ? 'bg-yellow-900/50 border-yellow-500 animate-pulse'
                        : 'bg-black/60 border-gray-700'
                    }`}
                    style={{
                      left: node.position.x * 150 + 360,
                      top: node.position.y * 120 + 60,
                      borderColor: isUnlocked ? '#00ff88' : canUnlock ? '#ffaa00' : '#444444',
                      boxShadow: isUnlocked 
                        ? '0 0 20px rgba(0, 255, 136, 0.5)' 
                        : canUnlock 
                        ? '0 0 20px rgba(255, 170, 0, 0.5)' 
                        : 'none'
                    }}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-3xl mb-1">{node.icon}</div>
                      <div className="text-xs font-mono text-center px-1" style={{ color }}>
                        T{node.tier}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Node details */}
          {selectedNode && (
            <div className="w-96 bg-black/60 border-l border-purple-500/50 p-6 overflow-y-auto">
              <div className="text-center mb-6">
                <div className="text-7xl mb-4">{selectedNode.icon}</div>
                <h3 
                  className="text-2xl font-bold font-mono mb-2"
                  style={{ color: getTierColor(selectedNode.tier) }}
                >
                  {selectedNode.name}
                </h3>
                <div className="text-sm font-mono text-gray-400">
                  {getTypeIcon(selectedNode.type)} {selectedNode.type.toUpperCase()} • TIER {selectedNode.tier}
                </div>
              </div>

              <p className="text-gray-300 font-mono text-sm mb-6">
                {selectedNode.description}
              </p>

              {/* Requirement */}
              <div className="mb-6 p-4 bg-black/40 rounded-lg border border-gray-700">
                <div className="text-gray-400 font-mono text-xs mb-2">ZAHTEVA:</div>
                <div className="text-white font-mono text-sm">
                  {selectedNode.requirement.description}
                </div>
              </div>

              {/* Unlocks */}
              {selectedNode.unlocks.length > 0 && (
                <div className="mb-6 p-4 bg-black/40 rounded-lg border border-gray-700">
                  <div className="text-gray-400 font-mono text-xs mb-2">ODKLENE:</div>
                  <div className="space-y-2">
                    {selectedNode.unlocks.map(unlockId => {
                      const unlockNode = UNLOCK_TREE.find(n => n.id === unlockId);
                      if (!unlockNode) return null;
                      return (
                        <div key={unlockId} className="flex items-center gap-2 text-sm font-mono">
                          <span>{unlockNode.icon}</span>
                          <span className="text-gray-300">{unlockNode.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="mb-6">
                {progression.isUnlocked(selectedNode.id) ? (
                  <div className="text-center text-green-400 font-mono font-bold text-lg">
                    ✓ ODKLENJENO
                  </div>
                ) : progression.canUnlock(selectedNode, playerStats) ? (
                  <button
                    onClick={() => {
                      onUnlock(selectedNode.id);
                      setSelectedNode(null);
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-mono font-bold rounded-lg transition-all hover:scale-105"
                    style={{ boxShadow: '0 0 20px rgba(255, 170, 0, 0.5)' }}
                  >
                    ODKLENI
                  </button>
                ) : (
                  <div className="text-center text-gray-500 font-mono">
                    🔒 ZAKLENJENO
                  </div>
                )}
              </div>

              {/* Available unlocks notification */}
              {availableUnlocks.length > 0 && (
                <div className="p-4 bg-yellow-900/30 border border-yellow-500 rounded-lg">
                  <div className="text-yellow-400 font-mono text-sm font-bold mb-2">
                    ⚡ NOVICH NA VOLJO:
                  </div>
                  <div className="text-yellow-300 font-mono text-xs">
                    {availableUnlocks.length} {availableUnlocks.length === 1 ? 'nova sposobnost' : 'novih sposobnosti'} za odklepanje!
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-black/60 p-4 border-t border-purple-500/50 flex-shrink-0">
          <div className="flex items-center justify-between text-sm font-mono">
            <div className="text-gray-400">
              Napredek: {progress.unlocked}/{progress.total} sposobnosti odklenjenih
            </div>
            <div className="text-gray-400">
              Val: {playerStats.highestWave} • Bossi: {playerStats.bossKills} • Max Combo: {playerStats.maxCombo}x
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
