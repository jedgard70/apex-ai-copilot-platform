---
enabled: true
---
# autonomous_sales_agent

---
name: autonomous_sales_agent
description: Automates sales outreach sequences and campaign copy generation (draft).
domains: [business-marketing, sales, crm]
entrypoint: autonomous_sales_agent.py:main
triggers:
  - generate_sales_sequence
  - outreach_campaign
risk: medium
enabled: false
---

Imported skill from /skill/autonomous_sales_agent.py.

Files:
- autonomous_sales_agent.py

Notes:
- Requires review before enabling: add email/SMS connectors, secrets, and tests.
- Do not enable in production until SMTP/Twilio/CRM credentials are configured and rotated.

# Usage
- Review code and update metadata, add unit/integration tests, then enable in a controlled rollout.


