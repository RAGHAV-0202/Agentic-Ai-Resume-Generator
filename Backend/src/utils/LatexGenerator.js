const escapeLatex = (text) => {
  if (!text || text === "__SKIPPED__" || text === "_skipped" || text === "skip") return "";

  const replacements = {
    "\\": "\\textbackslash{}",
    "&": "\\&",
    "%": "\\%",
    "$": "\\$",
    "#": "\\#",
    _: "\\_",
    "{": "\\{",
    "}": "\\}",
    "~": "\\textasciitilde{}",
    "^": "\\textasciicircum{}",
  };

  let escaped = text.toString().trim();

  // Double check again after trim (though probably redundant)
  if (escaped === "__SKIPPED__" || escaped === "_skipped") return "";

  // First escape backslash, then others
  escaped = escaped.replace(/\\/g, replacements["\\"]);

  for (const [char, replacement] of Object.entries(replacements)) {
    if (char !== "\\") {
      escaped = escaped.replace(new RegExp("\\" + char, "g"), replacement);
    }
  }

  // Handle newlines
  escaped = escaped.replace(/\r\n/g, "\n").replace(/\n/g, " \\\\ ");

  return escaped;
};

/**
 * Replace simple placeholders like {{PERSONAL.NAME}}
 */
const replaceSimplePlaceholders = (latex, data) => {
  let result = latex;

  // Personal info
  if (data.personal) {
    result = result.replace(/{{PERSONAL\.NAME}}/g, escapeLatex(data.personal.name || ""));
    result = result.replace(/{{PERSONAL\.LOCATION}}/g, escapeLatex(data.personal.location || ""));
    result = result.replace(/{{PERSONAL\.EMAIL}}/g, escapeLatex(data.personal.email || ""));
    result = result.replace(/{{PERSONAL\.PHONE}}/g, escapeLatex(data.personal.phone || ""));
    result = result.replace(/{{PERSONAL\.LINKEDIN}}/g, escapeLatex(data.personal.linkedin || ""));
    result = result.replace(/{{PERSONAL\.GITHUB}}/g, escapeLatex(data.personal.github || ""));
    result = result.replace(/{{PERSONAL\.WEBSITE}}/g, escapeLatex(data.personal.website || ""));
  }

  return result;
};

/**
 * Handle conditional blocks like {{#IF_LINKEDIN}}...{{/IF_LINKEDIN}}
 */
const handleConditionals = (latex, data) => {
  let result = latex;

  // LinkedIn conditional

  // In handleConditionals function, add:

  // Email conditional
  if (data.personal?.email && data.personal.email.trim() !== "") {
    result = result.replace(/{{#IF_EMAIL}}/g, "");
    result = result.replace(/{{\/IF_EMAIL}}/g, "");
  } else {
    result = result.replace(/{{#IF_EMAIL}}[\s\S]*?{{\/IF_EMAIL}}/g, "");
  }

  if (data.achievements && data.achievements.length > 0) {
    result = result.replace(/{{#IF_ACHIEVEMENTS}}/g, "");
    result = result.replace(/{{\/IF_ACHIEVEMENTS}}/g, "");
  } else {
    // If empty, remove the entire block
    result = result.replace(/{{#IF_ACHIEVEMENTS}}[\s\S]*?{{\/IF_ACHIEVEMENTS}}/g, "");
  }

  // Phone conditional
  if (data.personal?.phone && data.personal.phone.trim() !== "") {
    result = result.replace(/{{#IF_PHONE}}/g, "");
    result = result.replace(/{{\/IF_PHONE}}/g, "");
  } else {
    result = result.replace(/{{#IF_PHONE}}[\s\S]*?{{\/IF_PHONE}}/g, "");
  }

  if (data.personal?.linkedin && data.personal.linkedin.trim() !== "") {
    result = result.replace(/{{#IF_LINKEDIN}}/g, "");
    result = result.replace(/{{\/IF_LINKEDIN}}/g, "");
  } else {
    result = result.replace(/{{#IF_LINKEDIN}}[\s\S]*?{{\/IF_LINKEDIN}}/g, "");
  }

  // GitHub conditional
  if (data.personal?.github && data.personal.github.trim() !== "") {
    result = result.replace(/{{#IF_GITHUB}}/g, "");
    result = result.replace(/{{\/IF_GITHUB}}/g, "");
  } else {
    result = result.replace(/{{#IF_GITHUB}}[\s\S]*?{{\/IF_GITHUB}}/g, "");
  }

  // Website conditional
  if (data.personal?.website && data.personal.website.trim() !== "") {
    result = result.replace(/{{#IF_WEBSITE}}/g, "");
    result = result.replace(/{{\/IF_WEBSITE}}/g, "");
  } else {
    result = result.replace(/{{#IF_WEBSITE}}[\s\S]*?{{\/IF_WEBSITE}}/g, "");
  }

  // Education section conditional
  if (data.education && data.education.length > 0) {
    result = result.replace(/{{#IF_EDUCATION}}/g, "");
    result = result.replace(/{{\/IF_EDUCATION}}/g, "");
  } else {
    result = result.replace(/{{#IF_EDUCATION}}[\s\S]*?{{\/IF_EDUCATION}}/g, "");
  }

  // Experience section conditional
  if (data.experience && data.experience.length > 0) {
    result = result.replace(/{{#IF_EXPERIENCE}}/g, "");
    result = result.replace(/{{\/IF_EXPERIENCE}}/g, "");
  } else {
    result = result.replace(/{{#IF_EXPERIENCE}}[\s\S]*?{{\/IF_EXPERIENCE}}/g, "");
  }

  // Projects section conditional
  if (data.projects && data.projects.length > 0) {
    result = result.replace(/{{#IF_PROJECTS}}/g, "");
    result = result.replace(/{{\/IF_PROJECTS}}/g, "");
  } else {
    result = result.replace(/{{#IF_PROJECTS}}[\s\S]*?{{\/IF_PROJECTS}}/g, "");
  }

  // Skills section conditional
  if (
    (data.skills?.languages && data.skills.languages.length > 0) ||
    (data.skills?.frameworks && data.skills.frameworks.length > 0) ||
    (data.skills?.developerTools && data.skills.developerTools.length > 0) ||
    (data.skills?.libraries && data.skills.libraries.length > 0) ||
    (data.skills?.technologies && data.skills.technologies.length > 0)
  ) {
    result = result.replace(/{{#IF_SKILLS}}/g, "");
    result = result.replace(/{{\/IF_SKILLS}}/g, "");
  } else {
    result = result.replace(/{{#IF_SKILLS}}[\s\S]*?{{\/IF_SKILLS}}/g, "");
  }

  return result;
};

/**
 * Populate education array
 */
const populateEducation = (latex, educationArray) => {
  const blockRegex = /{{#EDUCATION}}([\s\S]*?){{\/EDUCATION}}/;
  const match = latex.match(blockRegex);

  if (!match || !educationArray || educationArray.length === 0) {
    return latex.replace(blockRegex, "");
  }

  const blockTemplate = match[1];
  let educationLatex = "";

  educationArray.forEach((edu) => {
    let block = blockTemplate;

    block = block.replace(/{{INSTITUTION}}/g, escapeLatex(edu.institution || ""));
    block = block.replace(/{{DEGREE}}/g, escapeLatex(edu.degree || ""));
    block = block.replace(/{{START_DATE}}/g, escapeLatex(edu.startDate || ""));
    block = block.replace(/{{END_DATE}}/g, escapeLatex(edu.endDate || ""));

    // Handle GPA conditional
    if (edu.gpa && edu.gpa.trim() !== "" && edu.gpa !== "_skipped") {
      block = block.replace(/{{#IF_GPA}}/g, "");
      block = block.replace(/{{\/IF_GPA}}/g, "");
      block = block.replace(/{{GPA}}/g, escapeLatex(edu.gpa));
    } else {
      block = block.replace(/{{#IF_GPA}}[\s\S]*?{{\/IF_GPA}}/g, "");
    }

    // Handle coursework conditional
    const courseworkFiltered = (edu.coursework || []).filter(c => c && c !== "_skipped");
    if (courseworkFiltered.length > 0) {
      block = block.replace(/{{#IF_COURSEWORK}}/g, "");
      block = block.replace(/{{\/IF_COURSEWORK}}/g, "");
      const courseworkText = courseworkFiltered.map(c => escapeLatex(c)).join(", ");
      block = block.replace(/{{COURSEWORK}}/g, courseworkText);
    } else {
      block = block.replace(/{{#IF_COURSEWORK}}[\s\S]*?{{\/IF_COURSEWORK}}/g, "");
    }

    educationLatex += block;
  });

  return latex.replace(blockRegex, educationLatex);
};
const populateAchievements = (latex, achievementsArray) => {
  // Regex to find the block {{#ACHIEVEMENTS}} ... {{/ACHIEVEMENTS}}
  const blockRegex = /{{#ACHIEVEMENTS}}([\s\S]*?){{\/ACHIEVEMENTS}}/;
  const match = latex.match(blockRegex);

  if (!match || !achievementsArray || achievementsArray.length === 0) {
    return latex.replace(blockRegex, "");
  }

  const blockTemplate = match[1];
  let achievementsLatex = "";

  achievementsArray.forEach((item) => {
    // Replace {{{.}}} with the actual text
    // The user's template uses {{{.}}} which corresponds to the current item in the array
    let entry = blockTemplate.replace(/{{{\.}}}/g, escapeLatex(item));
    achievementsLatex += entry;
  });

  return latex.replace(blockRegex, achievementsLatex);
};
const populateExperience = (latex, experienceArray) => {
  const blockRegex = /{{#EXPERIENCE}}([\s\S]*?){{\/EXPERIENCE}}/;
  const match = latex.match(blockRegex);

  if (!match || !experienceArray || experienceArray.length === 0) {
    return latex.replace(blockRegex, "");
  }

  const blockTemplate = match[1];
  let experienceLatex = "";

  experienceArray.forEach((exp) => {
    let block = blockTemplate;

    block = block.replace(/{{COMPANY}}/g, escapeLatex(exp.company || ""));
    block = block.replace(/{{POSITION}}/g, escapeLatex(exp.position || ""));
    block = block.replace(/{{LOCATION}}/g, escapeLatex(exp.location || ""));
    block = block.replace(/{{START_DATE}}/g, escapeLatex(exp.startDate || ""));
    block = block.replace(/{{END_DATE}}/g, escapeLatex(exp.endDate || ""));

    // Handle highlights (nested loop)
    const highlightsRegex = /{{#HIGHLIGHTS}}([\s\S]*?){{\/HIGHLIGHTS}}/;
    const highlightsMatch = block.match(highlightsRegex);

    if (highlightsMatch && exp.highlights && exp.highlights.length > 0) {
      let highlightsLatex = "";
      exp.highlights.forEach((highlight) => {
        highlightsLatex += `                \\item ${escapeLatex(highlight)}\n`;
      });
      block = block.replace(highlightsRegex, highlightsLatex);
    } else {
      block = block.replace(highlightsRegex, "");
    }

    experienceLatex += block;
  });

  return latex.replace(blockRegex, experienceLatex);
};


const populateProjects = (latex, projectsArray) => {
  const blockRegex = /{{#PROJECTS}}([\s\S]*?){{\/PROJECTS}}/;
  const match = latex.match(blockRegex);

  if (!match || !projectsArray || projectsArray.length === 0) {
    return latex.replace(blockRegex, "");
  }

  const blockTemplate = match[1];
  let projectsLatex = "";

  projectsArray.forEach((project) => {
    let block = blockTemplate;

    block = block.replace(/{{NAME}}/g, escapeLatex(project.name || ""));
    block = block.replace(/{{DATE}}/g, escapeLatex(project.date || ""));

    // Handle link conditional
    if (project.link && project.link.trim() !== "" && project.link !== "_skipped") {
      block = block.replace(/{{#IF_LINK}}/g, "");
      block = block.replace(/{{\/IF_LINK}}/g, "");
      block = block.replace(/{{LINK}}/g, escapeLatex(project.link));
    } else {
      block = block.replace(/{{#IF_LINK}}[\s\S]*?{{\/IF_LINK}}/g, "");
    }

    // Handle highlights
    const highlightsRegex = /{{#HIGHLIGHTS}}([\s\S]*?){{\/HIGHLIGHTS}}/;
    const highlightsMatch = block.match(highlightsRegex);

    if (highlightsMatch && project.highlights && project.highlights.length > 0) {
      let highlightsLatex = "";
      project.highlights.filter(h => h && h !== "_skipped").forEach((highlight) => {
        highlightsLatex += `                \\item ${escapeLatex(highlight)}\n`;
      });
      block = block.replace(highlightsRegex, highlightsLatex);
    } else {
      block = block.replace(highlightsRegex, "");
    }

    // Handle technologies conditional
    const techFiltered = (project.technologies || []).filter(t => t && t !== "_skipped");
    if (techFiltered.length > 0) {
      block = block.replace(/{{#IF_TECHNOLOGIES}}/g, "");
      block = block.replace(/{{\/IF_TECHNOLOGIES}}/g, "");
      const techText = techFiltered.map(t => escapeLatex(t)).join(", ");
      block = block.replace(/{{TECHNOLOGIES}}/g, techText);
    } else {
      block = block.replace(/{{#IF_TECHNOLOGIES}}[\s\S]*?{{\/IF_TECHNOLOGIES}}/g, "");
    }

    projectsLatex += block;
  });

  return latex.replace(blockRegex, projectsLatex);
};

/**
 * Populate skills section
 */
const populateSkills = (latex, skills) => {
  let result = latex;

  if (!skills) return result;

  // Languages
  if (skills.languages && skills.languages.length > 0) {
    result = result.replace(/{{#IF_LANGUAGES}}/g, "");
    result = result.replace(/{{\/IF_LANGUAGES}}/g, "");
    const languagesText = skills.languages.map(l => escapeLatex(l)).join(", ");
    result = result.replace(/{{LANGUAGES}}/g, languagesText);
  } else {
    result = result.replace(/{{#IF_LANGUAGES}}[\s\S]*?{{\/IF_LANGUAGES}}/g, "");
  }

  // Frameworks
  if (skills.frameworks && skills.frameworks.length > 0) {
    result = result.replace(/{{#IF_FRAMEWORKS}}/g, "");
    result = result.replace(/{{\/IF_FRAMEWORKS}}/g, "");
    const frameworksText = skills.frameworks.map(f => escapeLatex(f)).join(", ");
    result = result.replace(/{{FRAMEWORKS}}/g, frameworksText);
  } else {
    result = result.replace(/{{#IF_FRAMEWORKS}}[\s\S]*?{{\/IF_FRAMEWORKS}}/g, "");
  }

  // Developer Tools
  if (skills.developerTools && skills.developerTools.length > 0) {
    result = result.replace(/{{#IF_TOOLS}}/g, "");
    result = result.replace(/{{\/IF_TOOLS}}/g, "");
    const toolsText = skills.developerTools.map(t => escapeLatex(t)).join(", ");
    result = result.replace(/{{TOOLS}}/g, toolsText);
  } else {
    result = result.replace(/{{#IF_TOOLS}}[\s\S]*?{{\/IF_TOOLS}}/g, "");
  }

  // Libraries
  if (skills.libraries && skills.libraries.length > 0) {
    result = result.replace(/{{#IF_LIBRARIES}}/g, "");
    result = result.replace(/{{\/IF_LIBRARIES}}/g, "");
    const librariesText = skills.libraries.map(lib => escapeLatex(lib)).join(", ");
    result = result.replace(/{{LIBRARIES}}/g, librariesText);
  } else {
    result = result.replace(/{{#IF_LIBRARIES}}[\s\S]*?{{\/IF_LIBRARIES}}/g, "");
  }

  // Technologies (general — maps to {{TECHNOLOGIES_SKILLS}} at section level)
  if (skills.technologies && skills.technologies.length > 0) {
    result = result.replace(/{{#IF_TECHNOLOGIES_SKILLS}}/g, "");
    result = result.replace(/{{\/IF_TECHNOLOGIES_SKILLS}}/g, "");
    const techText = skills.technologies.map(t => escapeLatex(t)).join(", ");
    result = result.replace(/{{TECHNOLOGIES_SKILLS}}/g, techText);
  } else {
    result = result.replace(/{{#IF_TECHNOLOGIES_SKILLS}}[\s\S]*?{{\/IF_TECHNOLOGIES_SKILLS}}/g, "");
  }

  return result;
};

/**
 * Populate custom sections — appends LaTeX blocks before \end{document}
 * These are user-defined sections not part of the fixed template schema.
 */
const populateCustomSections = (latex, customSections) => {
  if (!customSections || customSections.length === 0) return latex;

  let customLatex = "\n\n";

  customSections.forEach((section) => {
    if (!section.title) return;

    const sectionTitle = escapeLatex(section.title);

    if (section.type === 'entries' && section.entries && section.entries.length > 0) {
      // Structured entries (similar to experience/projects)
      customLatex += `%-----------${sectionTitle.toUpperCase()}-----------\n`;
      customLatex += `\\section{${sectionTitle}}\n`;
      customLatex += `  \\resumeSubHeadingListStart\n`;

      section.entries.forEach((entry) => {
        if (!entry.title && !entry.subtitle) return;
        const title = escapeLatex(entry.title || "");
        const subtitle = escapeLatex(entry.subtitle || "");
        const date = escapeLatex(entry.date || "");

        customLatex += `    \\resumeSubheading{${title}}{${date}}{${subtitle}}{}\n`;

        const highlights = (entry.highlights || []).filter(h => h && h !== "_skipped" && h.trim());
        if (highlights.length > 0) {
          customLatex += `      \\resumeItemListStart\n`;
          highlights.forEach((h) => {
            customLatex += `        \\resumeItem{${escapeLatex(h)}}\n`;
          });
          customLatex += `      \\resumeItemListEnd\n`;
        }
      });

      customLatex += `  \\resumeSubHeadingListEnd\n\n`;
    } else if (section.items && section.items.length > 0) {
      // Simple list type
      const validItems = section.items.filter(i => i && i.text && i.text.trim() && i.text !== "_skipped");
      if (validItems.length === 0) return;

      customLatex += `%-----------${sectionTitle.toUpperCase()}-----------\n`;
      customLatex += `\\section{${sectionTitle}}\n`;
      customLatex += `  \\resumeItemListStart\n`;

      validItems.forEach((item) => {
        customLatex += `    \\resumeItem{${escapeLatex(item.text)}}\n`;
      });

      customLatex += `  \\resumeItemListEnd\n\n`;
    }
  });

  // Insert before \end{document} if it exists, otherwise append
  if (latex.includes("\\end{document}")) {
    return latex.replace("\\end{document}", customLatex + "\\end{document}");
  }
  return latex + customLatex;
};

/**
 * Main function: Generate complete LaTeX from template and data
 */
export const generateLatex = (templateString, resumeData) => {
  let latex = templateString;

  // Step 1: Replace simple placeholders
  latex = replaceSimplePlaceholders(latex, resumeData);

  // Step 2: Handle conditionals
  latex = handleConditionals(latex, resumeData);

  // Step 3: Populate arrays
  latex = populateEducation(latex, resumeData.education);
  latex = populateExperience(latex, resumeData.experience);
  latex = populateProjects(latex, resumeData.projects);
  latex = populateSkills(latex, resumeData.skills);
  latex = populateAchievements(latex, resumeData.achievements);

  // Step 4: Populate custom sections (before cleanup)
  latex = populateCustomSections(latex, resumeData.customSections);

  // Step 5: Clean up any remaining placeholders
  latex = latex.replace(/{{.*?}}/g, "");

  return latex;
};