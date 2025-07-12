/**
 * Campaign Manager - Feature coordination and public API
 * Main entry point for campaign management functionality
 */
import { CampaignCore } from "./campaign-core.js";
import { CampaignUI } from "./campaign-ui.js";
import { CampaignForms } from "./campaign-forms.js";

export class CampaignManager {
  constructor() {
    this.core = null;
    this.ui = null;
    this.forms = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the campaign manager
   */
  async init() {
    if (this.isInitialized) return;

    console.log("🏗️ CampaignManager: Initializing...");

    try {
      // Initialize core modules
      this.core = new CampaignCore();
      await this.core.init();

      this.forms = new CampaignForms(this.core);
      this.ui = new CampaignUI(this.core, this.forms);

      // Setup event handlers
      this.setupEventHandlers();

      this.isInitialized = true;
      console.log("✅ CampaignManager: Initialized successfully");
    } catch (error) {
      console.error("❌ CampaignManager: Failed to initialize:", error);
      throw error;
    }
  }

  /**
   * Render the campaign workspace
   */
  async renderCampaignWorkspace() {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      const workspaceHtml = await this.ui.renderCampaignWorkspace();

      // Update player status after rendering
      setTimeout(() => {
        this.ui.updatePlayerStatus();
      }, 100);

      return workspaceHtml;
    } catch (error) {
      console.error("❌ Error rendering campaign workspace:", error);
      return this.renderErrorState(error);
    }
  }

  /**
   * Setup event handlers for campaign interactions
   */
  setupEventHandlers() {
    // Use event delegation for dynamic content
    document.addEventListener("click", async (e) => {
      const action = e.target.closest("[data-action]")?.dataset.action;
      if (!action) return;

      try {
        await this.handleAction(action, e);
      } catch (error) {
        console.error(`❌ Error handling action "${action}":`, error);
        this.ui.showError(
          `Failed to ${action.replace("-", " ")}: ${error.message}`
        );
      }
    });

    // Handle form submissions
    document.addEventListener("submit", async (e) => {
      const formId = e.target.id;
      if (!formId || !formId.includes("campaign")) return;

      e.preventDefault();
      await this.handleFormSubmission(formId, e.target);
    });
  }

  /**
   * Handle user actions
   */
  async handleAction(action, event) {
    switch (action) {
      case "edit-campaign":
        this.forms.showEditCampaignModal();
        break;

      case "edit-campaign-info":
        this.forms.showQuickEditModal();
        break;

      case "campaign-settings":
        this.forms.showCampaignSettingsModal();
        break;

      case "close-modal":
        this.forms.closeModal();
        break;

      case "manage-players":
      case "add-first-player":
        // Navigate to characters section
        window.campaignManager?.showSection("characters");
        break;

      case "export-campaign":
        await this.exportCampaign();
        break;

      case "save-settings":
        await this.saveSettings();
        break;

      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  /**
   * Handle form submissions
   */
  async handleFormSubmission(formId, form) {
    try {
      const formData = this.forms.getFormData(formId);
      const errors = this.forms.validateFormData(formData);

      if (errors.length > 0) {
        this.ui.showError(`Validation errors: ${errors.join(", ")}`);
        return;
      }

      switch (formId) {
        case "edit-campaign-form":
          await this.updateCampaign(formData);
          break;

        case "quick-edit-form":
          await this.updateCampaign(formData);
          break;

        default:
          console.warn(`Unknown form: ${formId}`);
      }
    } catch (error) {
      console.error(`❌ Error handling form submission for ${formId}:`, error);
      this.ui.showError(`Failed to save: ${error.message}`);
    }
  }

  /**
   * Update campaign data
   */
  async updateCampaign(updates) {
    try {
      await this.core.updateCampaign(updates);
      this.forms.closeModal();
      this.ui.showSuccess("Campaign updated successfully!");

      // Refresh the workspace
      await this.refreshWorkspace();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Export campaign data
   */
  async exportCampaign() {
    try {
      const response = await fetch(`/api/export/${this.core.currentCampaignId}`);
      if (!response.ok) {
        throw new Error("Failed to export campaign data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `campaign-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      this.ui.showSuccess("Campaign data exported successfully!");
    } catch (error) {
      console.error("❌ Error exporting campaign:", error);
      this.ui.showError("Failed to export campaign data");
    }
  }

  /**
   * Save campaign settings
   */
  async saveSettings() {
    try {
      // Get settings from all forms
      const generalSettings =
        this.forms.getFormData("general-settings-form") || {};
      const gameplaySettings =
        this.forms.getFormData("gameplay-settings-form") || {};
      const aiSettings = this.forms.getFormData("ai-settings-form") || {};

      // Combine all settings
      const allSettings = {
        ...generalSettings,
        ...gameplaySettings,
        ...aiSettings,
      };

      // Update campaign metadata with settings
      const currentCampaign = this.core.getCampaignData();
      const updatedMetadata = {
        ...currentCampaign.metadata,
        settings: allSettings,
      };

      await this.core.updateCampaign({ metadata: updatedMetadata });

      this.forms.closeModal();
      this.ui.showSuccess("Settings saved successfully!");
    } catch (error) {
      console.error("❌ Error saving settings:", error);
      this.ui.showError("Failed to save settings");
    }
  }

  /**
   * Refresh the campaign workspace
   */
  async refreshWorkspace() {
    try {
      // Reload campaign data
      await this.core.loadCampaign();

      // Re-render the workspace
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.innerHTML = await this.renderCampaignWorkspace();
      }
    } catch (error) {
      console.error("❌ Error refreshing workspace:", error);
      this.ui.showError("Failed to refresh workspace");
    }
  }

  /**
   * Get campaign data for other components
   */
  getCampaignData() {
    return this.core?.getCampaignData();
  }

  /**
   * Update campaign title (for external use)
   */
  async updateCampaignTitle(newTitle) {
    if (!this.core) await this.init();
    return await this.core.updateCampaignTitle(newTitle);
  }

  /**
   * Render error state
   */
  renderErrorState(error) {
    return `
      <div class="campaign-workspace">
        <div class="campaign-workspace__header">
          <div class="campaign-workspace__title-section">
            <h2 class="campaign-workspace__title">
              <i class="fas fa-exclamation-triangle"></i>
              Campaign Loading Error
            </h2>
            <p class="campaign-workspace__subtitle">
              There was an error loading the campaign workspace
            </p>
          </div>
        </div>

        <div class="campaign-workspace__content">
          <div class="error-state">
            <div class="error-state__icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="error-state__content">
              <h3>Failed to Load Campaign</h3>
              <p>${error.message}</p>
              <button class="btn btn--primary" onclick="location.reload()">
                <i class="fas fa-refresh"></i>
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Remove event listeners if needed
    this.isInitialized = false;
    this.core = null;
    this.ui = null;
    this.forms = null;
  }
}

// Create and export singleton instance
export const campaignManager = new CampaignManager();
