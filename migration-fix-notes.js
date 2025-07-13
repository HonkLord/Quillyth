const Database = require("better-sqlite3");
const db = new Database("./campaign.db");
const fs = require("fs");

console.log("🚀 Starting notes migration script...");

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

// Backup verification step
const backupPath = "./campaign.db.bak";
if (!fs.existsSync(backupPath)) {
  console.error(
    "❌ Backup not found! Please create a backup of campaign.db as campaign.db.bak before running this migration."
  );
  process.exit(1);
}

try {
  const notes = db.prepare("SELECT id, tags FROM notes").all();
  let updatedCount = 0;

  const updateStmt = db.prepare("UPDATE notes SET tags = ? WHERE id = ?");

  for (const note of notes) {
    if (note.tags && !isJsonString(note.tags)) {
      console.log(
        `  - Migrating note ID ${note.id}: "${note.tags}" -> ["${note.tags}"]`
      );
      const newTags = JSON.stringify([note.tags]);
      updateStmt.run(newTags, note.id);
      updatedCount++;
    }
  }

  console.log(`\n✅ Migration complete. Updated ${updatedCount} notes.`);
} catch (error) {
  console.error("❌ Error during migration:", error);
}
