// src/models/Template.model.js

import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    latexTemplate: {
      type: String,
      required: true,
    },

    thumbnailUrl: {
      type: String,
      default: '',
    },
    requiredFields: {
      personal: {
        type: [String],
        default: ['name', 'location', 'email', 'phone'],
      },
      education: {
        type: [String],
        default: ['institution', 'degree', 'startDate', 'endDate'],
      },
      experience: {
        type: [String],
        default: ['company', 'position', 'startDate', 'endDate', 'highlights'],
      },
      projects: {
        type: [String],
        default: ['name', 'highlights'],
      },
      skills: {
        type: [String],
        default: ['languages', 'technologies'],
      },
      publications: {
        type: [String],
        default: ['title', 'authors', 'date'],
      },
    },
    optionalFields: {
      personal: {
        type: [String],
        default: ['linkedin', 'github', 'website'],
      },
      education: {
        type: [String],
        default: ['gpa', 'coursework'],
      },
      experience: {
        type: [String],
        default: ['location'],
      },
      projects: {
        type: [String],
        default: ['link', 'date', 'technologies'],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    usageCount: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: String,
      default: 'admin',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
templateSchema.index({ isActive: 1, isPremium: 1 });

// Method to increment usage count
templateSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  return this.save();
};

// Static method to get all active templates
templateSchema.statics.getActiveTemplates = function () {
  return this.find({ isActive: true }).select('-latexTemplate'); // Don't send full LaTeX in list
};

// Static method to get template by slug
templateSchema.statics.getBySlug = function (slug) {
  return this.findOne({ slug, isActive: true });
};

const Template = mongoose.model('Template', templateSchema);

export default Template;