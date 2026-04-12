import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Template from '../src/models/template.model.js';
import { generateLatex } from '../src/utils/LatexGenerator.js';

dotenv.config();

const verify = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const template = await Template.findOne({ slug: 'altacv' });
    
    const mockDataNoPub = {
      personal: { name: "Test User", location: "Delhi, India" },
      education: [{ degree: "B.Tech", institution: "IIT", startDate: "2020", endDate: "2024", gpa: "9.0" }],
      publications: [] // Empty
    };

    const mockDataWithPub = {
      personal: { name: "Test User", location: "Delhi, India" },
      education: [{ degree: "B.Tech", institution: "IIT", startDate: "2020", endDate: "2024", gpa: "9.0" }],
      publications: [{ title: "AI Paper", authors: "Me", date: "2024", doi: "10.1234/test" }]
    };

    const resultNoPub = generateLatex(template.latexTemplate, mockDataNoPub);
    const resultWithPub = generateLatex(template.latexTemplate, mockDataWithPub);

    console.log("--- NO PUB VERIFICATION ---");
    console.log(resultNoPub.includes("cvsection{Publications}") ? "❌ FAILED: Publications header found" : "✅ PASSED: Publications header hidden");

    console.log("\n--- WITH PUB VERIFICATION ---");
    console.log(resultWithPub.includes("cvsection{Publications}") ? "✅ PASSED: Publications header found" : "❌ FAILED: Publications header missing");
    console.log(resultWithPub.includes("DOI: 10.1234/test") ? "✅ PASSED: DOI found" : "❌ FAILED: DOI missing");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

verify();
