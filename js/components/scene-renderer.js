/**
 * SceneRenderer - Renders individual scenes with proper management tools
 */
class SceneRenderer {
  constructor() {
    this.currentScene = null;
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
              <span class="scene-location">📍 ${
                scene.location_id || "Unknown Location"
              }</span>
              <span class="scene-status status-${
                scene.scene_status || "planned"
              }">${this.formatStatus(scene.scene_status || "planned")}</span>
            </div>
          </div>
          <div class="scene-controls">
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
