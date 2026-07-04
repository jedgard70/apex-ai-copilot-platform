import fs from 'fs';
let c = fs.readFileSync('src/main.tsx', 'utf8');

c = c.replace(/<GlobalPermitsPanel \/>/g, 
  "<GlobalPermitsPanel initialRegion={typeof permitsOutput === 'object' ? permitsOutput.region : undefined} initialType={typeof permitsOutput === 'object' ? permitsOutput.type : undefined} />");

c = c.replace(/else if \(activeView === 'permits'\) \{ closeOtherPanels\('permits'\); setPermitsOutput\(true\); \}/,
`else if (activeView === 'permits') { closeOtherPanels('permits'); setPermitsOutput({ open: true }); }
    else if (activeView === 'legal_us') { closeOtherPanels('permits'); setPermitsOutput({ open: true, region: 'US' }); }
    else if (activeView === 'legal_br') { closeOtherPanels('permits'); setPermitsOutput({ open: true, region: 'BR' }); }
    else if (activeView === 'legal_eu') { closeOtherPanels('permits'); setPermitsOutput({ open: true, region: 'EU' }); }
    else if (activeView === 'contracts_gen') { closeOtherPanels('permits'); setPermitsOutput({ open: true, type: 'contract' }); }`);

fs.writeFileSync('src/main.tsx', c);
