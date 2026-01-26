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
      // Added achievements here
      achievements: {
        type: [String],
        default: [], // No sub-fields to require, just the section itself
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
      // Added achievements here as well for flexibility
      achievements: {
        type: [String],
        default: [],
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

templateSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  return this.save();
};

templateSchema.statics.getActiveTemplates = function () {
  return this.find({ isActive: true }).select('-latexTemplate'); 
};

templateSchema.statics.getBySlug = function (slug) {
  return this.findOne({ slug, isActive: true });
};

const Template = mongoose.model('Template', templateSchema);

export default Template;