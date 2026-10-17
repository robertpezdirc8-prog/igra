export interface Weapon {
  id: string;
  name: string;
  description: string;
  icon: string;
  damage: number;
  fireRate: number; // shots per second
  projectileCount: number;
  spread: number; // angle spread in radians
  projectileSpeed: number;
  projectileSize: number;
  projectileColor: string;
  projectileType: 'plasma' | 'laser' | 'missile' | 'beam' | 'shotgun';
  unlockLevel: number;
  cost: number;
}

export const WEAPONS: Weapon[] = [
  {
    id: 'plasma_pistol',
    name: 'Plasma Pistol',
    description: 'Osnovno plazma orožje',
    icon: '🔫',
    damage: 10,
    fireRate: 5,
    projectileCount: 1,
    spread: 0,
    projectileSpeed: 12,
    projectileSize: 4,
    projectileColor: '#00ffff',
    projectileType: 'plasma',
    unlockLevel: 1,
    cost: 0
  },
  {
    id: 'dual_plasma',
    name: 'Dual Plasma',
    description: 'Dvojni plazma strel',
    icon: '🔫🔫',
    damage: 8,
    fireRate: 6,
    projectileCount: 2,
    spread: 0.2,
    projectileSpeed: 12,
    projectileSize: 4,
    projectileColor: '#00ffff',
    projectileType: 'plasma',
    unlockLevel: 5,
    cost: 500
  },
  {
    id: 'spread_shot',
    name: 'Spread Shot',
    description: 'Širok razpon streljanja',
    icon: '🌀',
    damage: 6,
    fireRate: 4,
    projectileCount: 5,
    spread: 0.8,
    projectileSpeed: 10,
    projectileSize: 3,
    projectileColor: '#ff00ff',
    projectileType: 'shotgun',
    unlockLevel: 10,
    cost: 1000
  },
  {
    id: 'laser_beam',
    name: 'Laser Beam',
    description: 'Nenehen laserski žarek',
    icon: '⚡',
    damage: 15,
    fireRate: 10,
    projectileCount: 1,
    spread: 0,
    projectileSpeed: 20,
    projectileSize: 3,
    projectileColor: '#ff0000',
    projectileType: 'laser',
    unlockLevel: 15,
    cost: 2000
  },
  {
    id: 'missile_launcher',
    name: 'Missile Launcher',
    description: 'Izstrelki s samonavigacijo',
    icon: '🚀',
    damage: 25,
    fireRate: 2,
    projectileCount: 1,
    spread: 0,
    projectileSpeed: 6,
    projectileSize: 8,
    projectileColor: '#ffaa00',
    projectileType: 'missile',
    unlockLevel: 20,
    cost: 3000
  },
  {
    id: 'plasma_cannon',
    name: 'Plasma Cannon',
    description: 'Močan plazma top',
    icon: '💥',
    damage: 30,
    fireRate: 1.5,
    projectileCount: 1,
    spread: 0,
    projectileSpeed: 15,
    projectileSize: 10,
    projectileColor: '#ffff00',
    projectileType: 'plasma',
    unlockLevel: 25,
    cost: 4000
  },
  {
    id: 'quad_shot',
    name: 'Quad Shot',
    description: 'Štirje simultani streli',
    icon: '🎯',
    damage: 12,
    fireRate: 4,
    projectileCount: 4,
    spread: 0.4,
    projectileSpeed: 11,
    projectileSize: 4,
    projectileColor: '#00ff88',
    projectileType: 'plasma',
    unlockLevel: 30,
    cost: 5000
  },
  {
    id: 'void_cannon',
    name: 'Void Cannon',
    description: 'Uničujoč top praznine',
    icon: '🌌',
    damage: 50,
    fireRate: 1,
    projectileCount: 1,
    spread: 0,
    projectileSpeed: 18,
    projectileSize: 15,
    projectileColor: '#8800ff',
    projectileType: 'plasma',
    unlockLevel: 40,
    cost: 8000
  },
  {
    id: 'storm_rifle',
    name: 'Storm Rifle',
    description: 'Hitrostrelna plazma puška',
    icon: '⚡',
    damage: 5,
    fireRate: 15,
    projectileCount: 1,
    spread: 0.1,
    projectileSpeed: 14,
    projectileSize: 3,
    projectileColor: '#00aaff',
    projectileType: 'plasma',
    unlockLevel: 35,
    cost: 6000
  },
  {
    id: 'cosmic_destroyer',
    name: 'Cosmic Destroyer',
    description: 'Kozmični uničevalec',
    icon: '☄️',
    damage: 40,
    fireRate: 3,
    projectileCount: 3,
    spread: 0.3,
    projectileSpeed: 16,
    projectileSize: 12,
    projectileColor: '#ff4400',
    projectileType: 'plasma',
    unlockLevel: 50,
    cost: 15000
  }
];

export function getWeaponById(id: string): Weapon | undefined {
  return WEAPONS.find(w => w.id === id);
}

export function getUnlockedWeapons(playerLevel: number): Weapon[] {
  return WEAPONS.filter(w => w.unlockLevel <= playerLevel);
}

export function canAffordWeapon(weapon: Weapon, gold: number): boolean {
  return gold >= weapon.cost;
}
