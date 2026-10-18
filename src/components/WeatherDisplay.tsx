import React from 'react';
import { WeatherType } from '../game/weatherSystem';
import { t, useLang } from '../i18n';

interface WeatherDisplayProps {
  currentWeather: WeatherType;
  intensity: number;
  timeRemaining: number;
}

export const WeatherDisplay: React.FC<WeatherDisplayProps> = ({
  currentWeather,
  intensity,
  timeRemaining
}) => {
  useLang();
  const getWeatherInfo = (weather: WeatherType) => {
    switch (weather) {
      case 'clear':
        return { icon: '☀️', name: t('weather.clear.name'), color: '#ffdd00', description: t('weather.clear.desc') };
      case 'rain':
        return { icon: '🌧️', name: t('weather.rain.name'), color: '#4488ff', description: t('weather.rain.desc') };
      case 'snow':
        return { icon: '🌨️', name: t('weather.snow.name'), color: '#aaccff', description: t('weather.snow.desc') };
      case 'storm':
        return { icon: '⛈️', name: t('weather.storm.name'), color: '#222244', description: t('weather.storm.desc') };
      case 'fog':
        return { icon: '🌫️', name: t('weather.fog.name'), color: '#888888', description: t('weather.fog.desc') };
      case 'sandstorm':
        return { icon: '🌪️', name: t('weather.sandstorm.name'), color: '#aa8844', description: t('weather.sandstorm.desc') };
      case 'meteor':
        return { icon: '☄️', name: t('weather.meteor.name'), color: '#ff4400', description: t('weather.meteor.desc') };
      default:
        return { icon: '❓', name: t('weather.unknown'), color: '#ffffff', description: '' };
    }
  };

  const weatherInfo = getWeatherInfo(currentWeather);
  const formatTime = (seconds: number) => {
    if (seconds < 0) return '∞';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-4 left-4 bg-black/90 border-2 rounded-lg p-4 min-w-[250px] backdrop-blur-sm z-40"
         style={{ borderColor: weatherInfo.color }}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl">{weatherInfo.icon}</span>
        <div>
          <div className="text-lg font-bold" style={{ color: weatherInfo.color }}>
            {weatherInfo.name}
          </div>
          <div className="text-xs text-gray-400">
            {weatherInfo.description}
          </div>
        </div>
      </div>

      {/* Intensity bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{t('weather.intensity')}</span>
          <span>{Math.round(intensity * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${intensity * 100}%`,
              backgroundColor: weatherInfo.color,
              boxShadow: `0 0 10px ${weatherInfo.color}`
            }}
          />
        </div>
      </div>

      {/* Time remaining */}
      {timeRemaining >= 0 && (
        <div className="text-sm text-gray-400">
          {t('weather.timeRemaining')} <span style={{ color: weatherInfo.color }}>{formatTime(timeRemaining)}</span>
        </div>
      )}

      {/* Weather effects indicator */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-2">{t('weather.effects')}</div>
        <div className="space-y-1 text-xs">
          {currentWeather === 'rain' && (
            <>
              <div className="text-blue-400">• {t('weather.fx.visibility')}: -30%</div>
              <div className="text-blue-400">• {t('weather.fx.atmosphere')}</div>
            </>
          )}
          {currentWeather === 'snow' && (
            <>
              <div className="text-cyan-400">• {t('weather.fx.moveSpeed')}: -20%</div>
              <div className="text-cyan-400">• {t('weather.fx.visibility')}: -20%</div>
            </>
          )}
          {currentWeather === 'storm' && (
            <>
              <div className="text-purple-400">• {t('weather.fx.visibility')}: -50%</div>
              <div className="text-purple-400">• {t('weather.fx.lightning')}</div>
              <div className="text-purple-400">• {t('weather.fx.moveSpeed')}: -30%</div>
            </>
          )}
          {currentWeather === 'fog' && (
            <>
              <div className="text-gray-400">• {t('weather.fx.visibility')}: -70%</div>
              <div className="text-gray-400">• {t('weather.fx.range')}: -50%</div>
            </>
          )}
          {currentWeather === 'sandstorm' && (
            <>
              <div className="text-orange-400">• {t('weather.fx.visibility')}: -60%</div>
              <div className="text-orange-400">• {t('weather.fx.accuracy')}: -40%</div>
              <div className="text-orange-400">• {t('weather.fx.moveSpeed')}: -25%</div>
            </>
          )}
          {currentWeather === 'meteor' && (
            <>
              <div className="text-red-400">• {t('weather.fx.dangerHigh')}</div>
              <div className="text-red-400">• {t('weather.fx.randomDamage')}</div>
            </>
          )}
          {currentWeather === 'clear' && (
            <div className="text-green-400">• {t('weather.fx.none')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Weather selector component
interface WeatherSelectorProps {
  currentWeather: WeatherType;
  onWeatherChange: (weather: WeatherType, intensity: number, duration: number) => void;
}

export const WeatherSelector: React.FC<WeatherSelectorProps> = ({
  currentWeather,
  onWeatherChange
}) => {
  useLang();
  const [selectedWeather, setSelectedWeather] = React.useState<WeatherType>(currentWeather);
  const [intensity, setIntensity] = React.useState(1.0);
  const [duration, setDuration] = React.useState(60);

  const weathers: Array<{ type: WeatherType; icon: string; name: string }> = [
    { type: 'clear', icon: '☀️', name: t('weather.clear.name') },
    { type: 'rain', icon: '🌧️', name: t('weather.rain.name') },
    { type: 'snow', icon: '🌨️', name: t('weather.snow.name') },
    { type: 'storm', icon: '⛈️', name: t('weather.storm.name') },
    { type: 'fog', icon: '🌫️', name: t('weather.fog.name') },
    { type: 'sandstorm', icon: '🌪️', name: t('weather.sandstorm.name') },
    { type: 'meteor', icon: '☄️', name: t('weather.meteor.name') }
  ];

  const handleApply = () => {
    onWeatherChange(selectedWeather, intensity, duration);
  };

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 border-2 border-cyan-500 rounded-lg p-4 min-w-[300px] backdrop-blur-sm z-40">
      <h3 className="text-lg font-bold text-cyan-400 mb-3">{t('weather.settings')}</h3>

      {/* Weather type selector */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">{t('weather.typeLabel')}</div>
        <div className="grid grid-cols-4 gap-2">
          {weathers.map(weather => (
            <button
              key={weather.type}
              onClick={() => setSelectedWeather(weather.type)}
              className={`p-2 rounded border-2 transition-all ${
                selectedWeather === weather.type
                  ? 'border-cyan-400 bg-cyan-400/20'
                  : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
              }`}
            >
              <div className="text-2xl mb-1">{weather.icon}</div>
              <div className="text-xs text-gray-300">{weather.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Intensity slider */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>{t('weather.intensity')}</span>
          <span>{Math.round(intensity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={intensity}
          onChange={(e) => setIntensity(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </div>

      {/* Duration slider */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>{t('weather.duration')}</span>
          <span>{duration === -1 ? '∞' : `${duration}s`}</span>
        </div>
        <input
          type="range"
          min="-1"
          max="300"
          step="10"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <div className="text-xs text-gray-500 mt-1">
          {t('weather.infiniteHint')}
        </div>
      </div>

      {/* Apply button */}
      <button
        onClick={handleApply}
        className="w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded transition-all"
      >
        {t('weather.apply')}
      </button>
    </div>
  );
};
