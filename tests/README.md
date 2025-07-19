# Test Configuration

This directory contains automated tests for the Quillyth campaign management application.

## Accessibility Testing

The accessibility test (`accessibility-test.js`) supports configurable base URLs for different environments.

### Configuration Options

The test will use the base URL in the following priority order:

1. **Environment Variable (Full URL)**: `QUILLYTH_TEST_BASE_URL`
   ```bash
   # Windows PowerShell
   $env:QUILLYTH_TEST_BASE_URL="https://staging.quillyth.com"
   
   # Linux/macOS
   export QUILLYTH_TEST_BASE_URL="https://staging.quillyth.com"
   ```

2. **Environment Variable (Port Only)**: `QUILLYTH_TEST_PORT`
   ```bash
   # Windows PowerShell
   $env:QUILLYTH_TEST_PORT="3001"
   
   # Linux/macOS
   export QUILLYTH_TEST_PORT="3001"
   ```

3. **Configuration File**: `js/shared/config.js`
   ```javascript
   TESTING: {
     BASE_URL: "http://localhost:3000", // Default test server URL
     TIMEOUT: 10000, // 10 seconds for test operations
   },
   ```

4. **Default Fallback**: `http://localhost:3000`

### Usage Examples

```bash
# Run with default configuration
npm run test:accessibility

# Run with custom URL
$env:QUILLYTH_TEST_BASE_URL="https://staging.quillyth.com"; npm run test:accessibility

# Run with custom port
$env:QUILLYTH_TEST_PORT="3001"; npm run test:accessibility

# Run in CI/CD environment
QUILLYTH_TEST_BASE_URL="https://ci.quillyth.com" npm run test:accessibility
```

### Runtime Configuration

You can also update the base URL programmatically:

```javascript
const tester = new AccessibilityTester();

// Update base URL for different environments
tester.updateBaseUrl('https://staging.quillyth.com');

// Update accessibility thresholds
tester.updateConfig({
  minHiddenIconsRatio: 0.8,  // Require 80% of icons to be hidden
  minHiddenIconsCount: 3     // Require at least 3 hidden icons
});

tester.runAccessibilityTests();
```

## Other Tests

- **Performance Testing**: `performance-monitor.js`
- **Visual Regression Testing**: `visual-regression.js`
- **Manual Testing Checklist**: `manual-test-checklist.md`
