/**
 * CharacterRelationships - Character relationship matrix and management
 * Handles relationship tracking, social dynamics, and character connections
 */
export class CharacterRelationships {
  constructor(characterCore) {
    this.characterCore = characterCore;
    this.relationshipMatrix = {};
  }

  async init() {
    try {
      console.log("🤝 CharacterRelationships: Initializing...");

      // Wait for character core to be fully initialized
      let attempts = 0;
      while (!this.characterCore.isInitialized && attempts < 10) {
        console.log("⏳ Waiting for CharacterCore to initialize...");
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!this.characterCore.isInitialized) {
        console.warn("⚠️ CharacterCore not initialized, proceeding anyway");
      }

      // Load relationship data
      await this.loadRelationshipData();

      console.log("✅ CharacterRelationships: Initialized successfully");
    } catch (error) {
      console.error("❌ CharacterRelationships: Initialization failed", error);
      throw error;
    }
  }

  async loadRelationshipData() {
    try {
      const response = await fetch("/api/character-relationships");
      if (response.ok) {
        this.relationshipMatrix = await response.json();
        // Save to localStorage for offline use
        localStorage.setItem('character-relationships', JSON.stringify(this.relationshipMatrix));
      } else {
        console.log(
          "📝 Character relationships endpoint not available, using localStorage"
        );
        // Try to load from localStorage
        const stored = localStorage.getItem('character-relationships');
        this.relationshipMatrix = stored ? JSON.parse(stored) : {};
      }
    } catch (error) {
      console.log(
        "📝 Character relationships endpoint not available, using localStorage"
      );
      // Try to load from localStorage
      const stored = localStorage.getItem('character-relationships');
      this.relationshipMatrix = stored ? JSON.parse(stored) : {};
    }

    // Apply loaded relationships to characters
    this.applyRelationshipsToCharacters();
  }

  /**
   * Apply loaded relationship data to character objects
   */
  applyRelationshipsToCharacters() {
    if (!this.relationshipMatrix || Object.keys(this.relationshipMatrix).length === 0) {
      return;
    }

    const allCharacters = this.characterCore.getAllCharacters();
    
    allCharacters.forEach(character => {
      if (this.relationshipMatrix[character.id]) {
        character.relationships = {
          ...character.relationships,
          ...this.relationshipMatrix[character.id]
        };
      }
    });

    console.log('✅ Applied stored relationships to characters');
  }

  /**
   * Render character relationships for a specific character
   */
  renderCharacterRelationships(character) {
    const allCharacters = this.characterCore.getAllCharacters();
    const otherCharacters = allCharacters.filter(char => char.id !== character.id);
    const relationships = character.relationships || {};

    if (otherCharacters.length === 0) {
      return `
        <div class="character-relationships">
          <div class="relationships-empty">
            <i class="fas fa-users"></i>
            <p>No other characters available for relationships.</p>
            <small>Add more characters to track relationships.</small>
          </div>
        </div>
      `;
    }

    const characterCards = otherCharacters
      .map(targetChar => this.renderCharacterRelationshipCard(character, targetChar, relationships[targetChar.id]))
      .join("");

    return `
      <div class="character-relationships">
        <div class="relationships-header">
          <div class="relationships-header-left">
            <h5>${character.name}'s Relationships</h5>
          </div>
          <div class="relationships-filters">
            <select class="filter-select" data-filter="character-type" onchange="characterManager.filterRelationships()">
              <option value="all">All Characters</option>
              <option value="pc">Player Characters</option>
              <option value="npc">NPCs</option>
            </select>
            <select class="filter-select" data-filter="relationship-type" onchange="characterManager.filterRelationships()">
              <option value="all">All Relationships</option>
              <option value="none">No Relationship</option>
              <option value="friend">Friends</option>
              <option value="ally">Allies</option>
              <option value="rival">Rivals</option>
              <option value="enemy">Enemies</option>
              <option value="family">Family</option>
              <option value="romantic">Romantic</option>
              <option value="mentor">Mentors</option>
              <option value="student">Students</option>
            </select>
          </div>
        </div>
        <div class="relationships-grid workspace-cards-grid">
          ${characterCards}
        </div>
      </div>
    `;
  }

  /**
   * Render a character relationship card for the character-specific view
   */
  renderCharacterRelationshipCard(fromCharacter, targetCharacter, relationship) {
    try {
      const hasRelationship = !!relationship;
      const relationshipType = relationship?.type || "neutral";
      const relationshipDescription = relationship?.description || "";
      
      const charTypeClass = this.getCharacterTypeClass(targetCharacter);
      const isPC = targetCharacter.type === "pc" || targetCharacter.isPlayerCharacter || targetCharacter.player_character;
      
      return `
        <div class="card card-character clickable ${charTypeClass}" 
             data-character-id="${targetCharacter.id}"
             data-from-character-id="${fromCharacter.id}"
             data-to-character-id="${targetCharacter.id}">
          <div class="card-header">
            <div class="character-avatar">
              ${targetCharacter.name.charAt(0).toUpperCase()}
            </div>
            <div class="card-title-info">
              <h4 class="card-title">${targetCharacter.name}</h4>
              <div class="card-meta">
                ${isPC ? `
                  <span class="card-class-level">${targetCharacter.class || "Unknown"} ${targetCharacter.level || 1}</span>
                ` : `
                  <span class="card-role-location">${targetCharacter.role || "NPC"}${targetCharacter.location ? ` • ${targetCharacter.location}` : ""}</span>
                `}
              </div>
            </div>
            <div class="card-actions">
              ${hasRelationship ? `
                <select class="relationship-type-select btn btn-xs" 
                        data-from-character-id="${fromCharacter.id}"
                        data-to-character-id="${targetCharacter.id}"
                        onchange="characterManager.updateRelationshipType(this)"
                        onclick="event.stopPropagation()">
                  <option value="neutral" ${relationshipType === "neutral" ? "selected" : ""}>Neutral</option>
                  <option value="friend" ${relationshipType === "friend" ? "selected" : ""}>Friend</option>
                  <option value="ally" ${relationshipType === "ally" ? "selected" : ""}>Ally</option>
                  <option value="rival" ${relationshipType === "rival" ? "selected" : ""}>Rival</option>
                  <option value="enemy" ${relationshipType === "enemy" ? "selected" : ""}>Enemy</option>
                  <option value="family" ${relationshipType === "family" ? "selected" : ""}>Family</option>
                  <option value="romantic" ${relationshipType === "romantic" ? "selected" : ""}>Romantic</option>
                  <option value="mentor" ${relationshipType === "mentor" ? "selected" : ""}>Mentor</option>
                  <option value="student" ${relationshipType === "student" ? "selected" : ""}>Student</option>
                </select>
                <button class="btn btn-xs btn-outline-danger" 
                        data-action="delete-relationship"
                        data-from-character-id="${fromCharacter.id}"
                        data-to-character-id="${targetCharacter.id}"
                        title="Delete Relationship">
                  <i class="fas fa-trash"></i>
                </button>
              ` : `
                <button class="btn btn-xs btn-primary" 
                        data-action="add-relationship"
                        data-from-character-id="${fromCharacter.id}"
                        data-to-character-id="${targetCharacter.id}"
                        onclick="event.stopPropagation()"
                        title="Add Relationship">
                  <i class="fas fa-plus"></i>
                </button>
              `}
            </div>
          </div>
          <div class="card-body">
            ${hasRelationship && relationshipDescription ? `
              <p class="card-description">${relationshipDescription}</p>
            ` : hasRelationship ? `
              <p class="card-description text-muted">No description provided.</p>
            ` : `
              <p class="card-description text-muted">Click to add relationship</p>
            `}
          </div>
        </div>
      `;
    } catch (error) {
      console.error("❌ Error rendering relationship card:", error);
      return `<div class="card card-character">Error: ${error.message}</div>`;
    }
  }

  /**
   * Render the relationships matrix view
   */
  renderRelationshipsMatrixView() {
    console.log("🎭 RenderRelationshipsMatrixView: Starting enhanced matrix render");
    
    // Check if characters are still loading
    if (!this.characterCore.isInitialized) {
      console.log("⏳ CharacterCore not initialized, showing loading state");
      return this.renderLoadingState();
    }

    const allCharacters = this.characterCore.getAllCharacters();
    console.log(`📊 Matrix: Rendering with ${allCharacters.length} characters`);
    console.log("📊 Character types:", allCharacters.map(c => `${c.name}:${c.type}`));

    if (allCharacters.length === 0) {
      return this.renderNoCharactersMessage();
    }

    const totalRelationships = this.getTotalRelationships();
    const strongBonds = this.getStrongestBonds().length;
    const conflicts = this.getConflicts().length;

    return `
      <div class="relationships-workspace">
        <!-- Summary Stats at Top -->
        <div class="relationships-summary">
          <div class="summary-header">
            <h3><i class="fas fa-project-diagram"></i> Character Relationships</h3>
            <button class="btn btn-primary" 
                    data-action="add-relationship">
              <i class="fas fa-plus"></i> Add Relationship
            </button>
          </div>
          <div class="summary-stats">
            <div class="stat-card">
              <div class="stat-value">${totalRelationships}</div>
              <div class="stat-label">Total Relationships</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${strongBonds}</div>
              <div class="stat-label">Strong Bonds</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${conflicts}</div>
              <div class="stat-label">Conflicts</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${allCharacters.length}</div>
              <div class="stat-label">Total Characters</div>
            </div>
          </div>
        </div>

        <!-- Attitude Matrix -->
        <div class="matrix-container">
          ${this.renderRelationshipMatrix(allCharacters)}
        </div>
      </div>
    `;
  }

  /**
   * Render loading state message
   */
  renderLoadingState() {
    return `
      <div class="relationships-workspace">
        <div class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <h3>Loading Characters...</h3>
          <p>Please wait while character data is being loaded.</p>
        </div>
      </div>
    `;
  }

  /**
   * Render no characters message
   */
  renderNoCharactersMessage() {
    return `
      <div class="relationships-workspace">
        <div class="no-characters-message">
          <i class="fas fa-users"></i>
          <h3>No Characters Available</h3>
          <p>Add some characters first to start tracking relationships.</p>
          <div class="message-actions">
            <button class="btn btn-primary" onclick="characterManager.showAddCharacterDialog()">
              <i class="fas fa-plus"></i> Add Character
            </button>
            <button class="btn btn-secondary" onclick="characterManager.relationships.refreshRelationships()">
              <i class="fas fa-refresh"></i> Refresh
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Refresh relationships data and re-render
   */
  async refreshRelationships() {
    try {
      console.log("🔄 Refreshing relationships...");
      await this.loadRelationshipData();
      
      // Re-render the current view if we're on the relationships tab
      const centerPanel = document.getElementById("character-detail-content");
      if (centerPanel) {
        centerPanel.innerHTML = this.renderRelationshipsMatrixView();
        // Re-setup event listeners if needed
        const characterUI = window.characterManager?.ui;
        if (characterUI && typeof characterUI.setupRelationshipsListeners === 'function') {
          characterUI.setupRelationshipsListeners();
        }
      }
      console.log("✅ Relationships refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing relationships:", error);
    }
  }

  /**
   * Render relationship matrix grid with attitude/favorability scores
   */
  renderRelationshipMatrix(characters) {
    if (characters.length < 2) {
      return `
        <div class="relationship-matrix">
          <h4>Character Attitude Matrix</h4>
          <div class="matrix-empty">
            <p>Need at least 2 characters to show attitude matrix.</p>
          </div>
        </div>
      `;
    }

    const matrixRows = characters
      .map((fromChar) => {
        const fromCharTypeClass = this.getCharacterTypeClass(fromChar);
        const matrixCells = characters
          .map((toChar) => {
            if (fromChar.id === toChar.id) {
              const charTypeClass = this.getCharacterTypeClass(fromChar);
              const charTypeDisplay = this.getCharacterTypeDisplay(fromChar);
              return `<div class="matrix-cell self ${charTypeClass}">
                        <div class="char-name">${fromChar.name}</div>
                        <div class="char-type">${charTypeDisplay}</div>
                      </div>`;
            }

            // Get relationship data
            const relationship = fromChar.relationships?.[toChar.id];
            const relationshipType = relationship?.type || "neutral";

            // Get attitude/favorability score
            const attitude = this.getCharacterAttitude(fromChar, toChar);
            const attitudeClass = this.getAttitudeClass(attitude);
            const relationshipClass = this.getRelationshipHighlightClass(relationshipType);

            return `
          <div class="matrix-cell attitude-cell ${attitudeClass} ${relationshipClass}" 
               title="${fromChar.name} → ${
              toChar.name
            }: ${this.formatAttitudeTooltip(relationshipType, attitude)}"
               onclick="characterManager.showEditRelationshipDialog('${
                 fromChar.id
               }', '${toChar.id}')">
            <div class="attitude-score">${attitude}</div>
            <div class="attitude-bar">
              <div class="attitude-fill" style="width: ${attitude}%"></div>
            </div>
            <div class="relationship-type ${relationshipClass}">${this.formatRelationshipTypeShort(
              relationshipType
            )}</div>
          </div>
        `;
          })
          .join("");

        const fromCharTypeDisplay = this.getCharacterTypeDisplay(fromChar);
        return `
        <div class="matrix-row">
          <div class="matrix-label ${fromCharTypeClass}">
            <div class="char-name">${fromChar.name}</div>
            <div class="char-type">${fromCharTypeDisplay}</div>
          </div>
          ${matrixCells}
        </div>
      `;
      })
      .join("");

    const headerCells = characters
      .map((char) => {
        const charTypeClass = this.getCharacterTypeClass(char);
        const charTypeDisplay = this.getCharacterTypeDisplay(char);
        return `<div class="matrix-header-cell ${charTypeClass}">
                  <div class="char-name">${char.name}</div>
                  <div class="char-type">${charTypeDisplay}</div>
                </div>`;
      })
      .join("");

    return `
      <div class="relationship-matrix attitude-matrix">
        <h4>Character Attitude Matrix</h4>
        <p class="matrix-description">Shows how each character feels about others (0-100 scale)</p>
        <div class="matrix-grid">
          <div class="matrix-header">
            <div class="matrix-corner">
              <div class="corner-label">From →</div>
              <div class="corner-sublabel">To ↓</div>
            </div>
            ${headerCells}
          </div>
          ${matrixRows}
        </div>
        <div class="matrix-legend">
          <div class="legend-section">
            <h5>Attitude Scale:</h5>
            <div class="attitude-legend">
              <span class="legend-item"><span class="legend-color attitude-hostile"></span> 0-20 Hostile</span>
              <span class="legend-item"><span class="legend-color attitude-unfriendly"></span> 21-40 Unfriendly</span>
              <span class="legend-item"><span class="legend-color attitude-neutral"></span> 41-60 Neutral</span>
              <span class="legend-item"><span class="legend-color attitude-friendly"></span> 61-80 Friendly</span>
              <span class="legend-item"><span class="legend-color attitude-devoted"></span> 81-100 Devoted</span>
            </div>
          </div>
          <div class="legend-section">
            <h5>Relationship Types:</h5>
            <div class="relationship-legend">
              <span class="legend-item relationship-ally">A=Ally</span>
              <span class="legend-item relationship-friend">F=Friend</span>
              <span class="legend-item relationship-neutral">N=Neutral</span>
              <span class="legend-item relationship-rival">R=Rival</span>
              <span class="legend-item relationship-enemy">E=Enemy</span>
              <span class="legend-item">Fa=Family, Ro=Romantic, M=Mentor</span>
            </div>
          </div>
          <div class="legend-section">
            <h5>Character Types:</h5>
            <div class="character-type-legend">
              <span class="legend-item char-pc">PC = Player Character</span>
              <span class="legend-item char-npc">NPC = Non-Player Character</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render character relationship card for matrix view (OLD - RENAMED)
   */
  renderCharacterRelationshipCardOld(character, allCharacters) {
    const relationships = character.relationships || {};
    const relationshipCount = Object.keys(relationships).length;

    return `
      <div class="character-relationship-card">
        <div class="card-header">
          <h5>${character.name}</h5>
          <span class="relationship-count">${relationshipCount} relationships</span>
        </div>
        <div class="card-content">
          ${
            relationshipCount > 0
              ? Object.entries(relationships)
                  .map(([targetId, relationship]) => {
                    const targetCharacter = allCharacters.find(
                      (c) => c.id === targetId
                    );
                    return targetCharacter
                      ? this.renderRelationshipItem(
                          character.id,
                          targetCharacter,
                          relationship
                        )
                      : "";
                  })
                  .join("")
              : '<p class="text-muted">No relationships recorded.</p>'
          }
        </div>
        <div class="card-actions">
          <button class="btn btn-sm btn-primary" onclick="characterManager.showAddRelationshipDialog('${
            character.id
          }')">
            <i class="fas fa-plus"></i> Add Relationship
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render a single relationship item
   */
  renderRelationshipItem(fromCharacterId, toCharacter, relationship) {
    if (!toCharacter) {
      return "";
    }

    const relationshipTypeClass = `relationship-${
      relationship.type || "neutral"
    }`;

    return `
      <div class="relationship-item ${relationshipTypeClass}">
        <div class="relationship-character">
          <strong>${toCharacter.name}</strong>
          <span class="relationship-type">${this.formatRelationshipType(
            relationship.type || "neutral"
          )}</span>
        </div>
        <div class="relationship-description">
          ${relationship.description || "No description provided."}
        </div>
        <div class="relationship-actions">
          <button class="btn btn-sm btn-outline-primary" 
                  data-action="edit-relationship"
                  data-from-character-id="${fromCharacterId}"
                  data-to-character-id="${toCharacter.id}">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-sm btn-outline-danger" 
                  data-action="delete-relationship"
                  data-from-character-id="${fromCharacterId}"
                  data-to-character-id="${toCharacter.id}">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Format relationship type for display
   */
  formatRelationshipType(type) {
    const types = {
      ally: "Ally",
      friend: "Friend",
      neutral: "Neutral",
      rival: "Rival",
      enemy: "Enemy",
      family: "Family",
      romantic: "Romantic",
      mentor: "Mentor",
      student: "Student",
    };
    return types[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Get total number of relationships
   */
  getTotalRelationships() {
    const allCharacters = this.characterCore.getAllCharacters();
    return allCharacters.reduce((total, char) => {
      return total + Object.keys(char.relationships || {}).length;
    }, 0);
  }

  /**
   * Get strongest bonds (ally/friend/family/romantic relationships)
   */
  getStrongestBonds() {
    const allCharacters = this.characterCore.getAllCharacters();
    const strongBonds = [];

    allCharacters.forEach((char) => {
      const relationships = char.relationships || {};
      Object.entries(relationships).forEach(([targetId, relationship]) => {
        if (
          ["ally", "friend", "family", "romantic"].includes(relationship.type)
        ) {
          strongBonds.push({
            from: char,
            to: allCharacters.find((c) => c.id === targetId),
            relationship,
          });
        }
      });
    });

    return strongBonds;
  }

  /**
   * Get conflicts (rival/enemy relationships)
   */
  getConflicts() {
    const allCharacters = this.characterCore.getAllCharacters();
    const conflicts = [];

    allCharacters.forEach((char) => {
      const relationships = char.relationships || {};
      Object.entries(relationships).forEach(([targetId, relationship]) => {
        if (["rival", "enemy"].includes(relationship.type)) {
          conflicts.push({
            from: char,
            to: allCharacters.find((c) => c.id === targetId),
            relationship,
          });
        }
      });
    });

    return conflicts;
  }

  /**
   * Add a new relationship
   */
  async handleAddRelationship(form) {
    try {
      const formData = new FormData(form);
      const fromCharacterId = formData.get("fromCharacter");
      const toCharacterId = formData.get("toCharacter");
      const relationshipType = formData.get("relationshipType");
      const description = formData.get("description");

      // Find the characters
      const fromCharacterData =
        this.characterCore.getCharacterById(fromCharacterId);
      const toCharacterData =
        this.characterCore.getCharacterById(toCharacterId);

      if (!fromCharacterData.character || !toCharacterData.character) {
        throw new Error("One or both characters not found");
      }

      // Add relationship to from character
      if (!fromCharacterData.character.relationships) {
        fromCharacterData.character.relationships = {};
      }

      fromCharacterData.character.relationships[toCharacterId] = {
        type: relationshipType,
        description: description,
        created: new Date().toISOString(),
      };

      // Optionally add reciprocal relationship
      const isReciprocal = formData.get("reciprocal") === "on";
      if (isReciprocal) {
        if (!toCharacterData.character.relationships) {
          toCharacterData.character.relationships = {};
        }

        toCharacterData.character.relationships[fromCharacterId] = {
          type: relationshipType,
          description: `Reciprocal: ${description}`,
          created: new Date().toISOString(),
        };
      }

      // Save to API and localStorage for persistence
      await this.saveRelationshipData();

      return {
        success: true,
        message: `Relationship added between ${fromCharacterData.character.name} and ${toCharacterData.character.name}`,
      };
    } catch (error) {
      console.error("❌ Error adding relationship:", error);
      throw error;
    }
  }

  /**
   * Save relationship data to API and localStorage
   */
  async saveRelationshipData() {
    try {
      // Build relationship matrix from all characters
      const allCharacters = this.characterCore.getAllCharacters();
      const relationshipData = {};
      
      allCharacters.forEach(char => {
        if (char.relationships && Object.keys(char.relationships).length > 0) {
          relationshipData[char.id] = char.relationships;
        }
      });

      // Try to save to API first
      try {
        const response = await fetch('/api/character-relationships', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(relationshipData)
        });
        
        if (response.ok) {
          console.log('💾 Relationship data saved to API');
        } else {
          throw new Error('API save failed');
        }
      } catch (apiError) {
        console.warn('⚠️ API save failed, using localStorage only:', apiError.message);
      }
      
      // Always save to localStorage as backup
      localStorage.setItem('character-relationships', JSON.stringify(relationshipData));
      console.log('💾 Relationship data saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving relationship data:', error);
    }
  }

  /**
   * Delete a relationship
   */
  async deleteRelationship(fromCharacterId, toCharacterId) {
    try {
      const fromCharacterData =
        this.characterCore.getCharacterById(fromCharacterId);

      if (
        fromCharacterData.character &&
        fromCharacterData.character.relationships
      ) {
        delete fromCharacterData.character.relationships[toCharacterId];

        // Clean up empty relationships object
        if (
          Object.keys(fromCharacterData.character.relationships).length === 0
        ) {
          fromCharacterData.character.relationships = {};
        }
      }

      // Save to API and localStorage for persistence
      await this.saveRelationshipData();

      return {
        success: true,
        message: "Relationship deleted successfully",
      };
    } catch (error) {
      console.error("❌ Error deleting relationship:", error);
      throw error;
    }
  }

  /**
   * Render NPC relationship tags
   */
  renderNPCRelationshipTags(npc) {
    const relationships = npc.relationships || [];

    if (relationships.length === 0) {
      return '<span class="relationship-tag no-relationships">No relationships</span>';
    }

    return relationships
      .slice(0, 3)
      .map((rel) => {
        const relationshipClass = `relationship-${rel.type || "neutral"}`;
        return `<span class="relationship-tag ${relationshipClass}">${
          rel.character
        }: ${this.formatRelationshipType(rel.type)}</span>`;
      })
      .join("");
  }

  /**
   * Get attitude/favorability score between two characters
   */
  getCharacterAttitude(fromChar, toChar) {
    // For NPCs, use their stored favorability if it exists
    if (fromChar.type === "npc" && fromChar.favorability !== undefined) {
      return Math.round(fromChar.favorability);
    }

    // For relationships, convert relationship type to attitude score
    const relationship = fromChar.relationships?.[toChar.id];
    if (relationship) {
      return this.relationshipTypeToAttitude(relationship.type);
    }

    // Default neutral attitude
    return 50;
  }

  /**
   * Convert relationship type to attitude score
   */
  relationshipTypeToAttitude(relationshipType) {
    const attitudeMap = {
      enemy: 10,
      rival: 30,
      neutral: 50,
      friend: 70,
      ally: 80,
      family: 85,
      romantic: 90,
      mentor: 75,
      student: 65,
    };
    return attitudeMap[relationshipType] || 50;
  }

  /**
   * Get CSS class based on attitude score
   */
  getAttitudeClass(attitude) {
    if (attitude <= 20) return "attitude-hostile";
    if (attitude <= 40) return "attitude-unfriendly";
    if (attitude <= 60) return "attitude-neutral";
    if (attitude <= 80) return "attitude-friendly";
    return "attitude-devoted";
  }

  /**
   * Format tooltip text for attitude cell
   */
  formatAttitudeTooltip(relationshipType, attitude) {
    const attitudeText = this.getAttitudeText(attitude);
    const relationshipText = this.formatRelationshipType(relationshipType);
    return `${relationshipText} (${attitude}/100 - ${attitudeText})`;
  }

  /**
   * Get attitude description text
   */
  getAttitudeText(attitude) {
    if (attitude <= 20) return "Hostile";
    if (attitude <= 40) return "Unfriendly";
    if (attitude <= 60) return "Neutral";
    if (attitude <= 80) return "Friendly";
    return "Devoted";
  }

  /**
   * Format relationship type for short display in matrix
   */
  formatRelationshipTypeShort(type) {
    const shortTypes = {
      ally: "A",
      friend: "F",
      neutral: "N",
      rival: "R",
      enemy: "E",
      family: "Fa",
      romantic: "Ro",
      mentor: "M",
      student: "S",
    };
    return shortTypes[type] || "N";
  }

  /**
   * Get CSS class for character type (PC vs NPC)
   */
  getCharacterTypeClass(character) {
    // Check if character is a player character
    if (character.type === "pc" || character.isPlayerCharacter || character.player_character) {
      return "char-pc";
    }
    return "char-npc";
  }

  /**
   * Get display text for character type
   */
  getCharacterTypeDisplay(character) {
    if (character.type === "pc" || character.isPlayerCharacter || character.player_character) {
      return "PC";
    }
    return "NPC";
  }

  /**
   * Get CSS class for relationship highlighting (ally vs enemy distinction)
   */
  getRelationshipHighlightClass(relationshipType) {
    // Positive relationships
    if (["ally", "friend", "family", "romantic", "mentor"].includes(relationshipType)) {
      return "relationship-positive";
    }
    // Negative relationships
    if (["enemy", "rival"].includes(relationshipType)) {
      return "relationship-negative";
    }
    // Neutral relationships
    return "relationship-neutral";
  }
}
