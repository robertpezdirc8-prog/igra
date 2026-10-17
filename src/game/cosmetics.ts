export interface CosmeticItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'trail' | 'aura' | 'border' | 'ship' | 'effect';
  price: number;
  currency: 'gold' | 'gems';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockLevel: number;
}

export const COSMETIC_ITEMS: CosmeticItem[] = [
  // Trails
  {
    id: 'fire_trail',
    name: 'Fire Trail',
    description: 'Ognjeni sled za ladjo',
    icon: '🔥',
    type: 'trail',
    price: 500,
    currency: 'gold',
    rarity: 'common',
    unlockLevel: 5
  },
  {
    id: 'ice_trail',
    name: 'Ice Trail',
    description: 'Ledeni sled za ladjo',
    icon: '❄️',
    type: 'trail',
    price: 500,
    currency: 'gold',
    rarity: 'common',
    unlockLevel: 5
  },
  {
    id: 'lightning_trail',
    name: 'Lightning Trail',
    description: 'Električni sled za ladjo',
    icon: '⚡',
    type: 'trail',
    price: 1000,
    currency: 'gold',
    rarity: 'rare',
    unlockLevel: 10
  },
  {
    id: 'rainbow_trail',
    name: 'Rainbow Trail',
    description: 'Mavrični sled za ladjo',
    icon: '🌈',
    type: 'trail',
    price: 50,
    currency: 'gems',
    rarity: 'epic',
    unlockLevel: 15
  },
  {
    id: 'void_trail',
    name: 'Void Trail',
    description: 'Sled praznine',
    icon: '🌌',
    type: 'trail',
    price: 100,
    currency: 'gems',
    rarity: 'legendary',
    unlockLevel: 25
  },
  
  // Auras
  {
    id: 'fire_aura',
    name: 'Fire Aura',
    description: 'Ognjena aura okoli ladje',
    icon: '🔥',
    type: 'aura',
    price: 800,
    currency: 'gold',
    rarity: 'rare',
    unlockLevel: 8
  },
  {
    id: 'electric_aura',
    name: 'Electric Aura',
    description: 'Električna aura',
    icon: '⚡',
    type: 'aura',
    price: 1200,
    currency: 'gold',
    rarity: 'rare',
    unlockLevel: 12
  },
  {
    id: 'dark_aura',
    name: 'Dark Aura',
    description: 'Temna aura praznine',
    icon: '🌑',
    type: 'aura',
    price: 75,
    currency: 'gems',
    rarity: 'epic',
    unlockLevel: 20
  },
  {
    id: 'cosmic_aura',
    name: 'Cosmic Aura',
    description: 'Kozmična aura zvezd',
    icon: '✨',
    type: 'aura',
    price: 150,
    currency: 'gems',
    rarity: 'legendary',
    unlockLevel: 30
  },
  
  // Borders
  {
    id: 'golden_border',
    name: 'Golden Border',
    description: 'Zlati okvir',
    icon: '🏆',
    type: 'border',
    price: 2000,
    currency: 'gold',
    rarity: 'rare',
    unlockLevel: 10
  },
  {
    id: 'crystal_border',
    name: 'Crystal Border',
    description: 'Kristalni okvir',
    icon: '💎',
    type: 'border',
    price: 30,
    currency: 'gems',
    rarity: 'epic',
    unlockLevel: 15
  },
  {
    id: 'void_border',
    name: 'Void Border',
    description: 'Okvir praznine',
    icon: '🌌',
    type: 'border',
    price: 80,
    currency: 'gems',
    rarity: 'legendary',
    unlockLevel: 25
  },
  
  // Ships
  {
    id: 'golden_ship',
    name: 'Golden Ship',
    description: 'Zlata ladja',
    icon: '🚀',
    type: 'ship',
    price: 5000,
    currency: 'gold',
    rarity: 'epic',
    unlockLevel: 20
  },
  {
    id: 'crystal_ship',
    name: 'Crystal Ship',
    description: 'Kristalna ladja',
    icon: '💎',
    type: 'ship',
    price: 100,
    currency: 'gems',
    rarity: 'legendary',
    unlockLevel: 30
  },
  
  // Effects
  {
    id: 'explosion_effect',
    name: 'Mega Explosion',
    description: 'Večji eksplozijski efekti',
    icon: '💥',
    type: 'effect',
    price: 1500,
    currency: 'gold',
    rarity: 'rare',
    unlockLevel: 12
  },
  {
    id: 'critical_effect',
    name: 'Critical Flash',
    description: 'Poseben efekt za kritične zadetke',
    icon: '⚡',
    type: 'effect',
    price: 40,
    currency: 'gems',
    rarity: 'epic',
    unlockLevel: 18
  }
];

export interface ShopItem {
  cosmetic: CosmeticItem;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
}

export function getCosmeticById(id: string): CosmeticItem | undefined {
  return COSMETIC_ITEMS.find(c => c.id === id);
}

export function getCosmeticsByType(type: CosmeticItem['type']): CosmeticItem[] {
  return COSMETIC_ITEMS.filter(c => c.type === type);
}

export function getUnlockedCosmetics(playerLevel: number): CosmeticItem[] {
  return COSMETIC_ITEMS.filter(c => c.unlockLevel <= playerLevel);
}

export function canAffordCosmetic(item: CosmeticItem, gold: number, gems: number): boolean {
  if (item.currency === 'gold') {
    return gold >= item.price;
  } else {
    return gems >= item.price;
  }
}

export function getRarityColor(rarity: CosmeticItem['rarity']): string {
  switch (rarity) {
    case 'legendary': return '#ffaa00';
    case 'epic': return '#ff00ff';
    case 'rare': return '#00aaff';
    default: return '#888888';
  }
}

export function getRarityName(rarity: CosmeticItem['rarity']): string {
  switch (rarity) {
    case 'legendary': return 'Legendarno';
    case 'epic': return 'Epično';
    case 'rare': return 'Redko';
    default: return 'Običajno';
  }
}
