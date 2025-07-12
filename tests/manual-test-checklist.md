# Campaign Manager Manual Test Checklist

This document provides a comprehensive manual testing checklist to validate all functionality in the D&D Campaign Manager application.

## Pre-Test Setup

- [ ] Server is running (`npm start` or `node server.js`)
- [ ] Browser is open to `http://localhost:3000`
- [ ] Database exists and contains test data
- [ ] Console is open for error monitoring

## 🏠 Dashboard & Navigation Tests

### Main Dashboard

- [ ] Dashboard loads without errors
- [ ] Campaign title is displayed correctly
- [ ] Campaign title can be edited by clicking the edit icon
- [ ] All navigation buttons are present and styled correctly

### Navigation Menu

- [ ] "Dashboard" button shows main dashboard
- [ ] "Scenes" button shows scenes workspace
- [ ] "Characters" button shows characters workspace  
- [ ] "Campaign" button shows campaign details
- [ ] "Quick Actions" button shows quick actions panel
- [ ] All navigation uses data-action attributes (no onclick handlers)

### Sidebar Functionality

- [ ] Sidebar can be opened/closed
- [ ] Scene tree toggle works correctly
- [ ] Sidebar content updates based on current workspace

## 🎭 Scenes Workspace Tests

### Scene Navigation

- [ ] Scene list loads and displays correctly
- [ ] Scene tree can be toggled on/off
- [ ] Individual scenes can be selected
- [ ] Scene details load when selected
- [ ] Scene creation form works
- [ ] Scene editing functionality works

### Scene Content

- [ ] Scene descriptions display correctly
- [ ] Scene information cards show properly (DM Notes, Setup, Read Aloud)
- [ ] Scene status management works
- [ ] Scene editing modal functions correctly
- [ ] Scene actions (duplicate, export, delete) work
- [ ] Scene search functionality works
- [ ] Scene filtering works

## 👥 Characters Workspace Tests

### Character Overview Tab

- [ ] Character list loads correctly
- [ ] Character details display properly
- [ ] Character images show (if present)
- [ ] Character stats and information are accurate
- [ ] Character search works
- [ ] Character filtering works

### Player Arcs Tab

- [ ] Player Arcs tab is accessible
- [ ] Player arc overview loads
- [ ] Player arc data displays correctly
- [ ] Goals and milestones show properly
- [ ] Player arc status indicators work

### Player Arc Management

- [ ] Individual player arcs can be viewed
- [ ] Player arc editing modal opens
- [ ] Goals can be added/edited/removed
- [ ] Goal status can be updated
- [ ] Milestones can be added/edited/removed
- [ ] Player arc status can be changed
- [ ] Changes save correctly to database

## 🏰 Campaign Workspace Tests

### Campaign Details

- [ ] Campaign information loads
- [ ] Campaign metadata displays
- [ ] Campaign description shows correctly
- [ ] Campaign statistics are accurate

### Campaign Management

- [ ] Campaign settings can be accessed
- [ ] Campaign data can be edited
- [ ] Changes save properly

## ⚡ Quick Actions Tests

### Quick Actions Panel

- [ ] Quick actions panel opens/closes
- [ ] Global search opens with Ctrl+K
- [ ] Quick action buttons are functional
- [ ] Panel closes after action completion

### Action Functionality

- [ ] Create new scene works
- [ ] Create new character works
- [ ] Create new session works
- [ ] Export/Import functionality works

## 🔧 Technical Functionality Tests

### Event Handling

- [ ] All buttons use data-action attributes
- [ ] No onclick handlers present in HTML
- [ ] Event delegation works correctly
- [ ] Click events trigger appropriate actions
- [ ] Keyboard navigation works

### API Integration

- [ ] All API endpoints respond correctly
- [ ] Data loads without errors
- [ ] Data saves successfully
- [ ] Error handling works for failed requests
- [ ] Loading states display appropriately

### Database Operations

- [ ] Data persistence works correctly
- [ ] CRUD operations function properly
- [ ] Data integrity is maintained
- [ ] Concurrent operations handle correctly

## 📱 UI/UX Tests

### Responsive Design

- [ ] Layout works on different screen sizes
- [ ] Mobile navigation functions correctly
- [ ] Touch interactions work on mobile devices
- [ ] Text remains readable at all sizes

### Visual Design

- [ ] Styling is consistent throughout
- [ ] Colors and fonts match design system
- [ ] Icons display correctly
- [ ] Loading states are visually clear
- [ ] Error states are clearly indicated

### Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader compatibility (basic test)
- [ ] Color contrast is sufficient
- [ ] Focus indicators are visible
- [ ] Alt text present for images

## 🚨 Error Handling Tests

### Client-Side Errors

- [ ] Invalid form submissions show appropriate errors
- [ ] Network failures are handled gracefully
- [ ] Missing data scenarios display helpful messages
- [ ] JavaScript errors don't break the application

### Server-Side Errors

- [ ] API errors return meaningful messages
- [ ] Database connection issues are handled
- [ ] Invalid requests return appropriate status codes
- [ ] Server crashes are prevented/logged

## 🔄 Data Flow Tests

### Create Operations

- [ ] New scenes can be created and saved
- [ ] New characters can be created and saved
- [ ] New player arcs can be created
- [ ] New goals/milestones can be added

### Read Operations

- [ ] All data loads correctly on page refresh
- [ ] Search functionality returns accurate results
- [ ] Filtering works across all content types
- [ ] Data relationships display correctly

### Update Operations

- [ ] Existing data can be modified
- [ ] Changes persist after page reload
- [ ] Concurrent updates are handled properly
- [ ] Update confirmations work

### Delete Operations

- [ ] Data can be deleted (where applicable)
- [ ] Deletion confirmations work
- [ ] Related data is handled appropriately
- [ ] Soft deletes work (if implemented)

## 🎯 Player Arc Specific Tests

### Player Arc Overview

- [ ] All players with arcs are listed
- [ ] Arc summaries display correctly
- [ ] Progress indicators show accurate status
- [ ] Navigation to detailed view works

### Player Arc Details

- [ ] Individual player arc loads completely
- [ ] All goals are displayed with correct status
- [ ] All milestones are shown chronologically
- [ ] Arc description and status are accurate

### Player Arc Editing

- [ ] Edit modal opens correctly
- [ ] All fields are editable
- [ ] Form validation works
- [ ] Save functionality persists changes
- [ ] Cancel functionality discards changes

### Goals Management

- [ ] Goals list displays correctly
- [ ] New goals can be added
- [ ] Goal status can be updated
- [ ] Goal descriptions can be edited
- [ ] Goals can be removed

### Milestones Management

- [ ] Milestones display in chronological order
- [ ] New milestones can be added
- [ ] Milestone details can be edited
- [ ] Milestones can be removed

## 📦 Export/Import Tests

### Export Functionality

- [ ] Export campaign data works
- [ ] Export preview shows correct information
- [ ] Exported file downloads successfully
- [ ] Export includes all data types (scenes, characters, etc.)

### Import Functionality

- [ ] Import file selection works
- [ ] Import validation prevents invalid files
- [ ] Import creates new campaign correctly
- [ ] Import progress is shown to user
- [ ] Import handles errors gracefully

## 🔍 Search & Filter Tests

### Global Search

- [ ] Search works across all content types
- [ ] Search results are relevant and accurate
- [ ] Search highlighting works (if implemented)
- [ ] Empty search results display appropriately

### Content-Specific Filters

- [ ] Scene filters work correctly
- [ ] Character filters function properly
- [ ] Player arc filters operate as expected
- [ ] Filter combinations work together

## 📊 Performance Tests

### Load Times

- [ ] Initial page load is under 3 seconds
- [ ] Navigation between workspaces is responsive
- [ ] Large datasets load efficiently
- [ ] Images load without blocking UI

### Memory Usage

- [ ] No memory leaks during extended use
- [ ] Browser performance remains stable
- [ ] Large operations don't freeze the UI

## ✅ Test Results

### Overall Status

- [ ] All critical functionality works
- [ ] No blocking bugs identified
- [ ] Performance is acceptable
- [ ] User experience is smooth

### Notes

_Use this space to record any issues found during testing:_

---

## Test Execution Log

| Test Category | Status | Issues Found | Notes |
|---------------|--------|--------------|-------|
| Dashboard & Navigation | ⏳ | | |
| Scenes Workspace | ⏳ | | |
| Characters Workspace | ⏳ | | |
| Campaign Workspace | ⏳ | | |
| Quick Actions | ⏳ | | |
| Technical Functionality | ⏳ | | |
| UI/UX | ⏳ | | |
| Error Handling | ⏳ | | |
| Data Flow | ⏳ | | |
| Player Arc Specific | ⏳ | | |
| Search & Filter | ⏳ | | |
| Performance | ⏳ | | |

**Legend:** ✅ Pass | ❌ Fail | ⏳ Not Tested | ⚠️ Issues Found

---

_Last Updated: [Date]_
_Tested By: [Name]_
_Application Version: [Version]_
