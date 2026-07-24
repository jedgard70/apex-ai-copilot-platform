import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://csvtkvyauusvtmrkqtzl.supabase.co';
const supabaseKey = 'sb_secret_brXqeRm3prcJzAsZ82Q-1A_wc9UQELr';
const supabase = createClient(supabaseUrl, supabaseKey);

const imagePaths = [
  'D:\\Clientes\\Aparecido Rancho\\churrasqueira-forno-e-fogao-a-lenha-de-alvenaria-cod246.jpg',
  'D:\\Clientes\\Matheus e Laura\\image_406f1435.png',
  'D:\\Clientes\\Carlos Perez\\carlos lins.jpg'
];

async function run() {
  const { data: posts, error: fetchErr } = await supabase
    .from('social_posts')
    .select('*')
    .eq('status', 'draft')
    .order('scheduled_at', { ascending: true });
    
  if (fetchErr) { console.error('Fetch error:', fetchErr); return; }
  
  // Create bucket if not exists
  await supabase.storage.createBucket('media', { public: true }).catch(() => {});

  for (let i = 0; i < Math.min(posts.length, imagePaths.length); i++) {
    const post = posts[i];
    const imagePath = imagePaths[i];
    
    if (!fs.existsSync(imagePath)) {
      console.log(`File not found: ${imagePath}`);
      continue;
    }
    
    const fileName = `auto_${Date.now()}_${path.basename(imagePath)}`;
    const fileBuffer = fs.readFileSync(imagePath);
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    
    console.log(`Uploading ${fileName}...`);
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('media')
      .upload(`marketing/${fileName}`, fileBuffer, {
        contentType: mimeType
      });
    
    if (uploadErr) {
       console.error('Upload Error:', uploadErr);
       continue;
    }
    
    const { data: publicData } = supabase.storage.from('media').getPublicUrl(uploadData.path);
    const publicUrl = publicData.publicUrl;
    
    console.log(`Updating post ${post.id} with ${publicUrl}...`);
    await supabase.from('social_posts').update({ media_url: publicUrl, media_type: 'image' }).eq('id', post.id);
  }
  
  console.log('All drafts updated successfully!');
}

run();
