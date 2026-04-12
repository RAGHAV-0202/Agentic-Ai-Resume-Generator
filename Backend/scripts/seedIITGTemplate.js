/**
 * Seed the IITG-style template into MongoDB
 * Run: node scripts/seedIITGTemplate.js
 */
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const templateSchema = new mongoose.Schema({
  name: String,
  latexTemplate: String,
  thumbnailUrl: String,
  isDefault: Boolean,
}, { collection: "templates", strict: false });

const Template = mongoose.model("SeedTemplate", templateSchema);

async function seed() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("No MONGODB_URI found in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  // Check if already exists
  const existing = await Template.findOne({ name: "IITG Style (Gray Headers)" });
  if (existing) {
    console.log("Template 'IITG Style (Gray Headers)' already exists. Updating...");
    const latex = fs.readFileSync(path.resolve(__dirname, "../templates/iitg_template.tex"), "utf-8");
    existing.latexTemplate = latex;
    await existing.save();
    console.log("Updated!");
  } else {
    const latex = fs.readFileSync(path.resolve(__dirname, "../templates/iitg_template.tex"), "utf-8");
    await Template.create({
      name: "IITG Style (Gray Headers)",
      latexTemplate: latex,
      thumbnailUrl: "",
      isDefault: false,
    });
    console.log("Created template 'IITG Style (Gray Headers)'");
  }

  await mongoose.disconnect();
  console.log("Done!");
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
