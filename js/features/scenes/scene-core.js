import { ApiService } from "../../api-service.js";
import { DataManager } from "../../data-manager.js";

/**
 * SceneCore - Handles data management, API calls, and CRUD operations for scenes
 * Part of the modular scene management architecture
 */
export class SceneCore {
  constructor() {
    this.apiService = ApiService;
    this.dataManager = new DataManager();
    this.scenes = [];
    this.characters = [];
    this.currentScene = null;
  }

  /**
   * Load all scenes from the API
   */
  async loadScenes() {
    try {
      console.log("🎭 SceneCore: Loading scenes...");
      if (!this.dataManager.currentCampaignId) {
        await this.dataManager.loadCurrentCampaign();
      }
      const response = await fetch(`/api/scenes?campaign_id=${this.dataManager.currentCampaignId}`);

      if (!response.ok) {
        throw new Error(`Failed to load scenes: ${response.status}`);
      }

      this.scenes = await response.json();
      console.log(`✅ SceneCore: Loaded ${this.scenes.length} scenes`);
      return this.scenes;
    } catch (error) {
      console.error("❌ SceneCore: Failed to load scenes", error);
      throw error;
    }
  }

  /**
   * Load all characters from the API
   */
  async loadCharacters() {
    try {
      console.log("🎭 SceneCore: Loading characters...");
      if (!this.dataManager.currentCampaignId) {
        await this.dataManager.loadCurrentCampaign();
      }
      const response = await fetch(`/api/characters?campaign_id=${this.dataManager.currentCampaignId}`);

      if (!response.ok) {
        throw new Error(`Failed to load characters: ${response.status}`);
      }

      this.characters = await response.json();
      console.log(`✅ SceneCore: Loaded ${this.characters.length} characters`);
      return this.characters;
    } catch (error) {
      console.error("❌ SceneCore: Failed to load characters", error);
      throw error;
    }
  }

  /**
   * Create a new scene
   */
  async createScene(sceneData) {
    try {
      console.log("🎭 SceneCore: Creating scene...", sceneData.name);
      if (!this.dataManager.currentCampaignId) {
        await this.dataManager.loadCurrentCampaign();
      }

      // Add default values
      const payload = {
        ...sceneData,
        campaign_id: this.dataManager.currentCampaignId,
        scene_order: sceneData.scene_order || 0,
      };

      const response = await fetch("/api/scenes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Add to local cache
        if (result.scene) {
          this.scenes.push(result.scene);
        }

        console.log("✅ SceneCore: Scene created successfully");
        return result;
      } else {
        throw new Error(result.error || "Failed to create scene");
      }
    } catch (error) {
      console.error("❌ SceneCore: Failed to create scene", error);
      throw error;
    }
  }

  /**
   * Update an existing scene
   */
  async updateScene(sceneId, sceneData) {
    try {
      console.log("🎭 SceneCore: Updating scene...", sceneId);

      const response = await fetch(`/api/scenes/${sceneId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sceneData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update local cache
        const index = this.scenes.findIndex((s) => s.id === sceneId);
        if (index !== -1 && result.scene) {
          this.scenes[index] = result.scene;
        }

        console.log("✅ SceneCore: Scene updated successfully");
        return result;
      } else {
        throw new Error(result.error || "Failed to update scene");
      }
    } catch (error) {
      console.error("❌ SceneCore: Failed to update scene", error);
      throw error;
    }
  }

  /**
   * Delete a scene
   */
  async deleteScene(sceneId) {
    try {
      console.log("🎭 SceneCore: Deleting scene...", sceneId);

      const response = await fetch(`/api/scenes/${sceneId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove from local cache
        this.scenes = this.scenes.filter((s) => s.id !== sceneId);

        // Clear current scene if it was deleted
        if (this.currentScene && this.currentScene.id === sceneId) {
          this.currentScene = null;
        }

        console.log("✅ SceneCore: Scene deleted successfully");
        return { success: true };
      } else {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete scene");
      }
    } catch (error) {
      console.error("❌ SceneCore: Failed to delete scene", error);
      throw error;
    }
  }

  /**
   * Get scene by ID
   */
  getSceneById(sceneId) {
    return this.scenes.find((scene) => scene.id === sceneId);
  }

  /**
   * Find scene by ID (alias for getSceneById)
   */
  findSceneById(sceneId) {
    return this.getSceneById(sceneId);
  }

  /**
   * Get all scenes
   */
  getAllScenes() {
    return this.scenes;
  }

  /**
   * Get all characters
   */
  getAllCharacters() {
    return this.characters;
  }

  /**
   * Set current scene
   */
  setCurrentScene(scene) {
    this.currentScene = scene;
    console.log(`🎭 SceneCore: Current scene set to: ${scene?.name || "none"}`);
  }

  /**
   * Get current scene
   */
  getCurrentScene() {
    return this.currentScene;
  }

  /**
   * Get NPCs for a specific scene
   */
  getSceneNPCs(scene) {
    if (!scene || !scene.npcs) {
      return [];
    }

    // If NPCs are stored as character IDs, resolve them
    if (Array.isArray(scene.npcs) && scene.npcs.length > 0) {
      return scene.npcs.map((npcId) => {
        const character = this.characters.find((c) => c.id === npcId);
        return character || { id: npcId, name: `NPC ${npcId}` };
      });
    }

    return [];
  }

  /**
   * Search scenes by name or description
   */
  searchScenes(query) {
    if (!query || query.trim() === "") {
      return this.scenes;
    }

    const searchTerm = query.toLowerCase().trim();
    return this.scenes.filter(
      (scene) =>
        scene.name?.toLowerCase().includes(searchTerm) ||
        scene.description?.toLowerCase().includes(searchTerm) ||
        scene.dm_notes?.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Filter scenes by location
   */
  getScenesByLocation(locationId) {
    return this.scenes.filter((scene) => scene.location_id === locationId);
  }

  /**
   * Filter scenes by session
   */
  getScenesBySession(sessionId) {
    return this.scenes.filter((scene) => scene.session_id === sessionId);
  }

  /**
   * Get scene statistics
   */
  getSceneStats() {
    return {
      total: this.scenes.length,
      withLocations: this.scenes.filter((s) => s.location_id).length,
      withSessions: this.scenes.filter((s) => s.session_id).length,
      withReadAloud: this.scenes.filter((s) => s.read_aloud?.trim()).length,
      withDMNotes: this.scenes.filter((s) => s.dm_notes?.trim()).length,
    };
  }

  /**
   * Refresh scene data from API
   */
  async refresh() {
    try {
      await Promise.all([this.loadScenes(), this.loadCharacters()]);
      console.log("✅ SceneCore: Data refreshed successfully");
    } catch (error) {
      console.error("❌ SceneCore: Failed to refresh data", error);
      throw error;
    }
  }

  /**
   * Validate scene data
   */
  validateSceneData(sceneData) {
    const errors = [];

    if (!sceneData.name || sceneData.name.trim() === "") {
      errors.push("Scene name is required");
    }

    if (sceneData.name && sceneData.name.length > 255) {
      errors.push("Scene name must be less than 255 characters");
    }

    return errors;
  }

  /**
   * Check if scene exists
   */
  sceneExists(sceneId) {
    return this.scenes.some((scene) => scene.id === sceneId);
  }

  /**
   * Get next scene order number
   */
  getNextSceneOrder() {
    if (this.scenes.length === 0) {
      return 1;
    }

    const maxOrder = Math.max(...this.scenes.map((s) => s.scene_order || 0));
    return maxOrder + 1;
  }
}
