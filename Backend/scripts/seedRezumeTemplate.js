import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Template from "../src/models/Template.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("❌ MONGODB_URI is not defined in .env file");
  process.exit(1);
}

const seedRezumeTemplate = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const templatePath = path.resolve(__dirname, "../templates/rezume_template.tex");
    const latexContent = fs.readFileSync(templatePath, "utf-8");

    const newTemplate = {
      name: "Rezume Style (Blue accents)",
      slug: "rezume-style",
      description: "A professional and modern template with elegant blue text headers.",
      latexTemplate: latexContent,
      thumbnailUrl: "https://raw.githubusercontent.com/NanuPanchamurthy/Rezume/refs/heads/master/preview.png",
      isActive: true,
      requiredFields: ["personal", "education", "experience"],
      optionalFields: ["projects", "skills", "achievements", "summary"],
      createdBy: "admin", 
    };

    // Check if it exists
    const existing = await Template.findOne({ slug: newTemplate.slug });
    if (existing) {
      console.log(`Template '${newTemplate.name}' already exists. Updating...`);
      await Template.updateOne({ slug: newTemplate.slug }, newTemplate);
      console.log("✅ Updated!");
    } else {
      await Template.create(newTemplate);
      console.log(`✅ Template '${newTemplate.name}' created successfully!`);
    }

    mongoose.connection.close();
    console.log("Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedRezumeTemplate();
