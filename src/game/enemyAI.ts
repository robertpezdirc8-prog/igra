// Advanced Enemy AI System
export interface EnemyAIState {
  currentBehavior: 'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'circle';
  targetX: number;
  targetY: number;
  attackCooldown: number;
  stateTimer: number;
  memory: {
    playerLastX: number;
    playerLastY: number;
    playerVelocityX: number;
    playerVelocityY: number;
    recentPlayerPositions: Array<{ x: number; y: number; time: number }>;
  };
}

export class AdvancedEnemyAI {
  private state: EnemyAIState;
  private personality: {
    aggression: number; // 0-1
    intelligence: number; // 0-1
    reactionTime: number; // 0-1
    accuracy: number; // 0-1
  };

  constructor(personality: {
    aggression?: number;
    intelligence?: number;
    reactionTime?: number;
    accuracy?: number;
  } = {}) {
    this.state = {
      currentBehavior: 'idle',
      targetX: 0,
      targetY: 0,
      attackCooldown: 0,
      stateTimer: 0,
      memory: {
        playerLastX: 0,
        playerLastY: 0,
        playerVelocityX: 0,
        playerVelocityY: 0,
        recentPlayerPositions: []
      }
    };

    this.personality = {
      aggression: personality.aggression ?? 0.5,
      intelligence: personality.intelligence ?? 0.5,
      reactionTime: personality.reactionTime ?? 0.5,
      accuracy: personality.accuracy ?? 0.5
    };
  }

  update(
    enemyX: number,
    enemyY: number,
    playerX: number,
    playerY: number,
    playerVelocityX: number,
    playerVelocityY: number,
    deltaTime: number
  ): { moveX: number; moveY: number; shouldAttack: boolean; attackAngle: number } {
    // Update memory
    this.state.memory.playerLastX = playerX;
    this.state.memory.playerLastY = playerY;
    this.state.memory.playerVelocityX = playerVelocityX;
    this.state.memory.playerVelocityY = playerVelocityY;
    
    // Store recent positions for prediction
    this.state.memory.recentPlayerPositions.push({
      x: playerX,
      y: playerY,
      time: Date.now()
    });
    
    // Keep only last 10 positions
    if (this.state.memory.recentPlayerPositions.length > 10) {
      this.state.memory.recentPlayerPositions.shift();
    }

    // Update cooldowns
    this.state.attackCooldown = Math.max(0, this.state.attackCooldown - deltaTime);
    this.state.stateTimer += deltaTime;

    // Predict player position
    const predictionTime = 0.5 * this.personality.intelligence;
    const predictedX = playerX + playerVelocityX * predictionTime;
    const predictedY = playerY + playerVelocityY * predictionTime;

    // Calculate distance
    const dx = predictedX - enemyX;
    const dy = predictedY - enemyY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // State machine
    let moveX = 0;
    let moveY = 0;
    let shouldAttack = false;
    let attackAngle = 0;

    switch (this.state.currentBehavior) {
      case 'idle': {
        if (distance < 400 && this.personality.aggression > 0.3) {
          this.state.currentBehavior = 'chase';
          this.state.stateTimer = 0;
        }
        break;
      }

      case 'patrol': {
        // Move towards target
        const patrolDx = this.state.targetX - enemyX;
        const patrolDy = this.state.targetY - enemyY;
        const patrolDist = Math.sqrt(patrolDx * patrolDx + patrolDy * patrolDy);
        
        if (patrolDist > 10) {
          moveX = patrolDx / patrolDist;
          moveY = patrolDy / patrolDist;
        } else {
          // Pick new patrol target
          this.state.targetX = enemyX + (Math.random() - 0.5) * 300;
          this.state.targetY = enemyY + (Math.random() - 0.5) * 300;
        }

        // Switch to chase if player is close
        if (distance < 300 && this.personality.aggression > 0.4) {
          this.state.currentBehavior = 'chase';
          this.state.stateTimer = 0;
        }
        break;
      }

      case 'chase': {
        // Move towards predicted player position
        if (distance > 100) {
          moveX = dx / distance;
          moveY = dy / distance;
        }

        // Attack if close enough and cooldown is ready
        if (distance < 200 && this.state.attackCooldown <= 0) {
          this.state.currentBehavior = 'attack';
          this.state.stateTimer = 0;
        }

        // Switch to circle if intelligence is high
        if (this.personality.intelligence > 0.7 && distance < 300 && Math.random() < 0.01) {
          this.state.currentBehavior = 'circle';
          this.state.stateTimer = 0;
        }

        // Give up if player is too far
        if (distance > 600) {
          this.state.currentBehavior = 'patrol';
          this.state.stateTimer = 0;
        }
        break;
      }

      case 'attack': {
        // Aim at predicted position
        attackAngle = Math.atan2(dy, dx);
        
        // Add inaccuracy based on personality
        const inaccuracy = (1 - this.personality.accuracy) * 0.3;
        attackAngle += (Math.random() - 0.5) * inaccuracy;
        
        shouldAttack = true;
        this.state.attackCooldown = 1 + Math.random() * 2;

        // Move back after attacking
        if (distance < 150) {
          moveX = -dx / distance;
          moveY = -dy / distance;
        }

        // Switch back to chase
        if (this.state.stateTimer > 0.5) {
          this.state.currentBehavior = 'chase';
          this.state.stateTimer = 0;
        }
        break;
      }

      case 'circle': {
        // Circle around player
        const circleAngle = Math.atan2(dy, dx) + Math.PI / 2;
        moveX = Math.cos(circleAngle);
        moveY = Math.sin(circleAngle);

        // Attack while circling
        if (this.state.attackCooldown <= 0 && distance < 250) {
          attackAngle = Math.atan2(dy, dx);
          const circleInaccuracy = (1 - this.personality.accuracy) * 0.2;
          attackAngle += (Math.random() - 0.5) * circleInaccuracy;
          shouldAttack = true;
          this.state.attackCooldown = 0.8 + Math.random() * 1.5;
        }

        // Switch to chase after some time
        if (this.state.stateTimer > 3 + Math.random() * 2) {
          this.state.currentBehavior = 'chase';
          this.state.stateTimer = 0;
        }
        break;
      }

      case 'flee': {
        // Move away from player
        if (distance > 0) {
          moveX = -dx / distance;
          moveY = -dy / distance;
        }

        // Stop fleeing if far enough
        if (distance > 500) {
          this.state.currentBehavior = 'patrol';
          this.state.stateTimer = 0;
        }
        break;
      }
    }

    // Low health behavior
    // (This would be called from the enemy update with health info)

    return { moveX, moveY, shouldAttack, attackAngle };
  }

  setLowHealth(healthPercent: number): void {
    if (healthPercent < 0.3 && this.personality.aggression < 0.7) {
      this.state.currentBehavior = 'flee';
      this.state.stateTimer = 0;
    }
  }

  getState(): EnemyAIState {
    return { ...this.state };
  }

  getPersonality() {
    return { ...this.personality };
  }
}

// Boss AI with multiple phases
export class BossAI {
  private phase: number = 1;
  private maxPhases: number;
  private phaseTransitions: number[]; // HP thresholds for phase changes
  private attackPatterns: Array<{
    name: string;
    probability: number;
    cooldown: number;
    currentCooldown: number;
  }>;
  private currentPattern: string | null = null;
  private patternTimer: number = 0;
  private movementPattern: 'hover' | 'circle' | 'figure8' | 'random' | 'chase';
  private movementTimer: number = 0;

  constructor(maxPhases: number = 3) {
    this.maxPhases = maxPhases;
    this.phaseTransitions = Array.from({ length: maxPhases - 1 }, (_, i) => 
      1 - (i + 1) / maxPhases
    );

    this.attackPatterns = [
      { name: 'spiral', probability: 0.25, cooldown: 3, currentCooldown: 0 },
      { name: 'burst', probability: 0.2, cooldown: 4, currentCooldown: 0 },
      { name: 'laser', probability: 0.15, cooldown: 5, currentCooldown: 0 },
      { name: 'homing', probability: 0.15, cooldown: 6, currentCooldown: 0 },
      { name: 'ring', probability: 0.1, cooldown: 4, currentCooldown: 0 },
      { name: 'wave', probability: 0.15, cooldown: 5, currentCooldown: 0 }
    ];

    this.movementPattern = 'hover';
  }

  update(
    bossX: number,
    bossY: number,
    playerX: number,
    playerY: number,
    healthPercent: number,
    deltaTime: number
  ): {
    moveX: number;
    moveY: number;
    attackPattern: string | null;
    shouldAttack: boolean;
  } {
    // Check for phase transition
    for (let i = 0; i < this.phaseTransitions.length; i++) {
      if (healthPercent <= this.phaseTransitions[i] && this.phase === i + 1) {
        this.phase = i + 2;
        this.onPhaseChange();
      }
    }

    // Update cooldowns
    this.attackPatterns.forEach(pattern => {
      pattern.currentCooldown = Math.max(0, pattern.currentCooldown - deltaTime);
    });
    this.patternTimer += deltaTime;
    this.movementTimer += deltaTime;

    // Choose attack pattern
    let attackPattern: string | null = null;
    let shouldAttack = false;

    if (!this.currentPattern || this.patternTimer > 5) {
      // Choose new pattern based on probability
      const roll = Math.random();
      let cumulative = 0;
      
      for (const pattern of this.attackPatterns) {
        if (pattern.currentCooldown <= 0) {
          cumulative += pattern.probability;
          if (roll <= cumulative) {
            this.currentPattern = pattern.name;
            pattern.currentCooldown = pattern.cooldown;
            this.patternTimer = 0;
            break;
          }
        }
      }
    }

    if (this.currentPattern && this.patternTimer < 2) {
      attackPattern = this.currentPattern;
      shouldAttack = true;
    } else {
      this.currentPattern = null;
    }

    // Movement based on pattern
    let moveX = 0;
    let moveY = 0;

    switch (this.movementPattern) {
      case 'hover': {
        // Hover in place with slight movement
        moveX = Math.sin(this.movementTimer * 0.5) * 0.2;
        moveY = Math.cos(this.movementTimer * 0.3) * 0.2;
        
        // Change pattern occasionally
        if (this.movementTimer > 5) {
          const patterns: Array<'hover' | 'circle' | 'figure8' | 'random' | 'chase'> = ['hover', 'circle', 'figure8', 'random'];
          this.movementPattern = patterns[Math.floor(Math.random() * patterns.length)];
          this.movementTimer = 0;
        }
        break;
      }

      case 'circle': {
        // Circle around player
        const angle = this.movementTimer * 0.5;
        const radius = 200;
        const targetX = playerX + Math.cos(angle) * radius;
        const targetY = playerY + Math.sin(angle) * radius;
        const dx = targetX - bossX;
        const dy = targetY - bossY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 10) {
          moveX = dx / dist;
          moveY = dy / dist;
        }

        if (this.movementTimer > 8) {
          this.movementPattern = 'hover';
          this.movementTimer = 0;
        }
        break;
      }

      case 'figure8': {
        // Figure 8 pattern
        const t = this.movementTimer * 0.3;
        const fig8X = Math.sin(t) * 150;
        const fig8Y = Math.sin(t * 2) * 100;
        const fig8TargetX = playerX + fig8X;
        const fig8TargetY = playerY + fig8Y;
        const fig8Dx = fig8TargetX - bossX;
        const fig8Dy = fig8TargetY - bossY;
        const fig8Dist = Math.sqrt(fig8Dx * fig8Dx + fig8Dy * fig8Dy);
        
        if (fig8Dist > 10) {
          moveX = fig8Dx / fig8Dist;
          moveY = fig8Dy / fig8Dist;
        }

        if (this.movementTimer > 10) {
          this.movementPattern = 'hover';
          this.movementTimer = 0;
        }
        break;
      }

      case 'random': {
        // Random movement
        if (this.movementTimer > 2) {
          moveX = (Math.random() - 0.5) * 2;
          moveY = (Math.random() - 0.5) * 2;
          this.movementTimer = 0;
        }

        if (this.movementTimer > 6) {
          this.movementPattern = 'hover';
          this.movementTimer = 0;
        }
        break;
      }

      case 'chase': {
        // Chase player
        const chaseDx = playerX - bossX;
        const chaseDy = playerY - bossY;
        const chaseDist = Math.sqrt(chaseDx * chaseDx + chaseDy * chaseDy);
        
        if (chaseDist > 150) {
          moveX = chaseDx / chaseDist;
          moveY = chaseDy / chaseDist;
        }

        if (this.movementTimer > 5) {
          this.movementPattern = 'hover';
          this.movementTimer = 0;
        }
        break;
      }
    }

    return { moveX, moveY, attackPattern, shouldAttack };
  }

  private onPhaseChange(): void {
    // Increase difficulty in later phases
    this.attackPatterns.forEach(pattern => {
      pattern.cooldown *= 0.8; // Faster attacks
      pattern.probability *= 1.2; // More aggressive
    });

    // Change movement pattern based on phase
    if (this.phase === 2) {
      this.movementPattern = 'circle';
    } else if (this.phase === 3) {
      this.movementPattern = 'figure8';
    }
  }

  getPhase(): number {
    return this.phase;
  }

  getCurrentPattern(): string | null {
    return this.currentPattern;
  }
}

// Formation system for enemy groups
export class FormationSystem {
  private formationType: 'line' | 'circle' | 'vshape' | 'random' | 'spiral';
  private centerX: number;
  private centerY: number;
  private rotation: number = 0;
  private scale: number = 1;

  constructor(formationType: 'line' | 'circle' | 'vshape' | 'random' | 'spiral' = 'circle') {
    this.formationType = formationType;
    this.centerX = 0;
    this.centerY = 0;
  }

  setCenter(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;
  }

  setRotation(rotation: number): void {
    this.rotation = rotation;
  }

  setScale(scale: number): void {
    this.scale = scale;
  }

  getPosition(index: number, totalEnemies: number): { x: number; y: number } {
    let x = 0;
    let y = 0;

    switch (this.formationType) {
      case 'line': {
        x = (index - totalEnemies / 2) * 50 * this.scale;
        y = 0;
        break;
      }

      case 'circle': {
        const angle = (index / totalEnemies) * Math.PI * 2;
        const radius = 100 * this.scale;
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
        break;
      }

      case 'vshape': {
        const vIndex = index - totalEnemies / 2;
        x = vIndex * 40 * this.scale;
        y = Math.abs(vIndex) * 30 * this.scale;
        break;
      }

      case 'random': {
        x = (Math.random() - 0.5) * 200 * this.scale;
        y = (Math.random() - 0.5) * 200 * this.scale;
        break;
      }

      case 'spiral': {
        const spiralAngle = (index / totalEnemies) * Math.PI * 4;
        const spiralRadius = (index / totalEnemies) * 150 * this.scale;
        x = Math.cos(spiralAngle) * spiralRadius;
        y = Math.sin(spiralAngle) * spiralRadius;
        break;
      }
    }

    // Apply rotation
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    const rotatedX = x * cos - y * sin;
    const rotatedY = x * sin + y * cos;

    return {
      x: this.centerX + rotatedX,
      y: this.centerY + rotatedY
    };
  }

  update(deltaTime: number): void {
    // Optional: animate formation
    this.rotation += deltaTime * 0.1;
  }
}
