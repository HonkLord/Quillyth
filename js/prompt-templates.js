// Prompt Templates for AI Content Generation

export function getPlayerAdaptationPrompt(
  locationName,
  locationDescription,
  opportunityTitle,
  opportunityDescription,
  player,
  playerNotes
) {
  return `# PLAYER-FOCUSED OPPORTUNITY ADAPTATION

## CONTEXT
- **Location:** ${locationName}
- **Opportunity:** ${opportunityTitle} - ${opportunityDescription}
- **Player:** ${player.name} (${player.class}, ${player.race})

## PLAYER DETAILS
- **Backstory/Arc:** ${playerNotes}
- **Abilities/Themes:** 

## TASK
Adapt the opportunity to make it deeply personal to the player. Brainstorm 2-3 specific ways their class, backstory, or abilities could be woven into the challenge or its resolution. Focus on creating a unique character moment.

**Output Format:**
- **Adaptation 1:** [Description of the new tailored challenge]
- **Player-Specific Hooks:** [How to tie it to their past or skills]
- **Potential Outcome:** [How this could advance their personal story]
---
- **Adaptation 2:** ...`;
}

export function getPlayerArcOpportunityPrompt(
  locationName,
  locationDescription,
  player,
  playerNotes,
  groundTruth
) {
  return `# PLAYER ARC OPPORTUNITY GENERATION

## WEIGHTING PRIORITIES (HIGH → LOW):
1. **HIGH**: Player backstory/arc + location relevance
2. **MEDIUM**: Player class abilities and unique traits
3. **LOW**: Generic location content

## LOCATION CONTEXT:
**Location:** ${locationName}
**Description:** ${locationDescription || "No description available"}

## PLAYER CHARACTER:
**Name:** ${player.name}
**Class:** ${player.class} (Level ${player.level || "Unknown"})
**Race:** ${player.race || "Unknown"}
**Background:** ${player.background || "Unknown"}

### Character Arc & Backstory (WEIGH HEAVILY):
${playerNotes || "No character arc information available"}

### Class & Abilities (MEDIUM WEIGHT):
- **Class Features:** Consider how ${
    player.class
  } abilities could enhance story moments
- **Race Traits:** ${player.race} characteristics and cultural connections
- **Background:** ${player.background} experience and contacts

## OPPORTUNITY GENERATION REQUEST:
**Primary Goal:** Create a location-specific opportunity that advances ${
    player.name
  }'s personal story arc and character development.

**Focus Areas:**
- How does this location connect to their backstory, goals, or unresolved plot threads?
- What personal stakes or emotional investment can be created here?
- How might their past come back to haunt or help them at this location?
- What character growth or arc progression can happen here?
- Are there NPCs, items, or lore connected to their background?

**Output Format:**
- **Story Hook:** Personal connection to the location based on their arc
- **Opportunity Description:** Specific situation tailored to their background
- **Personal Stakes:** What they stand to gain/lose emotionally or narratively
- **Character Growth:** How this advances their development
- **Class Integration:** Brief note on how their abilities enhance the story moment
- **Potential Outcomes:** Multiple ways their choices could affect their arc

**Story Focus:** Prioritize character development, emotional stakes, and narrative progression over combat or mechanical challenges.

${
  groundTruth
    ? `\n## CAMPAIGN CONTEXT:\n${groundTruth.substring(0, 300)}${
        groundTruth.length > 300 ? "..." : ""
      }`
    : ""
}
`;
}

export function getSceneContextPrompt(scene, campaignContext) {
  return `# SCENE CONTEXT GENERATION
  
## SCENE DETAILS
- **Name:** ${scene.name}
- **Type:** ${scene.scene_type}
- **Location:** ${scene.location_id || "Unknown"}
- **Current Setup:** ${scene.current_setup || "None"}

## SCENE DESCRIPTION
${scene.description || "No description available"}

## CAMPAIGN CONTEXT
${campaignContext || "No campaign context available"}

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
- **Description:** ${scene.description || "No description"}

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
${actorStates
  .map(
    (state) => `
**${state.characterName} (${state.characterType}):**
- Thought: ${state.thought || "None recorded"}
- Action: ${state.action || "None recorded"}
- Timestamp: ${state.timestamp}
`
  )
  .join("\n")}

## CAMPAIGN CONTEXT
${campaignContext || "No campaign context available"}

## TASK
Based on the current scene dynamics and actor states, suggest what should happen next.

**Output Format:**
- **Therefore:** [Main suggested next action based on current events]
- **Alternative:** [Secondary option if players take different approach]
- **NPC Reactions:** [How NPCs should respond to current situation]
- **Plot Advancement:** [How this moves the story forward]
- **Player Agency:** [Ways to let players drive the scene]`;
}
