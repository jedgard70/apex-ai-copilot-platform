import fs from 'fs';
import path from 'path';

const FAL_KEY = '9e94cfe4-0c8a-4461-87af-ace86d887c83:7aba837f1ba727de2042e154ba220c3b';
const useDev = true;
const url = useDev ? 'https://fal.run/fal-ai/flux/dev' : 'https://fal.run/fal-ai/flux/schnell';

const pillars = [
  {
    name: 'pilar_1_orcamento.png',
    prompt: 'Cinematic hyper-realistic 8k render, luxurious tech brand style. A floating holographic financial dashboard showing construction budget, glowing with gold and cyan data streams. Dark mode, glassmorphism elements, sci-fi office background, depth of field, sharp focus, ray tracing, volumetric lighting.'
  },
  {
    name: 'pilar_2_projetos_bim.png',
    prompt: 'Cinematic hyper-realistic 8k render, luxurious tech brand style. A glowing translucent 3D BIM architectural model of a futuristic skyscraper hovering over a sleek black table. Dark mode, neon cyan wireframes intersecting with solid gold structural beams, sci-fi design, volumetric lighting, glassmorphism.'
  },
  {
    name: 'pilar_3_controle_execucao.png',
    prompt: 'Cinematic hyper-realistic 8k render, luxurious tech brand style. A high-tech construction site at night with autonomous drones scanning a building structure. Dark mode, laser grids, cyan and gold glowing HUD elements overlaying the physical world, glassmorphism interfaces, cinematic lighting.'
  },
  {
    name: 'pilar_4_inteligencia_evm.png',
    prompt: 'Cinematic hyper-realistic 8k render, luxurious tech brand style. An abstract glowing artificial intelligence core representing Earned Value Management (EVM), pulsating with gold and cyan energy. Dark mode, sleek glass panels floating in mid-air with performance metrics, sci-fi server room atmosphere, 8k resolution.'
  },
  {
    name: 'pilar_5_risco_preditiva.png',
    prompt: 'Cinematic hyper-realistic 8k render, luxurious tech brand style. An AI predictive risk analysis system displaying a glowing radar or forcefield over a city model, predicting anomalies. Dark mode, deep shadows, bright cyan alerts and gold safety shields, glassmorphism, sci-fi cybernetic vibe, photorealistic.'
  },
  {
    name: 'pilar_6_design_generativo.png',
    prompt: 'Cinematic hyper-realistic 8k render, luxurious tech brand style. An AI generative design matrix morphing complex geometric architecture out of liquid gold and cyan energy. Dark mode background, glassmorphism floating menus, highly detailed futuristic structures forming, dramatic cinematic lighting.'
  },
  {
    name: 'pilar_7_copilotos_autonomos.png',
    prompt: 'Cinematic hyper-realistic 8k render, luxurious tech brand style. A sleek futuristic AI robot or an elegant glowing humanoid AI avatar made of glass and glowing cyan circuits, assisting with a holographic blueprint. Dark mode, gold accents on the robot, sci-fi laboratory, highly detailed, 8k.'
  },
  {
    name: 'pilar_8_sustentabilidade.png',
    prompt: 'Cinematic hyper-realistic 8k render, luxurious tech brand style. A futuristic eco-city inside a glowing glass dome or a holographic green energy core, blending nature with hyper-advanced tech. Dark mode, glowing cyan bioluminescence, gold tech accents, glassmorphism panels, photorealistic, cinematic.'
  }
];

async function generateImage(prompt, filename) {
  console.log(`Generating ${filename}...`);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: "landscape_16_9",
        num_inference_steps: useDev ? 28 : 4
      })
    });
    
    if (!response.ok) {
      console.error(`Error generating ${filename}:`, await response.text());
      return;
    }
    
    const data = await response.json();
    const imageUrl = data.images[0].url;
    console.log(`Downloading ${filename} from ${imageUrl}`);
    
    const imageResponse = await fetch(imageUrl);
    const buffer = await imageResponse.arrayBuffer();
    
    const outPath = path.join(process.cwd(), 'public', 'pillars', filename);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, Buffer.from(buffer));
    console.log(`Saved ${filename}`);
  } catch (err) {
    console.error(`Failed ${filename}:`, err);
  }
}

async function run() {
  const promises = pillars.map(p => generateImage(p.prompt, p.name));
  await Promise.all(promises);
  console.log("Done generating all pillars.");
}

run();
