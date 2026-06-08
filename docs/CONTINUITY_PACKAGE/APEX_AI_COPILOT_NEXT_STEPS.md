# Apex AI Copilot Next Steps

Use this file to continue work safely.

## Immediate Commands

```powershell
cd D:\AI-constr\apex-ai-copilot-platform
git status --short
npm.cmd run build
```

Expected baseline before new work:

- working tree clean, unless continuity docs are intentionally uncommitted.
- latest app commit: `fd36613`.
- `.env.local` ignored.

## Recommended Checkpoint Order

1. Commit or archive this continuity package if desired.
2. Manual local QA for Project Workspace:
   - create new project
   - upload image
   - generate ArchVis output
   - create DirectCut plan
   - open BIM / 3D Studio
   - reload page
   - confirm restore
   - export JSON
   - import JSON
3. Create GitHub remote only after Owner approval.
4. Add deployment only after GitHub baseline is clean.
5. Improve real BIM/IFC viewer.
6. Improve strict image editing fidelity.
7. Add real video generation connector.
8. Add cloud persistence when database strategy is approved.

## Do Not Do

- Do not touch old Apex repos.
- Do not move files from `D:\AI Jedgard` or old folders.
- Do not touch Supabase.
- Do not touch Vercel config.
- Do not create GitHub remote without approval.
- Do not commit `.env.local`.
- Do not fake generated media.
- Do not fake BIM findings.

## Commit Pattern

Use small checkpoint commits:

```powershell
git add <safe files>
git commit -m "feat: <short checkpoint>"
```

Always run:

```powershell
npm.cmd run build
git status --short
git status --ignored --short .env.local
```

before committing.

## Owner QA Checklist

- Chat responds naturally in Portuguese and English.
- Upload appears in chat.
- Screenshot paste works.
- ArchVis opens on image/render/humanization intent.
- DirectCut opens on video/reels/tour intent.
- BIM / 3D opens on model/3D intent.
- Project Workspace opens on project commands.
- Export/import JSON does not include secrets.
- No fake output is presented as real generated media.

