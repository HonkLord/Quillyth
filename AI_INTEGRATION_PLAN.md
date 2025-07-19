# AI Integration Plan for Scene Renderer

## Overview
This document outlines the plan to replace placeholder AI functionality in `js/components/scene-renderer.js` with real Gemini AI service integration.

## Current Placeholder Methods

### 1. `generateSceneContext(scene)` - Lines 1317-1331
**Current State:** Uses setTimeout to simulate AI response
**Purpose:** Generate rich contextual information for scenes
**Integration Point:** Replace with Gemini AI service call

### 2. `generateMusicSuggestion(scene)` - Lines 1332-1348  
**Current State:** Uses setTimeout to simulate music suggestions
**Purpose:** Provide mood-based music recommendations
**Integration Point:** Replace with Gemini AI service call

### 3. `generateNextAction(scene)` - Lines 1349-1369
**Current State:** Uses setTimeout to simulate "Therefore" system
**Purpose:** AI-powered scene progression suggestions
**Integration Point:** Replace with Gemini AI service call

## Architecture Design

### 1. Enhanced Gemini Service Integration

#### New Methods to Add to `js/services/gemini-service.js`:

```javascript
// Scene-specific AI generation methods
async generateSceneContext(scene, location, campaignContext) {
  const prompt = this.#buildSceneContextPrompt(scene, location, campaignContext);
  return this.generateContent(prompt);
}

async generateMusicSuggestion(scene, mood) {
  const prompt = this.#buildMusicPrompt(scene, mood);
  return this.generateContent(prompt);
}

async generateNextAction(scene, actorStates, campaignContext) {
  const prompt = this.#buildNextActionPrompt(scene, actorStates, campaignContext);
  return this.generateContent(prompt);
}

// Private helper methods for building prompts
#buildSceneContextPrompt(scene, location, campaignContext) {
  return getSceneContextPrompt(scene, location, campaignContext);
}

#buildMusicPrompt(scene, mood) {
  return getMusicSuggestionPrompt(scene, mood);
}

#buildNextActionPrompt(scene, actorStates, campaignContext) {
  return getNextActionPrompt(scene, actorStates, campaignContext);
}
```

### 2. Prompt Template Expansion

#### New Templates to Add to `js/prompt-templates.js`:

```javascript
export function getSceneContextPrompt(scene, location, campaignContext) {
  return `# SCENE CONTEXT GENERATION
  
## SCENE DETAILS
- **Name:** ${scene.name}
- **Type:** ${scene.scene_type}
- **Location:** ${location?.name || 'Unknown'}
- **Current Setup:** ${scene.current_setup || 'None'}

## LOCATION CONTEXT
${location?.description || 'No location description available'}

## CAMPAIGN CONTEXT
${campaignContext || 'No campaign context available'}

## TASK
Generate rich, atmospheric context for this scene that a DM can use to:
- Set the mood and atmosphere
- Provide sensory details (sights, sounds, smells)
- Suggest environmental interactions
- Create immersive descriptions

**Output Format:**
- **Atmosphere:** [Mood and feeling of the scene]
- **Sensory Details:** [What characters see, hear, smell, feel]
- **Environmental Elements:** [Interactive objects, weather, lighting]
- **NPC Reactions:** [How NPCs might respond to the scene]
- **Player Hooks:** [Elements that might engage player characters]`;
}

export function getMusicSuggestionPrompt(scene, mood) {
  return `# MUSIC SUGGESTION GENERATION

## SCENE CONTEXT
- **Scene Type:** ${scene.scene_type}
- **Mood:** ${mood}
- **Location:** ${scene.location_id}
- **Description:** ${scene.description || 'No description'}

## TASK
Suggest appropriate music and ambient sounds for this D&D scene.

**Output Format:**
- **Primary Mood:** [Main emotional tone]
- **Music Suggestions:** [3-5 specific music recommendations]
- **Ambient Sounds:** [Environmental audio suggestions]
- **Volume/Pacing:** [How the music should change during the scene]
- **Transition Notes:** [When to change music or add effects]`;
}

export function getNextActionPrompt(scene, actorStates, campaignContext) {
  return `# NEXT ACTION GENERATION ("THEREFORE" SYSTEM)

## SCENE STATE
- **Scene:** ${scene.name}
- **Type:** ${scene.scene_type}
- **Current Status:** ${scene.scene_status}

## ACTOR STATES
${actorStates.map(state => `
**${state.characterName} (${state.characterType}):**
- Thought: ${state.thought || 'None recorded'}
- Action: ${state.action || 'None recorded'}
- Timestamp: ${state.timestamp}
`).join('\n')}

## CAMPAIGN CONTEXT
${campaignContext || 'No campaign context available'}

## TASK
Based on the current scene dynamics and actor states, suggest what should happen next.

**Output Format:**
- **Therefore:** [Main suggested next action based on current events]
- **Alternative:** [Secondary option if players take different approach]
- **NPC Reactions:** [How NPCs should respond to current situation]
- **Plot Advancement:** [How this moves the story forward]
- **Player Agency:** [Ways to let players drive the scene]`;
}
```

### 3. Scene Renderer Integration

#### Updated Methods in `js/components/scene-renderer.js`:

```javascript
// Import the enhanced services
import { GeminiService } from '../services/gemini-service.js';
import { 
  getSceneContextPrompt, 
  getMusicSuggestionPrompt, 
  getNextActionPrompt 
} from '../prompt-templates.js';

// Add Gemini service instance
constructor() {
  this.currentScene = null;
  this.quickNPCCounter = 0;
  this.geminiService = new GeminiService();
}

// Replace placeholder methods with real AI calls
async generateSceneContext(scene) {
  try {
    const output = document.getElementById("atmosphere-output");
    if (!output) return;

    output.innerHTML = `<p class="generating">🤖 Generating contextual information...</p>`;
    
    // Get campaign context
    const campaignContext = await this.getCampaignContext(scene.campaign_id);
    
    // Get location data
    const location = await this.getLocationData(scene.location_id);
    
    // Generate context using AI
    const context = await this.geminiService.generateSceneContext(
      scene, 
      location, 
      campaignContext
    );
    
    output.innerHTML = `<div class="ai-generated-content">${context}</div>`;
  } catch (error) {
    console.error('Failed to generate scene context:', error);
    this.showToast('Failed to generate context', 'error');
  }
}

async generateMusicSuggestion(scene) {
  try {
    const mood = document.querySelector(".mood-select")?.value || "neutral";
    const output = document.getElementById("music-output");
    if (!output) return;

    output.innerHTML = `<p class="generating">🎵 Finding music for ${mood} mood...</p>`;
    
    const musicSuggestion = await this.geminiService.generateMusicSuggestion(
      scene, 
      mood
    );
    
    output.innerHTML = `<div class="ai-generated-content">${musicSuggestion}</div>`;
  } catch (error) {
    console.error('Failed to generate music suggestion:', error);
    this.showToast('Failed to generate music suggestion', 'error');
  }
}

async generateNextAction(scene) {
  try {
    const suggestions = document.getElementById("next-suggestions");
    if (!suggestions) return;

    suggestions.innerHTML = `<p class="generating">🎲 Analyzing scene context...</p>`;
    
    // Get current actor states
    const actorStates = this.getCurrentActorStates(scene.id);
    
    // Get campaign context
    const campaignContext = await this.getCampaignContext(scene.campaign_id);
    
    const nextAction = await this.geminiService.generateNextAction(
      scene, 
      actorStates, 
      campaignContext
    );
    
    suggestions.innerHTML = `<div class="ai-generated-content">${nextAction}</div>`;
  } catch (error) {
    console.error('Failed to generate next action:', error);
    this.showToast('Failed to generate next action', 'error');
  }
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Add new prompt templates to `js/prompt-templates.js`
- [ ] Extend `GeminiService` with scene-specific methods
- [ ] Add helper methods to `SceneRenderer` for data gathering

### Phase 2: Core Integration (Week 2)
- [ ] Replace `generateSceneContext` placeholder
- [ ] Replace `generateMusicSuggestion` placeholder  
- [ ] Replace `generateNextAction` placeholder
- [ ] Add error handling and fallback mechanisms

### Phase 3: Enhancement (Week 3)
- [ ] Add caching for AI responses
- [ ] Implement progressive loading states
- [ ] Add user feedback mechanisms
- [ ] Optimize prompt engineering

### Phase 4: Testing & Polish (Week 4)
- [ ] Comprehensive testing with various scene types
- [ ] Performance optimization
- [ ] User experience improvements
- [ ] Documentation updates

## Error Handling Strategy

### Graceful Degradation
- If AI service fails, show helpful error message
- Provide fallback suggestions based on scene type
- Allow manual input as backup

### User Feedback
- Show loading states during AI generation
- Provide retry options for failed requests
- Display partial results when possible

## Performance Considerations

### Caching Strategy
- Cache AI responses for similar scenes
- Store generated content in session storage
- Implement request deduplication

### Rate Limiting
- Respect API rate limits
- Queue requests when necessary
- Provide user feedback on API status

## Success Metrics

### Technical Metrics
- AI response time < 3 seconds
- Success rate > 95%
- Error rate < 5%

### User Experience Metrics
- User satisfaction with AI suggestions
- Frequency of AI feature usage
- Reduction in manual scene preparation time

## Future Enhancements

### Advanced Features
- Multi-turn conversation with AI
- Scene-specific character voice generation
- Dynamic difficulty adjustment
- Campaign-wide AI memory

### Integration Opportunities
- Voice synthesis for read-aloud text
- Image generation for scene visuals
- Real-time translation for international players 