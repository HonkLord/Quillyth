/**
 * Campaign Core - Data management and CRUD operations
 * Handles all campaign data operations and API communication
 */
import { DataManager } from "../../data-manager.js";

export class CampaignCore {
  constructor() {
    this.apiBase = "/api";
    this.dataManager = new DataManager();
    this.currentCampaignId = null;
    this.campaignData = null;
  }

  /**
   * Initialize the campaign core
   */
  async init() {
    console.log("🏗️ CampaignCore: Initializing...");
    try {
      await this.dataManager.loadCurrentCampaign();
      this.currentCampaignId = this.dataManager.currentCampaignId;
      await this.loadCampaign();
      console.log("✅ CampaignCore: Initialized successfully");
    } catch (error) {
      console.error("❌ CampaignCore: Failed to initialize:", error);
      throw error;
    }
  }

  /**
   * Load current campaign data
   */
  async loadCampaign() {
    try {
      const response = await fetch(
        `${this.apiBase}/campaigns/${this.currentCampaignId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Campaign doesn't exist, create default
          console.log("📝 Campaign not found, creating default...");
          return await this.createDefaultCampaign();
        }
        throw new Error(`Failed to load campaign: ${response.status}`);
      }

      this.campaignData = await response.json();
      console.log("✅ Campaign loaded:", this.campaignData);
      return this.campaignData;
    } catch (error) {
      console.error("❌ Error loading campaign:", error);
      throw error;
    }
  }

  /**
   * Create default campaign if none exists
   */
  async createDefaultCampaign() {
    const defaultCampaign = {
      id: this.currentCampaignId,
      name: "Campaign 4 - The Old Cistern",
      description:
        "An epic D&D adventure exploring the mysteries beneath Duskhaven",
      setting: "Eryndral continent, Cymrath Dominion",
      current_session: 10,
      current_location: "The Hollow beneath Duskhaven",
      dm_name: "Dungeon Master",
      status: "active",
      metadata: {
        theme: "mystery",
        tone: "dark_fantasy",
        player_count: 4,
        session_length: 240,
      },
    };

    return await this.createCampaign(defaultCampaign);
  }

  /**
   * Create a new campaign
   */
  async createCampaign(campaignData) {
    try {
      const response = await fetch(`${this.apiBase}/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create campaign");
      }

      this.campaignData = await response.json();
      console.log("✅ Campaign created:", this.campaignData);
      return this.campaignData;
    } catch (error) {
      console.error("❌ Error creating campaign:", error);
      throw error;
    }
  }

  /**
   * Update campaign data
   */
  async updateCampaign(updates) {
    try {
      const response = await fetch(
        `${this.apiBase}/campaigns/${this.currentCampaignId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update campaign");
      }

      this.campaignData = await response.json();
      console.log("✅ Campaign updated:", this.campaignData);
      return this.campaignData;
    } catch (error) {
      console.error("❌ Error updating campaign:", error);
      throw error;
    }
  }

  /**
   * Get current campaign data
   */
  getCampaignData() {
    return this.campaignData;
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats() {
    try {
      const [sessions, locations, scenes, players, characters, quests, notes] =
        await Promise.all([
          fetch(
            `${this.apiBase}/sessions?campaign_id=${this.currentCampaignId}`
          ).then((r) => r.json()),
          fetch(
            `${this.apiBase}/locations?campaign_id=${this.currentCampaignId}`
          ).then((r) => r.json()),
          fetch(
            `${this.apiBase}/scenes?campaign_id=${this.currentCampaignId}`
          ).then((r) => r.json()),
          fetch(
            `${this.apiBase}/players?campaign_id=${this.currentCampaignId}`
          ).then((r) => r.json()),
          fetch(
            `${this.apiBase}/characters?campaign_id=${this.currentCampaignId}`
          ).then((r) => r.json()),
          fetch(
            `${this.apiBase}/quests?campaign_id=${this.currentCampaignId}`
          ).then((r) => r.json()),
          fetch(
            `${this.apiBase}/notes?campaign_id=${this.currentCampaignId}`
          ).then((r) => r.json()),
        ]);

      return {
        sessions: sessions.length || 0,
        locations: locations.length || 0,
        scenes: scenes.length || 0,
        players: players.length || 0,
        characters: characters.length || 0,
        quests: quests.length || 0,
        notes: notes.length || 0,
        total:
          (sessions.length || 0) +
          (locations.length || 0) +
          (scenes.length || 0) +
          (players.length || 0) +
          (characters.length || 0) +
          (quests.length || 0) +
          (notes.length || 0),
      };
    } catch (error) {
      console.error("❌ Error loading campaign stats:", error);
      // Return default stats if API fails
      return {
        sessions: 10,
        locations: 22,
        scenes: 8,
        players: 4,
        characters: 7,
        quests: 5,
        notes: 12,
        total: 68,
      };
    }
  }

  /**
   * Get recent campaign events
   */
  async getRecentEvents() {
    try {
      const response = await fetch(
        `${this.apiBase}/campaigns/${this.currentCampaignId}/events?limit=5`
      );

      if (!response.ok) {
        throw new Error("Failed to load campaign events");
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Error loading campaign events:", error);
      // Return default events if API fails
      return [
        {
          session_number: 9,
          title: "Kaelen's Revelation",
          description:
            "The party discovered Kaelen's true identity and his connection to the Inquisitors.",
        },
        {
          session_number: 8,
          title: "Ancient Mechanisms",
          description:
            "Successfully activated the ancient water purification system in the Old Cistern.",
        },
        {
          session_number: 7,
          title: "The Old Cistern",
          description:
            "First exploration of the massive underground cistern and its guardian creatures.",
        },
        {
          session_number: 6,
          title: "Trickle's Bond",
          description:
            "Vandarith formed a spiritual connection with Trickle, the water sprite.",
        },
        {
          session_number: 5,
          title: "Bridge Collapse",
          description:
            "Dramatic battle with giant centipedes after the bridge collapse in The Hollow.",
        },
      ];
    }
  }

  /**
   * Update campaign title (for quick edit)
   */
  async updateCampaignTitle(newTitle) {
    return await this.updateCampaign({ name: newTitle });
  }

  /**
   * Update current session
   */
  async updateCurrentSession(sessionNumber) {
    return await this.updateCampaign({ current_session: sessionNumber });
  }

  /**
   * Update current location
   */
  async updateCurrentLocation(location) {
    return await this.updateCampaign({ current_location: location });
  }

  /**
   * Validate campaign data
   */
  validateCampaignData(data) {
    const errors = [];

    if (!data.name || data.name.trim() === "") {
      errors.push("Campaign name is required");
    }

    if (
      data.current_session &&
      (isNaN(data.current_session) || data.current_session < 1)
    ) {
      errors.push("Current session must be a positive number");
    }

    if (
      data.status &&
      !["active", "paused", "completed", "archived"].includes(data.status)
    ) {
      errors.push("Invalid campaign status");
    }

    return errors;
  }

  /**
   * Get campaign status options
   */
  getStatusOptions() {
    return [
      { value: "active", label: "Active", icon: "fa-play", color: "success" },
      { value: "paused", label: "Paused", icon: "fa-pause", color: "warning" },
      {
        value: "completed",
        label: "Completed",
        icon: "fa-check",
        color: "info",
      },
      {
        value: "archived",
        label: "Archived",
        icon: "fa-archive",
        color: "secondary",
      },
    ];
  }
}
