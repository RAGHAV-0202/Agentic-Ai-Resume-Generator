import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import Admin from "../src/models/admin.model.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("Missing MONGO_URI/MONGODB_URI in environment");
    }

    await mongoose.connect(mongoUri);

    const email = "raghavkapoor16947@gmail.com";
    const password = "Raghav@Admin";
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.findOneAndUpdate(
      { email },
      { email, password: hashedPassword, isAdmin: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`Admin ready: ${admin.email}`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();
