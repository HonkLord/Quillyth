import { SceneCore } from "./scene-core.js";
import { SceneActions } from "./scene-actions.js";
import { SceneUI } from "./scene-ui.js";
import { SceneNavigation } from "../../components/scene-nav.js";
import { SceneActionSystem } from "../../components/scene-action-system.js";
import { SceneAI } from "../../components/scene-ai.js";
import SceneRenderer from "../../components/scene-renderer.js";

/**
 * SceneManager - Lean coordinator for the modular scene management system
 * Orchestrates SceneCore, SceneActions, and SceneUI modules
 */
export class SceneManager {
  constructor() {
    // Initialize core modules
    this.core = new SceneCore();
    this.ui = new SceneUI(this.core);

    // Initialize supporting components
    this.actionSystem = new SceneActionSystem();
    this.ai = new SceneAI();
    this.renderer = new SceneRenderer();
    this.sceneNavigation = new SceneNavigation();

    // Initialize actions module with dependencies
    this.actions = new SceneActions(this.core, this.ai, this.actionSystem);

    // State
    this.isInitialized = false;
  }

  /**
   * Initialize the Scene Manager and all its modules
   */
  async init() {
    try {
      console.log("🎭 SceneManager: Initializing modular version...");

      // Load data through core module
      await this.core.loadScenes();
      await this.core.loadCharacters();

      // Initialize navigation with scenes
      this.sceneNavigation.init(this.core.getAllScenes());

      // Setup UI event listeners
      this.ui.setupEventListeners(this);

      this.isInitialized = true;
      console.log("✅ SceneManager: Modular version initialized successfully");
    } catch (error) {
      console.error("❌ SceneManager: Failed to initialize", error);
      throw error;
    }
  }

  /**
   * Navigate to a specific scene
   */
  async navigateToScene(sceneId) {
    try {
      const scene = this.core.findSceneById(sceneId);
      if (!scene) {
        console.error(`Scene not found: ${sceneId}`);
        this.ui.showError(`Scene not found: ${sceneId}`);
        return;
      }

      // Update current scene in core
      this.core.setCurrentScene(scene);

      // Update URL hash
      this.ui.updateUrlHash(sceneId);

      // Render the scene
      this.renderer.renderScene(scene, this.core);

      // Load initial NPC actions if needed
      await this.actions.loadInitialNPCActions(scene);

      console.log(`🎭 SceneManager: Navigated to scene: ${scene.name}`);
    } catch (error) {
      console.error("❌ SceneManager: Error navigating to scene:", error);
      this.ui.showError("Failed to load scene");
    }
  }

  /**
   * Create a new scene
   */
  async createNewScene() {
    try {
      await this.ui.showCreateSceneModal();
    } catch (error) {
      console.error("❌ SceneManager: Error creating scene:", error);
      this.ui.showError("Failed to open scene creation dialog");
    }
  }

  /**
   * Edit an existing scene
   */
  async editScene(sceneId) {
    try {
      await this.ui.showEditSceneModal(sceneId);
    } catch (error) {
      console.error("❌ SceneManager: Error editing scene:", error);
      this.ui.showError("Failed to open scene editing dialog");
    }
  }

  /**
   * Delete a scene with confirmation
   */
  async deleteScene(sceneId) {
    try {
      const scene = this.core.getSceneById(sceneId);
      if (!scene) {
        this.ui.showError("Scene not found");
        return;
      }

      // Show confirmation dialog
      const confirmed = await this.ui.showConfirmationDialog(
        "Delete Scene",
        `Are you sure you want to delete "${scene.name}"?`,
        "This action cannot be undone.",
        "Delete",
        "btn-danger"
      );

      if (confirmed) {
        await this.core.deleteScene(sceneId);
        this.ui.showSuccessMessage(
          `Scene "${scene.name}" deleted successfully`
        );

        // Refresh scene overview if available
        await this.refreshSceneOverview();
      }
    } catch (error) {
      console.error("❌ SceneManager: Error deleting scene:", error);
      this.ui.showError("Failed to delete scene: " + error.message);
    }
  }

  /**
   * Show scene overview
   */
  showSceneOverview() {
    // Create scene overview HTML structure
    const scenesContent = document.getElementById("scenes-content");
    if (scenesContent) {
      scenesContent.innerHTML = `
        <div class="workspace-container">
          <div class="workspace-feature-header">
            <div class="workspace-feature-title">
              <i class="fas fa-theater-masks"></i>
              <div>
                <h2>Scene Overview</h2>
                <p class="workspace-feature-subtitle">Manage and navigate your campaign scenes</p>
              </div>
            </div>
            <div class="workspace-feature-actions">
              <button class="btn btn-primary" onclick="sceneManager.createNewScene()">
                <i class="fas fa-plus"></i> Create New Scene
              </button>
              <button class="btn btn-secondary" onclick="sceneManager.refreshSceneOverview()">
                <i class="fas fa-sync"></i> Refresh
              </button>
            </div>
          </div>
          
          <div class="workspace-section">
            <div class="workspace-section-header">
              <h3 class="workspace-section-title">
                <i class="fas fa-list"></i>
                Active Scenes
              </h3>
            </div>
            <div class="workspace-section-content">
              <div class="workspace-cards-grid" id="scenes-grid">
                <div class="loading-state">
                  <i class="fas fa-spinner fa-spin"></i>
                  <p>Loading scenes...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      scenesContent.classList.add("active");
    }

    this.populateSceneOverview();
  }

  /**
   * Populate scene overview with scene cards
   */
  populateSceneOverview() {
    const scenesGrid = document.getElementById("scenes-grid");
    if (!scenesGrid) {
      console.error("❌ SceneManager: scenes-grid element not found");
      return;
    }

    const scenes = this.core.getAllScenes();
    console.log(
      `🎭 SceneManager: Populating ${scenes.length} scenes in overview`
    );

    if (scenes.length === 0) {
      scenesGrid.innerHTML = `
        <div class="workspace-empty-state">
          <i class="fas fa-theater-masks"></i>
          <h3>No Scenes Yet</h3>
          <p>Create your first scene to get started</p>
          <button class="btn btn-primary" onclick="sceneManager.createNewScene()">
            <i class="fas fa-plus"></i> Create Scene
          </button>
        </div>
      `;
      return;
    }

    scenesGrid.innerHTML = scenes
      .map((scene) => this.createSceneCard(scene))
      .join("");
  }

  /**
   * Create a scene card for the overview
   */
  createSceneCard(scene) {
    const statusClass = scene.scene_status || "planned";
    const statusLabel = this.formatSceneStatus(scene.scene_status || "planned");

    return `
      <div class="card card-scene clickable" data-scene-id="${scene.id}">
        <div class="card-header">
          <div class="card-title-info">
            <h4 class="card-title">${scene.name}</h4>
            <div class="card-meta">
              <span class="card-status status-${statusClass}">${statusLabel}</span>
              ${
                scene.location_id
                  ? `<span class="card-category"><i class="fas fa-map-marker-alt"></i> ${scene.location_id}</span>`
                  : ""
              }
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-sm btn-primary" onclick="sceneManager.navigateToScene('${
              scene.id
            }')" title="Open Scene">
              <i class="fas fa-play"></i>
            </button>
            <button class="btn btn-sm btn-secondary" onclick="sceneManager.editScene('${
              scene.id
            }')" title="Edit Scene">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="sceneManager.deleteScene('${
              scene.id
            }')" title="Delete Scene">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="card-body">
          <p class="card-description">${
            scene.description
              ? scene.description.substring(0, 150) +
                (scene.description.length > 150 ? "..." : "")
              : "No description provided."
          }</p>
        </div>
      </div>
    `;
  }

  /**
   * Format scene status for display
   */
  formatSceneStatus(status) {
    const statusMap = {
      planned: "Planned",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return statusMap[status] || "Unknown";
  }

  /**
   * Refresh scene overview
   */
  async refreshSceneOverview() {
    try {
      // Reload scenes data
      await this.core.loadScenes();

      // Re-render scene overview
      this.showSceneOverview();

      console.log("✅ SceneManager: Scene overview refreshed");
    } catch (error) {
      console.error("❌ SceneManager: Error refreshing scene overview:", error);
      this.ui.showError("Failed to refresh scene overview");
    }
  }

  /**
   * Process all actions in the queue
   */
  async processAllActions() {
    try {
      await this.actions.processAllActions();
      this.ui.showSuccessMessage("All actions processed successfully");
    } catch (error) {
      console.error("❌ SceneManager: Error processing actions:", error);
      this.ui.showError(error.message || "Failed to process actions");
    }
  }

  /**
   * Suggest player action
   */
  async suggestPlayerAction(playerId) {
    try {
      const suggestion = await this.actions.suggestPlayerAction(playerId);
      this.ui.showSuggestionModal(suggestion.title, suggestion.content);
    } catch (error) {
      console.error(
        "❌ SceneManager: Error generating player suggestion:",
        error
      );
      this.ui.showError(error.message || "Failed to generate suggestion");
    }
  }

  /**
   * Suggest NPC action
   */
  async suggestNPCAction(npcId) {
    try {
      const suggestion = await this.actions.suggestNPCAction(npcId);
      this.ui.showSuggestionModal(suggestion.title, suggestion.content);
    } catch (error) {
      console.error("❌ SceneManager: Error generating NPC suggestion:", error);
      this.ui.showError(error.message || "Failed to generate suggestion");
    }
  }

  /**
   * Generate random encounter
   */
  async generateRandomEncounter() {
    try {
      const encounter = await this.actions.generateRandomEncounter();
      this.ui.showSuggestionModal(encounter.title, encounter.content);
    } catch (error) {
      console.error("❌ SceneManager: Error generating encounter:", error);
      this.ui.showError(error.message || "Failed to generate encounter");
    }
  }

  /**
   * Suggest complication
   */
  async suggestComplication() {
    try {
      const complication = await this.actions.suggestComplication();
      this.ui.showSuggestionModal(complication.title, complication.content);
    } catch (error) {
      console.error("❌ SceneManager: Error generating complication:", error);
      this.ui.showError("Failed to generate complication");
    }
  }

  /**
   * Roll dice utility
   */
  rollDice(sides = 20, count = 1) {
    try {
      const result = this.actions.rollDice(sides, count);
      this.ui.showSuccessMessage(result.message);
      return result;
    } catch (error) {
      console.error("❌ SceneManager: Error rolling dice:", error);
      this.ui.showError("Failed to roll dice");
    }
  }

  /**
   * Generate random name utility
   */
  generateRandomName(type = "general") {
    try {
      const result = this.actions.generateRandomName(type);
      this.ui.showSuccessMessage(result.message);
      return result;
    } catch (error) {
      console.error("❌ SceneManager: Error generating name:", error);
      this.ui.showError("Failed to generate name");
    }
  }

  /**
   * Update scene tone
   */
  updateSceneTone(tone) {
    try {
      const result = this.actions.updateSceneTone(tone);
      this.ui.showSuccessMessage(`Scene tone updated to: ${tone}`);
      return result;
    } catch (error) {
      console.error("❌ SceneManager: Error updating scene tone:", error);
      this.ui.showError(error.message || "Failed to update scene tone");
    }
  }

  /**
   * Update scene pacing
   */
  updateScenePacing(pacing) {
    try {
      const result = this.actions.updateScenePacing(pacing);
      this.ui.showSuccessMessage(`Scene pacing updated to: ${pacing}`);
      return result;
    } catch (error) {
      console.error("❌ SceneManager: Error updating scene pacing:", error);
      this.ui.showError(error.message || "Failed to update scene pacing");
    }
  }

  /**
   * Pause scene
   */
  pauseScene() {
    try {
      const result = this.actions.pauseScene();
      this.ui.showSuccessMessage(result.message);
      return result;
    } catch (error) {
      console.error("❌ SceneManager: Error pausing scene:", error);
      this.ui.showError(error.message || "Failed to pause scene");
    }
  }

  /**
   * Add timestamp to scene
   */
  addTimestamp() {
    try {
      const result = this.actions.addTimestamp();
      this.ui.showSuccessMessage("Timestamp added to scene");
      return result;
    } catch (error) {
      console.error("❌ SceneManager: Error adding timestamp:", error);
      this.ui.showError(error.message || "Failed to add timestamp");
    }
  }

  // Delegate methods to core module
  getCurrentScene() {
    return this.core.getCurrentScene();
  }

  getAllScenes() {
    return this.core.getAllScenes();
  }

  getAllCharacters() {
    return this.core.getAllCharacters();
  }

  getSceneById(sceneId) {
    return this.core.getSceneById(sceneId);
  }

  // Delegate methods to UI module
  showError(message) {
    this.ui.showError(message);
  }

  showSuccessMessage(message) {
    this.ui.showSuccessMessage(message);
  }

  showSuggestionModal(title, suggestion) {
    this.ui.showSuggestionModal(title, suggestion);
  }

  /**
   * Check if initialized
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Cleanup all modules
   */
  cleanup() {
    this.ui.cleanup();
    console.log("🧹 SceneManager: Cleaned up all modules");
  }
}
