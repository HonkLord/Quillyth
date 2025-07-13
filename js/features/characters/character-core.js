/**
 * CharacterCore - Data management and CRUD operations for characters
 * Handles API calls, data loading, and basic character operations
 */
import { DataManager } from "../../data-manager.js";

export default class CharacterCore {
  constructor(dataManager = null) {
    this.apiService = null; // Will be injected
    this.geminiService = null; // Will be injected
    this.dataManager = dataManager || new DataManager();

    this.playerCharacters = [];
    this.importantNPCs = [];
    this.currentCharacter = null;

    this.isInitialized = false;
  }

  async init() {
    try {
      console.log("🎭 CharacterCore: Initializing...");
      
      // Load current campaign to get campaign context (only if not already loaded)
      if (!this.dataManager.currentCampaignId) {
        await this.dataManager.loadCurrentCampaign();
      }

      // Load character data
      await this.loadCharacterData();

      this.isInitialized = true;
      console.log("✅ CharacterCore: Initialized successfully");
    } catch (error) {
      console.error("❌ CharacterCore: Initialization failed", error);
      throw error;
    }
  }

  async loadCharacterData() {
    try {
      // Load player characters
      try {
        console.log("🎭 CharacterCore: Loading player characters from API...");
        const playersResponse = await fetch(`/api/characters?campaign_id=${this.dataManager.currentCampaignId}`);
        console.log("🎭 CharacterCore: Players API response status:", playersResponse.status);
        
        if (playersResponse.ok) {
          const rawData = await playersResponse.json();
          console.log("🎭 CharacterCore: Raw player characters from API:", rawData);
          
          // The API returns {players: [...], npcs: [...]}, we need just the players array
          this.playerCharacters = rawData.players || rawData;
          console.log("🎭 CharacterCore: Extracted player characters:", this.playerCharacters);
          
          // Parse character descriptions to extract individual fields and mark as PC
          this.playerCharacters = this.playerCharacters.map((char) => {
            const parsed = this.parseCharacterDescription(char);
            return { ...parsed, type: "pc", isPlayerCharacter: true };
          });
          
          console.log("🎭 CharacterCore: Processed player characters:", this.playerCharacters);
        } else {
          console.log("📝 Players API not available, using default characters");
          this.playerCharacters = this.getDefaultPlayerCharacters();
        }
      } catch (error) {
        console.log("📝 Players API failed, using default characters:", error.message);
        this.playerCharacters = this.getDefaultPlayerCharacters();
      }

      // Load important NPCs (from scenes or separate endpoint)
      try {
        const npcsResponse = await fetch(`/api/characters/important-npcs?campaign_id=${this.dataManager.currentCampaignId}`);
        if (npcsResponse.ok) {
          this.importantNPCs = await npcsResponse.json();
          // Mark all NPCs with proper type
          this.importantNPCs = this.importantNPCs.map((npc) => ({
            ...npc,
            type: "npc",
            isPlayerCharacter: false
          }));
        } else {
          console.log(
            "📝 Important NPCs endpoint not available, using sample NPCs"
          );
          this.importantNPCs = this.getSampleNPCs();
        }
      } catch (error) {
        console.log(
          "📝 Important NPCs endpoint not available, using sample NPCs"
        );
        this.importantNPCs = this.getSampleNPCs();
      }

      console.log(
        `📊 Loaded ${this.playerCharacters.length} player characters and ${this.importantNPCs.length} important NPCs`
      );
    } catch (error) {
      console.error("❌ Error loading character data:", error);
      // Initialize with default data if load fails
      this.playerCharacters = this.getDefaultPlayerCharacters();
      this.importantNPCs = [];
    }
  }

  getDefaultPlayerCharacters() {
    // Default characters for development
    return [
      {
        id: "vandarith",
        name: "Vandarith",
        class: "Ranger",
        level: 5,
        background: "Outlander",
        personality: "Stoic and observant, speaks little but acts decisively",
        goals:
          "Find his missing sister and uncover the truth about the ancient ruins",
        bonds: "His family, especially his sister Lyralei",
        flaws: "Trusts too easily, sometimes to his detriment",
        progression: [],
        relationships: {
          "lyralei": {
            type: "family",
            description: "Missing sister - searching for her desperately",
            created: new Date().toISOString(),
          },
          "captain-thorne": {
            type: "ally",
            description: "Trusted military contact who provides information",
            created: new Date().toISOString(),
          },
          "shadow-broker": {
            type: "rival",
            description: "Competing information broker who withholds clues",
            created: new Date().toISOString(),
          },
        },
        sessionNotes: [],
        type: "pc",
        isPlayerCharacter: true,
      },
      {
        id: "vincent",
        name: "Vincent",
        class: "Fighter",
        level: 5,
        background: "Soldier",
        personality: "Tactical and protective, natural leader in combat",
        goals: "Reunite with his old military unit and clear his name",
        bonds: "His former comrades, the innocent he failed to protect",
        flaws:
          "Haunted by past failures, sometimes reckless in pursuit of redemption",
        progression: [],
        relationships: {
          "captain-thorne": {
            type: "mentor",
            description: "Former commanding officer who still believes in him",
            created: new Date().toISOString(),
          },
          "lyralei": {
            type: "neutral",
            description: "Vandarith's sister - wants to help find her",
            created: new Date().toISOString(),
          },
        },
        sessionNotes: [],
        type: "pc",
        isPlayerCharacter: true,
      },
      {
        id: "lilith",
        name: "Lilith",
        class: "Rogue",
        level: 5,
        background: "Criminal",
        personality: "Cunning and pragmatic, with a hidden compassionate side",
        goals: "Hunt down the vampire that turned her brother",
        bonds: "Her brother (now undead), the thieves guild that raised her",
        flaws:
          "Secretive and distrustful, struggles with emotional connections",
        progression: [],
        relationships: {
          "shadow-broker": {
            type: "friend",
            description: "Former guild contact who now works in information",
            created: new Date().toISOString(),
          },
          "captain-thorne": {
            type: "neutral",
            description: "Cautious respect for his military background",
            created: new Date().toISOString(),
          },
        },
        sessionNotes: [],
        type: "pc",
        isPlayerCharacter: true,
      },
      {
        id: "geoff",
        name: "Geoff",
        class: "Barbarian",
        level: 5,
        background: "Folk Hero",
        personality: "Jovial and straightforward, but fierce when angered",
        goals: "Protect his village from the encroaching darkness",
        bonds: "His village, his clan, the natural world",
        flaws: "Quick to anger, sometimes acts before thinking",
        progression: [],
        relationships: {
          "lyralei": {
            type: "friend",
            description: "Sees her as needing protection like his village",
            created: new Date().toISOString(),
          },
          "shadow-broker": {
            type: "enemy",
            description: "Distrusts underhanded information dealers",
            created: new Date().toISOString(),
          },
        },
        sessionNotes: [],
        type: "pc",
        isPlayerCharacter: true,
      },
    ];
  }

  getSampleNPCs() {
    // Sample NPCs for demonstrating PC/NPC relationships
    return [
      {
        id: "lyralei",
        name: "Lyralei",
        role: "Missing Person",
        location: "Unknown",
        description: "Vandarith's younger sister, disappeared during expedition to ancient ruins",
        motivation: "Survival and finding her way home",
        secrets: "Has discovered something significant about the ruins but is trapped",
        favorability: 85,
        importance: "high",
        scenes: ["the-hollow-entrance", "ancient-ruins-discovery"],
        relationships: {
          "vandarith": {
            type: "family",
            description: "Beloved older brother who is searching for her",
            created: new Date().toISOString(),
          },
          "vincent": {
            type: "neutral",
            description: "Trusts her brother's companions",
            created: new Date().toISOString(),
          },
          "geoff": {
            type: "friend",
            description: "Appreciates his protective nature",
            created: new Date().toISOString(),
          },
        },
        type: "npc",
        isPlayerCharacter: false,
      },
      {
        id: "captain-thorne",
        name: "Captain Thorne",
        role: "Military Officer",
        location: "Duskhaven Garrison",
        description: "Veteran captain of the Duskhaven Guard, honorable but pragmatic",
        motivation: "Maintain order and protect the city from emerging threats",
        secrets: "Knows more about Vincent's past than he reveals",
        favorability: 75,
        importance: "high",
        scenes: ["garrison-meeting", "tactical-briefing"],
        relationships: {
          "vincent": {
            type: "mentor",
            description: "Former subordinate he believes in despite past failures",
            created: new Date().toISOString(),
          },
          "vandarith": {
            type: "ally",
            description: "Reliable source of information about missing persons",
            created: new Date().toISOString(),
          },
          "lilith": {
            type: "neutral",
            description: "Wary of her criminal background but respects her skills",
            created: new Date().toISOString(),
          },
        },
        type: "npc",
        isPlayerCharacter: false,
      },
      {
        id: "shadow-broker",
        name: "The Shadow Broker",
        role: "Information Dealer",
        location: "Duskhaven Undercity",
        description: "Mysterious figure who trades in secrets and information",
        motivation: "Profit and maintaining network of informants",
        secrets: "Has connections to both the thieves guild and city officials",
        favorability: 45,
        importance: "medium",
        scenes: ["undercity-meeting", "information-exchange"],
        relationships: {
          "lilith": {
            type: "friend",
            description: "Former guild associate, trusted business partner",
            created: new Date().toISOString(),
          },
          "vandarith": {
            type: "rival",
            description: "Competes for the same information sources",
            created: new Date().toISOString(),
          },
          "geoff": {
            type: "enemy",
            description: "Mutual distrust and opposing values",
            created: new Date().toISOString(),
          },
        },
        type: "npc",
        isPlayerCharacter: false,
      },
    ];
  }


  /**
   * Parse character description to extract individual fields
   */
  parseCharacterDescription(character) {
    if (!character || !character.description) {
      return character;
    }

    const parsed = { ...character };
    const description = character.description;

    // Extract personality (only if not already set)
    if (!parsed.personality) {
      const personalityMatch = description.match(/Personality:\s*([^.]*\.?)/i);
      if (personalityMatch) {
        parsed.personality = personalityMatch[1].trim();
      }
    }

    // Extract goals (only if the existing goals field is empty or not set)
    if (!parsed.goals || parsed.goals === "[]" || parsed.goals === "") {
      const goalsMatch = description.match(/Goals?:\s*(\[.*?\])/i);
      if (goalsMatch) {
        try {
          // Try to parse as JSON array
          const goalsText = goalsMatch[1].trim();
          // Fix common JSON issues in the extracted text
          const fixedGoalsText = goalsText.replace(/'/g, '"'); // Replace single quotes with double quotes
          parsed.goals = fixedGoalsText;
        } catch (error) {
          console.warn(
            "🎭 Failed to parse extracted goals for",
            character.name,
            ":",
            error
          );
          // Keep the original goals field
        }
      }
    }

    // Extract bonds (only if not already set)
    if (!parsed.bonds) {
      const bondsMatch = description.match(/Bonds?:\s*([^.]*\.?)/i);
      if (bondsMatch) {
        parsed.bonds = bondsMatch[1].trim();
      }
    }

    // Extract flaws (only if not already set)
    if (!parsed.flaws) {
      const flawsMatch = description.match(/Flaws?:\s*([^.]*\.?)/i);
      if (flawsMatch) {
        parsed.flaws = flawsMatch[1].trim();
      }
    }

    // Initialize arrays if they don't exist
    parsed.progression = parsed.progression || [];
    parsed.relationships = parsed.relationships || {};
    parsed.sessionNotes = parsed.sessionNotes || [];

    return parsed;
  }

  /**
   * Add a new character
   */
  async handleAddCharacter(form) {
    try {
      const formData = new FormData(form);
      const characterData = {
        name: formData.get("name"),
        class: formData.get("class"),
        race: formData.get("race"),
        level: parseInt(formData.get("level")) || 1,
        background: formData.get("background"),
        description: formData.get("description"),
        personality: formData.get("personality"),
        goals: formData.get("goals"),
        bonds: formData.get("bonds"),
        flaws: formData.get("flaws"),
        type: "player",
      };

      // Generate ID
      characterData.id = this.generateCharacterId(characterData.name);

      // Send to API
      const response = await fetch("/api/characters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(characterData),
      });

      if (!response.ok) {
        throw new Error(`Failed to add character: ${response.statusText}`);
      }

      const newCharacter = await response.json();

      // Add to local data
      this.playerCharacters.push(newCharacter);

      return newCharacter;
    } catch (error) {
      console.error("❌ Error adding character:", error);
      throw error;
    }
  }

  /**
   * Add a new NPC
   */
  handleAddNPC(form) {
    try {
      const formData = new FormData(form);
      const npcData = {
        id: this.generateCharacterId(formData.get("name")),
        name: formData.get("name"),
        role: formData.get("role"),
        location: formData.get("location"),
        description: formData.get("description"),
        motivation: formData.get("motivation"),
        secrets: formData.get("secrets"),
        relationships: [],
        type: "npc",
      };

      // Add to local data
      this.importantNPCs.push(npcData);

      return npcData;
    } catch (error) {
      console.error("❌ Error adding NPC:", error);
      throw error;
    }
  }

  /**
   * Update character data
   */
  async handleEditCharacter(form, characterId, isPlayerCharacter) {
    try {
      const formData = new FormData(form);
      const characterData = {};

      // Get all form fields
      for (const [key, value] of formData.entries()) {
        if (key === "level") {
          characterData[key] = parseInt(value) || 1;
        } else {
          characterData[key] = value;
        }
      }

      // Add type field for API endpoint
      characterData.type = isPlayerCharacter ? "player" : "npc";

      // Add campaign_id field
      characterData.campaign_id = this.dataManager.currentCampaignId;

      // Update local data
      if (isPlayerCharacter) {
        const characterIndex = this.playerCharacters.findIndex(
          (char) => char.id === characterId
        );
        if (characterIndex !== -1) {
          this.playerCharacters[characterIndex] = {
            ...this.playerCharacters[characterIndex],
            ...characterData,
          };
        }
      } else {
        const npcIndex = this.importantNPCs.findIndex(
          (npc) => npc.id === characterId
        );
        if (npcIndex !== -1) {
          this.importantNPCs[npcIndex] = {
            ...this.importantNPCs[npcIndex],
            ...characterData,
          };
        }
      }

      // Send to API
      console.log("🎭 CharacterCore: Sending API request to update character:", characterId);
      console.log("🎭 CharacterCore: Character data being sent:", characterData);
      
      // Store debug info globally so it persists
      window.lastCharacterSave = {
        characterId,
        dataSent: characterData,
        timestamp: new Date().toISOString()
      };
      
      const response = await fetch(`/api/characters/${characterId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(characterData),
      });

      console.log("🎭 CharacterCore: API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🎭 CharacterCore: API error response:", errorText);
        throw new Error(`Failed to update character: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("🎭 CharacterCore: API success response:", result);
      
      // Debug: Check what the character looks like in memory after update
      const updatedChar = isPlayerCharacter 
        ? this.playerCharacters.find(char => char.id === characterId)
        : this.importantNPCs.find(npc => npc.id === characterId);
      console.log("🎭 CharacterCore: Character in memory after update:", updatedChar);
      
      // Store complete debug info globally
      window.lastCharacterSave.apiResponse = result;
      window.lastCharacterSave.characterInMemory = updatedChar;
      window.lastCharacterSave.responseStatus = response.status;
      
      return result;
    } catch (error) {
      console.error("❌ Error updating character:", error);
      throw error;
    }
  }

  /**
   * Add a relationship between characters
   */
  async addRelationship(form) {
    try {
      const formData = new FormData(form);
      const fromCharacterId = formData.get("fromCharacter");
      const toCharacterId = formData.get("toCharacter");
      const relationshipType = formData.get("relationshipType");
      const description = formData.get("description");
      const isReciprocal = formData.get("reciprocal") === "on";

      if (fromCharacterId === toCharacterId) {
        throw new Error("Cannot create relationship with self");
      }

      // Find the characters
      const fromCharacterData = this.getCharacterById(fromCharacterId);
      const toCharacterData = this.getCharacterById(toCharacterId);

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

      // Save the relationship data to the database via the character manager
      if (window.characterManager && window.characterManager.relationships) {
        await window.characterManager.relationships.saveRelationshipData();
      }

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
   * Get character by ID
   */
  getCharacterById(characterId) {
    // Check player characters first
    let character = this.playerCharacters.find(
      (char) => char.id === characterId
    );
    if (character) {
      return { character, isPlayerCharacter: true };
    }

    // Check NPCs
    character = this.importantNPCs.find((npc) => npc.id === characterId);
    if (character) {
      return { character, isPlayerCharacter: false };
    }

    return { character: null, isPlayerCharacter: false };
  }

  /**
   * Get all characters (players + NPCs)
   */
  getAllCharacters() {
    return [...this.playerCharacters, ...this.importantNPCs];
  }

  /**
   * Generate character ID from name
   */
  generateCharacterId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  /**
   * Get current session number for notes
   */
  getCurrentSessionNumber() {
    // This would typically come from session manager
    // For now, return a default
    return 10;
  }

  /**
   * Format date string
   */
  formatDate(dateString) {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return "Invalid Date";
    }
  }

  /**
   * Format category name for display
   */
  formatCategoryName(category) {
    if (!category) return "General";
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
