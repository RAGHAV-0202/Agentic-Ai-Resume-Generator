// src/utils/pdfCompiler.js

import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const compilePDFLocal = async (latexString, resumeId) => {
  // Create temp directory
  const tempDir = path.join(__dirname, "../../temp", resumeId);
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Write .tex file
  const texPath = path.join(tempDir, "resume.tex");
  fs.writeFileSync(texPath, latexString, "utf-8");

  try {
    // Run pdflatex (run twice for proper formatting)
    await execAsync(`pdflatex -interaction=nonstopmode -output-directory=${tempDir} ${texPath}`);
    await execAsync(`pdflatex -interaction=nonstopmode -output-directory=${tempDir} ${texPath}`);

    // Read generated PDF
    const pdfPath = path.join(tempDir, "resume.pdf");
    
    if (!fs.existsSync(pdfPath)) {
      throw new Error("PDF generation failed - output file not found");
    }

    const pdfBuffer = fs.readFileSync(pdfPath);

    // Optional: Clean up temp files (keep PDF for now)
    const filesToDelete = ["resume.aux", "resume.log", "resume.out"];
    filesToDelete.forEach((file) => {
      const filePath = path.join(tempDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    return pdfBuffer;
  } catch (error) {
    console.error("PDF compilation error:", error);
    throw new Error(`LaTeX compilation failed: ${error.message}`);
  }
};


export const compilePDFOnline = async (latexString) => {
  const FormData = (await import("form-data")).default;
  const fetch = (await import("node-fetch")).default;

  try {
    const formData = new FormData();
    formData.append("file", Buffer.from(latexString), {
      filename: "resume.tex",
      contentType: "text/plain",
    });

    const response = await fetch("https://texlive.net/cgi-bin/latexcgi", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `filecontents[]=${encodeURIComponent(latexString)}&filename[]=resume.tex&engine=pdflatex`
    });

    if (!response.ok) {
      throw new Error(`LaTeX.Online API error: ${response.status} ${response.statusText}`);
    }

    const pdfBuffer = await response.buffer();
    return pdfBuffer;
  } catch (error) {
    console.error("LaTeX.Online compilation error:", error);
    throw new Error(`Online PDF compilation failed: ${error.message}`);
  }
};


export const savePDF = (pdfBuffer, resumeId) => {
  const pdfDir = path.join(__dirname, "../../pdfs");
  
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  const pdfPath = path.join(pdfDir, `${resumeId}.pdf`);
  fs.writeFileSync(pdfPath, pdfBuffer);

  return pdfPath;
};


export const getPDFPath = (resumeId) => {
  return path.join(__dirname, "../../pdfs", `${resumeId}.pdf`);
};


export const compilePDF = async (latexString, resumeId) => {
  const method = process.env.PDF_COMPILATION_METHOD || "online"; // 'local' or 'online'

  if (method === "local") {
    return await compilePDFLocal(latexString, resumeId);
  } else {
    return await compilePDFOnline(latexString);
  }
};