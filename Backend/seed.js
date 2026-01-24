// src/scripts/seedTemplate.js

import mongoose from "mongoose";
import Template from "./src/models/Template.model.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const rendercvLatex = `\\documentclass[10pt, letterpaper]{article}

% Packages:
\\usepackage[
    ignoreheadfoot,
    top=2 cm,
    bottom=2 cm,
    left=2 cm,
    right=2 cm,
    footskip=1.0 cm,
]{geometry}
\\usepackage{titlesec}
\\usepackage{tabularx}
\\usepackage{array}
\\usepackage[dvipsnames]{xcolor}
\\definecolor{primaryColor}{RGB}{0, 0, 0}
\\usepackage{enumitem}
\\usepackage{fontawesome5}
\\usepackage{amsmath}
\\usepackage[
    pdftitle={Resume},
    pdfauthor={Resume Builder},
    colorlinks=true,
    urlcolor=primaryColor
]{hyperref}
\\usepackage[pscoord]{eso-pic}
\\usepackage{calc}
\\usepackage{bookmark}
\\usepackage{lastpage}
\\usepackage{changepage}
\\usepackage{paracol}
\\usepackage{ifthen}
\\usepackage{needspace}
\\usepackage{iftex}

\\ifPDFTeX
    \\input{glyphtounicode}
    \\pdfgentounicode=1
    \\usepackage[T1]{fontenc}
    \\usepackage[utf8]{inputenc}
    \\usepackage{lmodern}
\\fi

\\usepackage{charter}

\\raggedright
\\AtBeginEnvironment{adjustwidth}{\\partopsep0pt}
\\pagestyle{empty}
\\setcounter{secnumdepth}{0}
\\setlength{\\parindent}{0pt}
\\setlength{\\topskip}{0pt}
\\setlength{\\columnsep}{0.15cm}
\\pagenumbering{gobble}

\\titleformat{\\section}{\\needspace{4\\baselineskip}\\bfseries\\large}{}{0pt}{}[\\vspace{1pt}\\titlerule]

\\titlespacing{\\section}{-1pt}{0.3 cm}{0.2 cm}

\\renewcommand\\labelitemi{$\\vcenter{\\hbox{\\small$\\bullet$}}$}

\\newenvironment{highlights}{
    \\begin{itemize}[
        topsep=0.10 cm,
        parsep=0.10 cm,
        partopsep=0pt,
        itemsep=0pt,
        leftmargin=0 cm + 10pt
    ]
}{
    \\end{itemize}
}

\\newenvironment{onecolentry}{
    \\begin{adjustwidth}{0 cm + 0.00001 cm}{0 cm + 0.00001 cm}
}{
    \\end{adjustwidth}
}

\\newenvironment{twocolentry}[2][]{
    \\onecolentry
    \\def\\secondColumn{#2}
    \\setcolumnwidth{\\fill, 4.5 cm}
    \\begin{paracol}{2}
}{
    \\switchcolumn \\raggedleft \\secondColumn
    \\end{paracol}
    \\endonecolentry}

\\newenvironment{header}{
    \\setlength{\\topsep}{0pt}\\par\\kern\\topsep\\centering\\linespread{1.5}
}{
    \\par\\kern\\topsep
}

\\let\\hrefWithoutArrow\\href

\\begin{document}
    \\newcommand{\\AND}{\\unskip
        \\cleaders\\copy\\ANDbox\\hskip\\wd\\ANDbox
        \\ignorespaces
    }
    \\newsavebox\\ANDbox
    \\sbox\\ANDbox{$|$}

    \\begin{header}
        \\fontsize{25 pt}{25 pt}\\selectfont {{PERSONAL.NAME}}

        \\vspace{5 pt}

        \\normalsize
        \\mbox{{{PERSONAL.LOCATION}}}%
        \\kern 5.0 pt%
        \\AND%
        \\kern 5.0 pt%
        \\mbox{\\hrefWithoutArrow{mailto:{{PERSONAL.EMAIL}}}{{{PERSONAL.EMAIL}}}}%
        \\kern 5.0 pt%
        \\AND%
        \\kern 5.0 pt%
        \\mbox{\\hrefWithoutArrow{tel:{{PERSONAL.PHONE}}}{{{PERSONAL.PHONE}}}}%
        {{#IF_LINKEDIN}}
        \\kern 5.0 pt%
        \\AND%
        \\kern 5.0 pt%
        \\mbox{\\hrefWithoutArrow{https://{{PERSONAL.LINKEDIN}}}{{{PERSONAL.LINKEDIN}}}}%
        {{/IF_LINKEDIN}}
        {{#IF_GITHUB}}
        \\kern 5.0 pt%
        \\AND%
        \\kern 5.0 pt%
        \\mbox{\\hrefWithoutArrow{https://{{PERSONAL.GITHUB}}}{{{PERSONAL.GITHUB}}}}%
        {{/IF_GITHUB}}
    \\end{header}

    \\vspace{5 pt - 0.3 cm}

    {{#IF_EDUCATION}}
    \\section{Education}
    {{#EDUCATION}}
        \\begin{twocolentry}{
            {{START_DATE}} – {{END_DATE}}
        }
            \\textbf{ {{INSTITUTION}} }, {{DEGREE}}\\end{twocolentry}

        \\vspace{0.10 cm}
        \\begin{onecolentry}
            \\begin{highlights}
                {{#IF_GPA}}\\item GPA: {{GPA}}{{/IF_GPA}}
                {{#IF_COURSEWORK}}\\item \\textbf{Coursework:} {{COURSEWORK}}{{/IF_COURSEWORK}}
            \\end{highlights}
        \\end{onecolentry}

        \\vspace{0.2 cm}
    {{/EDUCATION}}
    {{/IF_EDUCATION}}

    {{#IF_EXPERIENCE}}
    \\section{Experience}
    {{#EXPERIENCE}}
        \\begin{twocolentry}{
            {{START_DATE}} – {{END_DATE}}
        }
            \\textbf{ {{POSITION}} }, {{COMPANY}} -- {{LOCATION}}\\end{twocolentry}

        \\vspace{0.10 cm}
        \\begin{onecolentry}
            \\begin{highlights}
                {{#HIGHLIGHTS}}
                \\item {{.}}
                {{/HIGHLIGHTS}}
            \\end{highlights}
        \\end{onecolentry}

        \\vspace{0.2 cm}
    {{/EXPERIENCE}}
    {{/IF_EXPERIENCE}}

    {{#IF_PROJECTS}}
    \\section{Projects}
    {{#PROJECTS}}
        \\begin{twocolentry}{
            {{#IF_LINK}}\\href{ {{LINK}} }{ {{LINK}} }{{/IF_LINK}}
        }
            \\textbf{ {{NAME}} }\\end{twocolentry}

        \\vspace{0.10 cm}
        \\begin{onecolentry}
            \\begin{highlights}
                {{#HIGHLIGHTS}}
                \\item {{.}}
                {{/HIGHLIGHTS}}
                {{#IF_TECHNOLOGIES}}\\item Tools Used: {{TECHNOLOGIES}}{{/IF_TECHNOLOGIES}}
            \\end{highlights}
        \\end{onecolentry}

        \\vspace{0.2 cm}
    {{/PROJECTS}}
    {{/IF_PROJECTS}}

    {{#IF_SKILLS}}
    \\section{Skills}
        {{#IF_LANGUAGES}}
        \\begin{onecolentry}
            \\textbf{Languages:} {{LANGUAGES}}
        \\end{onecolentry}
        {{/IF_LANGUAGES}}

        {{#IF_TECHNOLOGIES}}
        \\vspace{0.2 cm}

        \\begin{onecolentry}
            \\textbf{Technologies:} {{TECHNOLOGIES}}
        \\end{onecolentry}
        {{/IF_TECHNOLOGIES}}
    {{/IF_SKILLS}}

\\end{document}`;

const seedTemplate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://raghavAI-resume:neccu7-bYsgyj-bumdum@cluster0.vtrwisq.mongodb.net/?appName=Cluster0');
    console.log("✅ MongoDB connected");

    // Check if template already exists
    const existing = await Template.findOne({ slug: "rendercv-classic" });
    if (existing) {
      console.log("⚠️  Template already exists");
      process.exit(0);
    }

    const template = await Template.create({
      name: "RenderCV Classic",
      slug: "rendercv-classic",
      description:
        "Clean and professional resume template inspired by RenderCV. ATS-friendly with a classic design.",
      latexTemplate: rendercvLatex,
      thumbnailUrl: "", // Add later
      isActive: true,
    });

    console.log("✅ Template seeded successfully:", template.name);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding template:", error);
    process.exit(1);
  }
};

seedTemplate();