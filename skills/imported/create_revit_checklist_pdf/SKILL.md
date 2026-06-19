---
enabled: false
---
# create_revit_checklist_pdf

---
name: create_revit_checklist_pdf
description: Generate Revit QA checklists and export as PDF from project data.
domains: [revit-customization, revit, bim-3d]
entrypoint: create_revit_checklist_pdf.py:generate_pdf
triggers:
  - generate_revit_checklist
  - export_checklist_pdf
risk: low
enabled: false
---

Imported skill from /skill/create_revit_checklist_pdf.py.

Files:
- create_revit_checklist_pdf.py

Notes:
- Intended to run in pyRevit or with Revit data exports. Validate environment and file inputs before enabling.

# Usage
- Review and adapt to target Revit integration; add connector configuration and tests.



