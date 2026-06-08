# Apex AI Copilot Current State

Updated: 2026-06-08

## Safe Commit Timeline

- `35bd2a0` - initialized Apex AI Copilot platform baseline.
- `aeb9025` - added ArchVis image generation connector.
- `104d6f1` - added ArchVis studio with skill brain and revision memory.
- `25115c6` - enforced ArchVis top-down floor plan routing.
- `b427e27` - added DirectCut video studio.
- `baad290` - refined DirectCut video studio.
- `d7289b6` - added BIM 3D studio foundation.
- `34360b2` - added BIM 3D corrections and tour generator.
- `7c3fb59` - added Skill Export Factory.
- `9ae6e28` - added Windows Care Coding Assistant skill.
- `0ea59c3` - added Revit Customization Plugin skill.
- `fd36613` - added local Project Workspace.

## What Works

- Local app builds with `npm.cmd run build`.
- Chat-first UI exists.
- Universal upload exists.
- Paste screenshot support exists.
- Long message wrapping is fixed.
- Real AI runtime is wired through `/api/copilot/chat`.
- Image vision works when image data is sent.
- ArchVis Studio uses actual uploaded image.
- ArchVis preserve mode locks top-down floor plan humanization.
- ArchVis includes revision constraints and iteration gallery.
- DirectCut Studio generates planning-only video plans, scripts, prompts, and gallery items.
- BIM / 3D Studio opens internal viewer/import flow and avoids fake viewers.
- BIM findings use evidence levels: CONFIRMED, ASSUMPTION, UNKNOWN.
- Project Workspace saves/restores local project context with localStorage.
- Skill Update system analyzes knowledge files before approval.
- Skill Export Factory prepares portable skill packs.
- Windows Care + Coding Assistant skill is integrated.
- Revit Customization + Plugin skill is integrated.

## What Does Not Work Yet

- No GitHub remote exists yet.
- No production deploy is configured.
- No Supabase/database persistence.
- Project Workspace is local browser storage only.
- Video generation connector is planning-only.
- BIM / 3D viewer/import foundation exists, but real full IFC/CAD parsing and conversion need deeper implementation.
- RVT/DWG/DXF/SKP conversion is not implemented as a real converter yet.
- Image generation quality depends on the connected provider and may not perfectly preserve floor plans.
- No user account/project cloud sync yet.

## Secrets

`.env.local` exists locally and must remain ignored.

Do not print, commit, export, or zip secret values.

## Recommended Next Checkpoint

Stabilize Project Workspace restore and then create the GitHub repository only when the Owner approves.

After that:

1. Real BIM/IFC viewer improvements.
2. Real image generation provider tuning for strict plan preservation.
3. Video provider connector.
4. Cloud project persistence.
5. Deployment pipeline.

