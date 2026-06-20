# Local-First Client Workspace & CRM Schema
Created by Apex AI Copilot.

This local-first storage adapter synchronizes directly with Supabase when an internet connection is available, and falls back to local IndexedDB/localStorage inside the Desktop app.

## SQL Relational Design (Supabase Sync)

```sql
-- Client Profile Table
CREATE TABLE IF NOT EXISTS client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    preferred_language VARCHAR(10) DEFAULT 'pt-BR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Workspace Table (Multi-tenant)
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES client_profiles(id),
    status VARCHAR(50) DEFAULT 'active'
);

-- Projects linked to Workspace & Client
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id),
    name VARCHAR(255) NOT NULL,
    bim_file_path TEXT,
    proposal_package_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```
