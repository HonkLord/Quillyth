# NPC Relationships Implementation

## Overview
This implementation adds sample NPCs to the character system to demonstrate the PC vs NPC distinction in the relationship matrix.

## What Was Added

### 1. Sample NPCs
Three new NPCs were added to the character system:

#### Lyralei (Missing Person)
- **Role**: Missing Person
- **Description**: Vandarith's younger sister, disappeared during expedition to ancient ruins
- **Relationships**: 
  - Family relationship with Vandarith (her brother)
  - Neutral relationship with Vincent (trusts her brother's companions)
  - Friend relationship with Geoff (appreciates his protective nature)
- **Favorability**: 85 (high)

#### Captain Thorne (Military Officer)
- **Role**: Military Officer
- **Description**: Veteran captain of the Duskhaven Guard, honorable but pragmatic
- **Relationships**:
  - Mentor relationship with Vincent (former subordinate)
  - Ally relationship with Vandarith (reliable information source)
  - Neutral relationship with Lilith (wary but respects her skills)
- **Favorability**: 75 (high)

#### The Shadow Broker (Information Dealer)
- **Role**: Information Dealer
- **Description**: Mysterious figure who trades in secrets and information
- **Relationships**:
  - Friend relationship with Lilith (former guild associate)
  - Rival relationship with Vandarith (competing for information)
  - Enemy relationship with Geoff (mutual distrust)
- **Favorability**: 45 (medium)

### 2. Enhanced PC Relationships
Updated the existing player characters to include relationships with the new NPCs:

#### Vandarith (Ranger)
- **New Relationships**:
  - Family: Lyralei (missing sister - searching desperately)
  - Ally: Captain Thorne (trusted military contact)
  - Rival: Shadow Broker (competing information broker)

#### Vincent (Fighter)
- **New Relationships**:
  - Mentor: Captain Thorne (former commanding officer)
  - Neutral: Lyralei (wants to help find her)

#### Lilith (Rogue)
- **New Relationships**:
  - Friend: Shadow Broker (former guild contact)
  - Neutral: Captain Thorne (cautious respect)

#### Geoff (Barbarian)
- **New Relationships**:
  - Friend: Lyralei (sees her as needing protection)
  - Enemy: Shadow Broker (distrusts information dealers)

## Technical Implementation

### Code Changes Made

1. **Modified `character-core.js`**:
   - Added `getSampleNPCs()` method to provide sample NPCs
   - Updated fallback behavior to use sample NPCs instead of empty array
   - Enhanced existing PCs with relationship data

2. **Character Structure**:
   - Each character now has a `relationships` object with target character IDs as keys
   - Relationships include type, description, and creation timestamp
   - NPCs have additional properties: `role`, `favorability`, `importance`, `scenes`

3. **Relationship Types Supported**:
   - `family`: Family members
   - `ally`: Trusted allies
   - `friend`: Close friends
   - `neutral`: Neutral acquaintances
   - `rival`: Competitive rivals
   - `enemy`: Hostile enemies
   - `mentor`: Teacher/student relationships

## Testing

### Test File Created
Created `/test-relationships.html` to demonstrate the relationship matrix functionality:

- **Character List**: Shows all characters with their type (PC/NPC) and relationships
- **Matrix View**: Displays the relationship matrix with attitude scores
- **PC vs NPC Distinction**: Clear visual distinction between player characters and NPCs

### How to Test

1. Open `test-relationships.html` in a web browser
2. Click "Reload Characters" to see the character list
3. Click "Load Relationship Matrix" to display the attitude matrix
4. Observe:
   - PCs are marked with blue "PC" badges
   - NPCs are marked with purple "NPC" badges
   - Relationship matrix shows attitude scores (0-100)
   - Different relationship types are color-coded

## Relationship Matrix Features

### Visual Elements
- **Character Type Indicators**: PC vs NPC badges
- **Attitude Scores**: 0-100 scale showing favorability
- **Relationship Types**: Short codes (A=Ally, F=Friend, etc.)
- **Color Coding**: Different colors for positive, neutral, and negative relationships

### Matrix Legend
- **Attitude Scale**: Hostile (0-20), Unfriendly (21-40), Neutral (41-60), Friendly (61-80), Devoted (81-100)
- **Relationship Types**: A=Ally, F=Friend, N=Neutral, R=Rival, E=Enemy, Fa=Family, Ro=Romantic, M=Mentor
- **Character Types**: PC = Player Character, NPC = Non-Player Character

## Integration with Existing System

### API Compatibility
- NPCs are provided as fallback when `/api/characters/important-npcs` endpoint is unavailable
- Maintains compatibility with existing character management functions
- Supports all existing relationship management operations

### Character Management
- NPCs can be viewed, edited, and have relationships added/removed
- Fully integrated with the character progression system
- Compatible with the existing character notes and tracking systems

## Future Enhancements

### Database Integration
When the database is available, these NPCs can be properly stored in the `scene_characters` table:

```sql
INSERT INTO scene_characters (scene_id, character_id, character_type, character_name, role, motivation, favorability, history)
VALUES ('sample-scene', 'lyralei', 'npc', 'Lyralei', 'Missing Person', 'Survival and finding her way home', 85, 'Vandarith''s sister');
```

### Additional Features
- Dynamic NPC generation based on campaign events
- Relationship tracking over time
- Automated relationship suggestions based on character interactions
- Integration with AI-powered character development

## Summary

This implementation successfully adds sample NPCs to demonstrate the PC vs NPC distinction in the relationship matrix. The enhanced system now shows:

1. **Clear Character Types**: Visual distinction between PCs and NPCs
2. **Rich Relationships**: Comprehensive relationship web between all characters
3. **Attitude Matrix**: Quantified relationship strengths and types
4. **Interactive Testing**: Easy way to verify the functionality

The relationship matrix now provides meaningful insights into character dynamics and demonstrates the system's capability to handle complex social interactions between player characters and important NPCs.