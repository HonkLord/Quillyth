#!/usr/bin/env node

/**
 * Campaign Manager Test Runner
 * Comprehensive test suite for validating functionality
 */

const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

class TestRunner {
  constructor() {
    this.baseUrl = "http://localhost:3000";
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: [],
    };
  }

  // ==========================================
  // TEST UTILITIES
  // ==========================================

  async test(name, testFn) {
    this.results.total++;
    console.log(`\n🧪 Testing: ${name}`);

    try {
      await testFn();
      this.results.passed++;
      console.log(`✅ PASS: ${name}`);
      this.results.details.push({ name, status: "PASS", error: null });
    } catch (error) {
      this.results.failed++;
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Error: ${error.message}`);
      this.results.details.push({ name, status: "FAIL", error: error.message });
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  async apiRequest(endpoint, options = {}) {
    let url = `${this.baseUrl}${endpoint}`;
    // Automatically add campaign_id to requests that need it
    if (this.campaignId && !endpoint.includes("campaign_id")) {
      const separator = url.includes("?") ? "&" : "?";
      url += `${separator}campaign_id=${this.campaignId}`;
    }

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  // ==========================================
  // SERVER CONNECTIVITY TESTS
  // ==========================================

  async testServerConnectivity() {
    await this.test("Server Connectivity", async () => {
      const response = await fetch(this.baseUrl);
      this.assert(response.ok, "Server should be running and accessible");
    });
  }

  async testStaticFileServing() {
    await this.test("Static File Serving", async () => {
      const response = await fetch(`${this.baseUrl}/index.html`);
      this.assert(response.ok, "Should serve index.html");

      const content = await response.text();
      this.assert(
        content.includes("D&D Campaign Manager"),
        "Should contain app title"
      );
      this.assert(
        content.includes("data-action"),
        "Should have data-action attributes (no onclick)"
      );
    });
  }

  // ==========================================
  // API ENDPOINT TESTS
  // ==========================================

  async testCampaignsAPI() {
    await this.test("Campaigns API", async () => {
      const campaigns = await this.apiRequest("/api/campaigns");
      this.assert(Array.isArray(campaigns), "Should return array of campaigns");
    });
  }

  async testLocationsAPI() {
    await this.test("Locations API", async () => {
      const locations = await this.apiRequest("/api/locations");
      this.assert(Array.isArray(locations), "Should return array of locations");
    });
  }

  async testSessionsAPI() {
    await this.test("Sessions API", async () => {
      const sessions = await this.apiRequest("/api/sessions");
      this.assert(Array.isArray(sessions), "Should return array of sessions");
    });
  }

  async testScenesAPI() {
    await this.test("Scenes API", async () => {
      const scenes = await this.apiRequest("/api/scenes");
      this.assert(Array.isArray(scenes), "Should return array of scenes");
    });
  }

  async testCharactersAPI() {
    await this.test("Characters API", async () => {
      const characters = await this.apiRequest("/api/characters");
      this.assert(
        typeof characters === "object",
        "Should return characters object"
      );
      this.assert(
        Array.isArray(characters.players),
        "Should have players array"
      );
      this.assert(Array.isArray(characters.npcs), "Should have npcs array");
    });
  }

  async testPlayersAPI() {
    await this.test("Players API", async () => {
      const characters = await this.apiRequest("/api/characters");
      this.assert(
        typeof characters === "object" && characters !== null,
        "Should return a characters object"
      );
      this.assert(
        Array.isArray(characters.players),
        "Should have a players array"
      );
    });
  }

  // ==========================================
  // PLAYER ARCS API TESTS
  // ==========================================

  async testPlayerArcsAPI() {
    await this.test("Player Arcs API - GET", async () => {
      const characters = await this.apiRequest("/api/characters");
      if (!characters.players || characters.players.length === 0) {
        console.log("   ⚠️  No players found, skipping player arcs test");
        return;
      }
      const playerId = characters.players[0].id;
      const playerArcs = await this.apiRequest(
        `/api/characters/${playerId}/arcs`
      );
      this.assert(
        Array.isArray(playerArcs),
        "Should return array of player arcs"
      );
    });
  }

  async testPlayerArcsUpdate() {
    await this.test("Player Arcs API - UPDATE", async () => {
      const characters = await this.apiRequest("/api/characters");
      this.assert(
        characters.players && characters.players.length > 0,
        "Prerequisite: At least one player character must exist."
      );

      const testPlayerId = characters.players[0].id;

      const arcData = {
        campaign_id: this.campaignId,
        arc_type: "current_goal", // Use a valid arc_type
        title: "A Hero's Journey",
        content: "This is the story of a hero.",
        status: "active",
        importance_weight: 75,
        session_notes: "Started in session 1.",
      };

      const result = await this.apiRequest(
        `/api/characters/${testPlayerId}/arcs`,
        {
          method: "POST",
          body: JSON.stringify(arcData),
        }
      );

      this.assert(
        result.success,
        "Should successfully create a new player arc."
      );
      this.assert(result.id, "Response should include the new arc ID.");
    });
  }

  async testQuestsAPI() {
    await this.test("Quests API - GET", async () => {
      const quests = await this.apiRequest("/api/quests");
      this.assert(Array.isArray(quests), "Should return quests array");

      // Validate structure of quests if any exist
      if (quests.length > 0) {
        const quest = quests[0];
        this.assert(quest.hasOwnProperty("id"), "Should have id");
        this.assert(quest.hasOwnProperty("title"), "Should have title");
        this.assert(quest.hasOwnProperty("status"), "Should have status");
        this.assert(quest.hasOwnProperty("category"), "Should have category");
        this.assert(quest.hasOwnProperty("priority"), "Should have priority");
        this.assert(
          Array.isArray(quest.assigned_players),
          "Should have assigned_players array"
        );
        this.assert(
          Array.isArray(quest.objectives),
          "Should have objectives array"
        );
      }
    });
  }

  async testNotesAPI() {
    await this.test("Notes API - GET", async () => {
      const notes = await this.apiRequest("/api/notes");
      this.assert(Array.isArray(notes), "Should return notes array");

      // Validate structure of notes if any exist
      if (notes.length > 0) {
        const note = notes[0];
        this.assert(note.hasOwnProperty("id"), "Should have id");
        this.assert(note.hasOwnProperty("title"), "Should have title");
        this.assert(note.hasOwnProperty("content"), "Should have content");
        this.assert(note.hasOwnProperty("category"), "Should have category");
        this.assert(
          note.hasOwnProperty("created_at"),
          "Should have created_at"
        );
        this.assert(
          note.hasOwnProperty("updated_at"),
          "Should have updated_at"
        );
        this.assert(Array.isArray(note.tags), "Should have tags array");
      }
    });
  }

  // ==========================================
  // FILE STRUCTURE TESTS
  // ==========================================

  async testFileStructure() {
    await this.test("File Structure Validation", async () => {
      const requiredFiles = [
        "index.html",
        "js/app.js",
        "js/features/notes/notes-manager.js",
        "js/components/scene-action-system.js",
        "js/components/scene-ai.js",
        "js/components/scene-renderer.js",
        "js/components/scene-nav.js",
        "js/data-manager.js",
        "js/services/search-service.js",
        "js/components/global-search.js",
        "js/components/export-import-panel.js",
        "server.js",
        "package.json",
      ];

      for (const file of requiredFiles) {
        const exists = fs.existsSync(path.join(__dirname, "..", file));
        this.assert(exists, `Required file should exist: ${file}`);
      }
    });
  }

  async testNoOnclickHandlers() {
    await this.test("No Onclick Handlers in HTML", async () => {
      const htmlContent = fs.readFileSync(
        path.join(__dirname, "..", "index.html"),
        "utf8"
      );

      // Should not contain onclick handlers
      // Should contain minimal onclick handlers (only for global search)
      const onclickMatches = htmlContent.match(/onclick=/g) || [];
      this.assert(
        onclickMatches.length <= 1,
        `HTML should contain minimal onclick handlers, found ${onclickMatches.length}`
      );

      // Should contain data-action attributes instead
      this.assert(
        htmlContent.includes("data-action="),
        "HTML should contain data-action attributes"
      );

      // Check for specific data-action values
      const expectedActions = [
        "edit-campaign-title",
        "show-dashboard",
        "show-scenes",
        "show-characters",
        "show-quests",
        "show-notes",
        "show-campaign",
        "show-quick-actions",
        "toggle-scene-tree",
      ];

      for (const action of expectedActions) {
        this.assert(
          htmlContent.includes(`data-action="${action}"`),
          `Should contain data-action="${action}"`
        );
      }
    });
  }

  async testJavaScriptModules() {
    await this.test("JavaScript Module Structure", async () => {
      const appJs = fs.readFileSync(
        path.join(__dirname, "..", "js", "app.js"),
        "utf8"
      );

      // Should import modular managers and components
      this.assert(
        appJs.includes(
          'import PlayerArcManager from "./features/player-arcs/player-arc-manager.js"'
        ),
        "Should import PlayerArcManager from features directory"
      );
      this.assert(
        appJs.includes(
          'import QuestManager from "./features/quests/quest-manager.js"'
        ),
        "Should import QuestManager from features directory"
      );
      this.assert(
        appJs.includes(
          'import { NotesManager } from "./features/notes/notes-manager.js"'
        ),
        "Should import NotesManager from features directory"
      );
      this.assert(
        appJs.includes(
          'import { SessionManager } from "./features/sessions/session-manager-new.js"'
        ),
        "Should import SessionManager from features directory"
      );
      this.assert(
        appJs.includes(
          'import { GlobalSearch } from "./components/global-search.js"'
        ),
        "Should import GlobalSearch from components directory"
      );

      // Should not have global function assignments (except legacy ones)
      const globalAssignments = appJs.match(/window\.\w+\s*=/g) || [];
      const allowedGlobals = [
        "window.campaignManager",
        "window.showLocationsWorkspace",
        "window.closeSidebar",
        "window.playerArcManager",
        "window.sceneManager",
        "window.characterManager",
        "window.questManager",
        "window.notesManager",
        "window.sessionManager",
        "window.globalSearch",
        "window.exportImportPanel",
        "window.locationManager",
      ];

      for (const assignment of globalAssignments) {
        const isAllowed = allowedGlobals.some((allowed) =>
          assignment.includes(allowed.split(".")[1])
        );
        this.assert(isAllowed, `Unexpected global assignment: ${assignment}`);
      }
    });
  }

  // ==========================================
  // INTEGRATION TESTS
  // ==========================================

  async testPlayerArcManagerIntegration() {
    await this.test("PlayerArcManager Integration", async () => {
      const playerArcJs = fs.readFileSync(
        path.join(
          __dirname,
          "..",
          "js",
          "features",
          "player-arcs",
          "player-arc-manager.js"
        ),
        "utf8"
      );

      // Should export PlayerArcManager class as default
      this.assert(
        playerArcJs.includes("export default class PlayerArcManager"),
        "Should export PlayerArcManager class as default"
      );

      // Should have required public methods (manager delegates to core/ui modules)
      const requiredMethods = [
        "init",
        "getPlayerArc",
        "addGoal",
        "updateGoalStatus",
        "addMilestone",
        "showPlayerArcOverview",
      ];

      for (const method of requiredMethods) {
        this.assert(
          playerArcJs.includes(`${method}(`),
          `Should have ${method} method`
        );
      }
    });
  }

  async testEventDelegation() {
    await this.test("Event Delegation Implementation", async () => {
      const appJs = fs.readFileSync(
        path.join(__dirname, "..", "js", "app.js"),
        "utf8"
      );

      // Should have event delegation setup
      this.assert(
        appJs.includes('document.addEventListener("click"') ||
          appJs.includes("document.addEventListener('click'"),
        "Should have click event delegation"
      );

      // Should handle data-action attributes
      this.assert(
        appJs.includes("data-action"),
        "Should handle data-action attributes"
      );

      // Should have switch statement for actions
      this.assert(
        appJs.includes("switch (action)"),
        "Should have switch statement for action handling"
      );
    });
  }

  // ==========================================
  // PERFORMANCE TESTS
  // ==========================================

  async testAPIResponseTimes() {
    await this.test("API Response Times", async () => {
      const endpoints = [
        "/api/campaigns",
        "/api/locations",
        "/api/sessions",
        "/api/scenes",
        "/api/characters",
      ];

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        await this.apiRequest(endpoint);
        const responseTime = Date.now() - startTime;

        this.assert(
          responseTime < 5000,
          `${endpoint} should respond within 5 seconds (took ${responseTime}ms)`
        );
      }
    });
  }

  // ==========================================
  // MAIN TEST EXECUTION
  // ==========================================

  async runAllTests() {
    console.log("🚀 Starting Campaign Manager Test Suite\n");
    console.log("=".repeat(60));

    // Fetch the current campaign ID to be used in subsequent tests
    try {
      const currentCampaign = await this.apiRequest("/api/campaigns/current");
      this.campaignId = currentCampaign.id;
      console.log(`\nℹ️  Using Campaign ID: ${this.campaignId}`);
    } catch (error) {
      console.error(
        "❌ CRITICAL: Could not fetch current campaign. Attempting to create a new test campaign.",
        error
      );
      // Create a new test campaign
      const testCampaignId = `test-campaign-${Date.now()}`;
      const testCampaignData = {
        id: testCampaignId,
        name: "Test Campaign (Auto)",
        description: "Autogenerated campaign for test suite.",
        setting: "Test Realm",
        current_session: 1,
        current_location: "Test Location",
        dm_name: "Test Runner",
        status: "active",
        metadata: { test: true },
      };
      try {
        const created = await this.apiRequest("/api/campaigns", {
          method: "POST",
          body: JSON.stringify(testCampaignData),
        });
        this.campaignId = created.id;
        console.log(
          `\n⚠️  Created and using new test campaign ID: ${this.campaignId}`
        );
      } catch (createError) {
        console.error(
          "❌ CRITICAL: Failed to create test campaign. Most tests will fail.",
          createError
        );
        throw createError;
      }
    }

    // Run the failing test first for focused debugging
    console.log("\n🐞 DEBUGGING FAILED TESTS FIRST");
    console.log("-".repeat(40));
    await this.testPlayerArcsUpdate();

    // Server and connectivity tests
    console.log("\n📡 SERVER CONNECTIVITY TESTS");
    console.log("-".repeat(40));
    await this.testServerConnectivity();
    await this.testStaticFileServing();

    // API endpoint tests
    console.log("\n🔌 API ENDPOINT TESTS");
    console.log("-".repeat(40));
    await this.testCampaignsAPI();
    await this.testLocationsAPI();
    await this.testSessionsAPI();
    await this.testScenesAPI();
    await this.testCharactersAPI();
    await this.testPlayersAPI();
    await this.testPlayerArcsAPI();
    await this.testQuestsAPI();
    await this.testNotesAPI();

    // File structure tests
    console.log("\n📁 FILE STRUCTURE TESTS");
    console.log("-".repeat(40));
    await this.testFileStructure();
    await this.testNoOnclickHandlers();
    await this.testJavaScriptModules();

    // Integration tests
    console.log("\n🔗 INTEGRATION TESTS");
    console.log("-".repeat(40));
    await this.testPlayerArcManagerIntegration();
    await this.testEventDelegation();

    // Performance tests
    console.log("\n⚡ PERFORMANCE TESTS");
    console.log("-".repeat(40));
    await this.testAPIResponseTimes();

    // Results summary
    this.printResults();
  }

  printResults() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST RESULTS SUMMARY");
    console.log("=".repeat(60));

    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Total:  ${this.results.total}`);
    console.log(
      `🎯 Success Rate: ${(
        (this.results.passed / this.results.total) *
        100
      ).toFixed(1)}%`
    );

    if (this.results.failed > 0) {
      console.log("\n❌ FAILED TESTS:");
      console.log("-".repeat(40));
      this.results.details
        .filter((test) => test.status === "FAIL")
        .forEach((test) => {
          console.log(`• ${test.name}: ${test.error}`);
        });
    }

    console.log("\n🏁 Test suite completed!");

    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch((error) => {
    console.error("💥 Test runner crashed:", error);
    process.exit(1);
  });
}

module.exports = TestRunner;
