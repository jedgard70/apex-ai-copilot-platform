import fs from 'fs';
import path from 'path';

const FAL_KEY = '9e94cfe4-0c8a-4461-87af-ace86d887c83:7aba837f1ba727de2042e154ba220c3b';
const useDev = true;
const fluxUrl = useDev ? 'https://fal.run/fal-ai/flux/dev' : 'https://fal.run/fal-ai/flux/schnell';
const videoUrl = 'https://fal.run/fal-ai/kling-video/v1/standard/text-to-video';

const imagesToGenerate = [
  {
    name: 'hero_bg.jpg',
    prompt: 'Cinematic hyper-realistic 8k render, luxurious tech brand style. A floating glowing holographic city blending with physical construction in the desert. Dark mode, cyan and gold glowing data streams. Depth of field, sharp focus, ray tracing, volumetric lighting. [UNIQUE: 001]'
  },
  {
    name: 'feature_bim.jpg',
    prompt: 'Cinematic hyper-realistic 8k render, luxurious tech brand style. A glowing translucent 3D BIM architectural model of a futuristic skyscraper hovering over a sleek black table. Dark mode, neon cyan wireframes intersecting with solid gold structural beams, sci-fi design, volumetric lighting, glassmorphism. [UNIQUE: 002]'
  },
  {
    name: 'feature_predictive.jpg',
    prompt: 'Cinematic hyper-realistic 8k render. An AI predictive risk analysis system displaying a glowing radar over a city model, predicting anomalies. Dark mode, deep shadows, bright cyan alerts and gold safety shields, glassmorphism, photorealistic. [UNIQUE: 003]'
  },
  {
    name: 'feature_autonomous.jpg',
    prompt: 'Cinematic hyper-realistic 8k render, luxurious tech brand style. A sleek futuristic humanoid AI avatar made of glass and glowing cyan circuits, assisting with a holographic blueprint. Dark mode, gold accents, sci-fi laboratory, highly detailed. [UNIQUE: 004]'
  }
];

const videosToGenerate = [
  {
    name: 'hero_video.mp4',
    prompt: 'Cinematic hyper-realistic render. A futuristic city being built by glowing cyan and gold holographic beams in a dark desert landscape. Smooth, slow cinematic pan.',
    duration: "5"
  },
  {
    name: 'ai_copilot_video.mp4',
    prompt: 'Cinematic close-up of a holographic data dashboard glowing in cyan and gold on a dark glass table, numbers dynamically updating. Subtle depth of field, slow smooth camera movement.',
    duration: "5"
  }
];

async function generateImage(prompt, filename) {
  console.log(`Generating Image ${filename}...`);
  try {
    const response = await fetch(fluxUrl, {
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
    
    if (!response.ok) throw new Error(await response.text());
    
    const data = await response.json();
    const imageUrl = data.images[0].url;
    console.log(`Downloading ${filename}...`);
    
    const imageResponse = await fetch(imageUrl);
    const buffer = await imageResponse.arrayBuffer();
    
    const outPath = path.join(process.cwd(), 'public', 'assets', filename);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, Buffer.from(buffer));
    console.log(`Saved ${filename}`);
  } catch (err) {
    console.error(`Failed ${filename}:`, err);
  }
}

async function generateVideo(prompt, filename, duration) {
  console.log(`Generating Video ${filename}...`);
  try {
    const response = await fetch(videoUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        duration: duration,
        aspect_ratio: "16:9"
      })
    });
    
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    
    // Kling is async. We need to poll using request_id.
    let statusUrl = `https://fal.run/fal-ai/kling-video/v1/standard/text-to-video/requests/${data.request_id}`;
    let videoData = null;
    while (true) {
        console.log(`Polling status for ${filename}...`);
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await fetch(statusUrl, {
            headers: { 'Authorization': `Key ${FAL_KEY}` }
        });
        const statusJson = await statusRes.json();
        if (statusJson.status === "COMPLETED") {
            videoData = statusJson;
            break;
        } else if (statusJson.status === "FAILED") {
            throw new Error(`Video failed: ${statusJson.error}`);
        }
    }

    const vidUrl = videoData.video.url;
    console.log(`Downloading ${filename} from ${vidUrl}...`);
    
    const vidResponse = await fetch(vidUrl);
    const buffer = await vidResponse.arrayBuffer();
    
    const outPath = path.join(process.cwd(), 'public', 'assets', filename);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, Buffer.from(buffer));
    console.log(`Saved ${filename}`);
  } catch (err) {
    console.error(`Failed ${filename}:`, err);
  }
}

async function run() {
  // Generate sequentially to avoid duplicate cache issues on Fal!
  for (const p of imagesToGenerate) {
    await generateImage(p.prompt, p.name);
  }
  for (const p of videosToGenerate) {
    await generateVideo(p.prompt, p.name, p.duration);
  }
  console.log("Done generating all assets.");
}

run();
