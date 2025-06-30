// Weather service for fetching real-time surf and weather conditions
export interface WeatherCondition {
  temperature: number;
  windSpeed: number;
  windDirection: string;
  waveHeight: number;
  waveDirection: string;
  wavePeriod: number;
  tideStatus: string;
  conditions: string;
  rating: 'poor' | 'fair' | 'good' | 'excellent';
  lastUpdated: string;
}

export interface WeatherProvider {
  name: string;
  apiKey?: string;
  enabled: boolean;
  priority: number;
}

// Mock weather data for demonstration (in production, this would fetch from real APIs)
const generateMockWeatherData = (): WeatherCondition => {
  const conditions = ['Glassy', 'Light offshore', 'Clean waves', 'Choppy', 'Blown out', 'Perfect barrels'];
  const ratings: ('poor' | 'fair' | 'good' | 'excellent')[] = ['poor', 'fair', 'good', 'excellent'];
  const tideStatuses = ['Low tide', 'Rising tide', 'High tide', 'Falling tide'];
  const windDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  
  return {
    temperature: Math.floor(Math.random() * 10) + 18, // 18-28°C (equivalent to 65-80°F)
    windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 mph
    windDirection: windDirections[Math.floor(Math.random() * windDirections.length)],
    waveHeight: Math.floor(Math.random() * 6) + 2, // 2-8 feet
    waveDirection: windDirections[Math.floor(Math.random() * windDirections.length)],
    wavePeriod: Math.floor(Math.random() * 8) + 8, // 8-16 seconds
    tideStatus: tideStatuses[Math.floor(Math.random() * tideStatuses.length)],
    conditions: conditions[Math.floor(Math.random() * conditions.length)],
    rating: ratings[Math.floor(Math.random() * ratings.length)],
    lastUpdated: new Date().toISOString()
  };
};

export const weatherService = {
  // Get current weather conditions
  async getCurrentConditions(): Promise<WeatherCondition> {
    try {
      // In production, this would make actual API calls to:
      // - Surfline API for surf conditions
      // - OpenWeatherMap for general weather
      // - NOAA for marine conditions
      
      // For now, return mock data with realistic variations
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(generateMockWeatherData());
        }, 500); // Simulate API delay
      });
    } catch (error) {
      console.error('Error fetching weather conditions:', error);
      // Return fallback data
      return {
        temperature: 22, // 22°C (equivalent to 72°F)
        windSpeed: 10,
        windDirection: 'W',
        waveHeight: 4,
        waveDirection: 'SW',
        wavePeriod: 12,
        tideStatus: 'Rising tide',
        conditions: 'Good conditions',
        rating: 'good',
        lastUpdated: new Date().toISOString()
      };
    }
  },

  // Generate a brief weather message for the header
  generateWeatherMessage(conditions: WeatherCondition): string {
    const { waveHeight, conditions: conditionsText, rating, windSpeed } = conditions;
    
    // Create contextual messages based on conditions
    if (rating === 'excellent') {
      return `🌊 Epic ${waveHeight}ft waves - ${conditionsText.toLowerCase()}!`;
    } else if (rating === 'good') {
      return `🏄‍♂️ Good ${waveHeight}ft surf - ${conditionsText.toLowerCase()}`;
    } else if (rating === 'fair') {
      return `🌊 Fair ${waveHeight}ft waves - ${windSpeed}mph winds`;
    } else {
      return `⚠️ Poor conditions - ${waveHeight}ft, ${windSpeed}mph winds`;
    }
  },

  // Get weather icon based on conditions
  getWeatherIcon(conditions: WeatherCondition): string {
    switch (conditions.rating) {
      case 'excellent':
        return '🌊'; // Perfect waves
      case 'good':
        return '🏄‍♂️'; // Good surfing
      case 'fair':
        return '🌤️'; // Okay conditions
      case 'poor':
        return '⚠️'; // Poor conditions
      default:
        return '🌊';
    }
  },

  // Check if conditions are suitable for lessons
  isGoodForLessons(conditions: WeatherCondition): boolean {
    return conditions.rating === 'good' || conditions.rating === 'excellent';
  },

  // Check if conditions are suitable for rentals
  isGoodForRentals(conditions: WeatherCondition): boolean {
    return conditions.rating !== 'poor';
  },

  // Cache weather data to avoid excessive API calls
  _weatherCache: null as WeatherCondition | null,
  _cacheExpiry: 0,
  _cacheDuration: 10 * 60 * 1000, // 10 minutes

  async getCachedConditions(): Promise<WeatherCondition> {
    const now = Date.now();
    
    if (this._weatherCache && now < this._cacheExpiry) {
      return this._weatherCache;
    }
    
    const conditions = await this.getCurrentConditions();
    this._weatherCache = conditions;
    this._cacheExpiry = now + this._cacheDuration;
    
    return conditions;
  },

  // Clear cache (useful for manual refresh)
  clearCache(): void {
    this._weatherCache = null;
    this._cacheExpiry = 0;
  }
};