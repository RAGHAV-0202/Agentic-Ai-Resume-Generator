// src/utils/pdfCompiler.js

import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// src/utils/pdfCompiler.js

export const compilePDFLocal = async (latexString, resumeId) => {
  const tempDir = path.join(__dirname, "../../temp", resumeId);
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const texPath = path.join(tempDir, "resume.tex");
  fs.writeFileSync(texPath, latexString, "utf-8");

  try {
    // Run pdflatex (twice for proper formatting)
    // Use try-catch because pdflatex might return error code even if PDF is generated
    try {
      await execAsync(`pdflatex -interaction=nonstopmode -output-directory="${tempDir}" "${texPath}"`, {
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
      await execAsync(`pdflatex -interaction=nonstopmode -output-directory="${tempDir}" "${texPath}"`, {
        maxBuffer: 10 * 1024 * 1024
      });
    } catch (execError) {
      // pdflatex might return non-zero exit code even if PDF is generated
      console.log("pdflatex returned error code, checking if PDF exists anyway...");
    }

    // Check if PDF was generated regardless of exit code
    const pdfPath = path.join(tempDir, "resume.pdf");
    
    if (!fs.existsSync(pdfPath)) {
      // Check log file for actual errors
      const logPath = path.join(tempDir, "resume.log");
      if (fs.existsSync(logPath)) {
        const logContent = fs.readFileSync(logPath, "utf-8");
        console.error("LaTeX compilation log:", logContent);
      }
      throw new Error("PDF generation failed - output file not found");
    }

    console.log("✅ PDF generated successfully!");
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Verify PDF has reasonable size
    if (pdfBuffer.length < 1000) {
      throw new Error("Generated PDF is too small, likely corrupt");
    }

    console.log(`📄 PDF size: ${pdfBuffer.length} bytes`);

    // Clean up auxiliary files
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

// src/utils/pdfCompiler.js

// src/utils/pdfCompiler.js

export const compilePDFOnline = async (latexString) => {
  const fetch = (await import("node-fetch")).default;

  try {
    console.log("Using Cloud Compiler...");

    // Use CloudCompiler LaTeX API
    const response = await fetch("https://cloudcompiler.cci.fsu.edu/compile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: latexString,
        engine: "pdflatex",
      }),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Compilation failed: ${errorText}`);
    }

    const result = await response.json();
    
    if (result.pdf) {
      // PDF is returned as base64
      const pdfBuffer = Buffer.from(result.pdf, 'base64');
      console.log("✅ PDF generated! Size:", pdfBuffer.length, "bytes");
      return pdfBuffer;
    } else if (result.error) {
      throw new Error(result.error);
    } else {
      throw new Error("Unknown response format");
    }

  } catch (error) {
    console.error("Compilation error:", error);
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