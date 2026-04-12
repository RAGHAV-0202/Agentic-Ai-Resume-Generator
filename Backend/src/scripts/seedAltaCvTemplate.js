/**
 * Seed Script: Insert the AltaCV template into MongoDB
 * Run: node src/scripts/seedAltaCvTemplate.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import Template from "../models/template.model.js";

dotenv.config();

const TEMPLATE = {
    name: "AltaCV",
    slug: "altacv",
    description: "The famous two-column modern resume with colored tags. Optimized for high data density, perfect for software engineers and researchers.",
    latexTemplate: `\\documentclass[10pt,a4paper,ragged2e,withhyper]{altacv}

\\geometry{left=1.25cm,right=1.25cm,top=1.5cm,bottom=1.5cm,columnsep=1.2cm}
\\usepackage{paracol}

\\usepackage[rm]{roboto}
\\usepackage[defaultsans]{lato}
\\renewcommand{\\familydefault}{\\sfdefault}

% Colors
\\definecolor{SlateGrey}{HTML}{2E2E2E}
\\definecolor{LightGrey}{HTML}{666666}
\\definecolor{DarkPastelRed}{HTML}{450808}
\\definecolor{PastelRed}{HTML}{8F0D0D}
\\definecolor{GoldenEarth}{HTML}{E7D192}
\\colorlet{name}{black}
\\colorlet{tagline}{PastelRed}
\\colorlet{heading}{DarkPastelRed}
\\colorlet{headingrule}{GoldenEarth}
\\colorlet{subheading}{PastelRed}
\\colorlet{accent}{PastelRed}
\\colorlet{emphasis}{SlateGrey}
\\colorlet{body}{LightGrey}

\\renewcommand{\\namefont}{\\Huge\\rmfamily\\bfseries}
\\renewcommand{\\personalinfofont}{\\small}
\\renewcommand{\\cvsectionfont}{\\LARGE\\rmfamily\\bfseries}
\\renewcommand{\\cvsubsectionfont}{\\large\\bfseries}

\\renewcommand{\\cvItemMarker}{{\\small\\textbullet}}
\\renewcommand{\\cvRatingMarker}{\\faCircle}

\\begin{document}
\\name{ {{PERSONAL.NAME}} }
\\tagline{ {{PERSONAL.LOCATION}} }
\\personalinfo{
  {{#IF_EMAIL}}\\email{ {{PERSONAL.EMAIL}} }{{/IF_EMAIL}}
  {{#IF_PHONE}}\\phone{ {{PERSONAL.PHONE}} }{{/IF_PHONE}}
  {{#IF_LINKEDIN}}\\linkedin{ {{PERSONAL.LINKEDIN}} }{{/IF_LINKEDIN}}
  {{#IF_GITHUB}}\\github{ {{PERSONAL.GITHUB}} }{{/IF_GITHUB}}
  {{#IF_WEBSITE}}\\homepage{ {{PERSONAL.WEBSITE}} }{{/IF_WEBSITE}}
}
\\makecvheader

\\columnratio{0.6}
\\begin{paracol}{2}

{{#IF_EXPERIENCE}}
\\cvsection{Experience}
  {{#EXPERIENCE}}
  \\cvevent{ {{{POSITION}}} }{ {{{COMPANY}}} }{ {{{LOCATION}}} }{ {{START_DATE}} -- {{END_DATE}} }
  \\begin{itemize}
    {{#HIGHLIGHTS}}
    {{/HIGHLIGHTS}}
  \\end{itemize}
  \\divider
  {{/EXPERIENCE}}
{{/IF_EXPERIENCE}}

{{#IF_PROJECTS}}
\\cvsection{Projects}
  {{#PROJECTS}}
  \\cvevent{ {{{NAME}}} }{ \\href{https://{{LINK}}}{Link} }{ {{{TECHNOLOGIES}}} }{ {{DATE}} }
  \\begin{itemize}
    {{#HIGHLIGHTS}}
    {{/HIGHLIGHTS}}
  \\end{itemize}
  \\divider
  {{/PROJECTS}}
{{/IF_PROJECTS}}

\\switchcolumn

{{#IF_EDUCATION}}
\\cvsection{Education}
  {{#EDUCATION}}
  \\cvevent{ {{{DEGREE}}} }{ {{{INSTITUTION}}} }{}{ {{START_DATE}} -- {{END_DATE}} {{#IF_GPA}} $|$ GPA: {{GPA}}{{/IF_GPA}} }
    {{#IF_COURSEWORK}}Coursework: {{COURSEWORK}}{{/IF_COURSEWORK}}
  \\divider
  {{/EDUCATION}}
{{/IF_EDUCATION}}

{{#IF_SKILLS}}
\\cvsection{Skills}
    {{#IF_LANGUAGES}} \\textbf{Languages:}\\\\ {{LANGUAGES}}\\\\[1ex] {{/IF_LANGUAGES}}
    {{#IF_FRAMEWORKS}} \\textbf{Frameworks:}\\\\ {{FRAMEWORKS}}\\\\[1ex] {{/IF_FRAMEWORKS}}
    {{#IF_TOOLS}} \\textbf{Tools:}\\\\ {{TOOLS}}\\\\[1ex] {{/IF_TOOLS}}
    {{#IF_LIBRARIES}} \\textbf{Libraries:}\\\\ {{LIBRARIES}}\\\\[1ex] {{/IF_LIBRARIES}}
{{/IF_SKILLS}}

{{#IF_ACHIEVEMENTS}}
\\cvsection{Achievements}
  \\begin{itemize}
  {{#ACHIEVEMENTS}}
    \\item {{{.}}}
  {{/ACHIEVEMENTS}}
  \\end{itemize}
{{/IF_ACHIEVEMENTS}}

{{#IF_PUBLICATIONS}}
\\cvsection{Publications}
  {{#PUBLICATIONS}}
  \\cvevent{ {{{TITLE}}} }{ {{{AUTHORS}}} }{}{ {{DATE}} {{#IF_DOI}} $|$ DOI: {{DOI}}{{/IF_DOI}} }
  \\divider
  {{/PUBLICATIONS}}
{{/IF_PUBLICATIONS}}


\\end{paracol}
\\end{document}
`
};

const seedTemplate = async () => {
    try {
        console.log("⏳ Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

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
