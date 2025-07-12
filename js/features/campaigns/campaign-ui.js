/**
 * Campaign UI - UI rendering and interactions
 * Handles all campaign user interface elements and interactions
 */
export class CampaignUI {
  constructor(campaignCore, campaignForms) {
    this.core = campaignCore;
    this.forms = campaignForms;
  }

  /**
   * Render the main campaign workspace
   */
  async renderCampaignWorkspace() {
    const campaign = this.core.getCampaignData();
    const stats = await this.core.getCampaignStats();
    const events = await this.core.getRecentEvents();

    return `
      <div class="campaign-workspace">
        <div class="campaign-workspace__header">
          <div class="campaign-workspace__title-section">
            <h2 class="campaign-workspace__title">
              <i class="fas fa-dragon"></i>
              ${campaign?.name || "Campaign Management"}
            </h2>
            <p class="campaign-workspace__subtitle">
              Manage your campaign settings, view statistics, and track progress
            </p>
          </div>
          <div class="campaign-workspace__actions">
            <button class="btn btn--primary" data-action="edit-campaign">
              <i class="fas fa-edit"></i>
              Edit Campaign
            </button>
            <button class="btn btn--secondary" data-action="campaign-settings">
              <i class="fas fa-cog"></i>
              Settings
            </button>
          </div>
        </div>

        <div class="campaign-workspace__content">
          <div class="campaign-grid">
            ${this.renderCampaignInfo(campaign)}
            ${this.renderCampaignStats(stats)}
            ${this.renderRecentEvents(events)}
            ${this.renderPlayerStatus()}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render campaign information section
   */
  renderCampaignInfo(campaign) {
    if (!campaign) {
      return `
        <div class="campaign-section">
          <div class="campaign-section__header">
            <h3 class="campaign-section__title">
              <i class="fas fa-scroll"></i>
              Campaign Information
            </h3>
          </div>
          <div class="campaign-section__content">
            <div class="campaign-info--loading">
              <i class="fas fa-spinner fa-spin"></i>
              Loading campaign information...
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="campaign-section">
        <div class="campaign-section__header">
          <h3 class="campaign-section__title">
            <i class="fas fa-scroll"></i>
            Campaign Information
          </h3>
          <button class="btn btn--sm btn--ghost" data-action="edit-campaign-info">
            <i class="fas fa-edit"></i>
            Edit
          </button>
        </div>
        <div class="campaign-section__content">
          <div class="campaign-info">
            <div class="campaign-info__item">
              <label class="campaign-info__label">Campaign Name:</label>
              <div class="campaign-info__value">${campaign.name}</div>
            </div>
            <div class="campaign-info__item">
              <label class="campaign-info__label">Setting:</label>
              <div class="campaign-info__value">${
                campaign.setting || "Not specified"
              }</div>
            </div>
            <div class="campaign-info__item">
              <label class="campaign-info__label">Current Location:</label>
              <div class="campaign-info__value">${
                campaign.current_location || "Not specified"
              }</div>
            </div>
            <div class="campaign-info__item">
              <label class="campaign-info__label">Current Session:</label>
              <div class="campaign-info__value">Session ${
                campaign.current_session || 1
              }</div>
            </div>
            <div class="campaign-info__item">
              <label class="campaign-info__label">Status:</label>
              <div class="campaign-info__value">
                <span class="status-badge status-badge--${
                  campaign.status || "active"
                }">
                  <i class="fas ${this.getStatusIcon(campaign.status)}"></i>
                  ${this.getStatusLabel(campaign.status)}
                </span>
              </div>
            </div>
            ${
              campaign.description
                ? `
              <div class="campaign-info__item campaign-info__item--full">
                <label class="campaign-info__label">Description:</label>
                <div class="campaign-info__value campaign-info__description">
                  ${campaign.description}
                </div>
              </div>
            `
                : ""
            }
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render campaign statistics section
   */
  renderCampaignStats(stats) {
    return `
      <div class="campaign-section">
        <div class="campaign-section__header">
          <h3 class="campaign-section__title">
            <i class="fas fa-chart-bar"></i>
            Campaign Statistics
          </h3>
        </div>
        <div class="campaign-section__content">
          <div class="campaign-stats">
            <div class="stat-card">
              <div class="stat-card__icon">
                <i class="fas fa-calendar-alt"></i>
              </div>
              <div class="stat-card__content">
                <div class="stat-card__value">${stats.sessions}</div>
                <div class="stat-card__label">Sessions</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card__icon">
                <i class="fas fa-map-marker-alt"></i>
              </div>
              <div class="stat-card__content">
                <div class="stat-card__value">${stats.locations}</div>
                <div class="stat-card__label">Locations</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card__icon">
                <i class="fas fa-theater-masks"></i>
              </div>
              <div class="stat-card__content">
                <div class="stat-card__value">${stats.scenes}</div>
                <div class="stat-card__label">Scenes</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card__icon">
                <i class="fas fa-users"></i>
              </div>
              <div class="stat-card__content">
                <div class="stat-card__value">${stats.players}</div>
                <div class="stat-card__label">Players</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card__icon">
                <i class="fas fa-user-friends"></i>
              </div>
              <div class="stat-card__content">
                <div class="stat-card__value">${stats.characters}</div>
                <div class="stat-card__label">Characters</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card__icon">
                <i class="fas fa-scroll"></i>
              </div>
              <div class="stat-card__content">
                <div class="stat-card__value">${stats.quests}</div>
                <div class="stat-card__label">Quests</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card__icon">
                <i class="fas fa-sticky-note"></i>
              </div>
              <div class="stat-card__content">
                <div class="stat-card__value">${stats.notes}</div>
                <div class="stat-card__label">Notes</div>
              </div>
            </div>
            <div class="stat-card stat-card--featured">
              <div class="stat-card__icon">
                <i class="fas fa-database"></i>
              </div>
              <div class="stat-card__content">
                <div class="stat-card__value">${stats.total}</div>
                <div class="stat-card__label">Total Items</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render recent campaign events section
   */
  renderRecentEvents(events) {
    return `
      <div class="campaign-section campaign-section--full-width">
        <div class="campaign-section__header">
          <h3 class="campaign-section__title">
            <i class="fas fa-history"></i>
            Recent Campaign Events
          </h3>
        </div>
        <div class="campaign-section__content">
          <div class="campaign-events">
            ${
              events.length > 0
                ? events
                    .map(
                      (event) => `
              <div class="campaign-event">
                <div class="campaign-event__session">Session ${event.session_number}</div>
                <div class="campaign-event__content">
                  <h4 class="campaign-event__title">${event.title}</h4>
                  <p class="campaign-event__description">${event.description}</p>
                </div>
              </div>
            `
                    )
                    .join("")
                : `
              <div class="campaign-events--empty">
                <i class="fas fa-calendar-times"></i>
                <p>No recent events recorded</p>
              </div>
            `
            }
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render player status section
   */
  renderPlayerStatus() {
    return `
      <div class="campaign-section campaign-section--full-width">
        <div class="campaign-section__header">
          <h3 class="campaign-section__title">
            <i class="fas fa-users"></i>
            Player Characters
          </h3>
          <button class="btn btn--sm btn--ghost" data-action="manage-players">
            <i class="fas fa-user-plus"></i>
            Manage Players
          </button>
        </div>
        <div class="campaign-section__content">
          <div class="player-status-grid" id="campaign-player-status">
            <div class="player-status--loading">
              <i class="fas fa-spinner fa-spin"></i>
              Loading player information...
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update player status section with actual data
   */
  async updatePlayerStatus() {
    try {
      const response = await fetch("/api/players");
      const players = await response.json();

      const container = document.getElementById("campaign-player-status");
      if (!container) return;

      if (players.length === 0) {
        container.innerHTML = `
          <div class="player-status--empty">
            <i class="fas fa-user-slash"></i>
            <p>No players in this campaign</p>
            <button class="btn btn--primary" data-action="add-first-player">
              <i class="fas fa-user-plus"></i>
              Add First Player
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = players
        .map(
          (player) => `
        <div class="player-card">
          <div class="player-card__avatar">
            ${player.icon || "👤"}
          </div>
          <div class="player-card__info">
            <h4 class="player-card__name">${player.name}</h4>
            <div class="player-card__details">
              <span class="player-card__class">${
                player.class || "Unknown Class"
              }</span>
              <span class="player-card__level">Level ${player.level || 1}</span>
            </div>
            <div class="player-card__race">${
              player.race || "Unknown Race"
            }</div>
          </div>
          <div class="player-card__status">
            <span class="status-badge status-badge--${
              player.status || "active"
            }">
              ${player.status || "Active"}
            </span>
          </div>
        </div>
      `
        )
        .join("");
    } catch (error) {
      console.error("Error updating player status:", error);
      const container = document.getElementById("campaign-player-status");
      if (container) {
        container.innerHTML = `
          <div class="player-status--error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Failed to load player information</p>
          </div>
        `;
      }
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showNotification(message, "success");
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showNotification(message, "error");
  }

  /**
   * Show notification
   */
  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
      <div class="notification__content">
        <i class="fas ${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
      </div>
      <button class="notification__close">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);

    // Handle close button
    notification
      .querySelector(".notification__close")
      .addEventListener("click", () => {
        notification.remove();
      });
  }

  /**
   * Get status icon for campaign status
   */
  getStatusIcon(status) {
    const icons = {
      active: "fa-play",
      paused: "fa-pause",
      completed: "fa-check",
      archived: "fa-archive",
    };
    return icons[status] || "fa-play";
  }

  /**
   * Get status label for campaign status
   */
  getStatusLabel(status) {
    const labels = {
      active: "Active",
      paused: "Paused",
      completed: "Completed",
      archived: "Archived",
    };
    return labels[status] || "Active";
  }

  /**
   * Get notification icon for type
   */
  getNotificationIcon(type) {
    const icons = {
      success: "fa-check-circle",
      error: "fa-exclamation-circle",
      warning: "fa-exclamation-triangle",
      info: "fa-info-circle",
    };
    return icons[type] || "fa-info-circle";
  }
}
