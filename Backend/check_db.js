import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Template from "./src/models/Template.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const MONGO_URI = process.env.MONGODB_URI;

const check = async () => {
  await mongoose.connect(MONGO_URI);
  const templates = await Template.find({});
  templates.forEach(t => console.log(t.name, "=> starts with:", t.latexTemplate.substring(0, 100).replace(/\n/g, ' ')));
  process.exit(0);
};
check();
