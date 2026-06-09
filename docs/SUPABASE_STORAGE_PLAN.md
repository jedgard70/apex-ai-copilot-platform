# Supabase Storage Plan

Status: CP12A draft only.

This plan defines storage buckets for Apex AI Copilot. No Supabase project has been connected and no buckets have been created yet.

## Buckets

| Bucket | Public | Purpose | Draft size limit |
|---|---:|---|---:|
| `project-uploads` | no | General uploaded files from project intake | 100 MB |
| `archvis-images` | no | Source images, floor plans and ArchVis references | 100 MB |
| `generated-images` | no | Generated images from ArchVis/image connectors | 100 MB |
| `directcut-media` | no | Video, image and audio references for DirectCut | 500 MB |
| `bim-models` | no | IFC, GLB, GLTF, OBJ, STL, FBX and conversion outputs | 1 GB |
| `documents` | no | PDFs, DOC/DOCX, contracts, permits, reports and legal docs | 100 MB |
| `field-photos` | no | RDO and jobsite photo evidence | 100 MB |
| `exports` | no | Project packages, reports and export center outputs | 500 MB |
| `skill-files` | no | Uploaded skill files, prompt packs and knowledge imports | 100 MB |
| `public-assets` | yes | App branding/static public assets only | 100 MB |

## Path Convention

Protected buckets should use:

```text
<tenant_id>/<project_id>/<file_id-or-safe-file-name>
```

Examples:

```text
project-uploads/tenant_uuid/project_uuid/original-plan.pdf
archvis-images/tenant_uuid/project_uuid/floor-plan-source.png
bim-models/tenant_uuid/project_uuid/model.ifc
exports/tenant_uuid/project_uuid/client-package.md
```

This convention allows storage policies to parse the first two path segments and call project access helpers.

## Access Rules

- No public writes.
- Authenticated users can read protected files only if they can access the project.
- Authenticated users can upload/update protected files only if they can write to the project.
- Deletes are limited to Owner/Admin or Project Manager in the tenant.
- `public-assets` may be public-read for branding/static material.
- `public-assets` writes are Owner/Admin only.

## App Mapping

- Universal upload -> `project-uploads`
- Image/planta uploads -> `archvis-images`
- Generated images -> `generated-images`
- DirectCut references -> `directcut-media`
- IFC/GLB/GLTF/OBJ/STL/FBX and conversions -> `bim-models`
- Contracts, permits, reports, PDFs -> `documents`
- RDO/photo evidence -> `field-photos`
- Export Center output -> `exports`
- Skill Update / Skill Export files -> `skill-files`
- Logos/public branding -> `public-assets`

Every stored object should also have a matching `project_files` row with:

- `tenant_id`
- `project_id`
- `bucket`
- `storage_path`
- `file_name`
- `mime_type`
- `size_bytes`
- `file_kind`
- `source_confidence`
- `metadata`

## Review Before Applying

1. Confirm bucket size limits against provider plan.
2. Confirm MIME restrictions do not block universal upload needs.
3. Confirm HEIC/HEIF, BIM/CAD and ZIP support.
4. Test upload, read, update/upsert and delete for every role.
5. Confirm storage upsert has INSERT + SELECT + UPDATE policies where needed.
6. Confirm generated signed URLs cannot cross tenant/project boundaries.
