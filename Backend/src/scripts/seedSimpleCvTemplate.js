/**
 * Seed Script: Insert the Simple CV template into MongoDB
 * Run: node src/scripts/seedSimpleCvTemplate.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import Template from "../models/template.model.js";

dotenv.config();

const TEMPLATE = {
    name: "Simple CV",
    slug: "simple-cv",
    description: "A clean, modern, two-column resume template featuring custom colors, elegant typography, and a professional layout. Merged from the popular Simple CV package.",
    latexTemplate: `\\documentclass[letterpaper,11pt]{article}

% Packages from simplecv.sty
\\usepackage{fontawesome}                    % Social media icons
\\usepackage[cm]{fullpage}                   % Margins
\\usepackage[hidelinks]{hyperref}            % Hyperlinks
\\usepackage{titlesec}                       % Title formatting
\\usepackage{multicol}                       % Multiple columns
\\usepackage[usenames,dvipsnames]{xcolor}    % Coloring
\\usepackage{enumitem}                       % List customization
\\usepackage{lastpage}                       % Page numbering
\\usepackage{fancyhdr}                       % Footers
\\usepackage[english]{babel}         % Language styles
\\usepackage{graphicx}                       % Importing graphics
\\usepackage[export]{adjustbox}              % Aligning margins
\\usepackage{moresize}                       % HUGE size

% Styling
\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Quotes
\\usepackage[autostyle,english=american]{csquotes}
\\MakeOuterQuote{"}

% Hyperlinks
\\newcommand{\\link}[2]{\\href{#1}{#2}}

% Define colors
\\definecolor{color-text}{gray}{0.10}    % light black
\\definecolor{color-detail}{gray}{0.40}  % dark gray
\\def\\theme{MidnightBlue}
\\colorlet{color-title}{\\theme}          % black

% Set text color
\\makeatletter
\\newcommand{\\globalcolor}[1]{\\color{#1}\\global\\let\\default@color\\current@color}
\\makeatother
\\AtBeginDocument{\\globalcolor{color-text}}

% Shorthand
\\newcommand{\\github}[1]{\\href{https://github.com/#1/}{github.com/#1}}
\\newcommand{\\email}[1]{\\href{mailto:#1}{#1}}
\\newcommand{\\website}[1]{\\href{https://#1/}{#1}}
\\newcommand{\\linkedin}[1]{\\href{https://www.linkedin.com/in/#1/}{#1}}

% Dummy environment
\\newenvironment*{dummyenv}{}{}

% Inline heading
\\newcommand{\\headinginline}[2]{
    \\begin{minipage}[t]{0.60\\textwidth}
    \\vspace*{\\fill}
    \\HUGE \\textcolor{color-title}{#1}
    \\end{minipage}
    \\begin{minipage}[t]{0.39\\textwidth}
    \\begin{flushright}
    #2
    \\end{flushright}
    \\end{minipage}
}

% Two-columns
\\newcommand{\\sidebyside}[2]{
    \\begin{multicols}{2}
    #1 \\columnbreak
    #2 \\end{multicols}
}

% Section titles
\\titleformat{\\section}{
    \\scshape\\raggedright\\Large\\color{color-title}}{}{0em}{}[\\color{color-title}\\titlerule
    \\vspace{-\\smallskipamount}]

% Footer
\\fancyfoot[R]{Page \\thepage \\hspace{1pt} of \\pageref{LastPage}}

% Lists
\\newcommand{\\outerlist}[1]{
    \\begin{itemize}[leftmargin=*] #1 \\end{itemize}}
\\newcommand{\\denseouterlist}[1]{
    \\begin{itemize}[leftmargin=*,itemsep=0pt] #1 \\end{itemize}}
\\newcommand{\\innerlist}[1]{
    \\begin{itemize}[topsep=0pt] #1 \\end{itemize}}

% List items
\\newcommand{\\entry}[1]{\\item\\small{#1}}
\\newcommand{\\entryextra}[1]{\\textcolor{color-detail}{\\entry{#1}}}
\\newcommand{\\entrylabeled}[2][]{\\item[#1]\\small{#2}}

\\newcommand{\\entrymid}[4][]{
    \\item[#1] \\small{#2} \\hfill \\small{#3}
    \\vspace{-\\smallskipamount} \\item[]\\small{\\textit{#4}}}

\\newcommand{\\entrybig}[5][]{\\item[#1]
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
    #2 & #3 \\\\ {\\small#4} & {\\small #5} \\\\ \\end{tabular*}}

\\newcommand{\\entrybigonecol}[3][]{\\item[#1]
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
    #2 & \\\\ {\\small#3} & \\\\ \\end{tabular*}}

% Fill year
\\newcommand{\\fillyear}[1]{\\phantom{#1}}

% Make author name bold
\\newcommand*{\\boldname}[3]{%
  \\def\\lastname{#1}%
  \\def\\firstname{#2}%
  \\def\\firstinit{#3}}
\\boldname{}{}{}

\\begin{document}

% Heading
\\headinginline{ {{PERSONAL.NAME}} }{
    {{#IF_WEBSITE}}Website: \\website{ {{PERSONAL.WEBSITE}} } \\\\ {{/IF_WEBSITE}}
    {{#IF_EMAIL}}Email: \\email{ {{PERSONAL.EMAIL}} } \\\\ {{/IF_EMAIL}}
    {{#IF_LINKEDIN}}LinkedIn: \\linkedin{ {{PERSONAL.LINKEDIN}} } \\\\ {{/IF_LINKEDIN}}
    {{#IF_GITHUB}}GitHub: \\github{ {{PERSONAL.GITHUB}} } \\\\ {{/IF_GITHUB}}
    {{#IF_PHONE}}Phone: {{PERSONAL.PHONE}} {{/IF_PHONE}}
}

{{#IF_EDUCATION}}
\\section{Education}
\\outerlist{
  {{#EDUCATION}}
    \\entrybig
    {\\textbf{ {{INSTITUTION}} }} { {{START_DATE}} -- {{END_DATE}} }
    { {{DEGREE}} } { {{#IF_GPA}}GPA: {{GPA}}{{/IF_GPA}} }
    {{#IF_COURSEWORK}}
    \\innerlist{
        \\entry{\\textit{Coursework:} {{COURSEWORK}} }
    }
    {{/IF_COURSEWORK}}
  {{/EDUCATION}}
}
{{/IF_EDUCATION}}

{{#IF_EXPERIENCE}}
\\section{Experience}
\\outerlist{
  {{#EXPERIENCE}}
    \\entrybig
    {\\textbf{ {{COMPANY}} }} { {{START_DATE}} -- {{END_DATE}} }
    { {{POSITION}}, {{LOCATION}} } {}
    \\innerlist{
      {{#HIGHLIGHTS}}
      {{/HIGHLIGHTS}}
    }
  {{/EXPERIENCE}}
}
{{/IF_EXPERIENCE}}

{{#IF_PROJECTS}}
\\section{Projects}
\\outerlist{
  {{#PROJECTS}}
    \\entrybig
    {\\textbf{ {{NAME}} } {{#IF_LINK}} (\\link{https://{{LINK}}}{Link}) {{/IF_LINK}} } { {{DATE}} }
    { {{#IF_TECHNOLOGIES}} \\textit{ {{TECHNOLOGIES}} } {{/IF_TECHNOLOGIES}} } {}
    \\innerlist{
      {{#HIGHLIGHTS}}
      {{/HIGHLIGHTS}}
    }
  {{/PROJECTS}}
}
{{/IF_PROJECTS}}

\\sidebyside
{
    {{#IF_SKILLS}}
    \\section{Skills}
    \\denseouterlist{
        {{#IF_LANGUAGES}} \\entry{\\textbf{Languages:} {{LANGUAGES}} } {{/IF_LANGUAGES}}
        {{#IF_FRAMEWORKS}} \\entry{\\textbf{Frameworks:} {{FRAMEWORKS}} } {{/IF_FRAMEWORKS}}
        {{#IF_TOOLS}} \\entry{\\textbf{Tools:} {{TOOLS}} } {{/IF_TOOLS}}
        {{#IF_LIBRARIES}} \\entry{\\textbf{Libraries:} {{LIBRARIES}} } {{/IF_LIBRARIES}}
    }
    {{/IF_SKILLS}}
}
{
    {{#IF_ACHIEVEMENTS}}
    \\section{Achievements}
    \\denseouterlist{
        {{#ACHIEVEMENTS}}
        \\entry{ {{.}} }
        {{/ACHIEVEMENTS}}
    }
    {{/IF_ACHIEVEMENTS}}
}

{{#IF_PUBLICATIONS}}
\\section{Publications}
\\outerlist{
  {{#PUBLICATIONS}}
    \\entrymid{ {{TITLE}} }{ {{DATE}} }{\\textbf{ {{AUTHORS}} } {{#IF_DOI}} -- \\link{https://doi.org/{{DOI}}}{DOI} {{/IF_DOI}}}
  {{/PUBLICATIONS}}
}
{{/IF_PUBLICATIONS}}

\\end{document}
`
};

const seedTemplate = async () => {
    try {
        console.log("⏳ Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Check if template already exists
        const existing = await Template.findOne({ slug: TEMPLATE.slug });
        
        if (existing) {
            console.log("⚠️  Template already exists, updating...");
            existing.name = TEMPLATE.name;
            existing.description = TEMPLATE.description;
            existing.latexTemplate = TEMPLATE.latexTemplate;
            await existing.save();
            console.log("✅ Template updated:", existing._id);
        } else {
            const created = await Template.create(TEMPLATE);
            console.log("✅ Template created:", created._id);
        }

        console.log("✅ Done");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedTemplate();
