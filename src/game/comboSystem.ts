// Combo System for bonus scoring

export class ComboSystem {
  private combo: number = 0;
  private comboTimer: number = 0;
  private maxCombo: number = 0;
  private comboTimeout: number = 2; // seconds
  private multiplier: number = 1;

  constructor() {}

  addKill() {
    this.combo++;
    this.comboTimer = this.comboTimeout;
    
    // Update multiplier based on combo
    if (this.combo >= 50) {
      this.multiplier = 5;
    } else if (this.combo >= 30) {
      this.multiplier = 4;
    } else if (this.combo >= 20) {
      this.multiplier = 3;
    } else if (this.combo >= 10) {
      this.multiplier = 2;
    } else if (this.combo >= 5) {
      this.multiplier = 1.5;
    } else {
      this.multiplier = 1;
    }
    
    // Update max combo
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
  }

  update(deltaTime: number) {
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaTime;
      
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.multiplier = 1;
      }
    }
  }

  getCombo(): number {
    return this.combo;
  }

  getMaxCombo(): number {
    return this.maxCombo;
  }

  getMultiplier(): number {
    return this.multiplier;
  }

  getTimer(): number {
    return this.comboTimer;
  }

  getTimeout(): number {
    return this.comboTimeout;
  }

  reset() {
    this.combo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;
    this.multiplier = 1;
  }
}
