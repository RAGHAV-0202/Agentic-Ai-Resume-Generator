// src/test/testPDF.js

import { generateLatex } from "../src/utils/LatexGenerator.js";
import { compilePDF, savePDF } from "../src/utils/pdfCompiler.js";
import Template from "../src/models/Template.model.js";
import mongoose from "mongoose";
import dotenv from "dotenv";


dotenv.config();

const testPDFCompilation = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://raghavAI-resume:neccu7-bYsgyj-bumdum@cluster0.vtrwisq.mongodb.net/?appName=Cluster0');

  const template = await Template.findOne({ slug: "rendercv-classic" });

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
        institution: "PIET",
        degree: "BTech CSE",
        startDate: "2023",
        endDate: "2027",
        gpa: "8.5/10",
        coursework: ["DSA", "Web Dev"],
      },
    ],
    experience: [],
    projects: [
      {
        name: "Chat App",
        link: "github.com/raghav/chat",
        date: "2024",
        highlights: ["Real-time messaging"],
        technologies: ["React", "Node.js"],
      },
    ],
    skills: {
      languages: ["JavaScript", "Python"],
      technologies: ["React", "Node.js", "MongoDB"],
    },
  };

  console.log("Generating LaTeX...");
  const latex = generateLatex(template.latexTemplate, testData);

  console.log("Compiling PDF...");
  const pdfBuffer = await compilePDF(latex, "test_resume");

  console.log("Saving PDF...");
  const pdfPath = savePDF(pdfBuffer, "test_resume");

  console.log("✅ PDF generated successfully!");
  console.log("📄 Saved to:", pdfPath);

  process.exit(0);
};

testPDFCompilation();