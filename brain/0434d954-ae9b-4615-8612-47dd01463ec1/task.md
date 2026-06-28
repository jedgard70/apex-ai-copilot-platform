# Task List: SaaS User Management & RBAC

- [/] Verify Supabase `.env` variables and Service Role Key for Admin actions.
- [x] Update `src/lib/authModel.ts` with new Roles (Owner, Admin, Diretoria, Departamentos, Engenheiro de Obra, Cliente Final Categorias).
- [x] Implement Supabase Edge Function or local API route to handle User Invitations using Supabase Admin API (to bypass RLS and trigger auth emails).
- [x] Update `src/components/SaasAdminPanel.tsx` to read from real Supabase users (via Supabase RPC or Admin API) and not from mocks.
- [x] Add Invite User Form in `SaasAdminPanel.tsx`.
- [x] Implement role-based UI restriction in `App.tsx` or `main.tsx` to hide modules based on the logged-in user's role.
