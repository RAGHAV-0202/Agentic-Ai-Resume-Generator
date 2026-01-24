const escapeLatex = (text) => {
  if (!text) return "";

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

  let escaped = text.toString();

  // First escape backslash, then others
  escaped = escaped.replace(/\\/g, replacements["\\"]);

  for (const [char, replacement] of Object.entries(replacements)) {
    if (char !== "\\") {
      escaped = escaped.replace(new RegExp("\\" + char, "g"), replacement);
    }
  }

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
    if (edu.gpa && edu.gpa.trim() !== "") {
      block = block.replace(/{{#IF_GPA}}/g, "");
      block = block.replace(/{{\/IF_GPA}}/g, "");
      block = block.replace(/{{GPA}}/g, escapeLatex(edu.gpa));
    } else {
      block = block.replace(/{{#IF_GPA}}[\s\S]*?{{\/IF_GPA}}/g, "");
    }

    // Handle coursework conditional
    if (edu.coursework && edu.coursework.length > 0) {
      block = block.replace(/{{#IF_COURSEWORK}}/g, "");
      block = block.replace(/{{\/IF_COURSEWORK}}/g, "");
      const courseworkText = edu.coursework.map(c => escapeLatex(c)).join(", ");
      block = block.replace(/{{COURSEWORK}}/g, courseworkText);
    } else {
      block = block.replace(/{{#IF_COURSEWORK}}[\s\S]*?{{\/IF_COURSEWORK}}/g, "");
    }

    educationLatex += block;
  });

  return latex.replace(blockRegex, educationLatex);
};

/**
 * Populate experience array
 */
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

/**
 * Populate projects array
 */
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
    if (project.link && project.link.trim() !== "") {
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
      project.highlights.forEach((highlight) => {
        highlightsLatex += `                \\item ${escapeLatex(highlight)}\n`;
      });
      block = block.replace(highlightsRegex, highlightsLatex);
    } else {
      block = block.replace(highlightsRegex, "");
    }

    // Handle technologies conditional
    if (project.technologies && project.technologies.length > 0) {
      block = block.replace(/{{#IF_TECHNOLOGIES}}/g, "");
      block = block.replace(/{{\/IF_TECHNOLOGIES}}/g, "");
      const techText = project.technologies.map(t => escapeLatex(t)).join(", ");
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

  // Technologies
  if (skills.technologies && skills.technologies.length > 0) {
    result = result.replace(/{{#IF_TECHNOLOGIES}}/g, "");
    result = result.replace(/{{\/IF_TECHNOLOGIES}}/g, "");
    const techText = skills.technologies.map(t => escapeLatex(t)).join(", ");
    result = result.replace(/{{TECHNOLOGIES}}/g, techText);
  } else {
    result = result.replace(/{{#IF_TECHNOLOGIES}}[\s\S]*?{{\/IF_TECHNOLOGIES}}/g, "");
  }

  return result;
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

  // Step 4: Clean up any remaining placeholders
  latex = latex.replace(/{{.*?}}/g, "");

  return latex;
};