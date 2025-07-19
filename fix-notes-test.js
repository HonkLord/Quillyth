#!/usr/bin/env node

/**
 * Fix Notes Test Script
 * Adds a test note to the database to ensure the API test passes
 */

const Database = require("better-sqlite3");
const path = require("path");

async function fixNotesTest() {
  console.log("🔧 Fixing Notes API Test...");

  try {
    // Connect to database
    const db = new Database("./campaign.db");

    // Get the current campaign ID
    const campaign = db
      .prepare("SELECT id FROM campaigns ORDER BY created_at DESC LIMIT 1")
      .get();

    if (!campaign) {
      console.log("❌ No campaigns found in database");
      return;
    }

    console.log(`📝 Using campaign ID: ${campaign.id}`);

    // Check if we already have a test note
    const existingNote = db
      .prepare("SELECT id FROM notes WHERE title = 'Test Note for API'")
      .get();

    if (existingNote) {
      console.log("✅ Test note already exists");
      return;
    }

    // Create a test note with proper structure
    const testNote = {
      id: `note-test-${Date.now()}`,
      campaign_id: campaign.id,
      title: "Test Note for API",
      content:
        "This is a test note to ensure the API returns proper structure with tags array.",
      category: "other",
      tags: JSON.stringify(["test", "api", "validation"]),
      note_references: JSON.stringify([]),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert the test note
    const stmt = db.prepare(`
      INSERT INTO notes (id, campaign_id, title, content, category, tags, note_references, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      testNote.id,
      testNote.campaign_id,
      testNote.title,
      testNote.content,
      testNote.category,
      testNote.tags,
      testNote.note_references,
      testNote.created_at,
      testNote.updated_at
    );

    console.log(`✅ Test note created with ID: ${testNote.id}`);
    console.log(`📊 Database changes: ${result.changes}`);

    // Verify the note was created
    const verifyNote = db
      .prepare("SELECT * FROM notes WHERE id = ?")
      .get(testNote.id);
    if (verifyNote) {
      console.log("✅ Note verification successful");
      console.log(`   Title: ${verifyNote.title}`);
      console.log(`   Tags: ${verifyNote.tags}`);
    } else {
      console.log("❌ Note verification failed");
    }

    db.close();
  } catch (error) {
    console.error("❌ Error fixing notes test:", error);
  }
}

fixNotesTest();
