// UI components actually used by the application.
// Effect/prototype components that were never rendered have been removed.

// Shared building blocks
export { Button } from './Button';
export { Notification } from './Notification';
export { HUDBar, ComboCounter, WaveAnnouncement } from './HUD';

// Screens & menus
export { LoadingScreen } from './LoadingScreen';
export { MainMenu } from './MainMenu';
export { PauseMenu } from './PauseMenu';
export { GameOverScreen } from './GameOverScreen';
export { LevelUpScreen } from './LevelUpScreen';
export { LevelUpChoiceScreen } from './LevelUpChoiceScreen';
export { SettingsMenu } from './SettingsMenu';
export { TutorialOverlay } from './TutorialOverlay';
export { InteractiveTutorial } from './InteractiveTutorial';

// Feedback
export { AchievementNotification } from './AchievementNotification';
export { AchievementPanel } from './AchievementPanel';
export { DamageFlash } from './DamageFlash';

// In-game HUD (fed with real engine data via App.tsx)
export { MobileControls } from './MobileControls';
export { KeyboardHints } from './KeyboardHints';
export { MiniMap } from './MiniMap';
export { HealthBar } from './HealthBar';
export { ScoreDisplay } from './ScoreDisplay';
export { WeaponIndicator } from './WeaponIndicator';
export { Crosshair } from './Crosshair';
export { WaveInfo } from './WaveInfo';
export { ComboDisplay } from './ComboDisplay';
export { GameTimer } from './GameTimer';
export { LevelDisplay } from './LevelDisplay';
export { LevelInfo } from './LevelInfo';

// Meta systems
export { SkillTreeUI } from './SkillTreeUI';
export { DailyChallengesUI } from './DailyChallengesUI';
export { SaveLoadUI } from './SaveLoadUI';
export { StatsLeaderboardUI } from './StatsLeaderboardUI';
export { ArcadeGame } from './ArcadeGame';
export { DailyRewardsUI } from './DailyRewardsUI';
export { ShopUI } from './ShopUI';
export { DifficultySelectUI } from './DifficultySelectUI';
export { MetaProgressionUI } from './MetaProgressionUI';

// Advanced systems UI (merged from webgpu-online-games-51d72)
export { AchievementUI } from './AchievementUI';
export { ActivePowerUpsDisplay, ActiveCombosDisplay, PowerUpNotification } from './ActivePowerUpsDisplay';
export { EnemyAIDisplay, AIBehaviorLegend } from './EnemyAIDisplay';
export { EnemyVisualEffects } from './EnemyVisualEffects';
export { FormationVisualization, FormationSelector } from './FormationVisualization';
export { WeatherDisplay, WeatherSelector } from './WeatherDisplay';

// Decorative in-game overlays (merged from webgpu-online-games-51d72)
export { BloomEffect } from './BloomEffect';
export { ParticleOverlay } from './ParticleOverlay';
export { ChromaticAberration } from './ChromaticAberration';
export { OrientationWarning } from './OrientationWarning';
export { ClassicArcadeMode } from './ClassicArcadeMode';
