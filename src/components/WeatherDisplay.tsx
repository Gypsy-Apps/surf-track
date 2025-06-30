import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  Wind, 
  Waves, 
  ExternalLink,
  RefreshCw,
  Info,
  Thermometer,
  Eye,
  Navigation
} from 'lucide-react';
import { weatherService, WeatherCondition } from '../lib/weatherService';
import { settingsService } from '../lib/settingsService';

interface WeatherDisplayProps {
  className?: string;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ className = '' }) => {
  const [weatherData, setWeatherData] = useState<WeatherCondition | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Settings
  const isAutoWeatherEnabled = settingsService.isAutoWeatherEnabled();
  const updateInterval = settingsService.getWeatherUpdateInterval();
  const showDetailedForecast = settingsService.shouldShowDetailedForecast();
  const primaryWeatherLink = settingsService.getPrimaryWeatherLink();
  const staticMessage = settingsService.getWeatherHeaderMessage();

  // Fetch weather data
  const fetchWeatherData = async () => {
    if (!isAutoWeatherEnabled) return;
    
    setLoading(true);
    try {
      const conditions = await weatherService.getCachedConditions();
      setWeatherData(conditions);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh
  const handleRefresh = async () => {
    weatherService.clearCache();
    await fetchWeatherData();
  };

  // Auto-update effect
  useEffect(() => {
    if (isAutoWeatherEnabled) {
      fetchWeatherData();
      
      const interval = setInterval(fetchWeatherData, updateInterval * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAutoWeatherEnabled, updateInterval]);

  // Handle mouse enter to calculate tooltip position
  const handleMouseEnter = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.right - 320, // Position tooltip to the right edge minus tooltip width
      y: rect.bottom + 8   // Position below the weather display
    });
    setShowDetails(true);
  };

  // Get weather icon based on conditions
  const getWeatherIcon = () => {
    if (!weatherData) return <Sun className="h-4 w-4 text-yellow-400" />;
    
    switch (weatherData.rating) {
      case 'excellent':
        return <Waves className="h-4 w-4 text-cyan-400" />;
      case 'good':
        return <Sun className="h-4 w-4 text-yellow-400" />;
      case 'fair':
        return <Cloud className="h-4 w-4 text-gray-400" />;
      case 'poor':
        return <CloudRain className="h-4 w-4 text-gray-500" />;
      default:
        return <Sun className="h-4 w-4 text-yellow-400" />;
    }
  };

  // Get display message
  const getDisplayMessage = () => {
    if (!isAutoWeatherEnabled || !weatherData) {
      return staticMessage;
    }
    
    return weatherService.generateWeatherMessage(weatherData);
  };

  // Get rating color
  const getRatingColor = () => {
    if (!weatherData) return 'text-white';
    
    switch (weatherData.rating) {
      case 'excellent':
        return 'text-cyan-300';
      case 'good':
        return 'text-green-300';
      case 'fair':
        return 'text-yellow-300';
      case 'poor':
        return 'text-red-300';
      default:
        return 'text-white';
    }
  };

  // Render detailed forecast tooltip using Portal
  const renderDetailedForecast = () => {
    if (!weatherData || !showDetailedForecast || !showDetails) return null;

    const tooltipContent = (
      <div 
        className="fixed bg-black/95 backdrop-blur-md rounded-lg p-4 min-w-80 border border-white/20 shadow-2xl"
        style={{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`,
          zIndex: 999999
        }}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-white">Current Conditions</h4>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
              title="Refresh weather data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Thermometer className="h-4 w-4 text-orange-400" />
                <span className="text-cyan-200">Temperature:</span>
                <span className="text-white font-medium">{weatherData.temperature}°C</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Waves className="h-4 w-4 text-blue-400" />
                <span className="text-cyan-200">Wave Height:</span>
                <span className="text-white font-medium">{weatherData.waveHeight}ft</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Wind className="h-4 w-4 text-gray-400" />
                <span className="text-cyan-200">Wind:</span>
                <span className="text-white font-medium">{weatherData.windSpeed}mph {weatherData.windDirection}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Navigation className="h-4 w-4 text-purple-400" />
                <span className="text-cyan-200">Wave Period:</span>
                <span className="text-white font-medium">{weatherData.wavePeriod}s</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-indigo-400" />
                <span className="text-cyan-200">Tide:</span>
                <span className="text-white font-medium">{weatherData.tideStatus}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-emerald-400" />
                <span className="text-cyan-200">Rating:</span>
                <span className={`font-medium ${getRatingColor()}`}>
                  {weatherData.rating.charAt(0).toUpperCase() + weatherData.rating.slice(1)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t border-white/20">
            <p className="text-cyan-200 text-sm">
              <span className="font-medium">Conditions:</span> {weatherData.conditions}
            </p>
            {lastUpdated && (
              <p className="text-gray-400 text-xs mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          {primaryWeatherLink && (
            <div className="pt-2 border-t border-white/20">
              <a
                href={primaryWeatherLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center space-x-1 transition-colors"
              >
                <span>View full forecast</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    );

    // Use React Portal to render tooltip at document root
    return createPortal(tooltipContent, document.body);
  };

  return (
    <>
      <div 
        className={`relative flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2 ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowDetails(false)}
      >
        {getWeatherIcon()}
        
        {primaryWeatherLink ? (
          <a
            href={primaryWeatherLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm hover:text-cyan-200 transition-colors flex items-center space-x-1 ${getRatingColor()}`}
            title={primaryWeatherLink.description}
          >
            <span>{getDisplayMessage()}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className={`text-sm ${getRatingColor()}`}>
            {getDisplayMessage()}
          </span>
        )}
        
        {loading && (
          <RefreshCw className="h-3 w-3 text-cyan-400 animate-spin" />
        )}
      </div>
      
      {renderDetailedForecast()}
    </>
  );
};

export default WeatherDisplay;