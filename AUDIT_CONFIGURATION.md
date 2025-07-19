# Audit Configuration Guide

## Overview

The `audit-application.js` script now uses a separate configuration file (`audit-config.json`) to make maintenance easier as the application evolves. This allows you to update audit requirements without modifying the source code directly.

## Configuration File Structure

The `audit-config.json` file contains the following sections:

### CSS Configuration
```json
{
  "css": {
    "requiredImports": [
      "./base/variables.css",
      "./base/reset.css",
      // ... other CSS imports
    ]
  }
}
```

### HTML Configuration
```json
{
  "html": {
    "requiredSections": ["dashboard-content", "scenes-content", ...],
    "requiredNavTabs": ["nav-dashboard", "nav-scenes", ...],
    "requiredClasses": ["app-container", "top-nav", ...],
    "handledActions": ["edit-campaign-title", "show-dashboard", ...]
  }
}
```

### JavaScript Configuration
```json
{
  "javascript": {
    "requiredImports": ["SceneManager", "CharacterManager", ...],
    "requiredFeatures": ["scenes", "characters", ...],
    "requiredManagers": [
      {"name": "scene-manager.js", "feature": "scenes"},
      // ... other managers
    ],
    "featureFiles": [
      {
        "name": "scenes",
        "files": ["scene-core.js", "scene-manager.js", "scene-ui.js"]
      }
      // ... other features
    ]
  }
}
```

### API Configuration
```json
{
  "api": {
    "requiredRoutes": ["campaigns.js", "characters.js", ...]
  }
}
```

### Database Configuration
```json
{
  "database": {
    "requiredTables": ["campaigns", "sessions", ...]
  }
}
```

### Responsive Design Configuration
```json
{
  "responsive": {
    "requiredMediaQueries": [
      "@media (max-width: 768px)",
      "@media (max-width: 1024px)",
      "@media (min-width: 1200px)"
    ]
  }
}
```

## How to Update Configuration

### Adding New CSS Imports
1. Open `audit-config.json`
2. Add the new import path to the `css.requiredImports` array
3. Run the audit script to verify the change

### Adding New Features
1. Add the feature name to `javascript.requiredFeatures`
2. Add the manager file to `javascript.requiredManagers`
3. Add the feature files to `javascript.featureFiles`
4. Add any required HTML sections to `html.requiredSections`
5. Add navigation tabs to `html.requiredNavTabs`

### Adding New API Routes
1. Add the route file name to `api.requiredRoutes`
2. Ensure the route is registered in `server.js`

### Adding New Database Tables
1. Add the table name to `database.requiredTables`
2. Ensure the table creation SQL is in `server.js`

## Fallback Configuration

If the `audit-config.json` file is missing or invalid, the script will use a built-in fallback configuration. This ensures the audit continues to work even if the configuration file is accidentally deleted or corrupted.

## Benefits

1. **Easier Maintenance**: Update audit requirements without touching source code
2. **Version Control**: Track configuration changes separately from code changes
3. **Team Collaboration**: Multiple developers can update audit requirements
4. **Flexibility**: Add new audit checks by updating configuration
5. **Reliability**: Fallback configuration ensures audit always works

## Best Practices

1. **Keep Configuration Updated**: Update the config file when adding new features
2. **Validate JSON**: Ensure the JSON is valid before committing
3. **Document Changes**: Add comments to the config file for complex requirements
4. **Test Changes**: Run the audit after updating configuration
5. **Version Control**: Commit configuration changes with related code changes

## Example: Adding a New Feature

When adding a new feature (e.g., "inventory"):

1. **Update CSS imports**:
   ```json
   "css": {
     "requiredImports": [
       // ... existing imports
       "./components/inventory.css"
     ]
   }
   ```

2. **Update JavaScript configuration**:
   ```json
   "javascript": {
     "requiredFeatures": [
       // ... existing features
       "inventory"
     ],
     "requiredManagers": [
       // ... existing managers
       {"name": "inventory-manager.js", "feature": "inventory"}
     ],
     "featureFiles": [
       // ... existing features
       {
         "name": "inventory",
         "files": ["inventory-core.js", "inventory-manager.js", "inventory-ui.js"]
       }
     ]
   }
   ```

3. **Update HTML configuration**:
   ```json
   "html": {
     "requiredSections": [
       // ... existing sections
       "inventory-content"
     ],
     "requiredNavTabs": [
       // ... existing tabs
       "nav-inventory"
     ],
     "handledActions": [
       // ... existing actions
       "show-inventory"
     ]
   }
   ```

4. **Update API configuration**:
   ```json
   "api": {
     "requiredRoutes": [
       // ... existing routes
       "inventory.js"
     ]
   }
   ```

**⚠️  IMPORTANT: After making any configuration changes, always run the audit process to verify your changes:**

```bash
node audit-application.js
```

This ensures that your new feature is properly integrated and all audit checks pass before committing your changes.

This approach makes the audit system much more maintainable and flexible as your application grows.

## CDN Enforcement Configuration

The audit script now supports configurable CDN usage enforcement to accommodate different deployment environments.

### Environment Variable Configuration

Set the `AUDIT_ENFORCE_CDN` environment variable to control CDN enforcement:

```bash
# Enable CDN enforcement (default)
AUDIT_ENFORCE_CDN=true node audit-application.js

# Disable CDN enforcement for airgapped/development environments
AUDIT_ENFORCE_CDN=false node audit-application.js
```

### Configuration File Support

You can also configure CDN enforcement in your `js/shared/config.js` file:

```javascript
const CONFIG = {
  // ... other configuration
  AUDIT: {
    ENFORCE_CDN: true  // or false
  }
};
```

### Audit Configuration File

The `audit-config.json` file also supports CDN configuration:

```json
{
  // ... other configuration
  "audit": {
    "enforceCDN": true
  }
}
```

### Priority Order

The CDN enforcement setting is determined in this priority order:

1. **Environment Variable**: `AUDIT_ENFORCE_CDN` (highest priority)
2. **Config File**: `js/shared/config.js` AUDIT.ENFORCE_CDN setting
3. **Audit Config**: `audit-config.json` audit.enforceCDN setting
4. **Default**: `true` (enforce CDN usage)

### Use Cases

- **Production Environments**: Enable CDN enforcement to ensure optimal performance
- **Development Environments**: Disable CDN enforcement for faster local development
- **Airgapped Networks**: Disable CDN enforcement when external CDNs are not accessible
- **Offline Development**: Disable CDN enforcement when working without internet access

### Example Usage

```bash
# Development environment
AUDIT_ENFORCE_CDN=false node audit-application.js

# Production environment
AUDIT_ENFORCE_CDN=true node audit-application.js

# Airgapped environment
AUDIT_ENFORCE_CDN=false node audit-application.js
```

When CDN enforcement is disabled, the audit will skip the CDN usage check and display an informational message: `ℹ️  CDN usage check skipped (enforcement disabled)` 