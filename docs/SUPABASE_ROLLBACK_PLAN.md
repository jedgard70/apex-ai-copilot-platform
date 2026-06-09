# Supabase Rollback Plan

Status: CP12C documentation only.

Because CP12 starts from a brand-new Supabase project, the safest rollback before real users is to reset or recreate the project instead of trying to preserve partial state.

## Before Real Users

Preferred rollback:

1. Stop app writes.
2. Export any test notes or screenshots that matter.
3. Delete/reset the disposable Supabase project.
4. Recreate a clean Supabase project.
5. Reapply corrected migrations after review.

This is safer than manually dropping many interdependent tables while schema is still evolving.

## If Manual Cleanup Is Needed

Only use manual cleanup in a disposable/non-production project.

General order:

1. Delete storage objects.
2. Delete storage buckets:
   - `project-uploads`
   - `archvis-images`
   - `generated-images`
   - `directcut-media`
   - `bim-models`
   - `documents`
   - `field-photos`
   - `exports`
   - `skill-files`
   - `public-assets`
3. Drop dependent module tables.
4. Drop project tables.
5. Drop tenant/profile/role tables.
6. Drop enum types and helper functions last.

Manual cleanup must be reviewed because foreign keys and RLS helpers create dependencies.

## Production Data Rule

Never delete production data without explicit Owner approval.

Before production rollback:

- Export database backup.
- Export storage object inventory.
- Export critical project packages.
- Document affected tenants/projects/users.
- Confirm whether rollback is schema-only, data-only or both.
- Confirm downtime window.

## RLS Policy Rollback

If a policy blocks legitimate access:

1. Do not disable RLS globally as a first reaction.
2. Identify the exact table and role.
3. Reproduce with a test user.
4. Patch the specific policy.
5. Re-run cross-tenant denial tests.

If a policy exposes data:

1. Immediately revoke or tighten the policy.
2. Review audit logs if available.
3. Rotate exposed credentials only if there is evidence of key or token exposure.
4. Document the incident.

## Storage Rollback

If storage paths or policies are wrong:

1. Stop uploads.
2. Check object path convention.
3. Confirm object paths use `<tenant_id>/<project_id>/...`.
4. Patch bucket policies.
5. Test read/upload/update/delete per role.
6. Do not make protected buckets public as a workaround.
