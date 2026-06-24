---
enabled: false
kind: runtime-skill
---
# marketing_dispatcher

---
name: marketing_dispatcher
description: Produces campaign plans, copy templates, and local campaign artifacts.
domains: [business-marketing, content, social-media]
entrypoint: marketing_dispatcher.py:dispatch
triggers:
  - generate_campaign_plan
  - create_social_copy
risk: low
enabled: false
---

Imported skill from /skill/marketing_dispatcher.py.

Files:
- marketing_dispatcher.py

Notes:
- Writes local files; ensure runtime has correct writable paths or configure remote storage.

# Usage
- Review content templates and set distribution connectors (email, social) before enabling.



