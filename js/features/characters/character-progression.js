/**
 * CharacterProgression - Character progression tracking and timeline management
 * Handles progression tracking, campaign milestones, and character development
 */
export class CharacterProgression {
  constructor(characterCore) {
    this.characterCore = characterCore;
    this.characterProgression = {};
  }

  async init() {
    try {
      console.log("📈 CharacterProgression: Initializing...");

      // Load character progression data
      try {
        const progressionResponse = await fetch(`/api/characters/progression?campaign_id=${this.dataManager.currentCampaignId}`);
        if (progressionResponse.ok) {
          this.characterProgression = await progressionResponse.json();
          console.log("📈 Character progression data loaded successfully");
        } else {
          console.log("📝 Character progression endpoint returned error, using empty object");
          this.characterProgression = {};
        }
      } catch (error) {
        console.log("📝 Character progression endpoint error, using empty object");
        this.characterProgression = {};
      }

      console.log("✅ CharacterProgression: Initialized successfully");
    } catch (error) {
      console.error("❌ CharacterProgression: Initialization failed", error);
      throw error;
    }
  }

  /**
   * Render character progression view for a specific character
   */
  renderCharacterProgressionView(character) {
    return `
      <div class="character-progression-view">
        <div class="progression-header">
          <h4>${character.name}'s Character Development</h4>
          <button class="btn btn-primary" onclick="characterManager.showAddProgressionDialog('${
            character.id
          }')">
            <i class="fas fa-plus"></i> Add Progression
          </button>
        </div>
        
        ${this.renderCharacterTimeline(character)}
        
        <div class="progression-stats">
          <div class="stat-card">
            <div class="stat-value">${character.level || 1}</div>
            <div class="stat-label">Current Level</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${
              (character.progression || []).length
            }</div>
            <div class="stat-label">Milestones</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${
              Object.keys(character.relationships || {}).length
            }</div>
            <div class="stat-label">Relationships</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render character timeline with progression events
   */
  renderCharacterTimeline(character) {
    const progression = character.progression || [];

    if (progression.length === 0) {
      return `
        <div class="character-timeline">
          <div class="timeline-empty">
            <i class="fas fa-clock"></i>
            <p>No progression events recorded yet.</p>
            <small>Add progression milestones to track ${character.name}'s development.</small>
          </div>
        </div>
      `;
    }

    const timelineItems = progression
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((entry, index) => {
        return `
          <div class="timeline-item ${index === 0 ? "latest" : ""}">
            <div class="timeline-marker">
              <i class="fas ${this.getProgressionIcon(entry.type)}"></i>
            </div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="progression-type">${this.formatProgressionType(
                  entry.type
                )}</span>
                <span class="progression-date">${this.characterCore.formatDate(
                  entry.date
                )}</span>
              </div>
              <div class="progression-description">${entry.description}</div>
              ${
                entry.impact
                  ? `<div class="progression-impact"><strong>Impact:</strong> ${entry.impact}</div>`
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("");

    return `
      <div class="character-timeline">
        <h5>Character Timeline</h5>
        <div class="timeline">
          ${timelineItems}
        </div>
      </div>
    `;
  }

  /**
   * Render campaign progression view with all characters
   */
  renderCampaignProgressionView() {
    const allCharacters = this.characterCore.getAllCharacters();
    const stats = this.calculateProgressionStats();

    return `
      <div class="campaign-progression-view">
        <div class="progression-overview">
          <h3>Campaign Progression Overview</h3>
          <div class="progression-summary">
            <div class="summary-card">
              <div class="summary-value">${stats.totalProgressionEvents}</div>
              <div class="summary-label">Total Progression Events</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${stats.averageLevel.toFixed(1)}</div>
              <div class="summary-label">Average Party Level</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${stats.totalRelationships}</div>
              <div class="summary-label">Character Relationships</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${stats.activePlayers}</div>
              <div class="summary-label">Active Players</div>
            </div>
          </div>
        </div>

        ${this.renderCharacterProgressionTable()}
        ${this.renderCampaignMilestones()}
        ${this.renderRelationshipProgress()}
        ${this.renderCharacterInsights()}
      </div>
    `;
  }

  /**
   * Calculate progression statistics
   */
  calculateProgressionStats() {
    const playerCharacters = this.characterCore.playerCharacters;

    const totalProgressionEvents = playerCharacters.reduce((total, char) => {
      return total + (char.progression ? char.progression.length : 0);
    }, 0);

    const averageLevel =
      playerCharacters.length > 0
        ? playerCharacters.reduce(
            (total, char) => total + (char.level || 1),
            0
          ) / playerCharacters.length
        : 0;

    const totalRelationships = playerCharacters.reduce((total, char) => {
      return total + Object.keys(char.relationships || {}).length;
    }, 0);

    return {
      totalProgressionEvents,
      averageLevel,
      totalRelationships,
      activePlayers: playerCharacters.length,
    };
  }

  /**
   * Render character progression table
   */
  renderCharacterProgressionTable() {
    const playerCharacters = this.characterCore.playerCharacters;

    if (playerCharacters.length === 0) {
      return `
        <div class="progression-table-container">
          <h4>Character Progression</h4>
          <div class="no-characters">
            <i class="fas fa-users"></i>
            <p>No player characters found.</p>
          </div>
        </div>
      `;
    }

    const tableRows = playerCharacters
      .map((char) => this.renderCharacterProgressionRow(char))
      .join("");

    return `
      <div class="progression-table-container">
        <h4>Character Progression</h4>
        <div class="progression-table">
          <div class="table-header">
            <div class="header-cell">Character</div>
            <div class="header-cell">Level</div>
            <div class="header-cell">Class</div>
            <div class="header-cell">Progression Events</div>
            <div class="header-cell">Relationships</div>
            <div class="header-cell">Last Update</div>
          </div>
          <div class="table-body">
            ${tableRows}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render a single character progression row
   */
  renderCharacterProgressionRow(character) {
    const progression = character.progression || [];
    const relationships = Object.keys(character.relationships || {});
    const lastUpdate =
      progression.length > 0
        ? Math.max(...progression.map((p) => new Date(p.date).getTime()))
        : null;

    return `
      <div class="table-row" onclick="characterManager.showCharacterDetails('${
        character.id
      }')">
        <div class="table-cell">
          <div class="character-info">
            <strong>${character.name}</strong>
            <small>${character.background || "Unknown Background"}</small>
          </div>
        </div>
        <div class="table-cell">
          <span class="level-badge level-${character.level || 1}">${
      character.level || 1
    }</span>
        </div>
        <div class="table-cell">${character.class || "Unknown"}</div>
        <div class="table-cell">
          <span class="progression-count">${progression.length}</span>
          ${
            progression.length > 0
              ? `<small>events</small>`
              : `<small class="text-muted">none</small>`
          }
        </div>
        <div class="table-cell">
          <span class="relationship-count">${relationships.length}</span>
          ${
            relationships.length > 0
              ? `<small>connections</small>`
              : `<small class="text-muted">none</small>`
          }
        </div>
        <div class="table-cell">
          ${
            lastUpdate
              ? this.characterCore.formatDate(lastUpdate)
              : '<small class="text-muted">Never</small>'
          }
        </div>
      </div>
    `;
  }

  /**
   * Render campaign milestones
   */
  renderCampaignMilestones() {
    const milestones = this.getCampaignMilestones();

    return `
      <div class="campaign-milestones">
        <h4>Campaign Milestones</h4>
        <div class="milestones-grid">
          ${milestones
            .map(
              (milestone) => `
            <div class="milestone-card ${
              milestone.completed ? "completed" : "pending"
            }">
              <div class="milestone-icon">
                <i class="fas ${milestone.icon}"></i>
              </div>
              <div class="milestone-content">
                <h5>${milestone.title}</h5>
                <p>${milestone.description}</p>
                <div class="milestone-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${
                      milestone.progress
                    }%"></div>
                  </div>
                  <span class="progress-text">${milestone.progress}%</span>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  /**
   * Get campaign milestones
   */
  getCampaignMilestones() {
    // This would typically come from campaign data
    // For now, return some default milestones
    return [
      {
        title: "First Adventure",
        description: "Complete the party's first major quest together",
        icon: "fa-flag",
        progress: 100,
        completed: true,
      },
      {
        title: "Level 5 Reached",
        description: "All party members reach level 5",
        icon: "fa-star",
        progress: 100,
        completed: true,
      },
      {
        title: "Major Boss Defeated",
        description: "Defeat a significant campaign antagonist",
        icon: "fa-dragon",
        progress: 75,
        completed: false,
      },
      {
        title: "Character Bonds Formed",
        description: "Establish meaningful relationships between party members",
        icon: "fa-heart",
        progress: 60,
        completed: false,
      },
    ];
  }

  /**
   * Render relationship progress
   */
  renderRelationshipProgress() {
    return `
      <div class="relationship-progress">
        <h4>Relationship Development</h4>
        <p class="text-muted">Character relationship tracking would be displayed here.</p>
      </div>
    `;
  }

  /**
   * Render character insights
   */
  renderCharacterInsights() {
    return `
      <div class="character-insights">
        <h4>Character Development Insights</h4>
        <div class="insights-grid">
          <div class="insight-card">
            <i class="fas fa-chart-line"></i>
            <h5>Most Active Character</h5>
            <p>Character with the most progression events</p>
          </div>
          <div class="insight-card">
            <i class="fas fa-users"></i>
            <h5>Social Butterfly</h5>
            <p>Character with the most relationships</p>
          </div>
          <div class="insight-card">
            <i class="fas fa-clock"></i>
            <h5>Recent Development</h5>
            <p>Latest character progression activity</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get progression icon based on type
   */
  getProgressionIcon(type) {
    const icons = {
      "level-up": "fa-arrow-up",
      story: "fa-book",
      relationship: "fa-heart",
      skill: "fa-cogs",
      item: "fa-gem",
      achievement: "fa-trophy",
      default: "fa-star",
    };
    return icons[type] || icons.default;
  }

  /**
   * Format progression type for display
   */
  formatProgressionType(type) {
    const types = {
      "level-up": "Level Up",
      story: "Story Development",
      relationship: "Relationship Change",
      skill: "Skill Advancement",
      item: "Item Acquired",
      achievement: "Achievement Unlocked",
    };
    return types[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }
}
