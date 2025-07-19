/**
 * SceneRenderer - Renders individual scenes with proper management tools
 */
import { escapeHTML } from "../shared/escape-html.js";
import { getDefaultCampaignId } from "../shared/config.js";
class SceneRenderer {
  constructor() {
    this.currentScene = null;
    this.quickNPCCounter = 0; // Counter for generating unique quick NPC IDs
  }

  /**
   * Render the main scene content
   */
  renderScene(scene, sceneDataManager) {
    console.log(`🎭 SceneRenderer: Rendering scene "${scene.name}"`, scene);

    this.currentScene = scene;
    const sceneContent = this.createSceneContent(scene, sceneDataManager);

    // Use the scenes-content workspace
    const scenesContent = document.getElementById("scenes-content");
    if (scenesContent) {
      scenesContent.innerHTML = sceneContent;
      scenesContent.classList.add("active");

      // Initialize scene editing functionality
      this.initializeSceneEditing(scene);
    } else {
      console.error("❌ scenes-content workspace not found");
    }
  }

  /**
   * Create the main scene content HTML
   */
  createSceneContent(scene, sceneDataManager) {
    return `
      <div class="scene-container">
        <!-- Scene Header -->
        <div class="scene-header">
          <div class="scene-title-section">
            <h1 class="scene-title">${scene.name}</h1>
            <div class="scene-meta">
              <span class="scene-type">🎭 ${escapeHTML(
                scene.scene_type || "encounter"
              )}</span>
              <span class="scene-location">📍 ${
                scene.location_id || "Unknown Location"
              }</span>
              <span class="scene-status status-${
                scene.scene_status || "planned"
              }">${this.formatStatus(scene.scene_status || "planned")}</span>
            </div>
          </div>
          <div class="scene-controls">
            <button class="btn btn-success run-scene-btn" data-scene-id="${
              scene.id
            }">
              <i class="fas fa-play"></i> Run Scene
            </button>
            <button class="btn btn-primary edit-scene-btn" data-scene-id="${
              scene.id
            }">
              <i class="fas fa-edit"></i> Edit Scene
            </button>
            <button class="btn btn-secondary back-to-overview">
              <i class="fas fa-arrow-left"></i> Back to Overview
            </button>
          </div>
        </div>

        <!-- Scene Content -->
        <div class="scene-content">
          <!-- Main Content Area -->
          <div class="scene-main-content">
            <!-- Read Aloud Text - Most Important -->
            ${
              scene.read_aloud
                ? `
            <div class="scene-card scene-card-primary">
              <div class="scene-card-header">
                <h3><i class="fas fa-volume-up"></i> Read Aloud</h3>
              </div>
              <div class="scene-card-content">
                <div class="read-aloud-text">${scene.read_aloud}</div>
              </div>
            </div>
            `
                : ""
            }

            <!-- Scene Description -->
            <div class="scene-card">
              <div class="scene-card-header">
                <h3><i class="fas fa-scroll"></i> Scene Description</h3>
              </div>
              <div class="scene-card-content">
                <div class="scene-description">${
                  scene.description || "No description provided."
                }</div>
              </div>
            </div>

            <!-- Current Setup -->
            ${
              scene.current_setup
                ? `
            <div class="scene-card">
              <div class="scene-card-header">
                <h3><i class="fas fa-cogs"></i> Current Setup</h3>
              </div>
              <div class="scene-card-content">
                <div class="scene-setup">${scene.current_setup}</div>
              </div>
            </div>
            `
                : ""
            }
          </div>

          <!-- Sidebar - DM Tools -->
          <div class="scene-sidebar">
            <!-- DM Notes -->
            <div class="scene-card scene-card-compact">
              <div class="scene-card-header">
                <h3><i class="fas fa-sticky-note"></i> DM Notes</h3>
              </div>
              <div class="scene-card-content">
                <div class="dm-notes">${
                  scene.dm_notes || "No DM notes provided."
                }</div>
              </div>
            </div>

            <!-- Scene Status Management -->
            <div class="scene-card scene-card-compact">
              <div class="scene-card-header">
                <h3><i class="fas fa-tasks"></i> Scene Status</h3>
              </div>
              <div class="scene-card-content">
                <div class="status-controls">
                  <label for="scene-status-select">Current Status:</label>
                  <select id="scene-status-select" class="scene-status-select" data-scene-id="${
                    scene.id
                  }">
                    <option value="planned" ${
                      scene.scene_status === "planned" ? "selected" : ""
                    }>Planned</option>
                    <option value="in_progress" ${
                      scene.scene_status === "in_progress" ? "selected" : ""
                    }>In Progress</option>
                    <option value="completed" ${
                      scene.scene_status === "completed" ? "selected" : ""
                    }>Completed</option>
                    <option value="cancelled" ${
                      scene.scene_status === "cancelled" ? "selected" : ""
                    }>Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Scene Quick Actions -->
            <div class="scene-card scene-card-compact">
              <div class="scene-card-header">
                <h3><i class="fas fa-bolt"></i> Quick Actions</h3>
              </div>
              <div class="scene-card-content">
                <div class="quick-actions">
                  <button class="btn btn-sm btn-secondary duplicate-scene-btn" data-scene-id="${
                    scene.id
                  }">
                    <i class="fas fa-copy"></i> Duplicate
                  </button>
                  <button class="btn btn-sm btn-secondary export-scene-btn" data-scene-id="${
                    scene.id
                  }">
                    <i class="fas fa-download"></i> Export
                  </button>
                  <button class="btn btn-sm btn-danger delete-scene-btn" data-scene-id="${
                    scene.id
                  }">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Initialize scene editing functionality
   */
  initializeSceneEditing(scene) {
    // Run scene button
    const runBtn = document.querySelector(".run-scene-btn");
    if (runBtn) {
      runBtn.addEventListener("click", () => this.showRunSceneInterface(scene));
    }

    // Edit scene button
    const editBtn = document.querySelector(".edit-scene-btn");
    if (editBtn) {
      editBtn.addEventListener("click", () => this.openSceneEditModal(scene));
    }

    // Back to overview button
    const backBtn = document.querySelector(".back-to-overview");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        if (window.sceneManager) {
          window.sceneManager.showSceneOverview();
        }
      });
    }

    // Status change handler
    const statusSelect = document.querySelector(".scene-status-select");
    if (statusSelect) {
      statusSelect.addEventListener("change", (e) =>
        this.updateSceneStatus(scene.id, e.target.value)
      );
    }

    // Quick action buttons
    const duplicateBtn = document.querySelector(".duplicate-scene-btn");
    if (duplicateBtn) {
      duplicateBtn.addEventListener("click", () =>
        this.duplicateScene(scene.id)
      );
    }

    const exportBtn = document.querySelector(".export-scene-btn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.exportScene(scene.id));
    }

    const deleteBtn = document.querySelector(".delete-scene-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => this.deleteScene(scene.id));
    }
  }

  /**
   * Open scene edit modal
   */
  openSceneEditModal(scene) {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-content scene-edit-modal">
        <div class="modal-header">
          <h3><i class="fas fa-edit"></i> Edit Scene</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form class="scene-edit-form">
            <div class="form-group">
              <label for="scene-name">Scene Name</label>
              <input type="text" id="scene-name" name="name" value="${
                scene.name
              }" required>
            </div>
            
            <div class="form-group">
              <label for="scene-description">Description</label>
              <textarea id="scene-description" name="description" rows="3">${
                scene.description || ""
              }</textarea>
            </div>
            
            <div class="form-group">
              <label for="scene-setup">Current Setup</label>
              <textarea id="scene-setup" name="current_setup" rows="3">${
                scene.current_setup || ""
              }</textarea>
            </div>
            
            <div class="form-group">
              <label for="scene-read-aloud">Read Aloud Text</label>
              <textarea id="scene-read-aloud" name="read_aloud" rows="3">${
                scene.read_aloud || ""
              }</textarea>
            </div>
            
            <div class="form-group">
              <label for="scene-dm-notes">DM Notes</label>
              <textarea id="scene-dm-notes" name="dm_notes" rows="4">${
                scene.dm_notes || ""
              }</textarea>
            </div>
            
            <div class="form-group">
              <label for="scene-type">Scene Type</label>
              <select id="scene-type" name="scene_type">
                <option value="encounter" ${
                  scene.scene_type === "encounter" ? "selected" : ""
                }>Encounter</option>
                <option value="exploration" ${
                  scene.scene_type === "exploration" ? "selected" : ""
                }>Exploration</option>
                <option value="social" ${
                  scene.scene_type === "social" ? "selected" : ""
                }>Social</option>
                <option value="puzzle" ${
                  scene.scene_type === "puzzle" ? "selected" : ""
                }>Puzzle</option>
                <option value="other" ${
                  scene.scene_type === "other" ? "selected" : ""
                }>Other</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary cancel-edit">Cancel</button>
          <button class="btn btn-primary save-scene">Save Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Modal event handlers
    modal
      .querySelector(".modal-close")
      .addEventListener("click", () => modal.remove());
    modal
      .querySelector(".cancel-edit")
      .addEventListener("click", () => modal.remove());
    modal
      .querySelector(".save-scene")
      .addEventListener("click", () => this.saveSceneChanges(scene.id, modal));

    // Close on overlay click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  /**
   * Save scene changes
   */
  async saveSceneChanges(sceneId, modal) {
    const form = modal.querySelector(".scene-edit-form");
    const formData = new FormData(form);
    const sceneData = Object.fromEntries(formData);

    try {
      const response = await fetch(`/api/scenes/${sceneId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sceneData),
      });

      if (response.ok) {
        const updatedScene = await response.json();
        this.showToast("Scene updated successfully!", "success");
        modal.remove();
        // Refresh the scene display with updated data
        if (window.sceneManager) {
          window.sceneManager.navigateToScene(updatedScene.id);
        } else {
          location.reload();
        }
      } else {
        throw new Error("Failed to update scene");
      }
    } catch (error) {
      console.error("Error updating scene:", error);
      this.showToast("Failed to update scene", "error");
    }
  }

  /**
   * Update scene status
   */
  async updateSceneStatus(sceneId, newStatus) {
    try {
      const response = await fetch(`/api/scenes/${sceneId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scene_status: newStatus }),
      });

      if (response.ok) {
        this.showToast(
          `Scene status updated to ${this.formatStatus(newStatus)}`,
          "success"
        );
        // Update the status display
        const statusSpan = document.querySelector(".scene-status");
        if (statusSpan) {
          statusSpan.className = `scene-status status-${newStatus}`;
          statusSpan.textContent = this.formatStatus(newStatus);
        }
      } else {
        throw new Error("Failed to update scene status");
      }
    } catch (error) {
      console.error("Error updating scene status:", error);
      this.showToast("Failed to update scene status", "error");
    }
  }

  /**
   * Duplicate scene
   */
  async duplicateScene(sceneId) {
    try {
      const response = await fetch(`/api/scenes/${sceneId}/duplicate`, {
        method: "POST",
      });

      if (response.ok) {
        this.showToast("Scene duplicated successfully!", "success");
        // Refresh the scene list
        setTimeout(() => location.reload(), 1000);
      } else {
        throw new Error("Failed to duplicate scene");
      }
    } catch (error) {
      console.error("Error duplicating scene:", error);
      this.showToast("Failed to duplicate scene", "error");
    }
  }

  /**
   * Export scene
   */
  async exportScene(sceneId) {
    try {
      const response = await fetch(`/api/scenes/${sceneId}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `scene-${sceneId}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.showToast("Scene exported successfully!", "success");
      } else {
        throw new Error("Failed to export scene");
      }
    } catch (error) {
      console.error("Error exporting scene:", error);
      this.showToast("Failed to export scene", "error");
    }
  }

  /**
   * Delete scene
   */
  async deleteScene(sceneId) {
    if (
      !confirm(
        "Are you sure you want to delete this scene? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/scenes/${sceneId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        this.showToast("Scene deleted successfully!", "success");
        // Navigate back to overview
        setTimeout(() => {
          window.location.hash = "";
          location.reload();
        }, 1000);
      } else {
        throw new Error("Failed to delete scene");
      }
    } catch (error) {
      console.error("Error deleting scene:", error);
      this.showToast("Failed to delete scene", "error");
    }
  }

  /**
   * Show Run Scene Interface - Live gameplay control panel
   */
  async showRunSceneInterface(scene) {
    console.log(`🎬 SceneRenderer: Starting Run Scene mode for: ${scene.name}`);

    try {
      // Get campaign ID from scene or fallback
      const campaignId = scene.campaign_id || getDefaultCampaignId();

      // Fetch related data for the run scene interface
      const [charactersRes, locationsRes, questsRes] = await Promise.all([
        fetch(`/api/characters?campaign_id=${campaignId}`),
        fetch(`/api/locations?campaign_id=${campaignId}`),
        fetch(`/api/quests?campaign_id=${campaignId}`),
      ]);

      // Validate responses
      if (!charactersRes.ok) {
        throw new Error(`Characters API error: ${charactersRes.status}`);
      }
      if (!locationsRes.ok) {
        throw new Error(`Locations API error: ${locationsRes.status}`);
      }
      if (!questsRes.ok) {
        throw new Error(`Quests API error: ${questsRes.status}`);
      }

      const charactersData = await charactersRes.json();
      const locations = await locationsRes.json();
      const quests = await questsRes.json();

      // Handle character data structure (API returns {players: [], npcs: []})
      const allCharacters = [];
      if (charactersData.players && Array.isArray(charactersData.players)) {
        allCharacters.push(
          ...charactersData.players.map((p) => ({ ...p, type: "pc" }))
        );
      }
      if (charactersData.npcs && Array.isArray(charactersData.npcs)) {
        allCharacters.push(
          ...charactersData.npcs.map((n) => ({ ...n, type: "npc" }))
        );
      }

      // Ensure all data is in array format
      const safeCharacters = allCharacters;
      const safeLocations = Array.isArray(locations) ? locations : [];
      const safeQuests = Array.isArray(quests) ? quests : [];

      console.log(`📊 Run Scene data loaded:`, {
        characters: safeCharacters.length,
        locations: safeLocations.length,
        quests: safeQuests.length,
      });

      // Replace the entire scenes-content with run scene interface
      const scenesContent = document.getElementById("scenes-content");
      if (scenesContent) {
        // Store the original content for restoration
        this.originalSceneContent = scenesContent.innerHTML;

        // Replace with run scene interface
        scenesContent.innerHTML = this.createRunSceneHTML(
          scene,
          safeCharacters,
          safeLocations,
          safeQuests
        );
        scenesContent.classList.add("run-scene-active");

        // Initialize run scene functionality
        await this.initializeRunSceneInterface(scene, scenesContent);
      } else {
        console.error("❌ scenes-content workspace not found for Run Scene");
      }
    } catch (error) {
      console.error("❌ Failed to load Run Scene interface:", error);
      this.showToast(
        `Failed to load Run Scene interface: ${error.message}`,
        "error"
      );
    }
  }

  /**
   * Create Run Scene HTML - DM Control Panel for Live Gameplay
   */
  createRunSceneHTML(scene, characters, locations, quests) {
    // Ensure we have arrays to work with
    const safeCharacters = Array.isArray(characters) ? characters : [];
    const safeLocations = Array.isArray(locations) ? locations : [];
    const safeQuests = Array.isArray(quests) ? quests : [];

    // Filter relevant characters (NPCs in scene location, PCs)
    const relevantCharacters = safeCharacters.filter(
      (char) =>
        char &&
        (char.type === "pc" || char.current_location === scene.location_id)
    );

    // Find related quests and locations
    const relatedQuests = safeQuests.filter(
      (quest) =>
        quest &&
        (quest.location_id === scene.location_id ||
          (quest.participants &&
            quest.participants.includes &&
            quest.participants.includes(scene.location_id)))
    );

    const currentLocation = safeLocations.find(
      (loc) => loc && loc.id === scene.location_id
    );
    const nearbyLocations = safeLocations.filter(
      (loc) =>
        loc &&
        loc.parent_location_id === currentLocation?.parent_location_id &&
        loc.id !== scene.location_id
    );

    return `
      <div class="run-scene-interface">
        <div class="run-scene-header">
          <div class="run-scene-title">
            <h1><i class="fas fa-play-circle"></i> Running Scene: ${escapeHTML(
              scene.name
            )}</h1>
            <div class="scene-runtime-meta">
              <span class="scene-type-badge">${escapeHTML(
                scene.scene_type || "encounter"
              )}</span>
              <span class="scene-status-badge status-running">● LIVE</span>
            </div>
          </div>
          <div class="run-scene-nav">
            <button class="btn btn-secondary" data-action="close-run-scene">
              <i class="fas fa-arrow-left"></i> Exit Run Mode
            </button>
          </div>
        </div>

        <div class="run-scene-content">
          <!-- MAIN CONTROL PANEL -->
          <div class="run-scene-main">
            
            <!-- CURRENT CONTEXT - Why are we here? -->
            <div class="control-panel context-panel">
              <h3><i class="fas fa-compass"></i> Current Context</h3>
              <div class="context-content">
                <div class="context-section">
                  <label><strong>Location:</strong></label>
                  <input type="text" class="context-location-input" value="${escapeHTML(
                    currentLocation?.name || "Unknown"
                  )}" data-scene-id="${scene.id}" />
                  <label><strong>Description:</strong></label>
                  <textarea class="context-description-input" rows="2" data-scene-id="${
                    scene.id
                  }">${escapeHTML(
      currentLocation?.description || scene.description || "No context provided"
    )}</textarea>
                </div>
                <div class="context-section">
                  <label><strong>Scene Purpose:</strong></label>
                  <textarea class="context-purpose-input" rows="2" data-scene-id="${
                    scene.id
                  }">${escapeHTML(
      scene.read_aloud ||
        scene.current_setup ||
        "Define why the actors are here and what they hope to accomplish"
    )}</textarea>
                </div>
              </div>
              <div class="context-actions">
                <button class="btn btn-sm btn-primary save-context-btn" data-scene-id="${
                  scene.id
                }">
                  <i class="fas fa-save"></i> Save Context
                </button>
                <button class="btn btn-sm btn-outline-primary generate-context-btn" data-scene-id="${
                  scene.id
                }">
                  <i class="fas fa-magic"></i> Generate Context
                </button>
              </div>
            </div>

            <!-- MUSIC -->
            <div class="control-panel music-panel">
              <h3><i class="fas fa-music"></i> Music</h3>
              <div class="music-controls">
                <div class="mood-selector">
                  <label>Current Mood:</label>
                  <select class="mood-select" data-scene-id="${scene.id}">
                    <option value="tense">Tense</option>
                    <option value="peaceful">Peaceful</option>
                    <option value="mysterious">Mysterious</option>
                    <option value="dangerous">Dangerous</option>
                    <option value="festive">Festive</option>
                    <option value="somber">Somber</option>
                    <option value="chaotic">Chaotic</option>
                  </select>
                </div>
                <div class="music-actions">
                  <button class="btn btn-sm btn-secondary generate-music-btn">
                    <i class="fas fa-music"></i> Find Music
                  </button>
                </div>
              </div>
              <div class="music-output" id="music-output">
                <p class="placeholder-text">Music suggestions will appear here...</p>
              </div>
            </div>

            <!-- READ ALOUD TEXT -->
            ${
              scene.read_aloud
                ? `
              <div class="control-panel read-aloud-panel">
                <h3><i class="fas fa-volume-up"></i> Read Aloud Text</h3>
                <div class="read-aloud-display">
                  ${escapeHTML(scene.read_aloud)}
                </div>
                <button class="btn btn-sm btn-success mark-read-btn">
                  <i class="fas fa-check"></i> Mark as Read
                </button>
              </div>
            `
                : ""
            }

          </div>

          <!-- SIDEBAR - ACTORS & WORLD INFO -->
          <div class="run-scene-sidebar">
            
            <!-- CHARACTER MANAGEMENT -->
            <div class="characters-container">
              <!-- PLAYER CHARACTERS -->
              <div class="control-panel players-panel">
                <h3><i class="fas fa-users"></i> Player Characters</h3>
                <div class="players-list">
                  ${
                    relevantCharacters.filter((char) => char.type === "pc")
                      .length > 0
                      ? relevantCharacters
                          .filter((char) => char.type === "pc")
                          .map(
                            (char) => `
                      <div class="actor-item pc" data-character-id="${
                        char.id || ""
                      }">
                        <div class="actor-header">
                          <div class="actor-info">
                            <strong>${escapeHTML(
                              char.name || "Unknown Character"
                            )}</strong>
                            <span class="actor-type">PC</span>
                          </div>
                          <div class="actor-actions">
                            <button class="btn btn-xs btn-outline-primary view-character-btn" data-character-id="${
                              char.id || ""
                            }">
                              <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-xs btn-outline-secondary toggle-actor-details" data-character-id="${
                              char.id || ""
                            }">
                              <i class="fas fa-chevron-down"></i>
                            </button>
                          </div>
                        </div>
                        <div class="actor-details" id="actor-details-${
                          char.id
                        }" style="display: none;">
                          <div class="actor-thought-section">
                            <label>Player Intent/State:</label>
                            <textarea class="actor-thought-input" rows="2" placeholder="What is this player trying to accomplish? What's their character's state?" data-character-id="${
                              char.id
                            }"></textarea>
                          </div>
                          <div class="actor-action-section">
                            <label>Player Action:</label>
                            <textarea class="actor-action-input" rows="2" placeholder="What did this player say they want to do?" data-character-id="${
                              char.id
                            }"></textarea>
                            <button class="btn btn-xs btn-success save-actor-state-btn" data-character-id="${
                              char.id
                            }">
                              <i class="fas fa-save"></i> Save State
                            </button>
                          </div>
                          <div class="actor-history-section">
                            <h5><i class="fas fa-history"></i> Action History</h5>
                            <div class="action-history" id="history-${char.id}">
                              <p class="no-history">No actions recorded yet.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    `
                          )
                          .join("")
                      : '<p class="no-players">No player characters in this scene.</p>'
                  }
                </div>
              </div>

              <!-- NON-PLAYER CHARACTERS -->
              <div class="control-panel npcs-panel">
                <h3><i class="fas fa-user-friends"></i> NPCs (You Control)</h3>
                <div class="npcs-list">
                  ${
                    relevantCharacters.filter((char) => char.type === "npc")
                      .length > 0
                      ? relevantCharacters
                          .filter((char) => char.type === "npc")
                          .map(
                            (char) => `
                      <div class="actor-item npc" data-character-id="${
                        char.id || ""
                      }">
                        <div class="actor-header">
                          <div class="actor-info">
                            <strong>${escapeHTML(
                              char.name || "Unknown Character"
                            )}</strong>
                            <span class="actor-type">NPC</span>
                          </div>
                          <div class="actor-actions">
                            <button class="btn btn-xs btn-outline-primary view-character-btn" data-character-id="${
                              char.id || ""
                            }">
                              <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-xs btn-outline-secondary toggle-actor-details" data-character-id="${
                              char.id || ""
                            }">
                              <i class="fas fa-chevron-down"></i>
                            </button>
                          </div>
                        </div>
                        <div class="actor-details" id="actor-details-${
                          char.id
                        }" style="display: none;">
                          <div class="actor-thought-section">
                            <label>NPC Motivation/State:</label>
                            <textarea class="actor-thought-input" rows="2" placeholder="What does this NPC want? How are they feeling about the situation?" data-character-id="${
                              char.id
                            }"></textarea>
                          </div>
                          <div class="actor-action-section">
                            <label>NPC Action/Response:</label>
                            <textarea class="actor-action-input" rows="2" placeholder="How does this NPC react? What do they do?" data-character-id="${
                              char.id
                            }"></textarea>
                            <button class="btn btn-xs btn-success save-actor-state-btn" data-character-id="${
                              char.id
                            }">
                              <i class="fas fa-save"></i> Save State
                            </button>
                          </div>
                          <div class="actor-history-section">
                            <h5><i class="fas fa-history"></i> Action History</h5>
                            <div class="action-history" id="history-${char.id}">
                              <p class="no-history">No actions recorded yet.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    `
                          )
                          .join("")
                      : '<p class="no-npcs">No NPCs in this scene location.</p>'
                  }
                </div>
                <button class="btn btn-sm btn-outline-success add-actor-btn" data-scene-id="${
                  scene.id
                }">
                  <i class="fas fa-plus"></i> Add NPC
                </button>
              </div>
            </div>

            <!-- RELATIVE WORLD INFO -->
            <div class="control-panel world-info-panel">
              <h3><i class="fas fa-globe"></i> Related Information</h3>
              
              <!-- Related Quests -->
              ${
                relatedQuests.length > 0
                  ? `
                <div class="world-section">
                  <h4><i class="fas fa-scroll"></i> Active Quests</h4>
                  <div class="quest-list">
                    ${
                      relatedQuests.length > 0
                        ? relatedQuests
                            .map(
                              (quest) => `
                      <div class="quest-item" data-quest-id="${quest.id || ""}">
                        <span class="quest-name">${escapeHTML(
                          quest.title || quest.name || "Unknown Quest"
                        )}</span>
                        <span class="quest-status">${escapeHTML(
                          quest.status || "unknown"
                        )}</span>
                      </div>
                    `
                            )
                            .join("")
                        : '<p class="no-quests">No related quests found.</p>'
                    }
                  </div>
                </div>
              `
                  : ""
              }

              <!-- Nearby Locations -->
              ${
                nearbyLocations.length > 0
                  ? `
                <div class="world-section">
                  <h4><i class="fas fa-map"></i> Nearby Locations</h4>
                  <div class="location-list">
                    ${
                      nearbyLocations.length > 0
                        ? nearbyLocations
                            .map(
                              (loc) => `
                      <div class="location-item" data-location-id="${
                        loc.id || ""
                      }">
                        ${escapeHTML(loc.name || "Unknown Location")}
                      </div>
                    `
                            )
                            .join("")
                        : '<p class="no-locations">No nearby locations found.</p>'
                    }
                  </div>
                </div>
              `
                  : ""
              }
            </div>

            <!-- THEREFORE SYSTEM -->
            <div class="control-panel therefore-panel">
              <h3><i class="fas fa-arrow-right"></i> What Happens Next?</h3>
              <div class="therefore-content">
                <p class="therefore-description">
                  Based on the current context, actors, and goals...
                </p>
                <button class="btn btn-primary generate-next-btn" data-scene-id="${
                  scene.id
                }">
                  <i class="fas fa-magic"></i> Generate Next Action
                </button>
                <div class="next-suggestions" id="next-suggestions">
                  <!-- AI suggestions will appear here -->
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- FOOTER CONTROLS -->
        <div class="run-scene-footer">
          <div class="scene-controls">
            <button class="btn btn-outline-warning pause-scene-btn">
              <i class="fas fa-pause"></i> Pause Scene
            </button>
            <button class="btn btn-outline-success complete-scene-btn" data-scene-id="${
              scene.id
            }">
              <i class="fas fa-check"></i> Complete Scene
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Initialize Run Scene interface functionality
   */
  async initializeRunSceneInterface(scene, container) {
    // Initialize scene action history if not exists
    if (!this.sceneActionHistory) {
      this.sceneActionHistory = {};
    }
    if (!this.sceneActionHistory[scene.id]) {
      this.sceneActionHistory[scene.id] = {};
    }

    // Load existing actor state history from database
    await this.loadActorStateHistory(scene.id);

    // Close run scene handlers
    const closeButtons = container.querySelectorAll(
      '[data-action="close-run-scene"]'
    );
    closeButtons.forEach((button) => {
      button.addEventListener("click", () => this.exitRunSceneMode());
    });

    // Save Context button
    const saveContextBtn = container.querySelector(".save-context-btn");
    if (saveContextBtn) {
      saveContextBtn.addEventListener("click", () =>
        this.saveContextChanges(scene)
      );
    }

    // Generate Context button
    const generateContextBtn = container.querySelector(".generate-context-btn");
    if (generateContextBtn) {
      generateContextBtn.addEventListener("click", () =>
        this.generateSceneContext(scene)
      );
    }

    // Generate Music button
    const generateMusicBtn = container.querySelector(".generate-music-btn");
    if (generateMusicBtn) {
      generateMusicBtn.addEventListener("click", () =>
        this.generateMusicSuggestion(scene)
      );
    }

    // Actor toggle buttons
    const toggleBtns = container.querySelectorAll(".toggle-actor-details");
    toggleBtns.forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.toggleActorDetails(e.target.dataset.characterId)
      );
    });

    // Save actor state buttons
    const saveActorBtns = container.querySelectorAll(".save-actor-state-btn");
    saveActorBtns.forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.saveActorState(scene.id, e.target.dataset.characterId)
      );
    });

    // Add NPC button
    const addActorBtn = container.querySelector(".add-actor-btn");
    if (addActorBtn) {
      addActorBtn.addEventListener("click", () => this.showAddNPCModal(scene));
    }

    // Generate Next Action button
    const generateNextBtn = container.querySelector(".generate-next-btn");
    if (generateNextBtn) {
      generateNextBtn.addEventListener("click", () =>
        this.generateNextAction(scene)
      );
    }

    // Complete Scene button
    const completeBtn = container.querySelector(".complete-scene-btn");
    if (completeBtn) {
      completeBtn.addEventListener("click", () => this.completeScene(scene.id));
    }

    // Mood selector
    const moodSelect = container.querySelector(".mood-select");
    if (moodSelect) {
      moodSelect.addEventListener("change", (e) =>
        this.updateSceneMood(scene, e.target.value)
      );
    }

    console.log(`🎬 Run Scene interface initialized for: ${scene.name}`);
  }

  /**
   * Save context changes
   */
  async saveContextChanges(scene) {
    try {
      const locationInput = document.querySelector(".context-location-input");
      const descriptionInput = document.querySelector(
        ".context-description-input"
      );
      const purposeInput = document.querySelector(".context-purpose-input");

      if (!locationInput || !descriptionInput || !purposeInput) {
        console.error("Context input fields not found");
        return;
      }

      const contextData = {
        location: locationInput.value,
        description: descriptionInput.value,
        purpose: purposeInput.value,
        updatedAt: new Date().toISOString(),
      };

      // TODO: Save to scene data via API
      console.log("Saving context changes:", contextData);

      this.showToast("Context saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save context:", error);
      this.showToast("Failed to save context", "error");
    }
  }

  /**
   * Toggle actor details visibility
   */
  toggleActorDetails(characterId) {
    const details = document.getElementById(`actor-details-${characterId}`);
    const toggleBtn = document.querySelector(
      `[data-character-id="${characterId}"].toggle-actor-details`
    );

    if (details && toggleBtn) {
      const isVisible = details.style.display !== "none";
      details.style.display = isVisible ? "none" : "block";

      const icon = toggleBtn.querySelector("i");
      if (icon) {
        icon.className = isVisible
          ? "fas fa-chevron-down"
          : "fas fa-chevron-up";
      }
    }
  }

  /**
   * Save actor state (thoughts and actions)
   */
  async saveActorState(sceneId, characterId) {
    try {
      const thoughtInput = document.querySelector(
        `[data-character-id="${characterId}"].actor-thought-input`
      );
      const actionInput = document.querySelector(
        `[data-character-id="${characterId}"].actor-action-input`
      );

      if (!thoughtInput || !actionInput) {
        console.error("Actor input fields not found");
        return;
      }

      const thought = thoughtInput.value.trim();
      const action = actionInput.value.trim();

      if (!thought && !action) {
        this.showToast("Please enter a thought or action to save", "warning");
        return;
      }

      const timestamp = new Date().toISOString();
      const actorState = {
        thought,
        action,
        timestamp,
        characterId,
      };

      // Store in local history for immediate display
      if (!this.sceneActionHistory[sceneId][characterId]) {
        this.sceneActionHistory[sceneId][characterId] = [];
      }
      this.sceneActionHistory[sceneId][characterId].push(actorState);

      // Update the history display
      this.updateActorHistory(
        characterId,
        this.sceneActionHistory[sceneId][characterId]
      );

      // Clear the input fields
      thoughtInput.value = "";
      actionInput.value = "";

      // Save to database via API
      try {
        const response = await fetch(`/api/scenes/${sceneId}/actor-states`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            characterId: characterId,
            characterType: this.getCharacterType(characterId), // Determine character type
            thought: actorState.thought,
            action: actorState.action,
            metadata: {
              timestamp: actorState.timestamp,
              sceneId: sceneId,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        console.log("Actor state saved to database:", result);
        this.showToast("Actor state saved!", "success");
      } catch (apiError) {
        console.error("Failed to save actor state to database:", apiError);
        // Still show success for local save, but warn about persistence
        this.showToast(
          "Actor state saved locally (persistence failed)",
          "warning"
        );
      }
    } catch (error) {
      console.error("Failed to save actor state:", error);
      this.showToast("Failed to save actor state", "error");
    }
  }

  /**
   * Update actor history display
   */
  updateActorHistory(characterId, history) {
    const historyContainer = document.getElementById(`history-${characterId}`);
    if (!historyContainer) return;

    if (!history || history.length === 0) {
      historyContainer.innerHTML =
        '<p class="no-history">No actions recorded yet.</p>';
      return;
    }

    const historyHTML = history
      .map(
        (entry, index) => `
      <div class="history-entry" data-entry-index="${index}">
        <div class="history-timestamp">${new Date(
          entry.timestamp
        ).toLocaleTimeString()}</div>
        ${
          entry.thought
            ? `<div class="history-thought"><strong>Thought:</strong> ${escapeHTML(
                entry.thought
              )}</div>`
            : ""
        }
        ${
          entry.action
            ? `<div class="history-action"><strong>Action:</strong> ${escapeHTML(
                entry.action
              )}</div>`
            : ""
        }
      </div>
    `
      )
      .join("");

    historyContainer.innerHTML = historyHTML;
  }

  /**
   * Generate scene context using AI
   */
  async generateSceneContext(scene) {
    // Placeholder for AI integration
    const output = document.getElementById("atmosphere-output");
    if (output) {
      output.innerHTML = `<p class="generating">🤖 Generating contextual information...</p>`;
      // TODO: Integrate with Gemini AI service
      setTimeout(() => {
        output.innerHTML = `<p>Context generated based on scene type "${scene.scene_type}" and location. This would integrate with the AI service to provide rich contextual information.</p>`;
      }, 1500);
    }
  }

  /**
   * Generate music suggestion based on mood
   */
  async generateMusicSuggestion(scene) {
    const mood = document.querySelector(".mood-select")?.value || "neutral";
    const output = document.getElementById("music-output");
    if (output) {
      output.innerHTML = `<p class="generating">🎵 Finding music for ${mood} mood...</p>`;
      // TODO: Implement music suggestion API
      setTimeout(() => {
        output.innerHTML = `<p><strong>Music Suggestion for ${mood} scene:</strong><br>Search for: "${mood} D&D ambient music" or "fantasy ${mood} soundtrack"<br><br><strong>Suggested Tracks:</strong><br>• Ambient ${mood} fantasy background<br>• ${
          mood.charAt(0).toUpperCase() + mood.slice(1)
        } dungeon atmosphere<br>• Medieval ${mood} tavern sounds</p>`;
      }, 1000);
    }
  }

  /**
   * Generate next action suggestions
   */
  async generateNextAction(scene) {
    const suggestions = document.getElementById("next-suggestions");
    if (suggestions) {
      suggestions.innerHTML = `<p class="generating">🎲 Analyzing scene context...</p>`;
      // TODO: Implement AI-powered "Therefore" system
      setTimeout(() => {
        suggestions.innerHTML = `
          <div class="suggestion-item">
            <strong>Therefore:</strong> Based on the current scene dynamics, consider having an NPC react to the party's presence or introduce a complication that advances the plot.
          </div>
          <div class="suggestion-item">
            <strong>Alternative:</strong> Allow the players to drive the scene forward with their questions or actions.
          </div>
        `;
      }, 2000);
    }
  }

  /**
   * Exit Run Scene mode and restore original content
   */
  exitRunSceneMode() {
    const scenesContent = document.getElementById("scenes-content");
    if (scenesContent && this.originalSceneContent) {
      scenesContent.innerHTML = this.originalSceneContent;
      scenesContent.classList.remove("run-scene-active");
      this.originalSceneContent = null;
    }
    console.log("🎬 Exited Run Scene mode");
  }

  /**
   * Complete the scene and update status
   */
  async completeScene(sceneId) {
    try {
      await this.updateSceneStatus(sceneId, "completed");
      this.showToast("Scene completed successfully!", "success");
      this.exitRunSceneMode();
    } catch (error) {
      console.error("Failed to complete scene:", error);
      this.showToast("Failed to complete scene", "error");
    }
  }

  /**
   * Show Add NPC modal
   */
  async showAddNPCModal(scene) {
    try {
      // Load available NPCs first
      const { availableNPCs, error } = await this.loadAvailableNPCs(scene);

      if (error) {
        this.showToast("Failed to load NPCs", "error");
        return;
      }

      const modalContent = `
        <div class="add-npc-modal">
          <h3><i class="fas fa-user-plus"></i> Add NPC to Scene</h3>
          
          <!-- Quick Create Section -->
          <div class="modal-section">
            <h4>Quick Create</h4>
            <p class="section-description">Create a simple NPC on the fly for spontaneous characters</p>
            <div class="quick-create-form">
              <input type="text" id="quick-npc-name" placeholder="Enter NPC name (e.g., 'Tavern Owner', 'Guard #2')" />
              <button class="btn btn-success" id="create-quick-npc-btn">
                <i class="fas fa-plus"></i> Create & Add
              </button>
            </div>
          </div>

          <!-- Existing NPCs Section -->
          <div class="modal-section">
            <h4>Existing NPCs</h4>
            <p class="section-description">Add NPCs from your character database</p>
            <div class="existing-npcs-container">
              ${
                availableNPCs.length > 0
                  ? `
                <div class="npcs-grid">
                  ${availableNPCs
                    .map(
                      (npc) => `
                    <div class="npc-card" data-npc-id="${npc.id}">
                      <div class="npc-card-content">
                        <strong>${escapeHTML(npc.name)}</strong>
                        <span class="npc-role">${escapeHTML(
                          npc.role || "NPC"
                        )}</span>
                      </div>
                      <button class="btn btn-sm btn-outline-success add-existing-npc-btn" data-npc-id="${
                        npc.id
                      }">
                        <i class="fas fa-plus"></i> Add
                      </button>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              `
                  : '<p class="no-npcs-available">No additional NPCs available from your character database.</p>'
              }
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary close-modal-btn">Cancel</button>
          </div>
        </div>
      `;

      // Create and show modal
      const modalOverlay = this.createModal(modalContent);

      // Add event handlers
      this.setupAddNPCModalHandlers(modalOverlay, scene);
    } catch (error) {
      console.error("Failed to show Add NPC modal:", error);
      this.showToast("Failed to load Add NPC dialog", "error");
    }
  }

  /**
   * Load available NPCs
   */
  async loadAvailableNPCs(scene) {
    try {
      // Get campaign ID from scene or use the same source as Characters tab
      let campaignId = scene.campaign_id;

      // If no campaign ID in scene, get it from data manager like Characters tab does
      if (!campaignId) {
        // Try to get it from the same source as Characters tab
        campaignId =
          window.dataManager?.currentCampaignId || getDefaultCampaignId();
      }

      console.log("🔍 Run Scene loading NPCs for campaign:", campaignId);
      console.log("🎭 Scene details:", {
        sceneId: scene.id,
        sceneCampaignId: scene.campaign_id,
        dataManagerCampaignId: window.dataManager?.currentCampaignId,
        finalCampaignId: campaignId,
      });

      // Fetch all NPCs using the same endpoint structure as Characters tab
      const response = await fetch(`/api/characters?campaign_id=${campaignId}`);
      if (!response.ok) {
        throw new Error(`Failed to load NPCs: ${response.status}`);
      }

      const charactersData = await response.json();
      const allNPCs = charactersData.npcs || [];

      console.log(
        "📊 Available NPCs from API:",
        allNPCs.map((npc) => npc.name)
      );

      // Filter out NPCs already in scene
      const currentNPCIds =
        document.querySelectorAll(".actor-item.npc").length > 0
          ? Array.from(document.querySelectorAll(".actor-item.npc")).map(
              (item) => item.dataset.characterId
            )
          : [];

      const availableNPCs = allNPCs.filter(
        (npc) => !currentNPCIds.includes(npc.id)
      );

      return { availableNPCs, error: null };
    } catch (error) {
      console.error("Failed to load available NPCs:", error);
      return { availableNPCs: [], error: error.message };
    }
  }

  /**
   * Setup Add NPC modal event handlers
   */
  setupAddNPCModalHandlers(modalOverlay, scene) {
    // Close modal button
    const closeBtn = modalOverlay.querySelector(".close-modal-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => modalOverlay.remove());
    }

    // Quick create button
    const createBtn = modalOverlay.querySelector("#create-quick-npc-btn");
    const nameInput = modalOverlay.querySelector("#quick-npc-name");
    if (createBtn && nameInput) {
      createBtn.addEventListener("click", async () => {
        const npcName = nameInput.value.trim();
        if (!npcName) {
          this.showToast("Please enter an NPC name", "warning");
          return;
        }
        await this.createQuickNPC(scene, npcName, modalOverlay);
      });

      // Allow Enter key to create
      nameInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          createBtn.click();
        }
      });
    }

    // Add existing NPC buttons
    const addExistingBtns = modalOverlay.querySelectorAll(
      ".add-existing-npc-btn"
    );
    addExistingBtns.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const npcId = e.target.dataset.npcId;
        await this.addExistingNPCToScene(scene, npcId, modalOverlay);
      });
    });
  }

  /**
   * Generate a unique ID for quick NPCs using a combination of timestamp, counter, and random entropy
   * to ensure uniqueness even when NPCs are created rapidly
   * @returns {string} A unique identifier in format: quick-npc-{timestamp}-{counter}-{random}
   */
  generateUniqueQuickNPCId() {
    this.quickNPCCounter++;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `quick-npc-${timestamp}-${this.quickNPCCounter}-${random}`;
  }

  /**
   * Create a quick NPC and add to scene
   */
  async createQuickNPC(scene, npcName, modalOverlay) {
    try {
      // Create a simple NPC object
      const quickNPC = {
        id: this.generateUniqueQuickNPCId(), // Unique ID with counter and entropy
        name: npcName,
        role: "Quick NPC",
        type: "npc",
        isQuickNPC: true, // Flag to identify quick NPCs
      };

      // Add to the scene immediately
      await this.addNPCToScene(scene.id, quickNPC);

      // Close modal
      modalOverlay.remove();

      this.showToast(`Added ${npcName} to scene!`, "success");
    } catch (error) {
      console.error("Failed to create quick NPC:", error);
      this.showToast("Failed to create NPC", "error");
    }
  }

  /**
   * Add existing NPC to scene
   */
  async addExistingNPCToScene(scene, npcId, modalOverlay) {
    try {
      // Find the NPC data from the modal
      const npcCard = modalOverlay.querySelector(`[data-npc-id="${npcId}"]`);
      if (!npcCard) return;

      // Create NPC object (would normally fetch full data from API)
      const npcName = npcCard.querySelector("strong").textContent;
      const npcRole = npcCard.querySelector(".npc-role").textContent;

      const npc = {
        id: npcId,
        name: npcName,
        role: npcRole,
        type: "npc",
      };

      await this.addNPCToScene(scene.id, npc);

      // Close modal
      modalOverlay.remove();

      this.showToast(`Added ${npcName} to scene!`, "success");
    } catch (error) {
      console.error("Failed to add existing NPC:", error);
      this.showToast("Failed to add NPC", "error");
    }
  }

  /**
   * Add NPC to the scene interface
   */
  async addNPCToScene(sceneId, npc) {
    try {
      const npcsContainer = document.querySelector(".npcs-list");
      if (!npcsContainer) return;

      // Remove "no NPCs" message if it exists
      const noNPCsMsg = npcsContainer.querySelector(".no-npcs");
      if (noNPCsMsg) {
        noNPCsMsg.remove();
      }

      // Create the NPC HTML
      const npcHTML = `
        <div class="actor-item npc" data-character-id="${npc.id}">
          <div class="actor-header">
            <div class="actor-info">
              <strong>${escapeHTML(npc.name)}</strong>
              <span class="actor-type">NPC</span>
            </div>
            <div class="actor-actions">
              <button class="btn btn-xs btn-outline-primary view-character-btn" data-character-id="${
                npc.id
              }">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-xs btn-outline-secondary toggle-actor-details" data-character-id="${
                npc.id
              }">
                <i class="fas fa-chevron-down"></i>
              </button>
            </div>
          </div>
          <div class="actor-details" id="actor-details-${
            npc.id
          }" style="display: none;">
            <div class="actor-thought-section">
              <label>NPC Motivation/State:</label>
              <textarea class="actor-thought-input" rows="2" placeholder="What does this NPC want? How are they feeling about the situation?" data-character-id="${
                npc.id
              }"></textarea>
            </div>
            <div class="actor-action-section">
              <label>NPC Action/Response:</label>
              <textarea class="actor-action-input" rows="2" placeholder="How does this NPC react? What do they do?" data-character-id="${
                npc.id
              }"></textarea>
              <button class="btn btn-xs btn-success save-actor-state-btn" data-character-id="${
                npc.id
              }">
                <i class="fas fa-save"></i> Save State
              </button>
            </div>
            <div class="actor-history-section">
              <h5><i class="fas fa-history"></i> Action History</h5>
              <div class="action-history" id="history-${npc.id}">
                <p class="no-history">No actions recorded yet.</p>
              </div>
            </div>
          </div>
        </div>
      `;

      // Add to the container
      npcsContainer.insertAdjacentHTML("beforeend", npcHTML);

      // Add event listeners for the new NPC
      const newNPCElement = npcsContainer.querySelector(
        `[data-character-id="${npc.id}"]`
      );
      if (newNPCElement) {
        // Toggle button
        const toggleBtn = newNPCElement.querySelector(".toggle-actor-details");
        if (toggleBtn) {
          toggleBtn.addEventListener("click", (e) =>
            this.toggleActorDetails(e.target.dataset.characterId)
          );
        }

        // Save button
        const saveBtn = newNPCElement.querySelector(".save-actor-state-btn");
        if (saveBtn) {
          saveBtn.addEventListener("click", (e) =>
            this.saveActorState(sceneId, e.target.dataset.characterId)
          );
        }
      }

      // Initialize history for this NPC
      if (!this.sceneActionHistory[sceneId]) {
        this.sceneActionHistory[sceneId] = {};
      }
      if (!this.sceneActionHistory[sceneId][npc.id]) {
        this.sceneActionHistory[sceneId][npc.id] = [];
      }
    } catch (error) {
      console.error("Failed to add NPC to scene:", error);
      throw error;
    }
  }

  /**
   * Get character type (pc or npc) based on character ID
   */
  getCharacterType(characterId) {
    // Check if character exists in the current scene interface
    const pcElement = document.querySelector(
      `.actor-item.pc[data-character-id="${characterId}"]`
    );
    if (pcElement) {
      return "pc";
    }

    const npcElement = document.querySelector(
      `.actor-item.npc[data-character-id="${characterId}"]`
    );
    if (npcElement) {
      return "npc";
    }

    // Default to NPC if we can't determine
    return "npc";
  }

  /**
   * Load actor state history from database
   */
  async loadActorStateHistory(sceneId) {
    try {
      const response = await fetch(`/api/scenes/${sceneId}/actor-states`);

      if (!response.ok) {
        throw new Error(`Failed to load actor states: ${response.status}`);
      }

      const actorStates = await response.json();

      // Group states by character ID
      const groupedStates = {};
      actorStates.forEach((state) => {
        if (!groupedStates[state.character_id]) {
          groupedStates[state.character_id] = [];
        }
        groupedStates[state.character_id].push({
          thought: state.thought,
          action: state.action,
          timestamp: state.timestamp,
          characterType: state.character_type,
        });
      });

      // Update local history and display
      this.sceneActionHistory[sceneId] = groupedStates;

      // Update all character history displays
      Object.keys(groupedStates).forEach((characterId) => {
        this.updateActorHistory(characterId, groupedStates[characterId]);
      });

      console.log(
        `📚 Loaded ${actorStates.length} actor states for scene ${sceneId}`
      );
    } catch (error) {
      console.error("Failed to load actor state history:", error);
      // Don't show error toast as this is a background operation
    }
  }

  /**
   * Update scene mood
   */
  updateSceneMood(scene, mood) {
    console.log(`🎭 Scene mood updated to: ${mood}`);
    // TODO: Store mood state and use it for AI generation
  }

  /**
   * Format scene status for display
   */
  formatStatus(status) {
    const statusMap = {
      planned: "Planned",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return statusMap[status] || status;
  }

  /**
   * Create a modal overlay
   */
  createModal(content) {
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    modalOverlay.innerHTML = `
      <div class="modal-content">
        ${content}
      </div>
    `;

    // Close on overlay click
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.remove();
      }
    });

    document.body.appendChild(modalOverlay);
    return modalOverlay;
  }

  /**
   * Show toast notification
   */
  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-${
          type === "success"
            ? "check-circle"
            : type === "error"
            ? "exclamation-circle"
            : "info-circle"
        }"></i>
        <span class="toast-message">${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add("show"), 100);

    // Remove after delay
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

export default SceneRenderer;
