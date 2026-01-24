// src/test/testLatex.js

import { generateLatex } from "../src/utils/LatexGenerator.js";
import Template from "../src/models/Template.model.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const testLatexGeneration = async () => {
  await mongoose.connect(process.env.MONGO_URI  || 'mongodb+srv://raghavAI-resume:neccu7-bYsgyj-bumdum@cluster0.vtrwisq.mongodb.net/?appName=Cluster0');

  // Fetch template
  const template = await Template.findOne({ slug: "rendercv-classic" });

  if (!template) {
    console.log("❌ Template not found. Run seed script first.");
    process.exit(1);
  }

  // Test data
  const testData = {
    personal: {
      name: "Raghav Kumar",
      location: "Panipat, Haryana",
      email: "raghav@example.com",
      phone: "+91 9876543210",
      linkedin: "linkedin.com/in/raghav",
      github: "github.com/raghav",
    },
    education: [
      {
        institution: "Panipat Institute of Engineering and Technology",
        degree: "BTech in Computer Science",
        startDate: "2023",
        endDate: "2027",
        gpa: "8.5/10",
        coursework: ["Data Structures", "Algorithms", "Web Development"],
      },
    ],
    experience: [
      {
        company: "TechCorp",
        position: "Software Developer Intern",
        location: "Remote",
        startDate: "June 2024",
        endDate: "August 2024",
        highlights: [
          "Built dashboard using React and Node.js",
          "Improved page load time by 40%",
          "Worked with team of 5 developers",
        ],
      },
    ],
    projects: [
      {
        name: "Chat Application",
        link: "github.com/raghav/chat-app",
        date: "Jan 2024 - Mar 2024",
        highlights: ["Real-time messaging using Socket.io"],
        technologies: ["React", "Node.js", "MongoDB", "Socket.io"],
      },
    ],
    skills: {
      languages: ["JavaScript", "Python", "Java", "C++"],
      technologies: ["React", "Node.js", "Express", "MongoDB", "Git"],
    },
  };

  // Generate LaTeX
  const latex = generateLatex(template.latexTemplate, testData);

  // Save to file
  fs.writeFileSync("test_output.tex", latex);

  console.log("✅ LaTeX generated successfully!");
  console.log("📄 Saved to: test_output.tex");

  process.exit(0);
};

testLatexGeneration();