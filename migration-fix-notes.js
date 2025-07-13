const Database = require('better-sqlite3');
const db = new Database('./campaign.db');

console.log('🚀 Starting notes migration script...');

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

try {
  const notes = db.prepare('SELECT id, tags FROM notes').all();
  let updatedCount = 0;

  const updateStmt = db.prepare('UPDATE notes SET tags = ? WHERE id = ?');

  for (const note of notes) {
    if (note.tags && !isJsonString(note.tags)) {
      console.log(`  - Migrating note ID ${note.id}: "${note.tags}" -> ["${note.tags}"]`);
      const newTags = JSON.stringify([note.tags]);
      updateStmt.run(newTags, note.id);
      updatedCount++;
    }
  }

  console.log(`\n✅ Migration complete. Updated ${updatedCount} notes.`);
} catch (error) {
  console.error('❌ Error during migration:', error);
}
