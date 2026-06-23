# AI Prompts for Floor Plan Humanization

## DALL-E / GPT-4V Prompts

### Residential Floor Plan
```
"Photorealistic top-down view of a 400 sqft modern apartment floor plan.
Show 2 people: one person sitting on a gray couch reading, another person in 
the kitchen preparing food. Professional architectural rendering style, soft 
natural lighting from windows, realistic shadows, clean and bright aesthetic."
```

### Office Space
```
"Aerial view architectural rendering of a 2000 sqft open office floor plan.
Show 8 people: 4 seated at desks working on computers, 2 in conversation near 
a whiteboard area, 1 at a standing meeting table, 1 at a coffee station. 
Professional corporate office aesthetic, modern furniture, neutral colors, 
soft task lighting. Top-down perspective, scale grid visible."
```

### Retail/Hospitality
```
"Professional floor plan rendering of a 1500 sqft café floor plan viewed from above.
Show 6 customers: 3 seated at tables dining, 2 at counter ordering, 1 browsing 
the menu area. Include warm interior lighting, furniture, plants. Realistic 
architectural visualization, professional quality."
```

## Midjourney Parameters

### Effective Modifiers for Floor Plans
```
--ar 4:3 (aspect ratio for floor plans)
--style raw (more architectural)
--quality 2 (better detail)
--niji (anime realism, not recommended)
```

**Example:**
```
/imagine a floor plan of a modern loft apartment with 
2 people, top-down view, architectural visualization, 
photorealistic, 1:50 scale --ar 4:3 --quality 2
```

## Stable Diffusion Guidance

### Base Model Recommendations
- **RealisticVision**: Best for photorealistic humanization
- **Architectural Digest**: Specialized for floor plans
- **DreamShaper**: Good balance of quality and speed

### Effective Keywords
- "top-down view"
- "floor plan"
- "architectural rendering"
- "photorealistic"
- "professional architectural visualization"
- "scale figures"
- "overhead perspective"

## 3D Rendering Resources

### Free Human Figure Libraries
- **Sketchfab**: Search "human figure architecture" (free models)
- **CGTrader**: Professional rigged figures
- **TurboSquid**: Commercial human models
- **Poser/DAZ Studio**: Dedicated character platforms

### Blender Setup Tips
```
1. Import floor plan as background image
2. Model or import human figures to scale
3. Use proportions: 5.5-6 ft (1.7-1.8 m) height
4. Position with orthographic camera (true scale)
5. Add basic lighting and render
6. Composite shadows for realism
```

## Architectural Tools Settings

### Revit Figure Placement
1. Insert → Entourage → Figuresß
2. Scale to actual height (e.g., 1:50 scale = 0.1" per foot)
3. Position in plan view with snapping
4. Create multiple scenarios with visibility states
5. Render using 3D view for presentations

### SketchUp Workflow
1. Import human components from 3D Warehouse
2. Scale to model dimensions
3. Position in floor plan
4. Use scenes for different occupancy variations
5. Export as high-res image or PDF

## Validation Checklist

- [ ] Human figure height matches floor plan scale
- [ ] Figures fit naturally within spaces
- [ ] Door/window heights align with human proportions
- [ ] Furniture scale matches human figures
- [ ] Shadows are directionally consistent
- [ ] Walking paths are logical and unobstructed
- [ ] Poses and activities are realistic
- [ ] Overall composition is balanced
- [ ] Lighting and colors feel professional
- [ ] All dimensions are accurate

## Additional Resources

- **Architectural Graphics Standards** (Ramsey/Sleeper) - Reference dimensions
- **Human Scale**: Standard standing = 5.5-6 ft, seated = 2.5-3 ft
- **Personal Space**: 1.5-4 ft depending on relationship/context
- **Entourage**: Professional figure libraries specifically for architectural viz
