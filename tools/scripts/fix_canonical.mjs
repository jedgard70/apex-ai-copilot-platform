import fs from 'fs';
import path from 'path';

// Files to update
const agentsFile = path.resolve('AGENTS.md');
const modelfile = path.resolve('Modelfile.apex');
const checkpointTracker = path.resolve('docs/CHECKPOINT_TRACKER.md');
const oldCanonical = 'docs/APEX_PLATFORM_CURRENT_STATE.md';
const newCanonical = 'docs/Apex_acip_master_architecture(doumento official04-07-2026.md';

const newCanonicalPath = path.resolve(newCanonical);

// 1. Read AGENTS.md and find all the laws
let agentsContent = fs.readFileSync(agentsFile, 'utf16le');
if (!agentsContent.includes('REGRA ABSOLUTA')) {
    agentsContent = fs.readFileSync(agentsFile, 'utf8');
}

// Replace the canonical reference in AGENTS.md
if (agentsContent.includes('docs/APEX_PLATFORM_CURRENT_STATE.md')) {
    agentsContent = agentsContent.replace(/docs\/APEX_PLATFORM_CURRENT_STATE\.md/g, newCanonical);
    // Write it back with utf8 since utf16le is weird sometimes
    fs.writeFileSync(agentsFile, agentsContent, 'utf8');
    console.log('Updated AGENTS.md canonical references.');
}

// 2. Extract laws from AGENTS.md
const lawsMatch = agentsContent.match(/## 🚨 REGRA ABSOLUTA 1[\s\S]*/);
let lawsContent = lawsMatch ? lawsMatch[0] : '';
// Remove the weird UTF-16 spacing on Rule 10 if it exists
lawsContent = lawsContent.replace(/\0/g, ''); 

// 3. Append laws to the new canonical file
if (fs.existsSync(newCanonicalPath) && lawsContent) {
    let canonicalContent = fs.readFileSync(newCanonicalPath, 'utf8');
    
    // Only append if not already there
    if (!canonicalContent.includes('REGRA ABSOLUTA 1')) {
        canonicalContent += '\n\n' + lawsContent;
        fs.writeFileSync(newCanonicalPath, canonicalContent, 'utf8');
        console.log('Appended Laws to new canonical doc.');
    } else {
        console.log('Laws already exist in new canonical doc.');
    }
}

// 4. Update Modelfile.apex
if (fs.existsSync(modelfile)) {
    let modelfileContent = fs.readFileSync(modelfile, 'utf8');
    if (modelfileContent.includes(oldCanonical)) {
        modelfileContent = modelfileContent.replace(new RegExp(oldCanonical.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), newCanonical);
        fs.writeFileSync(modelfile, modelfileContent, 'utf8');
        console.log('Updated Modelfile.apex.');
    }
}

// 5. Update CHECKPOINT_TRACKER.md
if (fs.existsSync(checkpointTracker)) {
    let checkpointContent = fs.readFileSync(checkpointTracker, 'utf8');
    if (checkpointContent.includes(oldCanonical)) {
        checkpointContent = checkpointContent.replace(new RegExp(oldCanonical.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), newCanonical);
        fs.writeFileSync(checkpointTracker, checkpointContent, 'utf8');
        console.log('Updated CHECKPOINT_TRACKER.md.');
    }
} else {
    // Check root CHECKPOINT_TRACKER.md
    const rootTracker = path.resolve('CHECKPOINT_TRACKER.md');
    if (fs.existsSync(rootTracker)) {
        let checkpointContent = fs.readFileSync(rootTracker, 'utf8');
        if (checkpointContent.includes(oldCanonical)) {
            checkpointContent = checkpointContent.replace(new RegExp(oldCanonical.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), newCanonical);
            fs.writeFileSync(rootTracker, checkpointContent, 'utf8');
            console.log('Updated root CHECKPOINT_TRACKER.md.');
        }
    }
}

console.log('Done.');
