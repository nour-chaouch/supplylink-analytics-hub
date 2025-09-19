const fs = require('fs');
const path = require('path');

// Default settings
const DEFAULT_SETTINGS = {
  import: {
    batchSize: 5000,
    chunkSize: 10 * 1024 * 1024, // 10MB
    maxRetries: 3,
    timeoutMultiplier: 5, // minutes per GB
    minTimeout: 30, // minutes
    maxTimeout: 120, // minutes
    memoryCheckInterval: 100000, // documents
    progressUpdateInterval: 1000, // documents
    enableValidation: true,
    skipInvalidDocuments: true,
    enableRealTimeLogging: true
  },
  system: {
    siteName: 'SupplyLink Analytics Hub',
    siteDescription: 'Agricultural data analytics platform',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: false,
    supportedFormats: ['json', 'csv', 'xlsx'],
    elasticsearchTimeout: 30000,
    enableNotifications: true,
    logLevel: 'info',
    sessionTimeout: 3600
  }
};

class SettingsManager {
  constructor() {
    this.settingsPath = path.join(__dirname, '..', 'data', 'settings.json');
    this.settings = { ...DEFAULT_SETTINGS };
    this.loadSettings();
  }

  // Load settings from JSON file
  loadSettings() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Load settings from file if it exists
      if (fs.existsSync(this.settingsPath)) {
        const fileContent = fs.readFileSync(this.settingsPath, 'utf8');
        const savedSettings = JSON.parse(fileContent);
        
        // Merge with defaults to ensure all properties exist
        this.settings = this.mergeWithDefaults(savedSettings);
        console.log('Settings loaded from file:', this.settingsPath);
      } else {
        // Create default settings file
        this.saveSettings();
        console.log('Created default settings file:', this.settingsPath);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      console.log('Using default settings');
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  // Save settings to JSON file
  saveSettings() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Write settings to file
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
      console.log('Settings saved to file:', this.settingsPath);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  // Get all settings
  getAllSettings() {
    return { ...this.settings };
  }

  // Get settings by category
  getSettings(category) {
    if (!this.settings[category]) {
      throw new Error(`Settings category '${category}' not found`);
    }
    return { ...this.settings[category] };
  }

  // Update settings by category
  updateSettings(category, newSettings) {
    if (!this.settings[category]) {
      throw new Error(`Settings category '${category}' not found`);
    }

    // Validate and merge settings
    const validatedSettings = this.validateSettings(category, newSettings);
    this.settings[category] = { ...this.settings[category], ...validatedSettings };
    
    // Save to file
    this.saveSettings();
    
    return this.settings[category];
  }

  // Reset settings to defaults
  resetSettings(category = null) {
    if (category) {
      // Reset specific category
      if (!DEFAULT_SETTINGS[category]) {
        throw new Error(`Settings category '${category}' not found`);
      }
      this.settings[category] = { ...DEFAULT_SETTINGS[category] };
    } else {
      // Reset all settings
      this.settings = { ...DEFAULT_SETTINGS };
    }
    
    // Save to file
    this.saveSettings();
    
    return category ? this.settings[category] : this.settings;
  }

  // Validate settings based on category
  validateSettings(category, settings) {
    const validated = {};
    
    switch (category) {
      case 'import':
        validated.batchSize = Math.max(100, Math.min(10000, parseInt(settings.batchSize) || DEFAULT_SETTINGS.import.batchSize));
        validated.chunkSize = Math.max(1024 * 1024, Math.min(100 * 1024 * 1024, parseInt(settings.chunkSize) || DEFAULT_SETTINGS.import.chunkSize));
        validated.maxRetries = Math.max(1, Math.min(10, parseInt(settings.maxRetries) || DEFAULT_SETTINGS.import.maxRetries));
        validated.timeoutMultiplier = Math.max(1, Math.min(60, parseInt(settings.timeoutMultiplier) || DEFAULT_SETTINGS.import.timeoutMultiplier));
        validated.minTimeout = Math.max(5, Math.min(60, parseInt(settings.minTimeout) || DEFAULT_SETTINGS.import.minTimeout));
        validated.maxTimeout = Math.max(60, Math.min(480, parseInt(settings.maxTimeout) || DEFAULT_SETTINGS.import.maxTimeout));
        validated.memoryCheckInterval = Math.max(1000, Math.min(1000000, parseInt(settings.memoryCheckInterval) || DEFAULT_SETTINGS.import.memoryCheckInterval));
        validated.progressUpdateInterval = Math.max(100, Math.min(10000, parseInt(settings.progressUpdateInterval) || DEFAULT_SETTINGS.import.progressUpdateInterval));
        validated.enableValidation = Boolean(settings.enableValidation);
        validated.skipInvalidDocuments = Boolean(settings.skipInvalidDocuments);
        validated.enableRealTimeLogging = Boolean(settings.enableRealTimeLogging);
        break;
        
      case 'system':
        validated.siteName = String(settings.siteName || DEFAULT_SETTINGS.system.siteName);
        validated.siteDescription = String(settings.siteDescription || DEFAULT_SETTINGS.system.siteDescription);
        validated.maintenanceMode = Boolean(settings.maintenanceMode);
        validated.allowRegistration = Boolean(settings.allowRegistration);
        validated.requireEmailVerification = Boolean(settings.requireEmailVerification);
        validated.supportedFormats = Array.isArray(settings.supportedFormats) ? settings.supportedFormats : DEFAULT_SETTINGS.system.supportedFormats;
        validated.elasticsearchTimeout = Math.max(5000, Math.min(120000, parseInt(settings.elasticsearchTimeout) || DEFAULT_SETTINGS.system.elasticsearchTimeout));
        validated.enableNotifications = Boolean(settings.enableNotifications);
        validated.logLevel = ['error', 'warn', 'info', 'debug'].includes(settings.logLevel) ? settings.logLevel : DEFAULT_SETTINGS.system.logLevel;
        validated.sessionTimeout = Math.max(300, Math.min(86400, parseInt(settings.sessionTimeout) || DEFAULT_SETTINGS.system.sessionTimeout));
        break;
        
      default:
        throw new Error(`Unknown settings category: ${category}`);
    }
    
    return validated;
  }

  // Merge saved settings with defaults to ensure all properties exist
  mergeWithDefaults(savedSettings) {
    const merged = { ...DEFAULT_SETTINGS };
    
    Object.keys(savedSettings).forEach(category => {
      if (merged[category]) {
        merged[category] = { ...merged[category], ...savedSettings[category] };
      }
    });
    
    return merged;
  }

  // Get a specific setting value
  getSetting(category, key) {
    if (!this.settings[category]) {
      throw new Error(`Settings category '${category}' not found`);
    }
    if (!(key in this.settings[category])) {
      throw new Error(`Setting '${key}' not found in category '${category}'`);
    }
    return this.settings[category][key];
  }

  // Update a specific setting value
  setSetting(category, key, value) {
    if (!this.settings[category]) {
      throw new Error(`Settings category '${category}' not found`);
    }
    
    const validatedSettings = this.validateSettings(category, { [key]: value });
    this.settings[category][key] = validatedSettings[key];
    
    // Save to file
    this.saveSettings();
    
    return this.settings[category][key];
  }
}

// Create singleton instance
const settingsManager = new SettingsManager();

module.exports = settingsManager;
