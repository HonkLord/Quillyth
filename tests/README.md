# Testing Suite

This directory contains comprehensive testing tools for the Campaign Manager application.

## Test Files

### Core Tests
- `test-runner.js` - Main test runner for functional tests
- `manual-test-checklist.md` - Manual testing procedures and checklist

### Specialized Tests
- `accessibility-test.js` - Automated accessibility testing using axe-core
- `performance-monitor.js` - Performance monitoring and benchmarking
- `visual-regression.js` - **Visual regression testing with pixel-level comparison**

## Visual Regression Testing

The visual regression testing tool has been significantly improved with proper image comparison capabilities:

### Features
- **Pixel-level comparison** using `pixelmatch` library instead of unreliable file size comparison
- **Configurable thresholds** for color sensitivity and acceptable difference percentages
- **Automatic baseline creation** for missing reference screenshots
- **Diff image generation** showing exactly what changed
- **Command-line interface** with help and update options

### Usage

```bash
# Run all visual regression tests
npm run test:visual

# Or directly
node tests/visual-regression.js

# Show help
node tests/visual-regression.js --help

# Update baselines (after intentional UI changes)
node tests/visual-regression.js --update-baselines
```

### Configuration

The tool uses configurable thresholds:
- **Pixel threshold**: 0.1 (color sensitivity, 0-1)
- **Diff threshold**: 0.5% (percentage of pixels that can differ)
- **Auto-create baselines**: Enabled by default

### Output Structure

```
tests/screenshots/
├── baseline/     # Reference screenshots
├── current/      # Current test screenshots
└── diff/         # Difference images (when regressions detected)
```

### Test Coverage

The visual regression tests cover:
- Dashboard layout consistency
- Navigation structure and styling
- Responsive design (mobile/desktop)
- Component visual consistency

### Dependencies

- `puppeteer` - Browser automation and screenshot capture
- `pixelmatch` - Pixel-level image comparison
- `pngjs` - PNG image processing

## Performance Testing

The performance monitor tracks:
- Page load times
- Database query performance
- Memory usage
- API response times

## Accessibility Testing

Automated accessibility testing using axe-core covers:
- WCAG 2.1 compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios

## Running All Tests

```bash
# Run all tests including visual regression
npm run test:ci

# Run specific test suites
npm run test:accessibility
npm run test:performance
npm run test:visual
```
