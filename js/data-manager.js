// Data Manager - Handles API communication with SQLite backend

export class DataManager {
  constructor() {
    this.campaign = {};
    this.players = [];
    this.locations = [];
    this.currentCampaignId = null;
    this.apiBase = "/api";
  }

  // ==========================================
  // CORE DATA LOADING
  // ==========================================

  async loadCurrentCampaign() {
    try {
      console.log("🔄 Loading current campaign from API...");
      const response = await fetch(`${this.apiBase}/campaigns/current`);

      if (!response.ok) {
        throw new Error(
          `Failed to load current campaign: ${response.status} ${response.statusText}`
        );
      }

      const campaign = await response.json();
      console.log("✅ Current campaign loaded successfully:", campaign);
      this.currentCampaignId = campaign.id;
      this.campaign = campaign;
      return campaign;
    } catch (error) {
      console.error("❌ Error loading current campaign:", error);
      throw error;
    }
  }

  async loadCampaign() {
    if (!this.currentCampaignId) {
      await this.loadCurrentCampaign();
    }
    try {
      console.log("🔄 Loading campaign from API...");
      const response = await fetch(
        `${this.apiBase}/campaigns/${this.currentCampaignId}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load campaign: ${response.status} ${response.statusText}`
        );
      }

      const campaign = await response.json();
      console.log("✅ Campaign loaded successfully:", campaign);
      this.campaign = campaign;
      return campaign;
    } catch (error) {
      console.error("❌ Error loading campaign:", error);
      throw error;
    }
  }

  async loadPlayers() {
    if (!this.currentCampaignId) {
      await this.loadCurrentCampaign();
    }
    try {
      console.log("🔄 Loading players from API...");
      const response = await fetch(
        `${this.apiBase}/players?campaign_id=${this.currentCampaignId}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load players: ${response.status} ${response.statusText}`
        );
      }

      const players = await response.json();
      console.log("✅ Players loaded successfully:", players);
      this.players = players;
      return players;
    } catch (error) {
      console.error("❌ Error loading players:", error);
      throw error;
    }
  }

  async loadLocations() {
    if (!this.currentCampaignId) {
      await this.loadCurrentCampaign();
    }
    try {
      console.log("🔄 Loading locations from API...");
      const response = await fetch(
        `${this.apiBase}/locations?campaign_id=${this.currentCampaignId}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load locations: ${response.status} ${response.statusText}`
        );
      }

      const locations = await response.json();
      console.log("✅ Locations loaded successfully:", locations);
      this.locations = locations;
      return locations;
    } catch (error) {
      console.error("❌ Error loading locations:", error);
      throw error;
    }
  }

  async loadStats() {
    if (!this.currentCampaignId) {
      await this.loadCurrentCampaign();
    }
    try {
      const response = await fetch(
        `${this.apiBase}/stats?campaign_id=${this.currentCampaignId}`
      );
      if (!response.ok) {
        throw new Error(`Failed to load stats: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("❌ Error loading stats:", error);
      return { locations: 0, players: 0, opportunities: 0, lore_entries: 0 };
    }
  }

  // ==========================================
  // LOCATION MANAGEMENT
  // ==========================================

  async getLocation(locationId) {
    try {
      const response = await fetch(`${this.apiBase}/locations/${locationId}`);
      if (!response.ok) {
        throw new Error(`Failed to load location: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ Error loading location ${locationId}:`, error);
      return null;
    }
  }

  async createLocation(locationData) {
    if (!this.currentCampaignId) {
      await this.loadCurrentCampaign();
    }
    try {
      const response = await fetch(`${this.apiBase}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: this.currentCampaignId,
          ...locationData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create location: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Location created:", result);
      return result;
    } catch (error) {
      console.error("❌ Error creating location:", error);
      throw error;
    }
  }

  async updateLocation(locationId, locationData) {
    try {
      const response = await fetch(`${this.apiBase}/locations/${locationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update location: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Location updated:", result);
      return result;
    } catch (error) {
      console.error("❌ Error updating location:", error);
      throw error;
    }
  }

  // ==========================================
  // LOCATION LORE MANAGEMENT
  // ==========================================

  async getLocationLore(locationId) {
    try {
      const response = await fetch(
        `${this.apiBase}/locations/${locationId}/lore`
      );
      if (!response.ok) {
        throw new Error(`Failed to load lore: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ Error loading lore for ${locationId}:`, error);
      return [];
    }
  }

  async createLore(locationId, loreData) {
    try {
      const response = await fetch(
        `${this.apiBase}/locations/${locationId}/lore`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loreData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create lore: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Lore created:", result);
      return result;
    } catch (error) {
      console.error("❌ Error creating lore:", error);
      throw error;
    }
  }

  async updateLore(loreId, loreData) {
    try {
      const response = await fetch(`${this.apiBase}/lore/${loreId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loreData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update lore: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Lore updated:", result);
      return result;
    } catch (error) {
      console.error("❌ Error updating lore:", error);
      throw error;
    }
  }

  async deleteLore(loreId) {
    try {
      const response = await fetch(`${this.apiBase}/lore/${loreId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete lore: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Lore deleted:", result);
      return result;
    } catch (error) {
      console.error("❌ Error deleting lore:", error);
      throw error;
    }
  }

  // ==========================================
  // PLAYER MANAGEMENT
  // ==========================================

  async getPlayer(playerId) {
    try {
      const response = await fetch(`${this.apiBase}/players/${playerId}`);
      if (!response.ok) {
        throw new Error(`Failed to load player: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ Error loading player ${playerId}:`, error);
      return null;
    }
  }

  async createPlayer(playerData) {
    if (!this.currentCampaignId) {
      await this.loadCurrentCampaign();
    }
    try {
      const response = await fetch(`${this.apiBase}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: this.currentCampaignId,
          ...playerData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create player: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Player created:", result);
      return result;
    } catch (error) {
      console.error("❌ Error creating player:", error);
      throw error;
    }
  }

  async updatePlayer(playerId, playerData) {
    try {
      const response = await fetch(`${this.apiBase}/players/${playerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playerData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update player: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Player updated:", result);
      return result;
    } catch (error) {
      console.error("❌ Error updating player:", error);
      throw error;
    }
  }

  async deletePlayer(playerId) {
    try {
      const response = await fetch(`${this.apiBase}/players/${playerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete player: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Player deleted:", result);
      return result;
    } catch (error) {
      console.error("❌ Error deleting player:", error);
      throw error;
    }
  }

  // ==========================================
  // PLAYER BACKGROUNDS MANAGEMENT
  // ==========================================

  async getPlayerBackgrounds(playerId) {
    try {
      const response = await fetch(
        `${this.apiBase}/players/${playerId}/backgrounds`
      );
      if (!response.ok) {
        throw new Error(`Failed to load backgrounds: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ Error loading backgrounds for ${playerId}:`, error);
      return [];
    }
  }

  async createBackground(playerId, backgroundData) {
    try {
      const response = await fetch(
        `${this.apiBase}/players/${playerId}/backgrounds`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(backgroundData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create background: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Background created:", result);
      return result;
    } catch (error) {
      console.error("❌ Error creating background:", error);
      throw error;
    }
  }

  async updateBackground(backgroundId, backgroundData) {
    try {
      const response = await fetch(
        `${this.apiBase}/backgrounds/${backgroundId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(backgroundData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update background: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Background updated:", result);
      return result;
    } catch (error) {
      console.error("❌ Error updating background:", error);
      throw error;
    }
  }

  async deleteBackground(backgroundId) {
    try {
      const response = await fetch(
        `${this.apiBase}/backgrounds/${backgroundId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete background: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Background deleted:", result);
      return result;
    } catch (error) {
      console.error("❌ Error deleting background:", error);
      throw error;
    }
  }

  // ==========================================
  // OPPORTUNITIES MANAGEMENT
  // ==========================================

  async getLocationOpportunities(locationId) {
    try {
      const response = await fetch(
        `${this.apiBase}/locations/${locationId}/opportunities`
      );
      if (!response.ok) {
        throw new Error(`Failed to load opportunities: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ Error loading opportunities for ${locationId}:`, error);
      return [];
    }
  }

  async createOpportunity(locationId, opportunityData) {
    try {
      const response = await fetch(
        `${this.apiBase}/locations/${locationId}/opportunities`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(opportunityData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create opportunity: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Opportunity created:", result);
      return result;
    } catch (error) {
      console.error("❌ Error creating opportunity:", error);
      throw error;
    }
  }

  // ==========================================
  // LEGACY METHODS (for backward compatibility)
  // ==========================================

  // User data management (localStorage) - keeping for user preferences
  saveUserData(key, data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(`campaign-manager-${key}`, serialized);
      console.log(`💾 Saved user data: ${key}`);
      return true;
    } catch (error) {
      console.error("❌ Error saving user data:", error);
      return false;
    }
  }

  loadUserData(key) {
    try {
      const serialized = localStorage.getItem(`campaign-manager-${key}`);
      if (serialized) {
        const data = JSON.parse(serialized);
        console.log(`📖 Loaded user data: ${key}`);
        return data;
      }
      return null;
    } catch (error) {
      console.error("❌ Error loading user data:", error);
      return null;
    }
  }

  // Export campaign data for backup
  async exportCampaignData() {
    try {
      const [campaign, players, locations, stats] = await Promise.all([
        this.loadCampaign(),
        this.loadPlayers(),
        this.loadLocations(),
        this.loadStats(),
      ]);

      const exportData = {
        campaign,
        players,
        locations,
        stats,
        timestamp: new Date().toISOString(),
        version: "2.0",
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `campaign-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("✅ Campaign data exported successfully");
    } catch (error) {
      console.error("❌ Error exporting campaign data:", error);
    }
  }
}