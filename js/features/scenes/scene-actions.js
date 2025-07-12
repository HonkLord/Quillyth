/**
 * SceneActions - Handles action processing, AI suggestions, and utility functions
 * Part of the modular scene management architecture
 */
export class SceneActions {
  constructor(sceneCore, sceneAI, actionSystem) {
    this.core = sceneCore;
    this.ai = sceneAI;
    this.actionSystem = actionSystem;
    this.isProcessing = false;
  }

  /**
   * Process all actions in the queue
   */
  async processAllActions() {
    if (this.isProcessing) {
      console.log("Already processing actions...");
      return;
    }

    const actions = this.actionSystem.getActionQueue();
    if (actions.length === 0) {
      throw new Error("No actions to process");
    }

    this.isProcessing = true;
    const currentScene = this.core.getCurrentScene();

    try {
      console.log(`🎭 SceneActions: Processing ${actions.length} actions...`);

      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];

        // Show current action processing
        this.actionSystem.showCurrentActionProcessingCompact(action);
        this.actionSystem.setCurrentAction(action);

        // Generate result using AI
        const result = await this.ai.generateActionResult(action, currentScene);

        if (result) {
          this.actionSystem.setCurrentResult(result);
          this.actionSystem.showActionResultCompact(action, result);

          // Auto-accept after a delay
          setTimeout(() => {
            this.actionSystem.acceptCurrentResult();
          }, 2000);
        }
      }

      console.log("✅ SceneActions: All actions processed successfully");
    } catch (error) {
      console.error("❌ SceneActions: Failed to process actions", error);
      throw error;
    } finally {
      this.isProcessing = false;
      this.actionSystem.hideCurrentActionProcessingCompact();
    }
  }

  /**
   * Load initial NPC actions for a scene
   */
  async loadInitialNPCActions(scene) {
    const npcs = this.core.getSceneNPCs(scene);
    console.log(
      `🎭 SceneActions: Loading initial actions for ${npcs.length} NPCs...`
    );

    for (const npc of npcs) {
      if (!npc.hasInitialAction) {
        try {
          // Generate initial NPC behavior
          const suggestion = await this.ai.generateNPCSuggestion(npc.id, scene);
          if (suggestion) {
            npc.initialSuggestion = suggestion.suggestion;
            npc.hasInitialAction = true;
            console.log(
              `✅ SceneActions: Generated initial action for NPC ${
                npc.name || npc.id
              }`
            );
          }
        } catch (error) {
          console.error(
            `❌ SceneActions: Failed to generate initial action for NPC ${npc.id}`,
            error
          );
        }
      }
    }
  }

  /**
   * Suggest player action
   */
  async suggestPlayerAction(playerId) {
    const currentScene = this.core.getCurrentScene();
    if (!currentScene) {
      throw new Error("No active scene");
    }

    try {
      console.log(
        `🎭 SceneActions: Generating player suggestion for ${playerId}...`
      );
      const suggestion = await this.ai.generatePlayerSuggestion(
        playerId,
        currentScene
      );

      if (suggestion) {
        console.log(
          "✅ SceneActions: Player suggestion generated successfully"
        );
        return {
          title: "Player Action Suggestion",
          content: suggestion.suggestion,
        };
      } else {
        throw new Error("No suggestion generated");
      }
    } catch (error) {
      console.error(
        "❌ SceneActions: Failed to generate player suggestion",
        error
      );
      throw error;
    }
  }

  /**
   * Suggest NPC action
   */
  async suggestNPCAction(npcId) {
    const currentScene = this.core.getCurrentScene();
    if (!currentScene) {
      throw new Error("No active scene");
    }

    try {
      console.log(`🎭 SceneActions: Generating NPC suggestion for ${npcId}...`);
      const suggestion = await this.ai.generateNPCSuggestion(
        npcId,
        currentScene
      );

      if (suggestion) {
        console.log("✅ SceneActions: NPC suggestion generated successfully");
        return {
          title: "NPC Action Suggestion",
          content: suggestion.suggestion,
        };
      } else {
        throw new Error("No suggestion generated");
      }
    } catch (error) {
      console.error(
        "❌ SceneActions: Failed to generate NPC suggestion",
        error
      );
      throw error;
    }
  }

  /**
   * Generate random encounter
   */
  async generateRandomEncounter() {
    const currentScene = this.core.getCurrentScene();
    if (!currentScene) {
      throw new Error("No active scene");
    }

    try {
      console.log("🎭 SceneActions: Generating random encounter...");
      const encounter = await this.ai.generateRandomEncounter(currentScene);

      if (encounter) {
        console.log("✅ SceneActions: Random encounter generated successfully");
        return {
          title: "Random Encounter",
          content: encounter.encounter,
        };
      } else {
        throw new Error("No encounter generated");
      }
    } catch (error) {
      console.error("❌ SceneActions: Failed to generate encounter", error);
      throw error;
    }
  }

  /**
   * Suggest complication
   */
  async suggestComplication() {
    const complications = [
      "A sudden environmental hazard appears",
      "An unexpected NPC arrives on the scene",
      "Equipment fails at a critical moment",
      "A moral dilemma presents itself",
      "Time pressure increases dramatically",
      "A hidden truth is revealed",
      "Resources become scarce",
      "An ally becomes unreliable",
      "Weather conditions change dramatically",
      "A rival faction interferes",
      "Communication breaks down",
      "A trap is triggered",
      "Supplies run low",
      "A misunderstanding escalates",
      "An old enemy appears",
      "The terrain becomes treacherous",
    ];

    const complication =
      complications[Math.floor(Math.random() * complications.length)];
    console.log("🎭 SceneActions: Generated complication suggestion");

    return {
      title: "Complication Suggestion",
      content: complication,
    };
  }

  /**
   * Lock NPC action (placeholder for future implementation)
   */
  lockNPCAction(npcId) {
    console.log(`🎭 SceneActions: Locking NPC action for: ${npcId}`);
    // Future implementation: prevent NPC from taking actions
    return { success: true, message: `NPC ${npcId} action locked` };
  }

  /**
   * Unlock NPC action
   */
  unlockNPCAction(npcId) {
    console.log(`🎭 SceneActions: Unlocking NPC action for: ${npcId}`);
    // Future implementation: allow NPC to take actions again
    return { success: true, message: `NPC ${npcId} action unlocked` };
  }

  /**
   * Update scene tone
   */
  updateSceneTone(tone) {
    const currentScene = this.core.getCurrentScene();
    if (currentScene) {
      currentScene.tone = tone;
      console.log(`🎭 SceneActions: Scene tone updated to: ${tone}`);
      return { success: true, tone };
    } else {
      throw new Error("No active scene");
    }
  }

  /**
   * Update scene pacing
   */
  updateScenePacing(pacing) {
    const currentScene = this.core.getCurrentScene();
    if (currentScene) {
      currentScene.pacing = pacing;
      console.log(`🎭 SceneActions: Scene pacing updated to: ${pacing}`);
      return { success: true, pacing };
    } else {
      throw new Error("No active scene");
    }
  }

  /**
   * Pause scene
   */
  pauseScene() {
    const currentScene = this.core.getCurrentScene();
    if (currentScene) {
      currentScene.paused = true;
      currentScene.pausedAt = new Date().toISOString();
      console.log("🎭 SceneActions: Scene paused");
      return { success: true, message: "Scene paused" };
    } else {
      throw new Error("No active scene");
    }
  }

  /**
   * Resume scene
   */
  resumeScene() {
    const currentScene = this.core.getCurrentScene();
    if (currentScene) {
      currentScene.paused = false;
      currentScene.resumedAt = new Date().toISOString();
      console.log("🎭 SceneActions: Scene resumed");
      return { success: true, message: "Scene resumed" };
    } else {
      throw new Error("No active scene");
    }
  }

  /**
   * Add timestamp to scene
   */
  addTimestamp() {
    const currentScene = this.core.getCurrentScene();
    if (currentScene) {
      const timestamp = new Date().toISOString();
      if (!currentScene.timestamps) {
        currentScene.timestamps = [];
      }
      currentScene.timestamps.push(timestamp);
      console.log("🎭 SceneActions: Timestamp added to scene");
      return { success: true, timestamp };
    } else {
      throw new Error("No active scene");
    }
  }

  /**
   * Roll dice utility
   */
  rollDice(sides = 20, count = 1) {
    const rolls = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }

    const total = rolls.reduce((sum, roll) => sum + roll, 0);
    const result = {
      rolls,
      total,
      sides,
      count,
      message:
        count === 1
          ? `🎲 Rolled: ${total}`
          : `🎲 Rolled ${count}d${sides}: ${rolls.join(
              ", "
            )} (Total: ${total})`,
    };

    console.log("🎭 SceneActions:", result.message);
    return result;
  }

  /**
   * Generate random name utility
   */
  generateRandomName(type = "general") {
    const nameData = {
      general: [
        "Aldric",
        "Bethany",
        "Caspian",
        "Delara",
        "Ewan",
        "Fiona",
        "Gareth",
        "Helena",
        "Ivan",
        "Jasmine",
        "Kael",
        "Luna",
        "Magnus",
        "Nora",
        "Oscar",
        "Petra",
        "Quinn",
        "Raven",
        "Silas",
        "Thea",
        "Ulric",
        "Vera",
        "Willem",
        "Xara",
        "Yorick",
        "Zara",
        "Brennan",
        "Cordelia",
        "Darius",
        "Evelyn",
      ],
      fantasy: [
        "Aelindra",
        "Thorek",
        "Lyralei",
        "Grimjaw",
        "Seraphina",
        "Balasar",
        "Nimara",
        "Vorthak",
        "Elowen",
        "Drogath",
        "Silvyr",
        "Kazrik",
        "Miraleth",
        "Gorvek",
      ],
      tavern: [
        "Benny Barkeep",
        "Martha Mug",
        "Old Tom",
        "Rosie Redcheeks",
        "Big Jim",
        "Molly Meadhall",
        "Pip the Pint",
        "Granny Grog",
        "Sam Suds",
        "Betty Brew",
      ],
    };

    const names = nameData[type] || nameData.general;
    const name = names[Math.floor(Math.random() * names.length)];

    console.log(`🎭 SceneActions: Generated ${type} name: ${name}`);
    return { name, type, message: `📝 Generated name: ${name}` };
  }

  /**
   * Get action processing status
   */
  getProcessingStatus() {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.actionSystem?.getActionQueue()?.length || 0,
    };
  }

  /**
   * Clear action queue
   */
  clearActionQueue() {
    if (this.actionSystem) {
      this.actionSystem.clearQueue();
      console.log("🎭 SceneActions: Action queue cleared");
      return { success: true, message: "Action queue cleared" };
    } else {
      throw new Error("Action system not available");
    }
  }

  /**
   * Get scene action history
   */
  getActionHistory(sceneId) {
    const scene = this.core.getSceneById(sceneId);
    if (scene && scene.actionHistory) {
      return scene.actionHistory;
    }
    return [];
  }

  /**
   * Add action to scene history
   */
  addActionToHistory(sceneId, action) {
    const scene = this.core.getSceneById(sceneId);
    if (scene) {
      if (!scene.actionHistory) {
        scene.actionHistory = [];
      }
      scene.actionHistory.push({
        ...action,
        timestamp: new Date().toISOString(),
      });
      console.log(`🎭 SceneActions: Action added to scene ${sceneId} history`);
      return { success: true };
    } else {
      throw new Error("Scene not found");
    }
  }
}
