import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    resumeName: {
      type: String,
      default: 'My Resume',
      trim: true,
    },

    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      default: null,
    },

    conversationState: {
      currentSection: {
        type: String,
        // Added 'achievements' to the enum list
        enum: ['personal', 'education', 'experience', 'projects', 'skills', 'achievements', 'publications', 'complete'],
        default: 'personal',
      },
      currentField: {
        type: String,
        default: 'name',
      },
      currentArrayIndex: {
        type: Number,
        default: 0,
      },
      pendingArrayAddition: {
        type: Boolean,
        default: false,
      },
      isComplete: {
        type: Boolean,
        default: false,
      },
    },

    chatHistory: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant', 'system'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        // Metadata for context awareness
        nextSection: {
          type: String,
        },
        nextField: {
          type: String,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // The actual resume data
    data: {
      personal: {
        name: { type: String, default: '' },
        location: { type: String, default: '' },
        email: { type: String, default: '' },
        phone: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        github: { type: String, default: '' },
        website: { type: String, default: '' },
      },

      education: [
        {
          institution: { type: String, default: '' },
          degree: { type: String, default: '' },
          startDate: { type: String, default: '' },
          endDate: { type: String, default: '' },
          gpa: { type: String, default: '' },
          coursework: [{ type: String }],
        },
      ],

      experience: [
        {
          company: { type: String, default: '' },
          position: { type: String, default: '' },
          location: { type: String, default: '' },
          startDate: { type: String, default: '' },
          endDate: { type: String, default: '' },
          highlights: [{ type: String }],
        },
      ],

      projects: [
        {
          name: { type: String, default: '' },
          link: { type: String, default: '' },
          date: { type: String, default: '' },
          highlights: [{ type: String }],
          technologies: [{ type: String }],
        },
      ],

      skills: {
        languages: [{ type: String }],
        frameworks: [{ type: String }],
        developerTools: [{ type: String }],
        libraries: [{ type: String }],
        technologies: [{ type: String }],
      },
      achievements: {
        type: [String],
        default: [],
      },

      publications: [
        {
          title: { type: String, default: '' },
          authors: [{ type: String }],
          date: { type: String, default: '' },
          doi: { type: String, default: '' },
        },
      ],

      customSections: [
        {
          title: { type: String, required: true },
          type: { type: String, enum: ['list', 'entries'], default: 'list' },
          items: [
            { text: { type: String } }
          ],
          entries: [
            {
              title: { type: String, default: '' },
              subtitle: { type: String, default: '' },
              date: { type: String, default: '' },
              highlights: [{ type: String }],
            },
          ],
        },
      ],
    },

    generatedLatex: {
      type: String,
      default: '',
    },

    pdfUrl: {
      type: String,
      default: '',
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    sectionOrder: {
      type: [String],
      default: ['education', 'experience', 'projects', 'skills', 'achievements', 'custom'],
    },
  },
  {
    timestamps: true,
  }
);

resumeSchema.index({ userId: 1, createdAt: -1 });

resumeSchema.methods.addMessage = function (role, content, nextSection = null, nextField = null) {
  this.chatHistory.push({
    role,
    content,
    nextSection,
    nextField,
    timestamp: new Date(),
  });
  return this.save();
};

resumeSchema.methods.isSectionComplete = function (section) {
  const sectionFields = {
    personal: ['name', 'location', 'email', 'phone'],
    education: ['institution', 'degree', 'startDate', 'endDate'],
    experience: ['company', 'position', 'startDate', 'endDate'],
    projects: ['name'],
    skills: ['languages', 'technologies'],
    // Added achievements check (simple check if array has items)
    achievements: [],
  };

  const fields = sectionFields[section];
  if (!fields && section !== 'achievements') return false;

  if (section === 'personal') {
    return fields.every((field) => this.data.personal[field] && this.data.personal[field].trim() !== '');
  }

  // Check for achievements specifically
  if (section === 'achievements') {
    return this.data.achievements && this.data.achievements.length > 0;
  }

  return this.data[section] && this.data[section].length > 0;
};

resumeSchema.methods.resetConversation = function () {
  this.conversationState = {
    currentSection: 'personal',
    currentField: 'name',
    currentArrayIndex: 0,
    pendingArrayAddition: false,
    isComplete: false,
  };
  this.chatHistory = [];
  return this.save();
};

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;