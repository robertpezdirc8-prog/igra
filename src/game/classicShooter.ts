// Classic Arcade Vertical Shooter System
// Inspired by Alpha Mission II, Image Fight, and Varth: Operation Thunderstorm

export type WeaponType = 'vulcan' | 'laser' | 'missile' | 'spread' | 'beam';
export type ArmorType = 'none' | 'standard' | 'heavy' | 'speed' | 'shield' | 'nuke';
export type PodType = 'none' | 'vulcan' | 'laser' | 'missile' | 'beam';

export interface Weapon {
  type: WeaponType;
  level: number; // 1-5
  damage: number;
  fireRate: number; // shots per second
  projectileSpeed: number;
  projectileSize: number;
  projectileColor: string;
  spread: number; // angle spread in radians
  projectileCount: number;
}

export interface Armor {
  type: ArmorType;
  hp: number;
  speedModifier: number;
  specialAbility?: string;
  color: string;
}

export interface Pod {
  type: PodType;
  level: number;
  position: 'left' | 'right';
  offset: { x: number; y: number };
  fireRate: number;
  damage: number;
}

export interface PowerUpItem {
  type: 'weapon' | 'armor' | 'pod' | 'speed' | 'bomb' | 'score';
  weaponType?: WeaponType;
  armorType?: ArmorType;
  podType?: PodType;
  value: number;
  x: number;
  y: number;
  vy: number;
  life: number;
}

export class ClassicShooterSystem {
  private currentWeapon: Weapon;
  private currentArmor: Armor;
  private leftPod: Pod | null = null;
  private rightPod: Pod | null = null;
  private bombs: number = 3;
  private maxBombs: number = 5;
  private speed: number = 5;
  private baseSpeed: number = 5;

  constructor() {
    this.currentWeapon = this.getWeaponConfig('vulcan', 1);
    this.currentArmor = this.getArmorConfig('none');
  }

  // Weapon configurations
  private getWeaponConfig(type: WeaponType, level: number): Weapon {
    const configs: Record<WeaponType, Omit<Weapon, 'level'>> = {
      vulcan: {
        type: 'vulcan',
        damage: 10 * level,
        fireRate: 8 + level * 2,
        projectileSpeed: 12,
        projectileSize: 3,
        projectileColor: '#ffff00',
        spread: 0,
        projectileCount: 1
      },
      laser: {
        type: 'laser',
        damage: 15 * level,
        fireRate: 6 + level,
        projectileSpeed: 18,
        projectileSize: 4 + level,
        projectileColor: '#00ffff',
        spread: 0,
        projectileCount: 1
      },
      missile: {
        type: 'missile',
        damage: 25 * level,
        fireRate: 3 + level * 0.5,
        projectileSpeed: 8,
        projectileSize: 6,
        projectileColor: '#ff8800',
        spread: 0.2,
        projectileCount: level
      },
      spread: {
        type: 'spread',
        damage: 8 * level,
        fireRate: 5 + level,
        projectileSpeed: 10,
        projectileSize: 3,
        projectileColor: '#ff00ff',
        spread: 0.3 * level,
        projectileCount: 3 + level * 2
      },
      beam: {
        type: 'beam',
        damage: 30 * level,
        fireRate: 2,
        projectileSpeed: 25,
        projectileSize: 8 + level * 2,
        projectileColor: '#ff0000',
        spread: 0,
        projectileCount: 1
      }
    };

    return { ...configs[type], level };
  }

  // Armor configurations
  private getArmorConfig(type: ArmorType): Armor {
    const configs: Record<ArmorType, { hp: number; speedModifier: number; specialAbility?: string; color: string }> = {
      none: {
        hp: 1,
        speedModifier: 1,
        color: '#00ffff'
      },
      standard: {
        hp: 3,
        speedModifier: 1,
        color: '#4488ff'
      },
      heavy: {
        hp: 5,
        speedModifier: 0.8,
        color: '#888888'
      },
      speed: {
        hp: 2,
        speedModifier: 1.5,
        color: '#00ff00'
      },
      shield: {
        hp: 4,
        speedModifier: 0.9,
        specialAbility: 'reflect',
        color: '#ffff00'
      },
      nuke: {
        hp: 3,
        speedModifier: 1,
        specialAbility: 'nuke',
        color: '#ff4400'
      }
    };

    return { ...configs[type], type };
  }

  // Pod configurations
  private getPodConfig(type: PodType, level: number, position: 'left' | 'right'): Pod {
    const configs: Record<PodType, Omit<Pod, 'level' | 'position' | 'offset'>> = {
      none: {
        type: 'none',
        fireRate: 0,
        damage: 0
      },
      vulcan: {
        type: 'vulcan',
        fireRate: 6 + level * 2,
        damage: 8 * level
      },
      laser: {
        type: 'laser',
        fireRate: 5 + level,
        damage: 12 * level
      },
      missile: {
        type: 'missile',
        fireRate: 2 + level * 0.5,
        damage: 20 * level
      },
      beam: {
        type: 'beam',
        fireRate: 1.5,
        damage: 25 * level
      }
    };

    const xOffset = position === 'left' ? -30 : 30;

    return {
      ...configs[type],
      level,
      position,
      offset: { x: xOffset, y: 0 }
    };
  }

  // Public methods
  getWeapon(): Weapon {
    return this.currentWeapon;
  }

  getArmor(): Armor {
    return this.currentArmor;
  }

  getLeftPod(): Pod | null {
    return this.leftPod;
  }

  getRightPod(): Pod | null {
    return this.rightPod;
  }

  getBombs(): number {
    return this.bombs;
  }

  getMaxBombs(): number {
    return this.maxBombs;
  }

  getSpeed(): number {
    return this.speed * this.currentArmor.speedModifier;
  }

  // Power-up collection
  collectWeapon(type: WeaponType): void {
    if (this.currentWeapon.type === type) {
      // Upgrade existing weapon
      if (this.currentWeapon.level < 5) {
        this.currentWeapon = this.getWeaponConfig(type, this.currentWeapon.level + 1);
      }
    } else {
      // Switch to new weapon at level 1
      this.currentWeapon = this.getWeaponConfig(type, 1);
    }
  }

  collectArmor(type: ArmorType): void {
    this.currentArmor = this.getArmorConfig(type);
  }

  collectPod(type: PodType, position: 'left' | 'right'): void {
    if (type === 'none') {
      if (position === 'left') {
        this.leftPod = null;
      } else {
        this.rightPod = null;
      }
    } else {
      const level = position === 'left' && this.leftPod ? this.leftPod.level + 1 : 1;
      const pod = this.getPodConfig(type, Math.min(level, 5), position);
      
      if (position === 'left') {
        this.leftPod = pod;
      } else {
        this.rightPod = pod;
      }
    }
  }

  collectSpeed(): void {
    this.baseSpeed = Math.min(this.baseSpeed + 1, 10);
    this.speed = this.baseSpeed;
  }

  collectBomb(): void {
    this.bombs = Math.min(this.bombs + 1, this.maxBombs);
  }

  useBomb(): boolean {
    if (this.bombs > 0) {
      this.bombs--;
      return true;
    }
    return false;
  }

  takeDamage(): boolean {
    if (this.currentArmor.hp > 1) {
      this.currentArmor.hp--;
      return false; // Ship survives
    }
    return true; // Ship destroyed
  }

  reset(): void {
    this.currentWeapon = this.getWeaponConfig('vulcan', 1);
    this.currentArmor = this.getArmorConfig('none');
    this.leftPod = null;
    this.rightPod = null;
    this.bombs = 3;
    this.speed = 5;
    this.baseSpeed = 5;
  }

  // Generate power-up drop
  generatePowerUp(x: number, y: number): PowerUpItem | null {
    const roll = Math.random();
    
    if (roll < 0.4) {
      // Weapon power-up
      const weapons: WeaponType[] = ['vulcan', 'laser', 'missile', 'spread', 'beam'];
      const weaponType = weapons[Math.floor(Math.random() * weapons.length)];
      return {
        type: 'weapon',
        weaponType,
        value: 1,
        x,
        y,
        vy: 2,
        life: 10
      };
    } else if (roll < 0.6) {
      // Armor power-up
      const armors: ArmorType[] = ['standard', 'heavy', 'speed', 'shield', 'nuke'];
      const armorType = armors[Math.floor(Math.random() * armors.length)];
      return {
        type: 'armor',
        armorType,
        value: 1,
        x,
        y,
        vy: 2,
        life: 10
      };
    } else if (roll < 0.75) {
      // Pod power-up
      const pods: PodType[] = ['vulcan', 'laser', 'missile', 'beam'];
      const podType = pods[Math.floor(Math.random() * pods.length)];
      return {
        type: 'pod',
        podType,
        value: 1,
        x,
        y,
        vy: 2,
        life: 10
      };
    } else if (roll < 0.85) {
      // Speed power-up
      return {
        type: 'speed',
        value: 1,
        x,
        y,
        vy: 2,
        life: 10
      };
    } else if (roll < 0.95) {
      // Bomb power-up
      return {
        type: 'bomb',
        value: 1,
        x,
        y,
        vy: 2,
        life: 10
      };
    } else {
      // Score power-up
      return {
        type: 'score',
        value: 1000,
        x,
        y,
        vy: 2,
        life: 10
      };
    }
  }
}
