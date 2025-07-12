/**
 * CharacterManager - Lean coordinator for modular character management system
 * Orchestrates CharacterCore, CharacterProgression, CharacterRelationships, and CharacterUI
 */
import CharacterCore from "./character-core.js";
import { CharacterProgression } from "./character-progression.js";
import { CharacterRelationships } from "./character-relationships.js";
import { CharacterUI } from "./character-ui.js";

export default class CharacterManager {
  constructor() {
    // Initialize modules
    this.core = new CharacterCore();
    this.progression = new CharacterProgression(this.core);
    this.relationships = new CharacterRelationships(this.core);
    this.ui = new CharacterUI(this.core, this.progression, this.relationships);

    this.isInitialized = false;
  }

  async init() {
    try {
      console.log(
        "🎭 CharacterManager: Initializing modular character system..."
      );

      // Initialize all modules in order
      await this.core.init();
      await this.progression.init();
      await this.relationships.init();

      this.isInitialized = true;
      console.log("✅ CharacterManager: All modules initialized successfully");
      console.log("📊 CharacterManager: Player characters:", this.core.playerCharacters.length);
      console.log("📊 CharacterManager: Important NPCs:", this.core.importantNPCs.length);
    } catch (error) {
      console.error("❌ CharacterManager: Initialization failed", error);
      // Initialize with defaults to prevent complete failure
      this.isInitialized = true;
      console.log("⚠️ CharacterManager: Initialized with limited functionality");
    }
  }

  // ===========================================
  // PUBLIC API - Methods used by other systems
  // ===========================================

  /**
   * Show character overview (main entry point)
   */
  showCharacterOverview() {
    if (!this.isInitialized) {
      console.error("❌ CharacterManager: Not initialized");
      return;
    }
    this.ui.showCharacterOverview();
  }

  /**
   * Show specific character tab
   */
  showCharacterTab(tabName) {
    this.ui.switchCharacterTab(tabName);
  }

  /**
   * Show relationships view
   */
  showRelationshipsView() {
    this.ui.switchCharacterDetailTab("relationships");
  }

  /**
   * Show progression view
   */
  showProgressionView() {
    this.ui.switchCharacterDetailTab("progression");
  }

  /**
   * Get character by ID (used by other systems)
   */
  getCharacterById(characterId) {
    return this.core.getCharacterById(characterId);
  }

  /**
   * Get all characters (used by other systems)
   */
  getAllCharacters() {
    return this.core.getAllCharacters();
  }

  /**
   * Get player characters (used by other systems)
   */
  getPlayerCharacters() {
    return this.core.playerCharacters;
  }

  /**
   * Get important NPCs (used by other systems)
   */
  getImportantNPCs() {
    return this.core.importantNPCs;
  }

  // ===========================================
  // CHARACTER CRUD OPERATIONS
  // ===========================================

  /**
   * Show add character dialog
   */
  showAddCharacterDialog() {
    this.ui.showAddCharacterDialog();
  }

  /**
   * Show add NPC dialog
   */
  showAddNPCDialog() {
    this.ui.showAddNPCDialog();
  }

  /**
   * Show edit character dialog
   */
  showEditCharacterDialog(characterId) {
    this.ui.showEditCharacterDialog(characterId);
  }

  /**
   * Handle adding a new character
   */
  async handleAddCharacter(form) {
    try {
      const newCharacter = await this.core.handleAddCharacter(form);
      this.ui.showSuccessMessage(
        `Character ${newCharacter.name} added successfully`
      );
      this.refreshCharacterDisplay();
      return newCharacter;
    } catch (error) {
      this.ui.showError(`Failed to add character: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle adding a new NPC
   */
  handleAddNPC(form) {
    try {
      const newNPC = this.core.handleAddNPC(form);
      this.ui.showSuccessMessage(`NPC ${newNPC.name} added successfully`);
      this.refreshCharacterDisplay();
      return newNPC;
    } catch (error) {
      this.ui.showError(`Failed to add NPC: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle editing a character
   */
  async handleEditCharacter(form, characterId, isPlayerCharacter) {
    try {
      const updatedCharacter = await this.core.handleEditCharacter(
        form,
        characterId,
        isPlayerCharacter
      );
      this.ui.showSuccessMessage(`Character updated successfully`);
      this.refreshCharacterDisplay();
      return updatedCharacter;
    } catch (error) {
      this.ui.showError(`Failed to update character: ${error.message}`);
      throw error;
    }
  }

  // ===========================================
  // RELATIONSHIP MANAGEMENT
  // ===========================================

  /**
   * Show add relationship dialog
   */
  showAddRelationshipDialog(fromCharacterId = null) {
    this.ui.showAddRelationshipDialog(fromCharacterId);
  }

  /**
   * Show edit relationship dialog
   */
  showEditRelationshipDialog(fromCharacterId, toCharacterId) {
    this.ui.showEditRelationshipDialog(fromCharacterId, toCharacterId);
  }

  /**
   * Handle adding a relationship
   */
  handleAddRelationship(form) {
    try {
      const result = this.relationships.handleAddRelationship(form);
      this.ui.showSuccessMessage(result.message);
      this.refreshCharacterDisplay();
      return result;
    } catch (error) {
      this.ui.showError(`Failed to add relationship: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a relationship
   */
  deleteRelationship(fromCharacterId, toCharacterId) {
    try {
      const result = this.relationships.deleteRelationship(
        fromCharacterId,
        toCharacterId
      );
      this.ui.showSuccessMessage(result.message);
      this.refreshCharacterDisplay();
      return result;
    } catch (error) {
      this.ui.showError(`Failed to delete relationship: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update relationship type via dropdown
   */
  async updateRelationshipType(selectElement) {
    try {
      const fromCharacterId = selectElement.dataset.fromCharacterId;
      const toCharacterId = selectElement.dataset.toCharacterId;
      const newType = selectElement.value;
      
      // Get existing relationship to preserve description
      const fromCharacterData = this.core.getCharacterById(fromCharacterId);
      const existingRelationship = fromCharacterData.character.relationships?.[toCharacterId];
      
      if (existingRelationship) {
        existingRelationship.type = newType;
        
        // Save to database
        if (this.relationships) {
          await this.relationships.saveRelationshipData();
        }
        
        this.ui.showSuccessMessage(`Relationship updated to ${newType}`);
        
        // Refresh the view to update visual styling
        const currentTab = document.querySelector('.character-detail-tab.active')?.dataset.tab;
        if (currentTab === 'relationships') {
          this.ui.switchCharacterDetailTab('relationships');
        }
      }
    } catch (error) {
      this.ui.showError(`Failed to update relationship: ${error.message}`);
    }
  }

  /**
   * Filter relationships by type and character type
   */
  filterRelationships() {
    const characterTypeFilter = document.querySelector('[data-filter="character-type"]')?.value || 'all';
    const relationshipTypeFilter = document.querySelector('[data-filter="relationship-type"]')?.value || 'all';
    
    const cards = document.querySelectorAll('.character-relationships .card-character');
    
    cards.forEach(card => {
      let showCard = true;
      
      // Character type filter
      if (characterTypeFilter !== 'all') {
        const isPC = card.classList.contains('char-pc');
        if ((characterTypeFilter === 'pc' && !isPC) || (characterTypeFilter === 'npc' && isPC)) {
          showCard = false;
        }
      }
      
      // Relationship type filter
      if (relationshipTypeFilter !== 'all' && showCard) {
        const relationshipSelect = card.querySelector('.relationship-type-select');
        const hasRelationship = !!relationshipSelect;
        
        if (relationshipTypeFilter === 'none' && hasRelationship) {
          showCard = false;
        } else if (relationshipTypeFilter !== 'none') {
          if (!hasRelationship || relationshipSelect.value !== relationshipTypeFilter) {
            showCard = false;
          }
        }
      }
      
      card.style.display = showCard ? '' : 'none';
    });
  }

  // ===========================================
  // CHARACTER DETAILS & NOTES
  // ===========================================

  /**
   * Show character details
   */
  showCharacterDetails(characterId) {
    this.ui.showCharacterDetails(characterId);
  }

  /**
   * Show character notes dialog
   */
  showCharacterNotesDialog(characterId) {
    this.ui.showCharacterNotesDialog(characterId);
  }

  /**
   * Show character export dialog
   */
  showCharacterExportDialog(character) {
    this.ui.showCharacterExportDialog(character);
  }

  /**
   * Save character notes
   */
  async saveCharacterNotes(characterId, modalOverlay) {
    try {
      const notesTextarea = modalOverlay.querySelector("#character-notes");
      const backstoryTextarea = modalOverlay.querySelector(
        "#character-backstory"
      );

      const notes = notesTextarea?.value || "";
      const backstory = backstoryTextarea?.value || "";

      // Update character with notes
      const { character, isPlayerCharacter } =
        this.core.getCharacterById(characterId);
      if (!character) {
        throw new Error("Character not found");
      }

      const updatedData = { ...character, notes, backstory };
      await this.core.updateCharacter(
        characterId,
        updatedData,
        isPlayerCharacter
      );

      this.ui.showSuccessMessage("Character notes saved successfully!");
      modalOverlay.remove();

      // Refresh display if character is currently selected
      this.refreshCharacterDisplay();
    } catch (error) {
      console.error("Error saving character notes:", error);
      this.ui.showError("Failed to save character notes: " + error.message);
    }
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  /**
   * Refresh character display after data changes
   */
  refreshCharacterDisplay() {
    if (this.isInitialized) {
      this.ui.showCharacterOverview();
    }
  }

  /**
   * Render method for compatibility with existing code
   */
  render(container) {
    if (!container) {
      console.error("❌ CharacterManager: No container provided for rendering");
      return;
    }

    console.log(
      "🎭 CharacterManager: Rendering character management interface"
    );
    this.showCharacterOverview();
  }

  // ===========================================
  // LEGACY COMPATIBILITY METHODS
  // ===========================================

  /**
   * Legacy method for backward compatibility
   */
  get playerCharacters() {
    return this.core.playerCharacters;
  }

  /**
   * Legacy method for backward compatibility
   */
  get importantNPCs() {
    return this.core.importantNPCs;
  }

  /**
   * Legacy method for backward compatibility
   */
  get currentCharacter() {
    return this.core.currentCharacter;
  }

  /**
   * Legacy method for backward compatibility
   */
  set currentCharacter(character) {
    this.core.currentCharacter = character;
  }
}
