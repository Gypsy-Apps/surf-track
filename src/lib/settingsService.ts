// Settings service with complete PolicySettings interface and methods

export interface PolicySettings {
  business: {
    name: string;
    phone: string;
    email: string;
    website: string;
    address: string;
    locations: string[];
  };
  quickLinks: {
    displayInHeader: boolean;
    useAutoWeather: boolean;
    headerMessage: string;
    showDetailedForecast: boolean;
    weather: {
      enabled: boolean;
      updateInterval: number;
      primaryLink: {
        name: string;
        url: string;
        description: string;
      };
      additionalLinks: Array<{
        id: string;
        name: string;
        url: string;
        description: string;
        category: 'weather' | 'tourism' | 'roads' | 'emergency' | 'business' | 'other';
      }>;
    };
  };
  rental: {
    pricing: {
      surfboard: number;
      bodyboard: number;
      skimboard: number;
      wetsuit: number;
      boots: number;
      gloves: number;
      flippers: number;
      hoodedVest: number;
    };
    insurance: {
      cost: number;
    };
    lateFees: {
      hourlyRate: number;
      maxFee: number;
    };
  };
  lesson: {
    pricing: {
      beginnerGroup: number;
      intermediateGroup: number;
      advancedGroup: number;
      privateLesson: number;
      kidsGroup: number;
      supLesson: number;
      longboardLesson: number;
    };
  };
  waiver: {
    general: {
      expiryPeriod: number;
      minAge: number;
      reminderDays: number;
    };
    rental: {
      enabled: boolean;
      expiryPeriod: number;
      requireNewWaiverPerRental: boolean;
      waiverTitle: string;
      waiverText: string;
      additionalClauses: string[];
      photoIdRequired: boolean;
      emergencyContactRequired: boolean;
    };
    lesson: {
      enabled: boolean;
      expiryPeriod: number;
      requireNewWaiverPerLesson: boolean;
      waiverTitle: string;
      waiverText: string;
      additionalClauses: string[];
      photoIdRequired: boolean;
      emergencyContactRequired: boolean;
      instructorAcknowledgment: boolean;
      skillLevelDisclosure: boolean;
    };
  };
  cancellation: {
    refundPercentages: {
      none: number;
      partial: number;
      full: number;
    };
    processingFee: {
      percentage: number;
      maxAmount: number;
      waiveForWeather: boolean;
      waiveForInstructor: boolean;
    };
  };
  notifications: {
    email: {
      enabled: boolean;
      lessonReminders: boolean;
      rentalReminders: boolean;
      waiverExpiry: boolean;
    };
    timing: {
      lessonReminderHours: number;
      rentalReminderHours: number;
      waiverExpiryDays: number;
    };
  };
}

// Default settings
const defaultSettings: PolicySettings = {
  business: {
    name: 'Surf Track',
    phone: '(555) 123-4567',
    email: 'info@surftrack.com',
    website: 'https://surftrack.com',
    address: '123 Ocean Drive, Surf City, CA 90210',
    locations: [
      'Main Beach - North Side',
      'Main Beach - South Side',
      'Rocky Point',
      'The Pipeline',
      'Calm Cove',
      'Sunset Beach',
      'Turtle Bay'
    ]
  },
  quickLinks: {
    displayInHeader: true,
    useAutoWeather: true,
    headerMessage: 'Perfect waves today',
    showDetailedForecast: true,
    weather: {
      enabled: true,
      updateInterval: 15,
      primaryLink: {
        name: 'Surf Forecast',
        url: 'https://www.surfline.com',
        description: 'Real-time surf conditions and forecasts'
      },
      additionalLinks: [
        {
          id: 'weather-1',
          name: 'NOAA Marine Weather',
          url: 'https://marine.weather.gov',
          description: 'Official marine weather forecasts',
          category: 'weather'
        },
        {
          id: 'tourism-1',
          name: 'Visit California',
          url: 'https://www.visitcalifornia.com',
          description: 'Local tourism information',
          category: 'tourism'
        }
      ]
    }
  },
  rental: {
    pricing: {
      surfboard: 25,
      bodyboard: 15,
      skimboard: 12,
      wetsuit: 20,
      boots: 8,
      gloves: 6,
      flippers: 10,
      hoodedVest: 15
    },
    insurance: {
      cost: 5
    },
    lateFees: {
      hourlyRate: 10,
      maxFee: 50
    }
  },
  lesson: {
    pricing: {
      beginnerGroup: 75,
      intermediateGroup: 85,
      advancedGroup: 95,
      privateLesson: 150,
      kidsGroup: 65,
      supLesson: 80,
      longboardLesson: 90
    }
  },
  waiver: {
    general: {
      expiryPeriod: 365,
      minAge: 18,
      reminderDays: 30
    },
    rental: {
      enabled: true,
      expiryPeriod: 365,
      requireNewWaiverPerRental: false,
      waiverTitle: 'Surf Equipment Rental Waiver and Release',
      waiverText: `ASSUMPTION OF RISK, WAIVER OF CLAIMS, AND INDEMNITY AGREEMENT

I acknowledge that surfing and the use of surf equipment involves inherent risks, dangers, and hazards that can result in serious personal injury, death, or property damage. These risks include but are not limited to:

• Ocean conditions including waves, currents, tides, and marine life
• Weather conditions including wind, storms, and lightning
• Equipment failure or malfunction
• Collision with other surfers, swimmers, or objects
• Cuts, bruises, sprains, fractures, or other injuries
• Drowning or near-drowning incidents

I voluntarily assume all risks associated with surfing and equipment rental. I release and hold harmless the surf school, its owners, employees, and agents from any and all claims, demands, or causes of action arising from my participation in surfing activities.`,
      additionalClauses: [
        'I am physically fit and capable of participating in surfing activities',
        'I will follow all safety instructions provided by staff',
        'I understand that no lifeguard services are provided'
      ],
      photoIdRequired: true,
      emergencyContactRequired: true
    },
    lesson: {
      enabled: true,
      expiryPeriod: 30,
      requireNewWaiverPerLesson: true,
      waiverTitle: 'Surf Lesson Waiver and Release of Liability',
      waiverText: `ASSUMPTION OF RISK, WAIVER OF CLAIMS, AND INDEMNITY AGREEMENT

I acknowledge that participating in surf lessons and surfing instruction involves inherent risks, dangers, and hazards that can result in serious personal injury, death, or property damage. These risks include but are not limited to:

• Ocean conditions including waves, currents, tides, and marine life
• Weather conditions including wind, storms, and lightning
• Physical exertion and potential for overexertion
• Collision with other participants, instructors, or objects
• Equipment-related injuries
• Cuts, bruises, sprains, fractures, or other injuries
• Drowning or near-drowning incidents

I voluntarily assume all risks associated with surf lessons. I release and hold harmless the surf school, its owners, employees, instructors, and agents from any and all claims, demands, or causes of action arising from my participation in surf lessons.`,
      additionalClauses: [
        'I am physically fit and capable of participating in surf lessons',
        'I will follow all instructions provided by my instructor',
        'I understand the ocean environment and its inherent dangers'
      ],
      photoIdRequired: true,
      emergencyContactRequired: true,
      instructorAcknowledgment: true,
      skillLevelDisclosure: true
    }
  },
  cancellation: {
    refundPercentages: {
      none: 0,
      partial: 50,
      full: 100
    },
    processingFee: {
      percentage: 3,
      maxAmount: 25,
      waiveForWeather: true,
      waiveForInstructor: true
    }
  },
  notifications: {
    email: {
      enabled: true,
      lessonReminders: true,
      rentalReminders: true,
      waiverExpiry: true
    },
    timing: {
      lessonReminderHours: 24,
      rentalReminderHours: 2,
      waiverExpiryDays: 30
    }
  }
};

// Store settings in localStorage
const SETTINGS_KEY = 'surf-track-settings';

export const settingsService = {
  // Get complete settings object
  getSettings(): PolicySettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        return { ...defaultSettings, ...parsed };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return defaultSettings;
  },

  // Save complete settings object
  saveSettings(settings: PolicySettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },

  // Reset to default settings
  resetToDefaults(): void {
    try {
      localStorage.removeItem(SETTINGS_KEY);
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  },

  // Get weather header message
  getWeatherHeaderMessage(): string {
    const settings = this.getSettings();
    return settings.quickLinks.headerMessage;
  },

  // Check if auto weather is enabled
  isAutoWeatherEnabled(): boolean {
    const settings = this.getSettings();
    return settings.quickLinks.useAutoWeather;
  },

  // Get weather update interval
  getWeatherUpdateInterval(): number {
    const settings = this.getSettings();
    return settings.quickLinks.weather.updateInterval;
  },

  // Check if detailed forecast should be shown
  shouldShowDetailedForecast(): boolean {
    const settings = this.getSettings();
    return settings.quickLinks.showDetailedForecast;
  },

  // Get primary weather link
  getPrimaryWeatherLink(): { name: string; url: string; description: string } | null {
    const settings = this.getSettings();
    if (settings.quickLinks.weather.enabled) {
      return settings.quickLinks.weather.primaryLink;
    }
    return null;
  },

  // Get business locations
  getBusinessLocations(): string[] {
    const settings = this.getSettings();
    return settings.business.locations;
  },

  // Get waiver text for specific activity type
  getWaiverText(activityType: 'rental' | 'lesson'): string {
    const settings = this.getSettings();
    return settings.waiver[activityType].waiverText;
  },

  // Get waiver title for specific activity type
  getWaiverTitle(activityType: 'rental' | 'lesson'): string {
    const settings = this.getSettings();
    return settings.waiver[activityType].waiverTitle;
  },

  // Get required activities for waiver type
  getRequiredActivities(activityType: 'rental' | 'lesson'): string[] {
    return activityType === 'lesson'
      ? ['Surf Lessons', 'Instruction']
      : ['Equipment Rental'];
  },

  // Get lesson price for a specific type
  getLessonPrice(lessonType: string): number {
    const settings = this.getSettings();
    const normalizedType = lessonType.toLowerCase().replace(/\s+/g, '');
    
    const priceMap: { [key: string]: keyof typeof settings.lesson.pricing } = {
      'beginnergroup': 'beginnerGroup',
      'intermediategroup': 'intermediateGroup',
      'advancedgroup': 'advancedGroup',
      'privatelesson': 'privateLesson',
      'kidsgroup': 'kidsGroup',
      'suplesson': 'supLesson',
      'longboardlesson': 'longboardLesson'
    };
    
    const priceKey = priceMap[normalizedType];
    return priceKey ? settings.lesson.pricing[priceKey] : settings.lesson.pricing.beginnerGroup;
  },

  // Get insurance cost
  getInsuranceCost(): number {
    const settings = this.getSettings();
    return settings.rental.insurance.cost;
  },

  // Get setting by path (legacy method)
  getSetting<T>(path: string): T | undefined {
    const settings = this.getSettings();
    const keys = path.split('.');
    let current: any = settings;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current as T;
  }
};
