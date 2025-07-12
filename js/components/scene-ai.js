import { GeminiService } from "../services/gemini-service.js";

/**
 * SceneAI - Handles AI integration, suggestions, and content generation
 * Extracted from SceneManager to improve modularity and maintainability
 */
export class SceneAI {
  constructor() {
    this.geminiService = new GeminiService();
    this.isGenerating = false;
  }

  /**
   * Generate AI suggested actions for a scene
   */
  async generateAISuggestedActions(scene) {
    if (this.isGenerating) return null;

    try {
      this.isGenerating = true;
      const prompt = this.buildActionsPrompt(scene);
      const response = await this.geminiService.generateContent(prompt);
      return this.parseActionsResponse(response);
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
      return null;
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Build prompt for AI action suggestions
   */
  buildActionsPrompt(scene) {
    const players = scene.characters?.filter((c) => c.type === "player") || [];
    const npcs = scene.characters?.filter((c) => c.type === "npc") || [];

    return `
      As a D&D Dungeon Master, suggest 3 possible actions for this scene:

      **Scene**: ${scene.name}
      **Description**: ${scene.description || "No description available"}
      **Location**: ${scene.location || "Unknown location"}
      
      **Players Present**: ${players.map((p) => p.name).join(", ") || "None"}
      **NPCs Present**: ${npcs.map((n) => n.name).join(", ") || "None"}
      
      **Recent Events**: ${
        scene.progression
          ?.slice(-3)
          .map((p) => p.content)
          .join("; ") || "None"
      }
      
      Please provide 3 suggested actions in this format:
      1. [Action Type] - [Brief description]
      2. [Action Type] - [Brief description]
      3. [Action Type] - [Brief description]
      
      Action types can be: Player Action, NPC Action, Environmental Change, Complication, Discovery, etc.
    `;
  }

  /**
   * Parse AI actions response
   */
  parseActionsResponse(response) {
    if (!response) return [];

    const lines = response.split("\n").filter((line) => line.trim());
    const actions = [];

    for (const line of lines) {
      const match = line.match(/^\d+\.\s*\[(.*?)\]\s*-\s*(.*)/);
      if (match) {
        actions.push({
          type: match[1].trim(),
          description: match[2].trim(),
        });
      }
    }

    return actions.length > 0
      ? actions
      : [
          {
            type: "Player Action",
            description: "Investigate the current situation",
          },
          { type: "NPC Action", description: "React to recent events" },
          {
            type: "Environmental Change",
            description: "Something in the environment shifts",
          },
        ];
  }

  /**
   * Generate action result using AI
   */
  async generateActionResult(action, scene) {
    if (this.isGenerating) return null;

    try {
      this.isGenerating = true;
      const prompt = this.buildActionPrompt(action, scene);
      const response = await this.geminiService.generateContent(prompt);
      return this.parseActionResult(response);
    } catch (error) {
      console.error("Error generating action result:", error);
      return this.getFallbackActionResult(action);
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Build prompt for action result generation
   */
  buildActionPrompt(action, scene) {
    const sceneState = this.getSceneStateForPrompt(scene);

    return `
      As a D&D Dungeon Master, generate a result for this action:

      **Action**: ${action.description}
      **Actor**: ${this.getActionActor(action)}
      **Type**: ${action.type}
      
      **Current Scene State**:
      ${sceneState}
      
      Please provide a result that includes:
      1. **Narrative**: What happens as a result of this action
      2. **Consequences**: Any immediate effects or changes
      3. **New Information**: Any discoveries or revelations
      4. **Next Steps**: What options are now available
      
      Format your response as a narrative description that flows naturally.
    `;
  }

  /**
   * Get scene state for prompt context
   */
  getSceneStateForPrompt(scene) {
    if (!scene) return "No scene information available";

    const parts = [];

    if (scene.name) parts.push(`Scene: ${scene.name}`);
    if (scene.location) parts.push(`Location: ${scene.location}`);
    if (scene.description) parts.push(`Description: ${scene.description}`);

    const players = scene.characters?.filter((c) => c.type === "player") || [];
    const npcs = scene.characters?.filter((c) => c.type === "npc") || [];

    if (players.length > 0)
      parts.push(`Players: ${players.map((p) => p.name).join(", ")}`);
    if (npcs.length > 0)
      parts.push(`NPCs: ${npcs.map((n) => n.name).join(", ")}`);

    if (scene.progression && scene.progression.length > 0) {
      const recent = scene.progression.slice(-3);
      parts.push(`Recent Events: ${recent.map((p) => p.content).join("; ")}`);
    }

    return parts.join("\n");
  }

  /**
   * Parse action result from AI response
   */
  parseActionResult(response) {
    if (!response) return null;

    return {
      narrative: response,
      description: response,
      timestamp: new Date().toISOString(),
      source: "ai",
    };
  }

  /**
   * Get action actor name
   */
  getActionActor(action) {
    switch (action.type) {
      case "player":
        return action.playerName || "Player";
      case "npc":
        return action.npcName || "NPC";
      case "external":
        return "Environment";
      default:
        return "Unknown";
    }
  }

  /**
   * Generate NPC suggestion
   */
  async generateNPCSuggestion(npcId, scene) {
    if (this.isGenerating) return null;

    try {
      this.isGenerating = true;
      const npc = scene.characters?.find(
        (c) => c.id === npcId || c.name === npcId
      );

      if (!npc) {
        return this.getFallbackNPCSuggestion(npcId);
      }

      const prompt = this.buildNPCSuggestionPrompt(npc, scene);
      const response = await this.geminiService.generateContent(prompt);

      return {
        suggestion: response,
        npcId: npcId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error generating NPC suggestion:", error);
      return this.getFallbackNPCSuggestion(npcId);
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Build NPC suggestion prompt
   */
  buildNPCSuggestionPrompt(npc, scene) {
    return `
      As a D&D Dungeon Master, suggest what this NPC might do next:

      **NPC**: ${npc.name}
      **Role**: ${npc.role || "Unknown"}
      **Personality**: ${npc.personality || "Not specified"}
      **Current State**: ${npc.currentState || "Normal"}
      
      **Scene Context**:
      - Location: ${scene.location || "Unknown"}
      - Recent Events: ${
        scene.progression
          ?.slice(-2)
          .map((p) => p.content)
          .join("; ") || "None"
      }
      - Other Characters Present: ${
        scene.characters
          ?.filter((c) => c.id !== npc.id)
          .map((c) => c.name)
          .join(", ") || "None"
      }
      
      Provide a specific action or dialogue suggestion that fits this NPC's personality and the current situation.
    `;
  }

  /**
   * Generate player action suggestion
   */
  async generatePlayerSuggestion(playerId, scene) {
    if (this.isGenerating) return null;

    try {
      this.isGenerating = true;
      const player = scene.characters?.find(
        (c) => c.id === playerId || c.name === playerId
      );

      if (!player) {
        return this.getFallbackPlayerSuggestion(playerId);
      }

      const prompt = this.buildPlayerSuggestionPrompt(player, scene);
      const response = await this.geminiService.generateContent(prompt);

      return {
        suggestion: response,
        playerId: playerId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error generating player suggestion:", error);
      return this.getFallbackPlayerSuggestion(playerId);
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Build player suggestion prompt
   */
  buildPlayerSuggestionPrompt(player, scene) {
    return `
      As a D&D Dungeon Master, suggest possible actions for this player:

      **Player**: ${player.name}
      **Class**: ${player.class || "Unknown"}
      **Level**: ${player.level || "Unknown"}
      **Background**: ${player.background || "Not specified"}
      
      **Scene Context**:
      - Location: ${scene.location || "Unknown"}
      - Situation: ${scene.description || "No description"}
      - Recent Events: ${
        scene.progression
          ?.slice(-2)
          .map((p) => p.content)
          .join("; ") || "None"
      }
      
      Provide 2-3 specific action suggestions that would be appropriate for this character and situation.
    `;
  }

  /**
   * Generate random encounter
   */
  async generateRandomEncounter(scene) {
    if (this.isGenerating) return null;

    try {
      this.isGenerating = true;
      const prompt = this.buildEncounterPrompt(scene);
      const response = await this.geminiService.generateContent(prompt);

      return {
        encounter: response,
        type: "random_encounter",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error generating random encounter:", error);
      return this.getFallbackEncounter();
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Build encounter prompt
   */
  buildEncounterPrompt(scene) {
    return `
      Generate a random encounter for this D&D scene:

      **Location**: ${scene.location || "Unknown location"}
      **Environment**: ${scene.environment || "Standard"}
      **Party Level**: ${scene.partyLevel || "1-3"}
      **Current Situation**: ${scene.description || "Exploring"}
      
      Create a brief encounter that includes:
      1. What the party encounters
      2. Initial description of the situation
      3. Possible outcomes or complications
      
      Keep it engaging but appropriate for the current scene context.
    `;
  }

  /**
   * Get fallback action result
   */
  getFallbackActionResult(action) {
    return {
      narrative: `The ${this.getActionActor(
        action
      )} takes action, and the situation develops in an unexpected way.`,
      description: `A result occurs from the ${action.type} action.`,
      timestamp: new Date().toISOString(),
      source: "fallback",
    };
  }

  /**
   * Get fallback NPC suggestion
   */
  getFallbackNPCSuggestion(npcId) {
    return {
      suggestion:
        "The NPC reacts to the current situation with caution and considers their next move carefully.",
      npcId: npcId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get fallback player suggestion
   */
  getFallbackPlayerSuggestion(playerId) {
    return {
      suggestion:
        "Consider investigating the area, talking to NPCs, or using your character's abilities to gather more information.",
      playerId: playerId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get fallback encounter
   */
  getFallbackEncounter() {
    return {
      encounter:
        "A mysterious sound echoes through the area, drawing the party's attention to something unusual nearby.",
      type: "random_encounter",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if AI is currently generating
   */
  isGeneratingContent() {
    return this.isGenerating;
  }
}
