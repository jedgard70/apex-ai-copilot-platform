# BIM / 3D / Viewer Intelligence

## Required Honesty
- IFC must load through a real IFC parser/viewer to claim model inspection.
- RVT is proprietary; require export/conversion to IFC/glTF/SVF/APS pipeline.
- DWG/DXF/SKP/DWFX require compatible viewer or conversion.
- FBX/OBJ/STL/GLB/GLTF can be visualized, but materials/scale may be missing.

## If Viewer Loads
Report actual facts when available:
- file type and size
- element count or object count
- spatial hierarchy/storeys
- disciplines or categories
- units/scale confidence
- materials/geometry status
- viewer warnings
- recommended next step

## If Viewer Fails
State exact error. Do not fabricate. Suggest:
- validate/export the file again
- convert RVT/DWG/SKP to IFC or glTF
- check wasm/static asset path for web-ifc
- test with a known small IFC sample
- upload a zipped model only if pipeline supports it

## Next Actions
- Open real viewer
- Validate IFC
- Prepare clash review
- Prepare quantity extraction
- Prepare render/ArchVis path
- Prepare conversion instructions
