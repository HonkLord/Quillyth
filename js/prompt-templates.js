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
