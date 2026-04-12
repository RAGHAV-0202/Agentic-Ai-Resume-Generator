// src/utils/pdfCompiler.js

import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getLatexErrorSnippet = (logContent = "") => {
  if (!logContent) return "";

  const lines = logContent.split("\n");
  const errorStart = lines.findIndex((line) => line.trim().startsWith("!"));

  if (errorStart === -1) {
    return lines.slice(-40).join("\n");
  }

  const start = Math.max(0, errorStart - 3);
  const end = Math.min(lines.length, errorStart + 12);
  return lines.slice(start, end).join("\n");
};


// src/utils/pdfCompiler.js

export const compilePDFLocal = async (latexString, resumeId) => {
  const tempDir = path.join(__dirname, "../../temp", String(resumeId));
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const texPath = path.join(tempDir, "resume.tex");
  fs.writeFileSync(texPath, latexString, "utf-8");

  try {
    try {
      await execAsync("command -v pdflatex", { maxBuffer: 1024 * 1024 });
    } catch {
      throw new Error(
        "pdflatex is not installed or not in PATH. Install TeX Live (e.g. sudo apt update && sudo apt install -y texlive-latex-base texlive-latex-recommended texlive-fonts-recommended texlive-latex-extra)"
      );
    }

    // Run twice for references/table formatting stabilization.
    try {
      await execAsync(`pdflatex -file-line-error -interaction=nonstopmode -output-directory="${tempDir}" "${texPath}"`, {
        maxBuffer: 10 * 1024 * 1024,
      });
      await execAsync(`pdflatex -file-line-error -interaction=nonstopmode -output-directory="${tempDir}" "${texPath}"`, {
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch (execError) {
      const stdErrSnippet = execError?.stderr?.split("\n").slice(0, 20).join("\n") || "";
      console.log("pdflatex exited with non-zero status. Will verify generated PDF and inspect logs.");
      if (stdErrSnippet) {
        console.error("pdflatex stderr snippet:\n", stdErrSnippet);
      }
    }

    // Check if PDF was generated regardless of exit code
    const pdfPath = path.join(tempDir, "resume.pdf");
    
    if (!fs.existsSync(pdfPath)) {
      // Check log file for actual errors
      const logPath = path.join(tempDir, "resume.log");
      let errorDetails = "";

      if (fs.existsSync(logPath)) {
        const logContent = fs.readFileSync(logPath, "utf-8");
        errorDetails = getLatexErrorSnippet(logContent);
        console.error("LaTeX compilation error snippet:\n", errorDetails);
      }

      const detailedMessage = errorDetails
        ? `PDF generation failed - output file not found. LaTeX error:\n${errorDetails}`
        : "PDF generation failed - output file not found. Check if required LaTeX packages are installed.";

      throw new Error(detailedMessage);
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