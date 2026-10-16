This is a personal IT Business Analysis practice project by Nguyễn Đăng Cẩm Tú (Hazel).
ITBA Practice Lab is a learning project designed to help aspiring IT Business Analysts review core BA concepts through structured practice questions. The repository contains the question-bank data, Python utilities used to build and validate the bank, and a static website for practicing questions.
Project status: Personal learning project. Question counts, answer accuracy, and website behavior should be verified against the current files and deployment before being treated as final.

Project overview
The project separates the question-bank preparation tools from the website that presents the questions.
- Question bank: JSON data used by the website.
- Bank builder: Python scripts for defining the exam blueprint, preparing exam content, exporting data, and validating the question bank.
- Practice website: HTML, CSS, and JavaScript files in site/.
- Supporting materials: A practice guide in DOCX format and a question-bank workbook in XLSX format.
Repository structure
itba-question-bank/
├── bank_builder/
│   ├── blueprint_data.py
│   ├── exam01.py
│   ├── exam02.py
│   ├── exam03.py
│   ├── exam04.py
│   ├── exam05.py
│   ├── exam06.py
│   ├── exam07.py
│   ├── exam08.py
│   ├── exam09.py
│   ├── exam10.py
│   ├── exporter.py
│   ├── test_site.py
│   └── validator.py
├── site/
│   ├── ITBA_Junior_Question_Bank.json
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── ITBA_Junior_Practice_Guide.docx
├── ITBA_Junior_Question_Bank.json
├── ITBA_Junior_Question_Bank.xlsx
├── vercel.json
└── README.md
__pycache__/ and compiled Python bytecode may appear locally after running Python. These are generated files and generally should not be committed to Git.
Main components
1. Question-bank builder
The bank_builder/ directory contains Python source files for the question-bank workflow:
- blueprint_data.py — exam blueprint and related configuration.
- exam01.py to exam10.py — exam-specific content.
- exporter.py — exports the prepared question bank to a data format used by the project.
- validator.py — validation utilities for checking the question bank.
- test_site.py — site-related test utility.
Check each script's implementation and usage before running it. The exact commands and dependencies may vary with the current code.
2. Practice website
The site/ directory contains the static frontend:
- index.html — page structure.
- styles.css — visual styling.
- app.js — client-side behavior.
- ITBA_Junior_Question_Bank.json — question-bank data loaded by the website.
The website is intended to be deployable as a static site. Its data file must remain in the expected location and follow the schema consumed by app.js.
3. Supporting learning materials
- ITBA_Junior_Practice_Guide.docx — supporting practice guide.
- ITBA_Junior_Question_Bank.xlsx — spreadsheet version of the question bank.
- ITBA_Junior_Question_Bank.json — master or exported JSON question bank at the repository root.

This project includes a vercel.json configuration file. Review it together with the Vercel project's Root Directory, Build Command, and Output Directory settings before deployment.
For a static site whose published files are in site/, configure Vercel so that the deployment output includes site/index.html and the JSON file loaded by the frontend. Avoid configuring both the project Root Directory and Output Directory in a way that makes Vercel look for site/site.
After deploying, open the actual production URL and verify:
1. The homepage loads successfully.
2. The question-bank JSON is accessible to the frontend.
3. Exams and questions render correctly.
4. Answer selection, scoring, review, and other implemented features work as expected.
5. The browser console does not show critical errors.
A successful deployment process does not, by itself, guarantee that the production page is accessible or that every feature works.
Design direction
The website uses a pastel-yellow visual direction intended to feel warm, calm, and focused on learning. The design should prioritize readability, clear question navigation, and consistent feedback for answers.
Project authorship
Creator: Nguyễn Đăng Cẩm Tú (Hazel)
Year: 2026
This is a personal learning project. AI tools may assist with implementation and content preparation; generated questions and explanations should be reviewed and validated before being relied on for assessment or interview preparation.
Future improvements
Potential improvements include:
- Stronger automated checks for question-bank integrity.
- More detailed topic-level performance summaries.
- Additional test coverage for the exam flow.
- Clear documentation of question sources and review status.
- A deployment checklist for each release.
