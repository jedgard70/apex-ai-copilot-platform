# Recovery Checklist for docsedgard Restoration

1. Sanitize recovered files for secrets (API keys, tokens, passwords). Mark files requiring rotation.
2. Rotate any discovered credentials: GitHub PATs, Supabase, OpenAI, Stripe, Twilio, DB passwords.
3. Create isolated feature branches for converting assets into SKILL packages and enable selectively.
4. Add unit/integration tests for executable skills; validate local build before enabling.
5. Limit Serverless Functions to stay under Vercel Hobby limits; consolidate or upgrade plan.
6. Validate Supabase migrations and run DB push in a staging environment.
7. Review PR #44 and this branch changes; only merge after security review and test deployment.

Automated actions performed:
- Reverted enabled:true to enabled:false for imported skills.
- Restored artifacts placed under skills/imported/recovered_docsedgard and auto_wrapped.

