import fs from 'fs'

function updateFile(filePath) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8')
    if (content.includes('endpoints/apex-copilot-v1')) {
      content = content.replace(/endpoints\/apex-copilot-v1/g, 'endpoints/apex-ai-copilot-v1')
      fs.writeFileSync(filePath, content)
      console.log(`Updated ${filePath}`)
    }
  }
}

updateFile('d:/AI-constr/apex-ai-copilot-platform/docs/APEX_PLATFORM_CURRENT_STATE.md')
updateFile('C:/Users/apexg/.gemini/antigravity/brain/0434d954-ae9b-4615-8612-47dd01463ec1/implementation_plan_ai_intelligence.md')
