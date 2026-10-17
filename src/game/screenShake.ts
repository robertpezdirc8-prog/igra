// Screen Shake System for dynamic camera effects

export class ScreenShake {
  private intensity: number = 0;
  private duration: number = 0;
  private timer: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;

  constructor() {}

  shake(intensity: number, duration: number) {
    this.intensity = Math.max(this.intensity, intensity);
    this.duration = Math.max(this.duration, duration);
    this.timer = this.duration;
  }

  update(deltaTime: number) {
    if (this.timer > 0) {
      this.timer -= deltaTime;
      
      // Calculate shake offset
      const progress = this.timer / this.duration;
      const currentIntensity = this.intensity * progress;
      
      this.offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      this.offsetY = (Math.random() - 0.5) * 2 * currentIntensity;
      
      // Decay intensity
      if (this.timer <= 0) {
        this.intensity = 0;
        this.duration = 0;
        this.offsetX = 0;
        this.offsetY = 0;
      }
    }
  }

  getOffset(): { x: number; y: number } {
    return { x: this.offsetX, y: this.offsetY };
  }

  isShaking(): boolean {
    return this.timer > 0;
  }

  reset() {
    this.intensity = 0;
    this.duration = 0;
    this.timer = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }
}
