import React from 'react';
import { WeatherType } from '../game/weatherSystem';

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
  const getWeatherInfo = (weather: WeatherType) => {
    switch (weather) {
      case 'clear':
        return { icon: '☀️', name: 'Jasno', color: '#ffdd00', description: 'Čisto nebo, brez posebnih efektov' };
      case 'rain':
        return { icon: '🌧️', name: 'Dež', color: '#4488ff', description: 'Dež zmanjša vidljivost' };
      case 'snow':
        return { icon: '🌨️', name: 'Sneg', color: '#aaccff', description: 'Sneg upočasni gibanje' };
      case 'storm':
        return { icon: '⛈️', name: 'Nevihta', color: '#222244', description: 'Nevihta z bliskanjem in močnim dežjem' };
      case 'fog':
        return { icon: '🌫️', name: 'Megla', color: '#888888', description: 'Megla močno zmanjša vidljivost' };
      case 'sandstorm':
        return { icon: '🌪️', name: 'Peščeni vihar', color: '#aa8844', description: 'Peščeni vihar zmanjša vidljivost in natančnost' };
      case 'meteor':
        return { icon: '☄️', name: 'Meteorski dež', color: '#ff4400', description: 'Meteoriti padajo z neba' };
      default:
        return { icon: '❓', name: 'Neznano', color: '#ffffff', description: '' };
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
          <span>Intenzivnost</span>
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
          Preostali čas: <span style={{ color: weatherInfo.color }}>{formatTime(timeRemaining)}</span>
        </div>
      )}

      {/* Weather effects indicator */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-2">Efekti:</div>
        <div className="space-y-1 text-xs">
          {currentWeather === 'rain' && (
            <>
              <div className="text-blue-400">• Vidljivost: -30%</div>
              <div className="text-blue-400">• Atmosfera</div>
            </>
          )}
          {currentWeather === 'snow' && (
            <>
              <div className="text-cyan-400">• Hitrost gibanja: -20%</div>
              <div className="text-cyan-400">• Vidljivost: -20%</div>
            </>
          )}
          {currentWeather === 'storm' && (
            <>
              <div className="text-purple-400">• Vidljivost: -50%</div>
              <div className="text-purple-400">• Možnost strele</div>
              <div className="text-purple-400">• Hitrost gibanja: -30%</div>
            </>
          )}
          {currentWeather === 'fog' && (
            <>
              <div className="text-gray-400">• Vidljivost: -70%</div>
              <div className="text-gray-400">• Domet: -50%</div>
            </>
          )}
          {currentWeather === 'sandstorm' && (
            <>
              <div className="text-orange-400">• Vidljivost: -60%</div>
              <div className="text-orange-400">• Natančnost: -40%</div>
              <div className="text-orange-400">• Hitrost gibanja: -25%</div>
            </>
          )}
          {currentWeather === 'meteor' && (
            <>
              <div className="text-red-400">• Nevarnost: Visoka</div>
              <div className="text-red-400">• Naključna škoda</div>
            </>
          )}
          {currentWeather === 'clear' && (
            <div className="text-green-400">• Brez negativnih efektov</div>
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
  const [selectedWeather, setSelectedWeather] = React.useState<WeatherType>(currentWeather);
  const [intensity, setIntensity] = React.useState(1.0);
  const [duration, setDuration] = React.useState(60);

  const weathers: Array<{ type: WeatherType; icon: string; name: string }> = [
    { type: 'clear', icon: '☀️', name: 'Jasno' },
    { type: 'rain', icon: '🌧️', name: 'Dež' },
    { type: 'snow', icon: '🌨️', name: 'Sneg' },
    { type: 'storm', icon: '⛈️', name: 'Nevihta' },
    { type: 'fog', icon: '🌫️', name: 'Megla' },
    { type: 'sandstorm', icon: '🌪️', name: 'Peščeni vihar' },
    { type: 'meteor', icon: '☄️', name: 'Meteorski dež' }
  ];

  const handleApply = () => {
    onWeatherChange(selectedWeather, intensity, duration);
  };

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 border-2 border-cyan-500 rounded-lg p-4 min-w-[300px] backdrop-blur-sm z-40">
      <h3 className="text-lg font-bold text-cyan-400 mb-3">Nastavitve vremena</h3>

      {/* Weather type selector */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Tip vremena:</div>
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
          <span>Intenzivnost</span>
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
          <span>Trajanje</span>
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
          -1 = neskončno trajanje
        </div>
      </div>

      {/* Apply button */}
      <button
        onClick={handleApply}
        className="w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded transition-all"
      >
        Uporabi vreme
      </button>
    </div>
  );
};
