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
    name: 'Ognjeni sled',
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
    name: 'Ledeni sled',
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
    name: 'Električni sled',
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
    name: 'Mavrični sled',
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
    name: 'Sled praznine',
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
    name: 'Ognjena aura',
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
    name: 'Električna aura',
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
    name: 'Temna aura',
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
    name: 'Kozmična aura',
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
    name: 'Zlati okvir',
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
    name: 'Kristalni okvir',
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
    name: 'Okvir praznine',
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
    name: 'Zlata ladja',
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
    name: 'Kristalna ladja',
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
    name: 'Mega eksplozija',
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
    name: 'Kritični blisk',
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
