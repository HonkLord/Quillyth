# Configuration Guide

This document explains how to configure various settings in the Quillyth campaign management application.

## Default Campaign ID

The application uses a default campaign ID as a fallback when no campaign is specified. This can be configured in several ways:

### Method 1: Edit Configuration File (Recommended)

Edit `js/shared/config.js` and change the `DEFAULT_CAMPAIGN_ID` value:

```javascript
export const CONFIG = {
  CAMPAIGNS: {
    // Change this value to your desired default campaign ID
    DEFAULT_CAMPAIGN_ID: 'your-campaign-id-here',
    // ... rest of config
  },
  // ... rest of config
};
```

### Method 2: Environment Variable Override

Set a global variable in your HTML or JavaScript before the application loads:

```html
<script>
  // Set this before loading the application
  window.QUILLYTH_DEFAULT_CAMPAIGN_ID = 'your-campaign-id-here';
</script>
```

### Method 3: Runtime Configuration

You can also set the default campaign ID programmatically:

```javascript
import { CONFIG } from './js/shared/config.js';

// Change the default campaign ID at runtime
CONFIG.CAMPAIGNS.DEFAULT_CAMPAIGN_ID = 'your-campaign-id-here';
```

## Other Configuration Options

### API Settings

```javascript
API: {
  BASE_URL: '/api',           // API base URL
  TIMEOUT: 30000,            // Request timeout in milliseconds
  RETRY_ATTEMPTS: 3          // Number of retry attempts for failed requests
}
```

### UI Settings

```javascript
UI: {
  TOAST_DURATION: 3000,      // Toast notification duration in milliseconds
  MODAL_ANIMATION_DURATION: 300, // Modal animation duration
  DEBOUNCE_DELAY: 300        // Input debounce delay
}
```

### Scene Types and Statuses

```javascript
SCENES: {
  STATUSES: {
    PLANNED: 'planned',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  
  TYPES: {
    ENCOUNTER: 'encounter',
    EXPLORATION: 'exploration',
    SOCIAL: 'social',
    PUZZLE: 'puzzle',
    OTHER: 'other'
  }
}
```

## Configuration Functions

The configuration module provides utility functions:

### `getConfig(path, defaultValue)`

Get a configuration value using dot notation:

```javascript
import { getConfig } from './js/shared/config.js';

const defaultCampaignId = getConfig('CAMPAIGNS.DEFAULT_CAMPAIGN_ID', 'fallback-id');
const apiTimeout = getConfig('API.TIMEOUT', 30000);
```

### `getDefaultCampaignId()`

Get the default campaign ID with environment variable override:

```javascript
import { getDefaultCampaignId } from './js/shared/config.js';

const campaignId = getDefaultCampaignId();
```

## Best Practices

1. **Use the configuration file** for most changes - it's centralized and version-controlled
2. **Use environment variables** for deployment-specific settings
3. **Don't hardcode values** in your application code
4. **Document any custom configurations** in your project documentation
5. **Test configuration changes** to ensure they work as expected

## Migration from Hardcoded Values

If you're migrating from hardcoded campaign IDs, replace:

```javascript
// Old way (hardcoded)
const campaignId = scene.campaign_id || "campaign-4-old-cistern";

// New way (configurable)
import { getDefaultCampaignId } from "../shared/config.js";
const campaignId = scene.campaign_id || getDefaultCampaignId();
``` 