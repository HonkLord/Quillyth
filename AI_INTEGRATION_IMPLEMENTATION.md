# AI Integration Implementation Guide

## Quick Implementation Steps

This guide provides step-by-step instructions to replace the placeholder setTimeout calls in `js/components/scene-renderer.js` with real Gemini AI service integration.

## Step 1: Extend Gemini Service

### Add to `js/services/gemini-service.js`:

```javascript
// Add these methods to the GeminiService class

async generateSceneContext(sceneData, campaignContext) {
  const prompt = getSceneContextPrompt(sceneData, campaignContext);
  return this.generateContent(prompt);
}

async generateMusicSuggestion(sceneData, mood) {
  const prompt = getMusicSuggestionPrompt(sceneData, mood);
  return this.generateContent(prompt);
}

async generateNextAction(sceneData, actorStates, campaignContext) {
  const prompt = getNextActionPrompt(sceneData, actorStates, campaignContext);
  return this.generateContent(prompt);
}
```

## Step 2: Add Prompt Templates

### Add to `js/prompt-templates.js`:

```javascript
// Add these new export functions

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

## Step 3: Update Scene Renderer

### Add imports to `js/components/scene-renderer.js`:

```javascript
// Add these imports at the top
import { GeminiService } from "../services/gemini-service.js";
import { 
  getSceneContextPrompt, 
  getMusicSuggestionPrompt, 
  getNextActionPrompt 
} from "../prompt-templates.js";
```

### Update constructor:

```javascript
constructor() {
  this.currentScene = null;
  this.quickNPCCounter = 0;
  this.geminiService = new GeminiService(); // Add this line
}
```

### Add helper methods:

```javascript
// Add these helper methods to the SceneRenderer class

async getCampaignContext(campaignId) {
  try {
    if (!campaignId) {
      console.warn('No campaign ID provided for context retrieval');
      return null;
    }

    // Fetch campaign data from the API
    const response = await fetch(`/api/campaigns/${campaignId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch campaign: ${response.status}`);
    }

    const campaign = await response.json();
    
    // Build comprehensive campaign context
    const context = {
      name: campaign.name || 'Unknown Campaign',
      description: campaign.description || '',
      setting: campaign.setting || '',
      currentArc: campaign.current_arc || '',
      majorEvents: campaign.major_events || '',
      npcRelationships: campaign.npc_relationships || '',
      worldState: campaign.world_state || ''
    };

    // Format the context for AI consumption
    return `CAMPAIGN: ${context.name}
DESCRIPTION: ${context.description}
SETTING: ${context.setting}
CURRENT ARC: ${context.currentArc}
MAJOR EVENTS: ${context.majorEvents}
NPC RELATIONSHIPS: ${context.npcRelationships}
WORLD STATE: ${context.worldState}`.trim();

  } catch (error) {
    console.error('Failed to get campaign context:', error);
    return null;
  }
}

async getLocationData(locationId) {
  try {
    if (!locationId) return null;
    
    const response = await fetch(`/api/locations/${locationId}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Failed to get location data:', error);
    return null;
  }
}

getCurrentActorStates(sceneId) {
  try {
    if (!this.sceneActionHistory[sceneId]) {
      return [];
    }

    const states = [];
    Object.entries(this.sceneActionHistory[sceneId]).forEach(([characterId, history]) => {
      if (history.length > 0) {
        const latestState = history[history.length - 1];
        const characterElement = document.querySelector(`[data-character-id="${characterId}"]`);
        const characterName = characterElement?.querySelector('strong')?.textContent || 'Unknown';
        const characterType = characterElement?.classList.contains('pc') ? 'PC' : 'NPC';
        
        states.push({
          characterId,
          characterName,
          characterType,
          thought: latestState.thought,
          action: latestState.action,
          timestamp: latestState.timestamp
        });
      }
    });
    
    return states;
  } catch (error) {
    console.error('Failed to get current actor states:', error);
    return [];
  }
}
```

### Replace the placeholder methods:

```javascript
// Replace the existing generateSceneContext method
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
    
    // Fallback to placeholder content
    const output = document.getElementById("atmosphere-output");
    if (output) {
      output.innerHTML = `<p>Context generation failed. Please try again or add context manually.</p>`;
    }
  }
}

// Replace the existing generateMusicSuggestion method
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
    
    // Fallback to placeholder content
    const output = document.getElementById("music-output");
    if (output) {
      output.innerHTML = `<p>Music suggestion failed. Please try again or search manually.</p>`;
    }
  }
}

// Replace the existing generateNextAction method
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
    
    // Fallback to placeholder content
    const suggestions = document.getElementById("next-suggestions");
    if (suggestions) {
      suggestions.innerHTML = `<p>Next action generation failed. Please try again or proceed manually.</p>`;
    }
  }
}
```

## Step 4: Add CSS for AI-Generated Content

### Add to your CSS file:

```css
.ai-generated-content {
  background: #f8f9fa;
  border-left: 4px solid #007bff;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 0 4px 4px 0;
}

.generating {
  color: #6c757d;
  font-style: italic;
}

.ai-generated-content h4 {
  color: #007bff;
  margin-bottom: 0.5rem;
}

.ai-generated-content ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}
```

## Step 5: Testing

### Test each integration:

1. **Scene Context Generation:**
   - Open a scene in Run Mode
   - Click "Generate Context" button
   - Verify AI response appears
   - Test error handling by temporarily breaking API key

2. **Music Suggestions:**
   - Change mood selector
   - Click "Find Music" button
   - Verify AI-generated music suggestions
   - Test with different moods

3. **Next Action Generation:**
   - Add some actor states (thoughts/actions)
   - Click "Generate Next Action" button
   - Verify AI suggestions based on current state
   - Test with empty actor states

## Step 6: Error Handling

### Add retry functionality:

```javascript
// Add this method to SceneRenderer class
async retryAIGeneration(generationType, scene, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      switch (generationType) {
        case 'context':
          return await this.generateSceneContext(scene);
        case 'music':
          return await this.generateMusicSuggestion(scene);
        case 'nextAction':
          return await this.generateNextAction(scene);
        default:
          throw new Error(`Unknown generation type: ${generationType}`);
      }
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

## Notes

- Ensure your Gemini API key is properly configured
- Test with various scene types and configurations
- Monitor API usage and implement rate limiting if needed
- Consider adding user feedback mechanisms for AI suggestions
- Keep fallback content for when AI service is unavailable 