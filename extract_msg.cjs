const fs = require('fs');
const lines = fs.readFileSync('C:/Users/apexg/.gemini/antigravity-ide/brain/836a0383-cbd2-4b45-9b03-8386dadca3fb/.system_generated/logs/transcript_full.jsonl', 'utf8').split('\n');
const firstUserMsg = lines.find(l => l.includes('"type":"USER_INPUT"'));
if (firstUserMsg) {
  fs.writeFileSync('scratch_user_msg.txt', JSON.parse(firstUserMsg).content);
}
