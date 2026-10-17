import { useState } from 'react';
import { COSMETIC_ITEMS, CosmeticItem, getRarityColor, getRarityName, canAffordCosmetic } from '../game/cosmetics';

interface ShopUIProps {
  isOpen: boolean;
  onClose: () => void;
  gold: number;
  gems: number;
  ownedItems: string[];
  equippedItems: { [key: string]: string | null };
  onBuy: (item: CosmeticItem) => void;
  onEquip: (item: CosmeticItem) => void;
  playerLevel: number;
}

export function ShopUI({ 
  isOpen, 
  onClose, 
  gold, 
  gems, 
  ownedItems, 
  equippedItems, 
  onBuy, 
  onEquip,
  playerLevel
}: ShopUIProps) {
  const [selectedCategory, setSelectedCategory] = useState<CosmeticItem['type']>('trail');
  const [selectedItem, setSelectedItem] = useState<CosmeticItem | null>(null);

  if (!isOpen) return null;

  const categories: { type: CosmeticItem['type']; name: string; icon: string }[] = [
    { type: 'trail', name: 'Sledi', icon: '✨' },
    { type: 'aura', name: 'Aure', icon: '💫' },
    { type: 'border', name: 'Okvirji', icon: '🖼️' },
    { type: 'ship', name: 'Ladje', icon: '🚀' },
    { type: 'effect', name: 'Efekti', icon: '💥' }
  ];

  const filteredItems = COSMETIC_ITEMS.filter(item => 
    item.type === selectedCategory && item.unlockLevel <= playerLevel
  );

  const isOwned = (item: CosmeticItem) => ownedItems.includes(item.id);
  const isEquipped = (item: CosmeticItem) => equippedItems[item.type] === item.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="relative w-[90vw] max-w-6xl h-[85vh] bg-gradient-to-br from-purple-900 to-black border-2 border-purple-500 rounded-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold font-mono text-white">
              🛍️ TRGOVINA
            </h2>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-yellow-400 font-mono text-xl font-bold">
                  💰 {gold.toLocaleString()}
                </div>
                <div className="text-purple-300 font-mono text-sm">
                  Zlato
                </div>
              </div>
              <div className="text-right">
                <div className="text-purple-400 font-mono text-xl font-bold">
                  💎 {gems.toLocaleString()}
                </div>
                <div className="text-purple-300 font-mono text-sm">
                  Dragulji
                </div>
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

        {/* Categories */}
        <div className="flex border-b border-purple-500/50 flex-shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.type}
              onClick={() => {
                setSelectedCategory(cat.type);
                setSelectedItem(null);
              }}
              className={`flex-1 px-6 py-3 font-mono font-bold transition-all ${
                selectedCategory === cat.type
                  ? 'bg-purple-600/30 text-purple-400 border-b-2 border-purple-400'
                  : 'bg-black/40 text-gray-400 hover:bg-black/60'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Items grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const owned = isOwned(item);
                const equipped = isEquipped(item);
                const rarityColor = getRarityColor(item.rarity);
                const canAfford = canAffordCosmetic(item, gold, gems);

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                      equipped
                        ? 'bg-green-900/30 border-green-500'
                        : owned
                        ? 'bg-purple-900/30 border-purple-500'
                        : 'bg-black/60 border-gray-700 hover:border-purple-500'
                    }`}
                    style={{
                      borderColor: selectedItem?.id === item.id ? rarityColor : undefined
                    }}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-2">{item.icon}</div>
                      <h3 className="font-mono font-bold text-white text-sm mb-1">
                        {item.name}
                      </h3>
                      <div
                        className="text-xs font-mono font-bold mb-2"
                        style={{ color: rarityColor }}
                      >
                        {getRarityName(item.rarity)}
                      </div>
                      {!owned && (
                        <div className="text-sm font-mono">
                          <span style={{ color: item.currency === 'gold' ? '#facc15' : '#a855f7' }}>
                            {item.currency === 'gold' ? '💰' : '💎'} {item.price}
                          </span>
                        </div>
                      )}
                      {owned && !equipped && (
                        <div className="text-green-400 font-mono text-xs">
                          ✓ V LASTI
                        </div>
                      )}
                      {equipped && (
                        <div className="text-green-400 font-mono text-xs font-bold">
                          ✓ OPREMLJENO
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Item details */}
          {selectedItem && (
            <div className="w-80 bg-black/60 border-l border-purple-500/50 p-6 overflow-y-auto">
              <div className="text-center mb-6">
                <div className="text-7xl mb-4">{selectedItem.icon}</div>
                <h3 className="text-2xl font-bold font-mono text-white mb-2">
                  {selectedItem.name}
                </h3>
                <div
                  className="text-sm font-mono font-bold mb-4"
                  style={{ color: getRarityColor(selectedItem.rarity) }}
                >
                  {getRarityName(selectedItem.rarity)}
                </div>
              </div>

              <p className="text-gray-300 font-mono text-sm mb-6">
                {selectedItem.description}
              </p>

              {!isOwned(selectedItem) && (
                <div className="mb-6">
                  <div className="text-gray-400 font-mono text-xs mb-2">CENA:</div>
                  <div className="text-2xl font-mono font-bold" style={{
                    color: selectedItem.currency === 'gold' ? '#facc15' : '#a855f7'
                  }}>
                    {selectedItem.currency === 'gold' ? '💰' : '💎'} {selectedItem.price}
                  </div>
                </div>
              )}

              {!isOwned(selectedItem) ? (
                <button
                  onClick={() => {
                    if (canAffordCosmetic(selectedItem, gold, gems)) {
                      onBuy(selectedItem);
                    }
                  }}
                  disabled={!canAffordCosmetic(selectedItem, gold, gems)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-mono font-bold rounded-lg transition-all"
                >
                  KUPI
                </button>
              ) : !isEquipped(selectedItem) ? (
                <button
                  onClick={() => onEquip(selectedItem)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-mono font-bold rounded-lg transition-all"
                >
                  OPREMI
                </button>
              ) : (
                <div className="text-center text-green-400 font-mono font-bold">
                  ✓ OPREMLJENO
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
