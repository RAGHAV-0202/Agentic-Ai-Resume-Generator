/**
 * Seed Script: Insert the Jake Gutierrez template into MongoDB
 * Run: node src/scripts/seedJakeTemplate.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const TEMPLATE = {
    name: "Jake Gutierrez",
    slug: "jake-gutierrez",
    description: "Clean, ATS-friendly resume template based on Jake Gutierrez's popular LaTeX design. Professional sans-serif look with excellent readability.",
    latexTemplate: `%-------------------------
% Resume in Latex
% Author : Jake Gutierrez
% Based off of: https://github.com/sb2nov/resume
% License : MIT
%------------------------
\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}
\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]
\\pdfgentounicode=1
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-4pt}}
  }
}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeSubSubheading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textit{\\small#1} & \\textit{\\small #2} \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}[noitemsep, topsep=0pt, parsep=0pt, partopsep=0pt]}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}
\\begin{document}
\\begin{center}
    \\textbf{\\Huge \\scshape {{PERSONAL.NAME}}} \\\\ \\vspace{1pt}
    {{PERSONAL.LOCATION}}
    {{#IF_PHONE}} $|$ {{PERSONAL.PHONE}} {{/IF_PHONE}}
    {{#IF_EMAIL}} $|$ \\href{mailto:{{PERSONAL.EMAIL}}}{{{PERSONAL.EMAIL}}} {{/IF_EMAIL}}
    \\\\[3pt]
    {{#IF_LINKEDIN}}\\href{https://{{PERSONAL.LINKEDIN}}}{\\underline{LinkedIn}} $|$ {{/IF_LINKEDIN}}
    {{#IF_GITHUB}}\\href{https://{{PERSONAL.GITHUB}}}{\\underline{Github}} $|$ {{/IF_GITHUB}}
    {{#IF_WEBSITE}}\\href{https://{{PERSONAL.WEBSITE}}}{\\underline{Portfolio}}{{/IF_WEBSITE}}
\\end{center}
{{#IF_EDUCATION}}
\\section{Education}
  \\resumeSubHeadingListStart
  {{#EDUCATION}}
    \\resumeSubheading
      {{{INSTITUTION}}}{}
      {{{DEGREE}}}{{{START_DATE}} -- {{END_DATE}}}
      {{#IF_GPA}}\\item\\small{\\textit{GPA: {{GPA}}}}\\vspace{-5pt}{{/IF_GPA}}
      {{#IF_COURSEWORK}}\\item\\small{\\textit{Coursework: {{COURSEWORK}}}}\\vspace{-5pt}{{/IF_COURSEWORK}}
  {{/EDUCATION}}
  \\resumeSubHeadingListEnd
{{/IF_EDUCATION}}
{{#IF_SKILLS}}
\\section{Technical Skills}
\\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     {{#IF_LANGUAGES}} \\textbf{Languages}{: {{LANGUAGES}}} \\\\ {{/IF_LANGUAGES}}
     {{#IF_FRAMEWORKS}} \\textbf{Frameworks \\& Databases}{: {{FRAMEWORKS}}} \\\\ {{/IF_FRAMEWORKS}}
     {{#IF_TOOLS}} \\textbf{Developer Tools}{: {{TOOLS}}} \\\\ {{/IF_TOOLS}}
     {{#IF_LIBRARIES}} \\textbf{Libraries}{: {{LIBRARIES}}} \\\\ {{/IF_LIBRARIES}}
    }}
\\end{itemize}
{{/IF_SKILLS}}
{{#IF_EXPERIENCE}}
\\section{Experience}
  \\resumeSubHeadingListStart
  {{#EXPERIENCE}}
    \\resumeSubheading
      {{{COMPANY}}}{{{START_DATE}} -- {{END_DATE}}}
      {{{POSITION}}}{{{LOCATION}}}
      \\resumeItemListStart
        {{#HIGHLIGHTS}}
        {{/HIGHLIGHTS}}
      \\resumeItemListEnd
  {{/EXPERIENCE}}
  \\resumeSubHeadingListEnd
{{/IF_EXPERIENCE}}
{{#IF_PROJECTS}}
\\section{Projects}
    \\resumeSubHeadingListStart
    {{#PROJECTS}}
      \\resumeProjectHeading
          {\\textbf{{{NAME}}} {{#IF_LINK}} $|$ \\href{https://{{LINK}}}{\\underline{Link}} {{/IF_LINK}} {{#IF_TECHNOLOGIES}} $|$ \\emph{{{TECHNOLOGIES}}} {{/IF_TECHNOLOGIES}} } { {{DATE}} }
          \\resumeItemListStart
            {{#HIGHLIGHTS}}
            {{/HIGHLIGHTS}}
          \\resumeItemListEnd
    {{/PROJECTS}}
    \\resumeSubHeadingListEnd
{{/IF_PROJECTS}}
{{#IF_ACHIEVEMENTS}}
\\section{Achievements}
  \\resumeSubHeadingListStart
    \\resumeItemListStart
      {{#ACHIEVEMENTS}}
        \\resumeItem{{{.}}}
      {{/ACHIEVEMENTS}}
    \\resumeItemListEnd
  \\resumeSubHeadingListEnd
{{/IF_ACHIEVEMENTS}}
\\end{document}`,
    requiredFields: {
        personal: ["name", "location", "email", "phone"],
        education: ["institution", "degree", "startDate", "endDate"],
        experience: ["company", "position", "startDate", "endDate", "highlights"],
        projects: ["name", "highlights"],
        skills: ["languages"],
    },
    optionalFields: {
        personal: ["linkedin", "github", "website"],
        education: ["gpa", "coursework"],
        experience: ["location"],
        projects: ["link", "date", "technologies"],
    },
    isActive: true,
    isPremium: false,
    createdBy: "admin",
};

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const { default: Template } = await import("../models/Template.model.js");

        // Check if already exists
        const existing = await Template.findOne({ slug: TEMPLATE.slug });
        if (existing) {
            console.log("⚠️  Template already exists, updating...");
            Object.assign(existing, TEMPLATE);
            await existing.save();
            console.log("✅ Template updated:", existing._id);
        } else {
            const created = await Template.create(TEMPLATE);
            console.log("✅ Template created:", created._id);
        }

        await mongoose.disconnect();
        console.log("✅ Done");
    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    }
}

seed();
