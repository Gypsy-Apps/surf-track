import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RotateCcw, 
  DollarSign, 
  Clock, 
  FileText, 
  Bell, 
  MapPin, 
  Shield,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Edit3,
  Eye,
  EyeOff,
  Calendar,
  RefreshCw,
  Link,
  Plus,
  Trash2,
  ExternalLink,
  Globe,
  Cloud,
  Navigation2,
  AlertCircle,
  Settings as SettingsIcon
} from 'lucide-react';
import { settingsService, PolicySettings } from '../lib/settingsService';

const Settings = () => {
  const [settings, setSettings] = useState<PolicySettings>(settingsService.getSettings());
  const [activeTab, setActiveTab] = useState('business');
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [expandedWaiverSection, setExpandedWaiverSection] = useState<'rental' | 'lesson' | null>(null);
  const [previewWaiver, setPreviewWaiver] = useState<'rental' | 'lesson' | null>(null);

  // Track changes
  useEffect(() => {
    const originalSettings = settingsService.getSettings();
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(hasChanges);
  }, [settings]);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      settingsService.saveSettings(settings);
      setSaveStatus('saved');
      setHasChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      const defaultSettings = settingsService.getSettings();
      settingsService.resetToDefaults();
      setSettings(settingsService.getSettings());
      setHasChanges(false);
      setSaveStatus('idle');
    }
  };

  const updateSetting = (path: string, value: any) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
  };

  const tabs = [
    { id: 'business', name: 'Business Info', icon: MapPin },
    { id: 'quicklinks', name: 'Quick Links', icon: Link },
    { id: 'pricing', name: 'Pricing', icon: DollarSign },
    { id: 'waivers', name: 'Waiver Policies', icon: FileText },
    { id: 'cancellation', name: 'Cancellation', icon: Clock },
    { id: 'notifications', name: 'Notifications', icon: Bell }
  ];

  const renderBusinessSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Business Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Business Name</label>
            <input
              type="text"
             value={settings?.business?.name || ''}
              onChange={(e) => updateSetting('business.name', e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Phone</label>
            <input
              type="text"
              value={settings?.business?.phone || ''}
              onChange={(e) => updateSetting('business.phone', e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Email</label>
            <input
              type="email"
              value={settings?.business?.email || ''}
              onChange={(e) => updateSetting('business.email', e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Website</label>
            <input
              type="text"
              value={settings?.business?.website || ''}
              onChange={(e) => updateSetting('business.website', e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-cyan-200 mb-2">Address</label>
          <textarea
            value={settings?.business?.address || ''}
            onChange={(e) => updateSetting('business.address', e.target.value)}
            rows={2}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Lesson Locations</h3>
        <div className="space-y-2">
          {settings?.business?.locations?.map((location, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  const newLocations = [...settings.business.locations];
                  newLocations[index] = e.target.value;
                  updateSetting('business.locations', newLocations);
                }}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <button
                onClick={() => {
                  const newLocations = settings.business.locations.filter((_, i) => i !== index);
                  updateSetting('business.locations', newLocations);
                }}
                className="text-red-400 hover:text-red-300 p-2"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newLocations = [...settings.business.locations, 'New Location'];
              updateSetting('business.locations', newLocations);
            }}
            className="text-cyan-400 hover:text-cyan-300 text-sm"
          >
            + Add Location
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuickLinksSettings = () => (
    <div className="space-y-6">
      {/* Weather Header Settings */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex items-center space-x-3 mb-4">
          <Cloud className="h-6 w-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Weather Header Display</h3>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.quickLinks.displayInHeader}
              onChange={(e) => updateSetting('quickLinks.displayInHeader', e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
            />
            <span className="text-cyan-200">Show weather information in header</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.quickLinks.useAutoWeather}
              onChange={(e) => updateSetting('quickLinks.useAutoWeather', e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
            />
            <span className="text-cyan-200">Use automatic weather updates</span>
          </label>

          {!settings.quickLinks.useAutoWeather && (
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Static Header Message</label>
              <input
                type="text"
                value={settings.quickLinks.headerMessage}
                onChange={(e) => updateSetting('quickLinks.headerMessage', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Perfect waves today"
              />
            </div>
          )}

          {settings.quickLinks.useAutoWeather && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">Update Interval (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={settings.quickLinks.weather.updateInterval}
                  onChange={(e) => updateSetting('quickLinks.weather.updateInterval', parseInt(e.target.value) || 15)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.quickLinks.showDetailedForecast}
                  onChange={(e) => updateSetting('quickLinks.showDetailedForecast', e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-cyan-200">Show detailed forecast on hover</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Primary Weather Link */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex items-center space-x-3 mb-4">
          <Navigation2 className="h-6 w-6 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Primary Weather Link</h3>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.quickLinks.weather.enabled}
              onChange={(e) => updateSetting('quickLinks.weather.enabled', e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
            />
            <span className="text-cyan-200">Enable primary weather link</span>
          </label>

          {settings.quickLinks.weather.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">Link Name</label>
                <input
                  type="text"
                  value={settings.quickLinks.weather.primaryLink.name}
                  onChange={(e) => updateSetting('quickLinks.weather.primaryLink.name', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">URL</label>
                <input
                  type="url"
                  value={settings.quickLinks.weather.primaryLink.url}
                  onChange={(e) => updateSetting('quickLinks.weather.primaryLink.url', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-cyan-200 mb-2">Description</label>
                <input
                  type="text"
                  value={settings.quickLinks.weather.primaryLink.description}
                  onChange={(e) => updateSetting('quickLinks.weather.primaryLink.description', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <div className="md:col-span-2">
                <a
                  href={settings.quickLinks.weather.primaryLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Test Link</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Quick Links */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Globe className="h-6 w-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Additional Quick Links</h3>
          </div>
          <button
            onClick={() => {
              const newLink = {
                id: `link-${Date.now()}`,
                name: 'New Link',
                url: 'https://example.com',
                description: 'Description',
                category: 'other' as const
              };
              const newLinks = [...settings.quickLinks.weather.additionalLinks, newLink];
              updateSetting('quickLinks.weather.additionalLinks', newLinks);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>Add Link</span>
          </button>
        </div>

        <div className="space-y-4">
          {settings.quickLinks.weather.additionalLinks.map((link, index) => (
            <div key={link.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-1">Name</label>
                  <input
                    type="text"
                    value={link.name}
                    onChange={(e) => {
                      const newLinks = [...settings.quickLinks.weather.additionalLinks];
                      newLinks[index] = { ...link, name: e.target.value };
                      updateSetting('quickLinks.weather.additionalLinks', newLinks);
                    }}
                    className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-1">URL</label>
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...settings.quickLinks.weather.additionalLinks];
                      newLinks[index] = { ...link, url: e.target.value };
                      updateSetting('quickLinks.weather.additionalLinks', newLinks);
                    }}
                    className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-1">Category</label>
                  <select
                    value={link.category}
                    onChange={(e) => {
                      const newLinks = [...settings.quickLinks.weather.additionalLinks];
                      newLinks[index] = { ...link, category: e.target.value as any };
                      updateSetting('quickLinks.weather.additionalLinks', newLinks);
                    }}
                    className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    <option value="weather" className="bg-gray-800">🌤️ Weather</option>
                    <option value="tourism" className="bg-gray-800">📍 Tourism</option>
                    <option value="roads" className="bg-gray-800">🚗 Roads</option>
                    <option value="emergency" className="bg-gray-800">🚨 Emergency</option>
                    <option value="business" className="bg-gray-800">🏢 Business</option>
                    <option value="other" className="bg-gray-800">🌐 Other</option>
                  </select>
                </div>
                <div className="flex items-end space-x-2">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 p-1 transition-colors"
                    title="Test Link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => {
                      const newLinks = settings.quickLinks.weather.additionalLinks.filter((_, i) => i !== index);
                      updateSetting('quickLinks.weather.additionalLinks', newLinks);
                    }}
                    className="text-red-400 hover:text-red-300 p-1 transition-colors"
                    title="Remove Link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-cyan-200 mb-1">Description</label>
                <input
                  type="text"
                  value={link.description}
                  onChange={(e) => {
                    const newLinks = [...settings.quickLinks.weather.additionalLinks];
                    newLinks[index] = { ...link, description: e.target.value };
                    updateSetting('quickLinks.weather.additionalLinks', newLinks);
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  placeholder="Brief description of this link"
                />
              </div>
            </div>
          ))}

          {settings.quickLinks.weather.additionalLinks.length === 0 && (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-white/30 mx-auto mb-3" />
              <p className="text-cyan-200 mb-4">No additional links configured</p>
              <p className="text-cyan-300 text-sm">Add links for weather, tourism, roads, emergency contacts, and more</p>
            </div>
          )}
        </div>
      </div>

      {/* Weather API Providers (Future Enhancement) */}
      <div className="bg-amber-500/20 rounded-xl p-6 border border-amber-500/30">
        <div className="flex items-center space-x-3 mb-4">
          <AlertCircle className="h-6 w-6 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">Weather API Integration</h3>
        </div>
        <div className="space-y-3 text-amber-200">
          <p className="text-sm">
            <strong>Coming Soon:</strong> Connect to real weather APIs for automatic surf condition updates.
          </p>
          <div className="text-sm space-y-1">
            <p>• <strong>Surfline API:</strong> Real-time surf forecasts and wave data</p>
            <p>• <strong>OpenWeatherMap:</strong> General weather conditions and marine forecasts</p>
            <p>• <strong>NOAA Marine:</strong> Official marine weather and safety warnings</p>
          </div>
          <p className="text-xs text-amber-300 mt-3">
            Currently using simulated weather data for demonstration. Contact support for API integration setup.
          </p>
        </div>
      </div>
    </div>
  );

  const renderPricingSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Rental Pricing (per day)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(settings.rental.pricing).map(([item, price]) => (
            <div key={item}>
              <label className="block text-sm font-medium text-cyan-200 mb-2 capitalize">
                {item.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70">$</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => updateSetting(`rental.pricing.${item}`, parseFloat(e.target.value) || 0)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-8 pr-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Lesson Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(settings.lesson.pricing).map(([lesson, price]) => (
            <div key={lesson}>
              <label className="block text-sm font-medium text-cyan-200 mb-2 capitalize">
                {lesson.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70">$</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => updateSetting(`lesson.pricing.${lesson}`, parseFloat(e.target.value) || 0)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-8 pr-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Insurance & Fees</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Equipment Insurance Cost</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70">$</span>
              <input
                type="number"
                value={settings.rental.insurance.cost}
                onChange={(e) => updateSetting('rental.insurance.cost', parseFloat(e.target.value) || 0)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-8 pr-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Late Fee (per hour)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70">$</span>
              <input
                type="number"
                value={settings.rental.lateFees.hourlyRate}
                onChange={(e) => updateSetting('rental.lateFees.hourlyRate', parseFloat(e.target.value) || 0)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-8 pr-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Max Late Fee</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70">$</span>
              <input
                type="number"
                value={settings.rental.lateFees.maxFee}
                onChange={(e) => updateSetting('rental.lateFees.maxFee', parseFloat(e.target.value) || 0)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-8 pr-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWaiverPreview = (type: 'rental' | 'lesson') => {
    const waiverData = settings.waiver[type];
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <h3 className="text-xl font-semibold text-white">Waiver Preview - {type === 'rental' ? 'Equipment Rental' : 'Surf Lessons'}</h3>
            <button
              onClick={() => setPreviewWaiver(null)}
              className="text-white/70 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="bg-white p-8 rounded-lg text-black">
              <h2 className="text-2xl font-bold mb-6 text-center">{waiverData.waiverTitle}</h2>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-line text-sm leading-relaxed mb-6">
                  {waiverData.waiverText}
                </div>
                
                {waiverData.additionalClauses.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Additional Terms:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {waiverData.additionalClauses.map((clause, index) => (
                        <li key={index} className="text-sm">{clause}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-8 pt-6 border-t border-gray-300">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm mb-2">Participant Signature:</p>
                      <div className="border-b border-gray-400 h-8"></div>
                      <p className="text-xs text-gray-600 mt-1">Digital signature will appear here</p>
                    </div>
                    <div>
                      <p className="text-sm mb-2">Date:</p>
                      <div className="border-b border-gray-400 h-8"></div>
                      <p className="text-xs text-gray-600 mt-1">Automatically filled</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWaiverSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">General Waiver Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Default Waiver Expiry (days)</label>
            <input
              type="number"
              value={settings.waiver.general.expiryPeriod}
              onChange={(e) => updateSetting('waiver.general.expiryPeriod', parseInt(e.target.value) || 365)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Minimum Age</label>
            <input
              type="number"
              value={settings.waiver.general.minAge}
              onChange={(e) => updateSetting('waiver.general.minAge', parseInt(e.target.value) || 18)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Reminder Days</label>
            <input
              type="number"
              value={settings.waiver.general.reminderDays}
              onChange={(e) => updateSetting('waiver.general.reminderDays', parseInt(e.target.value) || 30)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* Equipment Rental Waiver */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Package className="h-5 w-5 text-blue-400" />
            <h4 className="text-lg font-semibold text-white">Equipment Rental Waiver</h4>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewWaiver('rental')}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setExpandedWaiverSection(expandedWaiverSection === 'rental' ? null : 'rental')}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-sm transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              <span>{expandedWaiverSection === 'rental' ? 'Collapse' : 'Edit'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.waiver.rental.enabled}
              onChange={(e) => updateSetting('waiver.rental.enabled', e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
            />
            <span className="text-cyan-200">Require waiver for equipment rentals</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Rental Waiver Expiry (days)</label>
              <input
                type="number"
                value={settings.waiver.rental.expiryPeriod}
                onChange={(e) => updateSetting('waiver.rental.expiryPeriod', parseInt(e.target.value) || 365)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <p className="text-xs text-cyan-300 mt-1">How long rental waivers remain valid</p>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.waiver.rental.requireNewWaiverPerRental}
                  onChange={(e) => updateSetting('waiver.rental.requireNewWaiverPerRental', e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-cyan-200">Require new waiver for each rental</span>
              </label>
            </div>
          </div>
        </div>

        {expandedWaiverSection === 'rental' && (
          <div className="space-y-4 mt-6 pt-6 border-t border-white/20">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Waiver Title</label>
              <input
                type="text"
                value={settings.waiver.rental.waiverTitle}
                onChange={(e) => updateSetting('waiver.rental.waiverTitle', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Waiver Text</label>
              <textarea
                value={settings.waiver.rental.waiverText}
                onChange={(e) => updateSetting('waiver.rental.waiverText', e.target.value)}
                rows={12}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Additional Clauses</label>
              <div className="space-y-2">
                {settings.waiver.rental.additionalClauses.map((clause, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={clause}
                      onChange={(e) => {
                        const newClauses = [...settings.waiver.rental.additionalClauses];
                        newClauses[index] = e.target.value;
                        updateSetting('waiver.rental.additionalClauses', newClauses);
                      }}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                    <button
                      onClick={() => {
                        const newClauses = settings.waiver.rental.additionalClauses.filter((_, i) => i !== index);
                        updateSetting('waiver.rental.additionalClauses', newClauses);
                      }}
                      className="text-red-400 hover:text-red-300 p-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newClauses = [...settings.waiver.rental.additionalClauses, 'New clause'];
                    updateSetting('waiver.rental.additionalClauses', newClauses);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  + Add Clause
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.waiver.rental.photoIdRequired}
                  onChange={(e) => updateSetting('waiver.rental.photoIdRequired', e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-cyan-200">Require Photo ID</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.waiver.rental.emergencyContactRequired}
                  onChange={(e) => updateSetting('waiver.rental.emergencyContactRequired', e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-cyan-200">Require Emergency Contact</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Surf Lesson Waiver */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-emerald-400" />
            <h4 className="text-lg font-semibold text-white">Surf Lesson Waiver</h4>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewWaiver('lesson')}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setExpandedWaiverSection(expandedWaiverSection === 'lesson' ? null : 'lesson')}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-sm transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              <span>{expandedWaiverSection === 'lesson' ? 'Collapse' : 'Edit'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.waiver.lesson.enabled}
              onChange={(e) => updateSetting('waiver.lesson.enabled', e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
            />
            <span className="text-cyan-200">Require waiver for surf lessons</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Lesson Waiver Expiry (days)</label>
              <input
                type="number"
                value={settings.waiver.lesson.expiryPeriod}
                onChange={(e) => updateSetting('waiver.lesson.expiryPeriod', parseInt(e.target.value) || 30)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <p className="text-xs text-cyan-300 mt-1">How long lesson waivers remain valid</p>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.waiver.lesson.requireNewWaiverPerLesson}
                  onChange={(e) => updateSetting('waiver.lesson.requireNewWaiverPerLesson', e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-cyan-200">Require new waiver for each lesson</span>
              </label>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="bg-amber-500/20 rounded-lg p-4 border border-amber-500/30">
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-amber-200 mb-2">Lesson Waiver Policy Options</h5>
                <div className="text-amber-200 text-sm space-y-2">
                  <p><strong>Option 1:</strong> Set expiry to 30 days + require new waiver per lesson = Fresh waiver for every lesson</p>
                  <p><strong>Option 2:</strong> Set expiry to 365 days + don't require new waiver = One waiver covers multiple lessons for a year</p>
                  <p><strong>Current Setting:</strong> Waivers expire after <strong>{settings.waiver.lesson.expiryPeriod} days</strong> and {settings.waiver.lesson.requireNewWaiverPerLesson ? 'a new waiver is required for each lesson' : 'one waiver covers multiple lessons'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {expandedWaiverSection === 'lesson' && (
          <div className="space-y-4 mt-6 pt-6 border-t border-white/20">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Waiver Title</label>
              <input
                type="text"
                value={settings.waiver.lesson.waiverTitle}
                onChange={(e) => updateSetting('waiver.lesson.waiverTitle', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Waiver Text</label>
              <textarea
                value={settings.waiver.lesson.waiverText}
                onChange={(e) => updateSetting('waiver.lesson.waiverText', e.target.value)}
                rows={12}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Additional Clauses</label>
              <div className="space-y-2">
                {settings.waiver.lesson.additionalClauses.map((clause, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={clause}
                      onChange={(e) => {
                        const newClauses = [...settings.waiver.lesson.additionalClauses];
                        newClauses[index] = e.target.value;
                        updateSetting('waiver.lesson.additionalClauses', newClauses);
                      }}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                    <button
                      onClick={() => {
                        const newClauses = settings.waiver.lesson.additionalClauses.filter((_, i) => i !== index);
                        updateSetting('waiver.lesson.additionalClauses', newClauses);
                      }}
                      className="text-red-400 hover:text-red-300 p-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newClauses = [...settings.waiver.lesson.additionalClauses, 'New clause'];
                    updateSetting('waiver.lesson.additionalClauses', newClauses);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  + Add Clause
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.waiver.lesson.photoIdRequired}
                  onChange={(e) => updateSetting('waiver.lesson.photoIdRequired', e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-cyan-200">Require Photo ID</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.waiver.lesson.emergencyContactRequired}
                  onChange={(e) => updateSetting('waiver.lesson.emergencyContactRequired', e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-cyan-200">Require Emergency Contact</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.waiver.lesson.instructorAcknowledgment}
                  onChange={(e) => updateSetting('waiver.lesson.instructorAcknowledgment', e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-cyan-200">Instructor Acknowledgment</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.waiver.lesson.skillLevelDisclosure}
                  onChange={(e) => updateSetting('waiver.lesson.skillLevelDisclosure', e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-cyan-200">Skill Level Disclosure</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {previewWaiver && renderWaiverPreview(previewWaiver)}
    </div>
  );

  const renderCancellationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Refund Percentages</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">No Refund (%)</label>
            <input
              type="number"
              value={settings.cancellation.refundPercentages.none}
              onChange={(e) => updateSetting('cancellation.refundPercentages.none', parseFloat(e.target.value) || 0)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Partial Refund (%)</label>
            <input
              type="number"
              value={settings.cancellation.refundPercentages.partial}
              onChange={(e) => updateSetting('cancellation.refundPercentages.partial', parseFloat(e.target.value) || 0)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Full Refund (%)</label>
            <input
              type="number"
              value={settings.cancellation.refundPercentages.full}
              onChange={(e) => updateSetting('cancellation.refundPercentages.full', parseFloat(e.target.value) || 0)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Processing Fees</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Processing Fee (%)</label>
            <input
              type="number"
              value={settings.cancellation.processingFee.percentage}
              onChange={(e) => updateSetting('cancellation.processingFee.percentage', parseFloat(e.target.value) || 0)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Max Processing Fee ($)</label>
            <input
              type="number"
              value={settings.cancellation.processingFee.maxAmount}
              onChange={(e) => updateSetting('cancellation.processingFee.maxAmount', parseFloat(e.target.value) || 0)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.cancellation.processingFee.waiveForWeather}
              onChange={(e) => updateSetting('cancellation.processingFee.waiveForWeather', e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
            />
            <span className="text-cyan-200">Waive processing fee for weather cancellations</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.cancellation.processingFee.waiveForInstructor}
              onChange={(e) => updateSetting('cancellation.processingFee.waiveForInstructor', e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
            />
            <span className="text-cyan-200">Waive processing fee for instructor cancellations</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Email Notifications</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.notifications.email.enabled}
              onChange={(e) => updateSetting('notifications.email.enabled', e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
            />
            <span className="text-cyan-200">Enable email notifications</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.notifications.email.lessonReminders}
              onChange={(e) => updateSetting('notifications.email.lessonReminders', e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
            />
            <span className="text-cyan-200">Lesson reminders</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.notifications.email.rentalReminders}
              onChange={(e) => updateSetting('notifications.email.rentalReminders', e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
            />
            <span className="text-cyan-200">Rental return reminders</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.notifications.email.waiverExpiry}
              onChange={(e) => updateSetting('notifications.email.waiverExpiry', e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
            />
            <span className="text-cyan-200">Waiver expiry notifications</span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Notification Timing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Lesson Reminder (hours before)</label>
            <input
              type="number"
              value={settings.notifications.timing.lessonReminderHours}
              onChange={(e) => updateSetting('notifications.timing.lessonReminderHours', parseInt(e.target.value) || 24)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Rental Reminder (hours before due)</label>
            <input
              type="number"
              value={settings.notifications.timing.rentalReminderHours}
              onChange={(e) => updateSetting('notifications.timing.rentalReminderHours', parseInt(e.target.value) || 2)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Waiver Expiry (days before)</label>
            <input
              type="number"
              value={settings.notifications.timing.waiverExpiryDays}
              onChange={(e) => updateSetting('notifications.timing.waiverExpiryDays', parseInt(e.target.value) || 30)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'business':
        return renderBusinessSettings();
      case 'quicklinks':
        return renderQuickLinksSettings();
      case 'pricing':
        return renderPricingSettings();
      case 'waivers':
        return renderWaiverSettings();
      case 'cancellation':
        return renderCancellationSettings();
      case 'notifications':
        return renderNotificationSettings();
      default:
        return renderBusinessSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
          <p className="text-cyan-200">Configure your surf school policies and preferences</p>
        </div>
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <div className="flex items-center space-x-2 text-amber-400 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Unsaved changes</span>
            </div>
          )}
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset to Defaults</span>
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saveStatus === 'saving'}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              !hasChanges || saveStatus === 'saving'
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : saveStatus === 'saved'
                ? 'bg-green-600 text-white'
                : saveStatus === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white'
            }`}
          >
            {saveStatus === 'saving' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Saved!</span>
              </>
            ) : saveStatus === 'error' ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>Error</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-cyan-400 text-cyan-400 bg-white/10'
                    : 'border-transparent text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
