// Simplified settings service with only the essential functions needed
export const settingsService = {
  // Get weather header message
  getWeatherHeaderMessage(): string {
    return 'Perfect waves today';
  },

  // Check if auto weather is enabled
  isAutoWeatherEnabled(): boolean {
    return true;
  },

  // Get weather update interval
  getWeatherUpdateInterval(): number {
    return 15; // Default 15 minutes
  },

  // Check if detailed forecast should be shown
  shouldShowDetailedForecast(): boolean {
    return true;
  },

  // Get primary weather link
  getPrimaryWeatherLink(): { name: string; url: string; description: string } | null {
    return {
      name: 'Surf Forecast',
      url: 'https://www.surfline.com',
      description: 'Real-time surf conditions and forecasts'
    };
  },

  // Get business locations
  getBusinessLocations(): string[] {
    return [
      'Main Beach - North Side',
      'Main Beach - South Side',
      'Rocky Point',
      'The Pipeline',
      'Calm Cove',
      'Sunset Beach',
      'Turtle Bay'
    ];
  },

  // Get waiver text for specific activity type
  getWaiverText(activityType: 'rental' | 'lesson'): string {
    if (activityType === 'lesson') {
      return `ASSUMPTION OF RISK, WAIVER OF CLAIMS, AND INDEMNITY AGREEMENT

I acknowledge that participating in surf lessons and surfing instruction involves inherent risks, dangers, and hazards that can result in serious personal injury, death, or property damage. These risks include but are not limited to:

• Ocean conditions including waves, currents, tides, and marine life
• Weather conditions including wind, storms, and lightning
• Physical exertion and potential for overexertion
• Collision with other participants, instructors, or objects
• Equipment-related injuries
• Cuts, bruises, sprains, fractures, or other injuries
• Drowning or near-drowning incidents`;
    } else {
      return `ASSUMPTION OF RISK, WAIVER OF CLAIMS, AND INDEMNITY AGREEMENT

I acknowledge that surfing and the use of surf equipment involves inherent risks, dangers, and hazards that can result in serious personal injury, death, or property damage. These risks include but are not limited to:

• Ocean conditions including waves, currents, tides, and marine life
• Weather conditions including wind, storms, and lightning
• Equipment failure or malfunction
• Collision with other surfers, swimmers, or objects
• Cuts, bruises, sprains, fractures, or other injuries
• Drowning or near-drowning incidents`;
    }
  },

  // Get waiver title for specific activity type
  getWaiverTitle(activityType: 'rental' | 'lesson'): string {
    return activityType === 'lesson' 
      ? 'Surf Lesson Waiver and Release of Liability'
      : 'Surf Equipment Rental Waiver and Release';
  },

  // Get required activities for waiver type
  getRequiredActivities(activityType: 'rental' | 'lesson'): string[] {
    return activityType === 'lesson'
      ? ['Surf Lessons', 'Instruction']
      : ['Equipment Rental'];
  },

  // Get lesson price for a specific type
  getLessonPrice(lessonType: string): number {
    const normalizedType = lessonType.toLowerCase().replace(/\s+/g, '');
    
    const priceMap: { [key: string]: number } = {
      'beginnergroup': 75,
      'intermediategroup': 85,
      'advancedgroup': 95,
      'privatelesson': 150,
      'kidsgroup': 65,
      'suplesson': 80,
      'longboardlesson': 90
    };
    
    return priceMap[normalizedType] || 75;
  },

  // Get insurance cost
  getInsuranceCost(): number {
    return 5;
  },

  // Get setting
  getSetting<T>(path: string): T | undefined {
    return undefined;
  }
};