import fs from 'fs';

const agentsMd = fs.readFileSync('AGENTS.md', 'utf-8');
const canonicalFile = 'docs/Apex_acip_master_architecture(doumento official04-07-2026.md';
let canonical = fs.readFileSync(canonicalFile, 'utf-8');

// The rules in AGENTS.md start at "## ðŸš¨ REGRA ABSOLUTA 1" or "## 🚨 REGRA ABSOLUTA 1"
let matchIndex = agentsMd.indexOf('REGRA ABSOLUTA 1');
if (matchIndex === -1) {
  console.log('Could not find rules in AGENTS.md');
  process.exit(1);
}

// Find the start of the line
const startOfRules = agentsMd.lastIndexOf('##', matchIndex);
let rules = agentsMd.substring(startOfRules);

// Quick UTF-8 fix for the corrupted characters that got into AGENTS.md
rules = rules.replace(/ðŸš¨/g, '🚨')
             .replace(/â€”/g, '—')
             .replace(/Ã§Ã£/g, 'çã')
             .replace(/Ã§/g, 'ç')
             .replace(/Ãµ/g, 'õ')
             .replace(/Ã¡/g, 'á')
             .replace(/Ã©/g, 'é')
             .replace(/Ã­/g, 'í')
             .replace(/Ã³/g, 'ó')
             .replace(/Ãº/g, 'ú')
             .replace(/Ãª/g, 'ê')
             .replace(/Ã¢/g, 'â')
             .replace(/Ã/g, 'í')
             .replace(/  # #   =Ø¨Þ  /g, '## 🚨 ')
             .replace(/ F i c a /g, 'Fica ') // Trying to fix the weird spacing in rule 10
             // To be safe, just replace the corrupt rule 10 completely:
             .replace(/## 🚨 R E G R A   A B S O L U T A   1 0[\s\S]*/, `## 🚨 REGRA ABSOLUTA 10 — Nomenclatura de Concorrentes\nFica terminantemente proibido citar nomes de empresas, sites ou IAs concorrentes (ex: Magnific, Midjourney, Veo AI, ChatGPT, Lumion, V-Ray, CapCut) nos textos de marketing, pitches de vendas ou na interface da plataforma.\nUse sempre termos genéricos como "estilo os melhores sites por aí", "padrão de cinema", "edição profissional de mercado". A marca central é única e exclusivamente a **Apex AI**.`);

// Now we need to replace whatever is at the bottom of the canonical doc
// The canonical doc has "## 🚨 REGRA ABSOLUTA 10" currently at the bottom
const canonicalRuleStart = canonical.indexOf('## 🚨 REGRA ABSOLUTA 10');
if (canonicalRuleStart !== -1) {
    canonical = canonical.substring(0, canonicalRuleStart);
}

// Ensure there is some spacing
if (!canonical.endsWith('\n\n')) {
    canonical += '\n\n';
}

canonical += rules;

fs.writeFileSync(canonicalFile, canonical, 'utf-8');
console.log('Fixed canonical doc successfully!');
