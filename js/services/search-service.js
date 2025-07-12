/**
 * Global Search Service
 * Provides unified search functionality across all content types
 */
export class SearchService {
  constructor() {
    this.searchableTypes = {
      scenes: { weight: 3, fields: ["name", "description", "scene_type"] },
      characters: { weight: 3, fields: ["name", "description", "role"] },
      locations: { weight: 3, fields: ["name", "description", "atmosphere"] },
      quests: { weight: 2, fields: ["title", "description", "objectives"] },
      notes: { weight: 1, fields: ["title", "content", "category"] },
      players: { weight: 2, fields: ["name", "class", "background"] },
    };

    this.searchIndex = new Map();
    this.lastIndexUpdate = 0;
    this.indexUpdateInterval = 30000; // 30 seconds
  }

  /**
   * Perform global search across all content types
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} Search results with relevance scoring
   */
  async globalSearch(query, options = {}) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const results = [];

    // Update search index if needed
    await this.updateSearchIndex();

    // Search each content type
    for (const [type, config] of Object.entries(this.searchableTypes)) {
      if (options.types && !options.types.includes(type)) {
        continue;
      }

      const typeResults = await this.searchContentType(
        type,
        searchTerm,
        config
      );
      results.push(...typeResults);
    }

    // Sort by relevance score
    results.sort((a, b) => b.score - a.score);

    // Apply limit if specified
    if (options.limit) {
      return results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Search within a specific content type
   * @param {string} type - Content type to search
   * @param {string} searchTerm - Search term
   * @param {Object} config - Type configuration
   * @returns {Array} Search results for this type
   */
  async searchContentType(type, searchTerm, config) {
    const data = await this.getContentData(type);
    const results = [];

    for (const item of data) {
      const score = this.calculateRelevanceScore(item, searchTerm, config);
      if (score > 0) {
        results.push({
          type,
          id: item.id,
          title: this.getItemTitle(item, type),
          description: this.getItemDescription(item, type),
          score,
          data: item,
          matches: this.getMatches(item, searchTerm, config),
        });
      }
    }

    return results;
  }

  /**
   * Calculate relevance score for an item
   * @param {Object} item - Item to score
   * @param {string} searchTerm - Search term
   * @param {Object} config - Type configuration
   * @returns {number} Relevance score
   */
  calculateRelevanceScore(item, searchTerm, config) {
    let score = 0;
    const matches = [];

    for (const field of config.fields) {
      const fieldValue = this.getFieldValue(item, field);
      if (!fieldValue) continue;

      const fieldText = fieldValue.toLowerCase();

      // Exact match in title/name gets highest score
      if (field === "name" || field === "title") {
        if (fieldText === searchTerm) {
          score += 10 * config.weight;
          matches.push({ field, type: "exact", text: fieldValue });
        } else if (fieldText.includes(searchTerm)) {
          score += 5 * config.weight;
          matches.push({ field, type: "partial", text: fieldValue });
        }
      }
      // Partial matches in other fields
      else if (fieldText.includes(searchTerm)) {
        score += config.weight;
        matches.push({ field, type: "partial", text: fieldValue });
      }

      // Word boundary matches get bonus
      const wordBoundaryRegex = new RegExp(
        `\\b${this.escapeRegex(searchTerm)}\\b`,
        "i"
      );
      if (wordBoundaryRegex.test(fieldText)) {
        score += config.weight * 0.5;
      }
    }

    return score;
  }

  /**
   * Get field value from item, handling nested properties
   * @param {Object} item - Item to get field from
   * @param {string} field - Field name
   * @returns {string} Field value
   */
  getFieldValue(item, field) {
    switch (field) {
      case "objectives":
        return Array.isArray(item.objectives)
          ? item.objectives
              .map((obj) => (typeof obj === "string" ? obj : obj.text))
              .join(" ")
          : "";
      default:
        return item[field] || "";
    }
  }

  /**
   * Get matches for highlighting
   * @param {Object} item - Item
   * @param {string} searchTerm - Search term
   * @param {Object} config - Type configuration
   * @returns {Array} Match information
   */
  getMatches(item, searchTerm, config) {
    const matches = [];

    for (const field of config.fields) {
      const fieldValue = this.getFieldValue(item, field);
      if (fieldValue && fieldValue.toLowerCase().includes(searchTerm)) {
        matches.push({
          field,
          value: fieldValue,
          highlighted: this.highlightText(fieldValue, searchTerm),
        });
      }
    }

    return matches;
  }

  /**
   * Highlight search term in text
   * @param {string} text - Text to highlight
   * @param {string} searchTerm - Term to highlight
   * @returns {string} Text with highlighted terms
   */
  highlightText(text, searchTerm) {
    const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  }

  /**
   * Escape regex special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Get content data for a specific type
   * @param {string} type - Content type
   * @returns {Array} Content data
   */
  async getContentData(type) {
    try {
      switch (type) {
        case "scenes":
          const scenesResponse = await fetch("/api/scenes");
          return scenesResponse.ok ? await scenesResponse.json() : [];

        case "characters":
          const charactersResponse = await fetch("/api/characters");
          return charactersResponse.ok ? await charactersResponse.json() : [];

        case "locations":
          const locationsResponse = await fetch("/api/locations");
          return locationsResponse.ok ? await locationsResponse.json() : [];

        case "quests":
          const questsResponse = await fetch("/api/quests");
          return questsResponse.ok ? await questsResponse.json() : [];

        case "notes":
          const notesResponse = await fetch("/api/notes");
          return notesResponse.ok ? await notesResponse.json() : [];

        case "players":
          const playersResponse = await fetch("/api/players");
          return playersResponse.ok ? await playersResponse.json() : [];

        default:
          return [];
      }
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error);
      return [];
    }
  }

  /**
   * Get display title for an item
   * @param {Object} item - Item
   * @param {string} type - Content type
   * @returns {string} Display title
   */
  getItemTitle(item, type) {
    switch (type) {
      case "scenes":
      case "locations":
      case "characters":
      case "players":
        return item.name || item.title || "Untitled";
      case "quests":
      case "notes":
        return item.title || "Untitled";
      default:
        return item.name || item.title || "Untitled";
    }
  }

  /**
   * Get display description for an item
   * @param {Object} item - Item
   * @param {string} type - Content type
   * @returns {string} Display description
   */
  getItemDescription(item, type) {
    const desc = item.description || item.content || "";
    return desc.length > 150 ? desc.substring(0, 150) + "..." : desc;
  }

  /**
   * Update search index (for future optimization)
   * @private
   */
  async updateSearchIndex() {
    const now = Date.now();
    if (now - this.lastIndexUpdate < this.indexUpdateInterval) {
      return; // Index is still fresh
    }

    // For now, we fetch data on-demand
    // In the future, we could build a more sophisticated index
    this.lastIndexUpdate = now;
  }

  /**
   * Get search suggestions based on partial input
   * @param {string} partial - Partial search term
   * @param {number} limit - Maximum suggestions
   * @returns {Array} Search suggestions
   */
  async getSearchSuggestions(partial, limit = 5) {
    if (!partial || partial.length < 2) {
      return [];
    }

    const results = await this.globalSearch(partial, { limit: limit * 2 });
    const suggestions = [];
    const seen = new Set();

    for (const result of results) {
      const title = result.title.toLowerCase();
      if (!seen.has(title) && title.includes(partial.toLowerCase())) {
        suggestions.push({
          text: result.title,
          type: result.type,
          id: result.id,
        });
        seen.add(title);

        if (suggestions.length >= limit) {
          break;
        }
      }
    }

    return suggestions;
  }

  /**
   * Search within a specific workspace
   * @param {string} workspace - Workspace type (scenes, quests, notes, etc.)
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array} Filtered results
   */
  async searchWorkspace(workspace, query, filters = {}) {
    const results = await this.globalSearch(query, { types: [workspace] });

    // Apply workspace-specific filters
    return this.applyWorkspaceFilters(results, workspace, filters);
  }

  /**
   * Apply workspace-specific filters
   * @param {Array} results - Search results
   * @param {string} workspace - Workspace type
   * @param {Object} filters - Filters to apply
   * @returns {Array} Filtered results
   */
  applyWorkspaceFilters(results, workspace, filters) {
    let filtered = results;

    switch (workspace) {
      case "quests":
        if (filters.status) {
          filtered = filtered.filter((r) => r.data.status === filters.status);
        }
        if (filters.category) {
          filtered = filtered.filter(
            (r) => r.data.category === filters.category
          );
        }
        break;

      case "notes":
        if (filters.category) {
          filtered = filtered.filter(
            (r) => r.data.category === filters.category
          );
        }
        if (filters.tags && filters.tags.length > 0) {
          filtered = filtered.filter((r) => {
            const noteTags = Array.isArray(r.data.tags)
              ? r.data.tags
              : typeof r.data.tags === "string"
              ? JSON.parse(r.data.tags || "[]")
              : [];
            return filters.tags.some((tag) => noteTags.includes(tag));
          });
        }
        break;

      case "characters":
        if (filters.role) {
          filtered = filtered.filter((r) => r.data.role === filters.role);
        }
        break;
    }

    return filtered;
  }
}
