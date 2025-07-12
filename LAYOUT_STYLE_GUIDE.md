# D&D Campaign Manager - Layout & Nesting Style Guide

## Overview

This guide establishes consistent layout patterns, container nesting standards, and spacing rules across all features to ensure a unified user experience.

## Core Layout Principles

### 1. **Standardized Container Hierarchy**

All features must follow this exact nesting pattern:

```html
<div class="workspace-container">
  <div class="workspace-feature-header">
    <div class="workspace-feature-title">
      <i class="feature-icon"></i>
      <div>
        <h2>Feature Name</h2>
        <p class="workspace-feature-subtitle">Description</p>
      </div>
    </div>
    <div class="workspace-feature-actions">
      <!-- Action buttons -->
    </div>
  </div>
  
  <div class="workspace-section">
    <div class="workspace-section-header">
      <h3 class="workspace-section-title">Section Title</h3>
      <div class="workspace-section-actions">
        <!-- Optional section actions -->
      </div>
    </div>
    <div class="workspace-section-content">
      <!-- Section content -->
    </div>
  </div>
</div>
```

### 2. **Grid Layout Standards**

#### Statistics Grid

```html
<div class="workspace-stats-grid">
  <div class="card card-stat">
    <div class="stat-value">123</div>
    <div class="stat-label">Label</div>
  </div>
</div>
```

#### Cards Grid

```html
<div class="workspace-cards-grid">
  <div class="card card-[type]">
    <div class="card-header">
      <div class="card-title-info">
        <h4 class="card-title">Title</h4>
        <div class="card-meta">Meta info</div>
      </div>
      <div class="card-actions">
        <!-- Action buttons -->
      </div>
    </div>
    <div class="card-body">
      <!-- Card content -->
    </div>
  </div>
</div>
```

### 3. **Panel Layout Standards**

#### Two-Panel Layout

```html
<div class="workspace-container">
  <div class="workspace-grid workspace-grid-2">
    <div class="workspace-panel workspace-panel-primary">
      <!-- Main content -->
    </div>
    <div class="workspace-panel workspace-panel-secondary">
      <!-- Detail/sidebar content -->
    </div>
  </div>
</div>
```

#### Three-Panel Layout

```html
<div class="workspace-container">
  <div class="workspace-grid workspace-grid-3">
    <div class="workspace-panel workspace-panel-sidebar">
      <!-- Left sidebar -->
    </div>
    <div class="workspace-panel workspace-panel-main">
      <!-- Main content -->
    </div>
    <div class="workspace-panel workspace-panel-detail">
      <!-- Right detail panel -->
    </div>
  </div>
</div>
```

## Spacing Standards

### Container Spacing

- **Workspace Container**: `padding: var(--cm-workspace-padding)`
- **Workspace Panel**: `padding: var(--cm-panel-padding)`
- **Workspace Section**: `padding: var(--cm-section-padding)`
- **Card**: `padding: var(--cm-card-padding)`

### Grid Spacing

- **Grid Gap**: `gap: var(--cm-grid-gap)`
- **Section Gap**: `gap: var(--cm-section-gap)`
- **Card Gap**: `gap: var(--cm-card-gap)`

## Card Component Standards

### Base Card Structure

```html
<div class="card card-[type]">
  <div class="card-header">
    <div class="card-title-info">
      <h4 class="card-title">Title</h4>
      <div class="card-meta">
        <span class="card-category">Category</span>
        <span class="card-status">Status</span>
      </div>
    </div>
    <div class="card-actions">
      <button class="btn btn-sm btn-outline-primary">
        <i class="fas fa-eye"></i>
      </button>
    </div>
  </div>
  <div class="card-body">
    <p class="card-description">Description</p>
  </div>
  <div class="card-footer">
    <!-- Optional footer content -->
  </div>
</div>
```

### Card Types

- `card-character` - Character cards
- `card-scene` - Scene cards
- `card-quest` - Quest cards
- `card-session` - Session cards
- `card-location` - Location cards
- `card-stat` - Statistics cards

## Empty State Standards

### Empty State Structure

```html
<div class="workspace-empty-state">
  <i class="fas fa-[icon]"></i>
  <h3>No [Items] Found</h3>
  <p>Description of what to do next.</p>
  <button class="btn btn-primary">
    <i class="fas fa-plus"></i> Add [Item]
  </button>
</div>
```

## Feature-Specific Requirements

### Characters Feature

- Must use two-panel layout with character list and detail view
- Character cards must use `card-character` type
- NPCs must use same card structure as player characters
- Character detail tabs must use standard tab structure

### Scenes Feature

- Must use three-panel layout for navigation, content, and tools
- Scene cards must use `card-scene` type
- Scene overview must use standard feature header
- Scene dynamics must use workspace panels

### Quests Feature

- Must use single-panel layout with sections
- Quest cards must use `card-quest` type
- Quest filters must use workspace section pattern
- Quest details must use standard card expansion

### Sessions Feature

- Must use single-panel layout with session list
- Session items must use `card-session` type
- Session statistics must use workspace stats grid
- Session planner must use workspace modal pattern

### Locations Feature

- Must use two-panel layout with location list and detail view
- Location cards must use `card-location` type
- Location details must use workspace panel structure

## Responsive Design Standards

### Breakpoints

- **Mobile**: `max-width: 768px` - Single column, stacked panels
- **Tablet**: `max-width: 1024px` - Two columns, reduced spacing
- **Desktop**: `min-width: 1025px` - Full layout, standard spacing

### Panel Behavior

- **Mobile**: All panels stack vertically
- **Tablet**: Two-panel layouts become single column, three-panel becomes two-column
- **Desktop**: Full multi-panel layouts

## Implementation Checklist

### HTML Structure

- [ ] Use standardized container hierarchy
- [ ] Follow consistent nesting patterns
- [ ] Use proper semantic HTML elements
- [ ] Include required CSS classes

### CSS Classes

- [ ] Use workspace-* classes for layout
- [ ] Use card-* classes for components
- [ ] Use standardized spacing variables
- [ ] Follow responsive design patterns

### JavaScript Integration

- [ ] Generate HTML using standard templates
- [ ] Use consistent event handling patterns
- [ ] Follow modular architecture
- [ ] Maintain accessibility standards

## Anti-Patterns to Avoid

### HTML Anti-Patterns

- ❌ Custom container classes per feature
- ❌ Inconsistent nesting depths
- ❌ Hardcoded spacing values
- ❌ Non-semantic HTML structures

### CSS Anti-Patterns

- ❌ Feature-specific layout classes
- ❌ Hardcoded dimensions
- ❌ Inconsistent spacing units
- ❌ Non-responsive designs

### JavaScript Anti-Patterns

- ❌ Inline HTML strings without templates
- ❌ Feature-specific layout logic
- ❌ Hardcoded DOM structures
- ❌ Non-modular component patterns

## Testing Requirements

### Visual Testing

- [ ] Consistent spacing across all features
- [ ] Proper nesting without overflow
- [ ] Responsive behavior at all breakpoints
- [ ] Consistent card appearances

### Functional Testing

- [ ] All interactive elements work correctly
- [ ] Proper focus management
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility

## Maintenance Guidelines

### Code Reviews

- Verify all new components follow this guide
- Check for consistent spacing and nesting
- Ensure responsive design compliance
- Validate accessibility standards

### Updates

- Update this guide when new patterns are needed
- Communicate changes to all team members
- Maintain backward compatibility when possible
- Document any breaking changes

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Status**: Active Implementation Guide
