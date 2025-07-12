# CSS Architecture

## Overview

This directory contains the modular CSS architecture for the Campaign Manager application. The styles are organized following a component-based approach with clear separation of concerns.

## File Structure

```
css/
├── README.md                    # This file
├── main.css                     # Main entry point that imports all other files
├── base/                        # Foundation styles
│   ├── variables.css           # CSS custom properties
│   ├── reset.css               # CSS reset and normalize
│   ├── typography.css          # Font styles and text utilities
│   └── layout.css              # Core layout utilities
├── components/                  # Reusable UI components
│   ├── buttons.css             # Button styles and variants
│   ├── forms.css               # Form controls and validation
│   ├── modals.css              # Modal dialogs and overlays
│   ├── cards.css               # Card components
│   ├── navigation.css          # Navigation and tabs
│   ├── tables.css              # Table styles
│   └── notifications.css       # Toasts and alerts
├── features/                    # Feature-specific styles
│   ├── scenes.css              # Scene management UI
│   ├── characters.css          # Character management UI
│   ├── sessions.css            # Session management UI
│   ├── locations.css           # Location management UI
│   ├── quests.css              # Quest management UI
│   ├── notes.css               # Notes system UI
│   ├── player-arcs.css         # Player arc UI
│   └── dashboard.css           # Dashboard and overview UI
├── utilities/                   # Utility classes
│   ├── spacing.css             # Margin and padding utilities
│   ├── colors.css              # Color utilities
│   ├── display.css             # Display and visibility utilities
│   ├── flexbox.css             # Flexbox utilities
│   └── responsive.css          # Responsive design utilities
└── legacy/                      # Legacy files (to be removed)
    ├── campaign-manager.css    # Original monolithic file
    ├── session-management.css  # Original session styles
    ├── location-management.css # Original location styles
    ├── notes-system.css        # Original notes styles
    └── player-arc-modals.css   # Original player arc styles
```

## Naming Conventions

We follow a modified BEM (Block Element Modifier) methodology:

- **Block**: `.component-name`
- **Element**: `.component-name__element`
- **Modifier**: `.component-name--modifier`
- **State**: `.component-name.is-active`

### Examples

```css
/* Block */
.scene-card { }

/* Element */
.scene-card__header { }
.scene-card__content { }
.scene-card__actions { }

/* Modifier */
.scene-card--completed { }
.scene-card--highlighted { }

/* State */
.scene-card.is-loading { }
.scene-card.is-selected { }
```

## CSS Custom Properties

All design tokens are defined as CSS custom properties in `base/variables.css`:

- Colors: `--cm-primary`, `--cm-secondary`, etc.
- Spacing: `--cm-space-xs`, `--cm-space-sm`, etc.
- Typography: `--cm-font-size-sm`, `--cm-line-height-base`, etc.
- Shadows: `--cm-shadow-sm`, `--cm-shadow-md`, etc.
- Borders: `--cm-radius-sm`, `--cm-border-width`, etc.

## Component Guidelines

1. **Single Responsibility**: Each component should have one clear purpose
2. **Composable**: Components should work well together
3. **Consistent**: Follow the same patterns across all components
4. **Accessible**: Include proper focus states and ARIA support
5. **Responsive**: Mobile-first approach with progressive enhancement

## File Size Guidelines

- Base files: < 100 lines each
- Component files: < 300 lines each
- Feature files: < 500 lines each
- Utility files: < 200 lines each

## Migration Strategy

1. ✅ Create new modular structure
2. ⏳ Extract base styles and variables
3. ⏳ Create reusable components
4. ⏳ Migrate feature-specific styles
5. ⏳ Add utility classes
6. ⏳ Set up build system
7. ⏳ Test and validate
8. ⏳ Remove legacy files

## Build Process

The CSS files are concatenated in the following order:

1. Base styles (variables, reset, typography, layout)
2. Components (buttons, forms, modals, etc.)
3. Features (scenes, characters, sessions, etc.)
4. Utilities (spacing, colors, display, etc.)

This ensures proper cascade and specificity management.
