/**
 * Application Configuration
 * Centralized configuration for the Quillyth campaign management application
 */

export const CONFIG = {
  // Campaign Configuration
  CAMPAIGNS: {
    // Default campaign ID fallback when no campaign is specified
    DEFAULT_CAMPAIGN_ID: "campaign-4-old-cistern",

    // Campaign types
    TYPES: {
      DND_5E: "dnd_5e",
      PATHFINDER: "pathfinder",
      CUSTOM: "custom",
    },
  },

  // API Configuration
  API: {
    BASE_URL: "/api",
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
  },

  // Testing Configuration
  TESTING: {
    BASE_URL: "http://localhost:3000", // Default test server URL
    TIMEOUT: 10000, // 10 seconds for test operations
  },

  // UI Configuration
  UI: {
    TOAST_DURATION: 3000, // 3 seconds
    MODAL_ANIMATION_DURATION: 300, // 300ms
    DEBOUNCE_DELAY: 300, // 300ms
  },

  // Debug Configuration
  DEBUG: {
    ENABLED:
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"),
    LOG_LEVEL: "info", // info, warn, error, debug
  },

  // Scene Configuration
  SCENES: {
    STATUSES: {
      PLANNED: "planned",
      IN_PROGRESS: "in_progress",
      COMPLETED: "completed",
      CANCELLED: "cancelled",
    },

    TYPES: {
      ENCOUNTER: "encounter",
      EXPLORATION: "exploration",
      SOCIAL: "social",
      PUZZLE: "puzzle",
      OTHER: "other",
    },
  },

  // Character Configuration
  CHARACTERS: {
    TYPES: {
      PC: "pc",
      NPC: "npc",
    },
  },
};

/**
 * Get configuration value with fallback
 * @param {string} path - Dot-separated path to config value (e.g., 'CAMPAIGNS.DEFAULT_CAMPAIGN_ID')
 * @param {*} defaultValue - Default value if path doesn't exist
 * @returns {*} Configuration value or default
 */
export function getConfig(path, defaultValue = null) {
  const keys = path.split(".");
  let value = CONFIG;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }

  return value;
}

/**
 * Get default campaign ID with environment variable override
 * @returns {string} Default campaign ID
 */
export function getDefaultCampaignId() {
  // Check for environment variable override (useful for deployment)
  if (typeof window !== "undefined" && window.QUILLYTH_DEFAULT_CAMPAIGN_ID) {
    return window.QUILLYTH_DEFAULT_CAMPAIGN_ID;
  }

  return CONFIG.CAMPAIGNS.DEFAULT_CAMPAIGN_ID;
}

/**
 * Check if debug logging is enabled
 * @returns {boolean} True if debug logging should be enabled
 */
export function isDebugEnabled() {
  return CONFIG.DEBUG.ENABLED;
}

export default CONFIG;
