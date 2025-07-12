// API Service for backend communication

export const ApiService = {
  async getLocations() {
    const response = await fetch("/api/locations");
    if (!response.ok) throw new Error("Failed to load locations");
    return response.json();
  },

  async createLocation(locationData) {
    const response = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(locationData),
    });
    if (!response.ok) throw new Error("Failed to create location");
    return response.json();
  },

  async updateLocation(locationId, updates) {
    const response = await fetch(`/api/locations/${locationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Failed to update location");
    return response.json();
  },

  async deleteLocation(locationId) {
    const response = await fetch(`/api/locations/${locationId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete location");
    return response.json();
  },

  async moveLocation(locationId, newParentId) {
    const response = await fetch(`/api/locations/${locationId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newParentId }),
    });
    if (!response.ok) throw new Error("Failed to move location");
    return response.json();
  },

  async getPlayers() {
    const response = await fetch("/api/players");
    if (!response.ok) throw new Error("Failed to load players");
    return response.json();
  },

  async getPlayer(playerId) {
    const response = await fetch(`/api/players/${playerId}`);
    if (!response.ok) throw new Error("Failed to fetch player data");
    return response.json();
  },

  async getPlayerNotes(playerId) {
    const response = await fetch(`/api/player-notes/${playerId}`);
    if (!response.ok) return { notes: "" }; // Gracefully fail
    return response.json();
  },

  // Scene methods
  async getScenes() {
    const response = await fetch("/api/scenes");
    if (!response.ok) throw new Error("Failed to load scenes");
    return response.json();
  },

  async getScene(sceneId) {
    const response = await fetch(`/api/scenes/${sceneId}`);
    if (!response.ok) throw new Error("Failed to load scene");
    return response.json();
  },

  async createScene(sceneData) {
    const response = await fetch("/api/scenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sceneData),
    });
    if (!response.ok) throw new Error("Failed to create scene");
    return response.json();
  },

  async updateScene(sceneId, updates) {
    const response = await fetch(`/api/scenes/${sceneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Failed to update scene");
    return response.json();
  },

  async deleteScene(sceneId) {
    const response = await fetch(`/api/scenes/${sceneId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete scene");
    return response.json();
  },

  // Character methods
  async getCharacters() {
    const response = await fetch("/api/characters");
    if (!response.ok) throw new Error("Failed to load characters");
    return response.json();
  },

  async getCharacter(characterId) {
    const response = await fetch(`/api/characters/${characterId}`);
    if (!response.ok) throw new Error("Failed to load character");
    return response.json();
  },

  async createCharacter(characterData) {
    const response = await fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(characterData),
    });
    if (!response.ok) throw new Error("Failed to create character");
    return response.json();
  },

  async updateCharacter(characterId, updates) {
    const response = await fetch(`/api/characters/${characterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Failed to update character");
    return response.json();
  },

  async deleteCharacter(characterId) {
    const response = await fetch(`/api/characters/${characterId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete character");
    return response.json();
  },

  // Character Notes API
  async getCharacterNotes(characterId, characterType = "player") {
    const response = await fetch(
      `/api/characters/${characterId}/notes?character_type=${characterType}`
    );
    if (!response.ok) throw new Error("Failed to load character notes");
    return response.json();
  },

  async createCharacterNote(characterId, noteData) {
    const response = await fetch(`/api/characters/${characterId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noteData),
    });
    if (!response.ok) throw new Error("Failed to create character note");
    return response.json();
  },

  async updateCharacterNote(characterId, noteId, updates) {
    const response = await fetch(
      `/api/characters/${characterId}/notes/${noteId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }
    );
    if (!response.ok) throw new Error("Failed to update character note");
    return response.json();
  },

  async deleteCharacterNote(characterId, noteId) {
    const response = await fetch(
      `/api/characters/${characterId}/notes/${noteId}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) throw new Error("Failed to delete character note");
    return response.json();
  },

  // Character Relationships API
  async getCharacterRelationships(characterId, characterType = "player") {
    const response = await fetch(
      `/api/characters/${characterId}/relationships?character_type=${characterType}`
    );
    if (!response.ok) throw new Error("Failed to load character relationships");
    return response.json();
  },

  async getAllRelationships() {
    const response = await fetch("/api/relationships");
    if (!response.ok) throw new Error("Failed to load relationships");
    return response.json();
  },

  async createRelationship(relationshipData) {
    const response = await fetch("/api/relationships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(relationshipData),
    });
    if (!response.ok) throw new Error("Failed to create relationship");
    return response.json();
  },

  async updateRelationship(relationshipId, updates) {
    const response = await fetch(`/api/relationships/${relationshipId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Failed to update relationship");
    return response.json();
  },

  async deleteRelationship(relationshipId) {
    const response = await fetch(`/api/relationships/${relationshipId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete relationship");
    return response.json();
  },

  // Character Progression API
  async getCharacterProgression(characterId, characterType = "player") {
    const response = await fetch(
      `/api/characters/${characterId}/progression?character_type=${characterType}`
    );
    if (!response.ok) throw new Error("Failed to load character progression");
    return response.json();
  },

  async createProgressionEntry(characterId, progressionData) {
    const response = await fetch(`/api/characters/${characterId}/progression`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(progressionData),
    });
    if (!response.ok) throw new Error("Failed to create progression entry");
    return response.json();
  },

  async updateProgressionEntry(characterId, progressionId, updates) {
    const response = await fetch(
      `/api/characters/${characterId}/progression/${progressionId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }
    );
    if (!response.ok) throw new Error("Failed to update progression entry");
    return response.json();
  },

  async deleteProgressionEntry(characterId, progressionId) {
    const response = await fetch(
      `/api/characters/${characterId}/progression/${progressionId}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) throw new Error("Failed to delete progression entry");
    return response.json();
  },

  // ... other player and opportunity related API calls can be added here
};
