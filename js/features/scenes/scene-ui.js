import { uiNotificationService } from "../../services/ui-notification-service.js";
import { escapeHTML } from "../../shared/escape-html.js";

/**
 * SceneUI - Handles modal dialogs, form handling, notifications, and UI interactions
 * Part of the modular scene management architecture
 */
export class SceneUI {
  constructor(sceneCore) {
    this.core = sceneCore;
  }

  /**
   * Setup event listeners for scene management
   */
  setupEventListeners(sceneManager) {
    console.log("🎭 SceneUI: Setting up event listeners...");

    // Store reference to scene manager for callbacks
    this.sceneManager = sceneManager;

    // Add any global event listeners here
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeTopModal();
      }
    });

    console.log("✅ SceneUI: Event listeners setup complete");
  }

  /**
   * Show create scene modal
   */
  async showCreateSceneModal() {
    try {
      console.log("🎭 SceneUI: Loading create scene modal...");

      // Load locations and sessions for dropdowns
      const [locationsResponse, sessionsResponse] = await Promise.all([
        fetch("/api/locations"),
        fetch("/api/sessions"),
      ]);

      const locations = await locationsResponse.json();
      const sessions = await sessionsResponse.json();

      // Show create scene modal
      this.renderCreateSceneModal(locations, sessions);
    } catch (error) {
      console.error("❌ SceneUI: Failed to load create scene modal", error);
      this.showError("Failed to load scene creation data");
    }
  }

  /**
   * Show edit scene modal
   */
  async showEditSceneModal(sceneId) {
    try {
      console.log(`🎭 SceneUI: Loading edit scene modal for: ${sceneId}`);

      // Load scene data, locations, and sessions
      const [sceneResponse, locationsResponse, sessionsResponse] =
        await Promise.all([
          fetch(`/api/scenes/${sceneId}`),
          fetch("/api/locations"),
          fetch("/api/sessions"),
        ]);

      if (!sceneResponse.ok) {
        throw new Error("Scene not found");
      }

      const scene = await sceneResponse.json();
      const locations = await locationsResponse.json();
      const sessions = await sessionsResponse.json();

      // Show edit scene modal with pre-populated data
      this.renderEditSceneModal(scene, locations, sessions);
    } catch (error) {
      console.error("❌ SceneUI: Failed to load edit scene modal", error);
      this.showError("Failed to load scene data for editing");
    }
  }

  /**
   * Render create scene modal
   */
  renderCreateSceneModal(locations, sessions) {
    const modalContent = `
      <div class="create-scene-modal">
        <h3>Create New Scene</h3>
        <form id="create-scene-form">
          <div class="form-group">
            <label for="scene-name">Scene Name *</label>
            <input type="text" id="scene-name" name="name" required 
                   placeholder="Enter scene name..." />
          </div>
          
          <div class="form-group">
            <label for="scene-description">Description</label>
            <textarea id="scene-description" name="description" 
                      placeholder="Describe the scene..." rows="3"></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="scene-location">Location</label>
              <select id="scene-location" name="location_id">
                <option value="">Select location...</option>
                ${locations
                  .map(
                    (loc) => `<option value="${loc.id}">${loc.name}</option>`
                  )
                  .join("")}
              </select>
            </div>
            
            <div class="form-group">
              <label for="scene-session">Session</label>
              <select id="scene-session" name="session_id">
                <option value="">Select session...</option>
                ${sessions
                  .map(
                    (session) =>
                      `<option value="${session.id}">Session ${
                        session.session_number || session.id
                      }</option>`
                  )
                  .join("")}
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="scene-read-aloud">Read Aloud Text</label>
            <textarea id="scene-read-aloud" name="read_aloud" 
                      placeholder="Text to read aloud to players..." rows="3"></textarea>
          </div>
          
          <div class="form-group">
            <label for="scene-dm-notes">DM Notes</label>
            <textarea id="scene-dm-notes" name="dm_notes" 
                      placeholder="Private notes for the DM..." rows="3"></textarea>
          </div>
          
          <div class="form-group">
            <label for="scene-setup">Current Setup</label>
            <textarea id="scene-setup" name="current_setup" 
                      placeholder="Current scene setup and state..." rows="2"></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Create Scene
            </button>
          </div>
        </form>
      </div>
    `;

    // Create and show modal
    const modalOverlay = this.createModal(modalContent);

    // Add form submit handler
    modalOverlay
      .querySelector("#create-scene-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleCreateSceneSubmit(e.target);
      });

    // Focus on scene name input
    setTimeout(() => {
      document.getElementById("scene-name")?.focus();
    }, 100);
  }

  /**
   * Render edit scene modal
   */
  renderEditSceneModal(scene, locations, sessions) {
    const modalContent = `
      <div class="edit-scene-modal">
        <h3>Edit Scene</h3>
        <form id="edit-scene-form" data-scene-id="${scene.id}">
          <div class="form-group">
            <label for="edit-scene-name">Scene Name *</label>
            <input type="text" id="edit-scene-name" name="name" required 
                   value="${
                     scene.name || ""
                   }" placeholder="Enter scene name..." />
          </div>
          
          <div class="form-group">
            <label for="edit-scene-description">Description</label>
            <textarea id="edit-scene-description" name="description" 
                      placeholder="Describe the scene..." rows="3">${
                        scene.description || ""
                      }</textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="edit-scene-location">Location</label>
              <select id="edit-scene-location" name="location_id">
                <option value="">Select location...</option>
                ${locations
                  .map(
                    (loc) =>
                      `<option value="${loc.id}" ${
                        loc.id === scene.location_id ? "selected" : ""
                      }>${loc.name}</option>`
                  )
                  .join("")}
              </select>
            </div>
            
            <div class="form-group">
              <label for="edit-scene-session">Session</label>
              <select id="edit-scene-session" name="session_id">
                <option value="">Select session...</option>
                ${sessions
                  .map(
                    (session) =>
                      `<option value="${session.id}" ${
                        session.id === scene.session_id ? "selected" : ""
                      }>Session ${
                        session.session_number || session.id
                      }</option>`
                  )
                  .join("")}
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="edit-scene-read-aloud">Read Aloud Text</label>
            <textarea id="edit-scene-read-aloud" name="read_aloud" 
                      placeholder="Text to read aloud to players..." rows="3">${
                        scene.read_aloud || ""
                      }</textarea>
          </div>
          
          <div class="form-group">
            <label for="edit-scene-dm-notes">DM Notes</label>
            <textarea id="edit-scene-dm-notes" name="dm_notes" 
                      placeholder="Private notes for the DM..." rows="3">${
                        scene.dm_notes || ""
                      }</textarea>
          </div>
          
          <div class="form-group">
            <label for="edit-scene-setup">Current Setup</label>
            <textarea id="edit-scene-setup" name="current_setup" 
                      placeholder="Current scene setup and state..." rows="2">${
                        scene.current_setup || ""
                      }</textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Update Scene
            </button>
          </div>
        </form>
      </div>
    `;

    // Create and show modal
    const modalOverlay = this.createModal(modalContent);

    // Add form submit handler
    modalOverlay
      .querySelector("#edit-scene-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleEditSceneSubmit(e.target);
      });

    // Focus on scene name input
    setTimeout(() => {
      document.getElementById("edit-scene-name")?.focus();
    }, 100);
  }

  /**
   * Handle create scene form submission
   */
  async handleCreateSceneSubmit(form) {
    try {
      const formData = new FormData(form);
      const sceneData = {
        name: formData.get("name"),
        description: formData.get("description"),
        location_id: formData.get("location_id") || null,
        session_id: formData.get("session_id") || null,
        read_aloud: formData.get("read_aloud"),
        dm_notes: formData.get("dm_notes"),
        current_setup: formData.get("current_setup"),
      };

      // Validate required fields
      if (!sceneData.name || sceneData.name.trim() === "") {
        this.showError("Scene name is required");
        return;
      }

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Creating...";
      submitBtn.disabled = true;

      // Create scene via core module
      const result = await this.core.createScene(sceneData);

      if (result.success) {
        // Close modal
        form.closest(".modal-overlay").remove();

        // Show success message
        this.showSuccessMessage(
          `Scene "${sceneData.name}" created successfully!`
        );

        // Refresh scene overview if available
        if (this.sceneManager && this.sceneManager.refreshSceneOverview) {
          await this.sceneManager.refreshSceneOverview();
        }

        console.log("✅ SceneUI: Scene created successfully:", result);
      } else {
        throw new Error(result.error || "Failed to create scene");
      }
    } catch (error) {
      console.error("❌ SceneUI: Failed to create scene", error);
      this.showError("Failed to create scene: " + error.message);

      // Reset submit button
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = "Create Scene";
        submitBtn.disabled = false;
      }
    }
  }

  /**
   * Handle edit scene form submission
   */
  async handleEditSceneSubmit(form) {
    try {
      const sceneId = form.dataset.sceneId;
      const formData = new FormData(form);
      const sceneData = {
        name: formData.get("name"),
        description: formData.get("description"),
        location_id: formData.get("location_id") || null,
        session_id: formData.get("session_id") || null,
        read_aloud: formData.get("read_aloud"),
        dm_notes: formData.get("dm_notes"),
        current_setup: formData.get("current_setup"),
      };

      // Validate required fields
      if (!sceneData.name || sceneData.name.trim() === "") {
        this.showError("Scene name is required");
        return;
      }

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Updating...";
      submitBtn.disabled = true;

      // Update scene via core module
      const result = await this.core.updateScene(sceneId, sceneData);

      if (result.success) {
        // Close modal
        form.closest(".modal-overlay").remove();

        // Show success message
        this.showSuccessMessage(
          `Scene "${sceneData.name}" updated successfully!`
        );

        // Refresh scene overview if available
        if (this.sceneManager && this.sceneManager.refreshSceneOverview) {
          await this.sceneManager.refreshSceneOverview();
        }

        console.log("✅ SceneUI: Scene updated successfully:", result);
      } else {
        throw new Error(result.error || "Failed to update scene");
      }
    } catch (error) {
      console.error("❌ SceneUI: Failed to update scene", error);
      this.showError("Failed to update scene: " + error.message);

      // Reset submit button
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = "Update Scene";
        submitBtn.disabled = false;
      }
    }
  }

  /**
   * Show confirmation dialog
   */
  showConfirmationDialog(
    title,
    message,
    details,
    confirmText = "Confirm",
    confirmClass = "btn-primary"
  ) {
    return uiNotificationService.showConfirmation(
      title,
      `${message}<br><small>${details}</small>`
    );
  }

  /**
   * Show suggestion modal
   */
  showSuggestionModal(title, suggestion) {
    uiNotificationService.showModal(title, suggestion, [
      { text: "Close", class: "btn-primary", action: () => {} },
    ]);
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
   * Close the topmost modal
   */
  closeTopModal() {
    const modal = document.querySelector(".modal-overlay");
    if (modal) {
      modal.remove();
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage(message) {
    uiNotificationService.showToast(message, "success");
  }

  /**
   * Show error message
   */
  showError(message) {
    uiNotificationService.showToast(message, "error");
  }

  /**
   * Update URL hash for navigation
   */
  updateUrlHash(sceneId) {
    if (sceneId) {
      window.location.hash = `scene/${sceneId}`;
      console.log(`🎭 SceneUI: URL hash updated to: #scene/${sceneId}`);
    } else {
      window.location.hash = "";
      console.log("🎭 SceneUI: URL hash cleared");
    }
  }

  /**
   * Show loading state
   */
  showLoading(message = "Loading...") {
    const loadingOverlay = document.createElement("div");
    loadingOverlay.className = "loading-overlay";
    loadingOverlay.innerHTML = `
      <div class="loading-content">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;

    document.body.appendChild(loadingOverlay);
    return loadingOverlay;
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    const loadingOverlay = document.querySelector(".loading-overlay");
    if (loadingOverlay) {
      loadingOverlay.remove();
    }
  }

  /**
   * Show modal with custom content
   */
  showModal(title, content) {
    return uiNotificationService.showModal(title, content, [
      { text: "Close", class: "btn-secondary", action: () => {} },
    ]);
  }

  /**
   * Cleanup UI elements
   */
  cleanup() {
    // Remove any open modals
    document
      .querySelectorAll(".modal-overlay")
      .forEach((modal) => modal.remove());

    // Remove any notifications
    document
      .querySelectorAll(".success-notification, .error-notification")
      .forEach((notification) => notification.remove());

    // Remove any loading overlays
    document
      .querySelectorAll(".loading-overlay")
      .forEach((loading) => loading.remove());

    console.log("🧹 SceneUI: Cleanup complete");
  }
}
