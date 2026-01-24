// src/controllers/template.controller.js

import Template from "../models/Template.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";


export const getAllTemplates = asyncHandler(async (req, res) => {
  const templates = await Template.find({ isActive: true }).select(
    "-latexTemplate" 
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count: templates.length, templates },
        "Templates fetched successfully"
      )
    );
});


export const getTemplateById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const template = await Template.findOne({ _id: id, isActive: true });

  if (!template) {
    throw new ApiError(404, "Template not found");
  }

  await template.incrementUsage();

  res
    .status(200)
    .json(
      new ApiResponse(200, { template }, "Template fetched successfully")
    );
});

export const getTemplateBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const template = await Template.getBySlug(slug);

  if (!template) {
    throw new ApiError(404, "Template not found");
  }

  await template.incrementUsage();

  res
    .status(200)
    .json(
      new ApiResponse(200, { template }, "Template fetched successfully")
    );
});


export const createTemplate = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    description,
    latexTemplate,
    thumbnailUrl,
    requiredFields,
    optionalFields,
  } = req.body;

  if (!name || !slug || !latexTemplate) {
    throw new ApiError(400, "Name, slug, and latexTemplate are required");
  }

  // Check if slug already exists
  const existingTemplate = await Template.findOne({ slug });
  if (existingTemplate) {
    throw new ApiError(409, "Template with this slug already exists");
  }

  const newTemplate = await Template.create({
    name,
    slug,
    description,
    latexTemplate,
    thumbnailUrl,
    requiredFields,
    optionalFields,
    createdBy: req.user?._id || "admin",
  });

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { template: newTemplate },
        "Template created successfully"
      )
    );
});

export const updateTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const template = await Template.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!template) {
    throw new ApiError(404, "Template not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, { template }, "Template updated successfully")
    );
});

export const deleteTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const template = await Template.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!template) {
    throw new ApiError(404, "Template not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Template deleted successfully"));
});