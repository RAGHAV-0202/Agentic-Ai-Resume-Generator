/**
 * ═══════════════════════════════════════════════════════════════════
 * TEMPLATE MIGRATION SCRIPT
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Batch-updates ALL templates in MongoDB to add new placeholders.
 * 
 * Run:  node scripts/migrateTemplates.js
 * 
 * This is useful when you add a new feature that requires a new
 * placeholder in every template. Instead of editing them one-by-one
 * in MongoDB Atlas, run this script.
 * 
 * HOW TO USE:
 * 1. Add your migration to the MIGRATIONS array below
 * 2. Run: node scripts/migrateTemplates.js
 * 3. Done — all templates are updated
 * 
 * The script is IDEMPOTENT: running it multiple times is safe.
 * It skips templates that already have the placeholder.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ═══════════════════════════════════════════════════════════════════
// MIGRATION DEFINITIONS
// ═══════════════════════════════════════════════════════════════════
// Each migration inserts a placeholder AFTER a specific pattern.
// Add new entries here whenever you introduce a new template variable.

const MIGRATIONS = [
  {
    name: "Add {{CUSTOM_SKILLS_BLOCK}}",
    placeholder: "{{CUSTOM_SKILLS_BLOCK}}",
    // Insert after the last standard skill conditional
    afterPattern: /\{\{\/IF_LIBRARIES\}\}/,
    // Fallback: insert before the closing }} of the skill item block
    fallbackPattern: /\{\{\/IF_TOOLS\}\}/,
    insertText: "\n     {{CUSTOM_SKILLS_BLOCK}}",
  },
  // ── Future migrations go here ──────────────────────────────────
  // {
  //   name: "Add {{CERTIFICATIONS_BLOCK}}",
  //   placeholder: "{{CERTIFICATIONS_BLOCK}}",
  //   afterPattern: /\{\{\/IF_ACHIEVEMENTS\}\}/,
  //   insertText: "\n{{CERTIFICATIONS_BLOCK}}",
  // },
];

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE SCHEMA (minimal — just what we need)
// ═══════════════════════════════════════════════════════════════════
const templateSchema = new mongoose.Schema({
  name: String,
  latexTemplate: String,
}, { collection: "templates", strict: false });

const Template = mongoose.model("MigrationTemplate", templateSchema);

// ═══════════════════════════════════════════════════════════════════
// RUN MIGRATIONS
// ═══════════════════════════════════════════════════════════════════
async function migrate() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  TEMPLATE MIGRATION SCRIPT");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ No MONGODB_URI found in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB\n");

  // Fetch all templates
  const templates = await Template.find({});
  console.log(`📄 Found ${templates.length} template(s)\n`);

  let totalUpdated = 0;

  for (const template of templates) {
    console.log(`─── Template: "${template.name}" (${template._id}) ───`);
    let latex = template.latexTemplate;
    let modified = false;

    for (const migration of MIGRATIONS) {
      // Skip if already applied
      if (latex.includes(migration.placeholder)) {
        console.log(`  ✓ ${migration.name} — already present, skipping`);
        continue;
      }

      // Try primary pattern
      const primaryMatch = latex.match(migration.afterPattern);
      if (primaryMatch) {
        const insertPos = primaryMatch.index + primaryMatch[0].length;
        latex = latex.slice(0, insertPos) + migration.insertText + latex.slice(insertPos);
        console.log(`  ✅ ${migration.name} — injected after "${migration.afterPattern}"`);
        modified = true;
        continue;
      }

      // Try fallback
      if (migration.fallbackPattern) {
        const fallbackMatch = latex.match(migration.fallbackPattern);
        if (fallbackMatch) {
          const insertPos = fallbackMatch.index + fallbackMatch[0].length;
          latex = latex.slice(0, insertPos) + migration.insertText + latex.slice(insertPos);
          console.log(`  ✅ ${migration.name} — injected after fallback "${migration.fallbackPattern}"`);
          modified = true;
          continue;
        }
      }

      console.log(`  ⚠️  ${migration.name} — no injection point found, skipping`);
    }

    if (modified) {
      template.latexTemplate = latex;
      await template.save();
      totalUpdated++;
      console.log(`  💾 Saved!\n`);
    } else {
      console.log(`  (no changes needed)\n`);
    }
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  DONE — ${totalUpdated}/${templates.length} templates updated`);
  console.log("═══════════════════════════════════════════════════════════\n");

  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
