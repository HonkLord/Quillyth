# Campaign Manager Testing Framework

This directory contains comprehensive testing tools for the D&D Campaign Manager application.

## 🧪 Automated Tests

### Quick Start

1. **Install test dependencies:**

   ```bash
   npm run test:install
   ```

2. **Start the server:**

   ```bash
   npm start
   ```

3. **Run automated tests:**

   ```bash
   npm test
   ```

### Test Runner Features

The automated test runner (`test-runner.js`) validates:

- **Server Connectivity** - Ensures server is running and accessible
- **API Endpoints** - Tests all REST API endpoints for proper responses
- **File Structure** - Validates required files exist and are properly structured
- **Code Quality** - Checks for onclick handlers removal and proper ES6 modules
- **Integration** - Tests PlayerArcManager integration and event delegation
- **Performance** - Validates API response times

### Test Categories

#### 📡 Server Connectivity Tests

- Server availability
- Static file serving
- HTML content validation

#### 🔌 API Endpoint Tests

- `/api/campaigns` - Campaign data retrieval
- `/api/locations` - Location data
- `/api/sessions` - Session information
- `/api/scenes` - Scene data
- `/api/characters` - Character information
- `/api/players` - Player data
- `/api/player-arcs` - Player arc data (GET/PUT)

#### 📁 File Structure Tests

- Required files existence
- No onclick handlers in HTML
- Proper data-action attributes
- ES6 module structure

#### 🔗 Integration Tests

- PlayerArcManager class structure
- Event delegation implementation
- Module imports/exports

#### ⚡ Performance Tests

- API response times (<5 seconds)
- Server responsiveness

### Test Results

The test runner provides:

- ✅ Pass/❌ Fail status for each test
- 📊 Summary statistics
- 🎯 Success rate percentage
- 📝 Detailed error messages for failures

## 📋 Manual Tests

### Manual Test Checklist

Use `manual-test-checklist.md` for comprehensive manual testing:

```bash
npm run test:manual
```

### Manual Test Categories

- **🏠 Dashboard & Navigation** - UI navigation and basic functionality
- **🎭 Scenes Workspace** - Scene management and display
- **👥 Characters Workspace** - Character management and player arcs
- **🏰 Campaign Workspace** - Campaign details and settings
- **⚡ Quick Actions** - Quick action panel functionality
- **🔧 Technical Functionality** - Event handling and API integration
- **📱 UI/UX** - Responsive design and accessibility
- **🚨 Error Handling** - Error states and recovery
- **🔄 Data Flow** - CRUD operations
- **🎯 Player Arc Specific** - Player arc management features
- **🔍 Search & Filter** - Search and filtering functionality
- **📊 Performance** - Load times and responsiveness

### Manual Testing Process

1. **Pre-Test Setup**
   - Start server
   - Open browser to `http://localhost:3000`
   - Open browser console for error monitoring

2. **Execute Test Categories**
   - Work through each category systematically
   - Check off completed items
   - Document any issues found

3. **Record Results**
   - Update the test execution log
   - Note any bugs or issues
   - Track overall status

## 🔧 Test Configuration

### Environment Requirements

- **Node.js** - Version 14+ recommended
- **SQLite Database** - `campaign.db` with test data
- **Network Access** - For API testing
- **Modern Browser** - For manual testing

### Test Data Setup

Ensure your database contains:

- At least one campaign
- Sample scenes, characters, and players
- Player arc data for testing

### Troubleshooting

#### Common Issues

1. **"Server not accessible"**
   - Ensure server is running on port 3000
   - Check for port conflicts

2. **"API request failed"**
   - Verify database exists and is accessible
   - Check server logs for errors

3. **"Required file not found"**
   - Ensure all files are in correct locations
   - Run from project root directory

4. **"No players found"**
   - Add test data to database
   - Check player_arcs table structure

#### Debug Mode

For detailed debugging, modify the test runner:

```javascript
// Add at top of test-runner.js
const DEBUG = true;

// Use in tests
if (DEBUG) console.log('Debug info:', data);
```

## 📈 Continuous Testing

### Integration with Development

1. **Before Commits**

   ```bash
   npm test
   ```

2. **After Major Changes**
   - Run full automated test suite
   - Execute relevant manual test categories

3. **Before Releases**
   - Complete manual test checklist
   - Verify all automated tests pass
   - Document any known issues

### Test Maintenance

- **Update tests** when adding new features
- **Modify assertions** when changing API responses
- **Add new test cases** for bug fixes
- **Review test coverage** regularly

## 🎯 Best Practices

### Automated Testing

- Run tests before commits
- Keep tests fast and reliable
- Test both success and failure cases
- Mock external dependencies when needed

### Manual Testing

- Test on multiple browsers
- Verify mobile responsiveness
- Check accessibility features
- Test with realistic data volumes

### Documentation

- Update test documentation when adding features
- Record test results for tracking
- Document any test environment setup
- Maintain test data requirements

---

## 📞 Support

If you encounter issues with the testing framework:

1. Check this README for troubleshooting steps
2. Verify your environment meets requirements
3. Review server logs for errors
4. Ensure database contains appropriate test data

Happy testing! 🚀
