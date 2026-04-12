// src/controllers/pdf.controller.js

import Resume from "../models/Resume.model.js";
import Template from "../models/Template.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateLatex } from "../utils/LatexGenerator.js";
import { compilePDF, savePDF, getPDFPath } from "../utils/pdfCompiler.js";
import fs from "fs";


export const generatePDF = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user._id;


  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  if (!resume.templateId) {
    throw new ApiError(400, "Please select a template first");
  }

  const template = await Template.findById(resume.templateId);

  if (!template) {
    throw new ApiError(404, "Template not found");
  }

  const latexString = generateLatex(template.latexTemplate, resume.data);

  resume.generatedLatex = latexString;

  const pdfBuffer = await compilePDF(latexString, resumeId);

  const pdfPath = savePDF(pdfBuffer, resumeId);

  resume.pdfUrl = `/pdfs/${resumeId}.pdf`; // Adjust based on your static file serving
  await resume.save();

  res.status(200).json(
    new ApiResponse(
      200,
      {
        pdfUrl: resume.pdfUrl,
        message: "PDF generated successfully",
      },
      "PDF generated successfully"
    )
  );
});


export const downloadPDF = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  const pdfPath = getPDFPath(resumeId);

  if (!fs.existsSync(pdfPath)) {
    throw new ApiError(404, "PDF not found. Please generate it first.");
  }

  res.download(pdfPath, `resume_${resumeId}.pdf`);
});


export const getPDFUrl = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  if (!resume.pdfUrl) {
    throw new ApiError(404, "PDF not generated yet");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      { pdfUrl: resume.pdfUrl },
      "PDF URL fetched successfully"
    )
  );
});

export const recompilePDF = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  if (!resume.templateId) {
    throw new ApiError(400, "Please select a template first");
  }

  const template = await Template.findById(resume.templateId);

  if (!template) {
    throw new ApiError(404, "Template not found");
  }

  // Generate LaTeX with CURRENT data (not mock)
  const latexString = generateLatex(template.latexTemplate, resume.data);
  resume.generatedLatex = latexString;

  // Compile to PDF
  const pdfBuffer = await compilePDF(latexString, resumeId);

  // Save PDF
  const pdfPath = savePDF(pdfBuffer, resumeId);

  resume.pdfUrl = `/pdfs/${resumeId}.pdf`;
  resume.updatedAt = new Date(); // Force update timestamp
  await resume.save();

  res.status(200).json(
    new ApiResponse(
      200,
      {
        pdfUrl: resume.pdfUrl,
        timestamp: resume.updatedAt,
        message: "PDF recompiled successfully",
      },
      "PDF recompiled successfully"
    )
  );
});