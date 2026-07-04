import fs from 'fs';
let c = fs.readFileSync('src/components/GlobalPermitsPanel.tsx', 'utf8');

c = c.replace(/import \{ GlobalImmigrationData, CountryPermits, VisaType \} from '\.\.\/lib\/legalCorporateModel';/g, 
"import { GlobalLegalData, LegalJurisdiction, LegalProcess } from '../lib/legalCorporateModel';");

c = c.replace(/CountryPermits/g, 'LegalJurisdiction');
c = c.replace(/VisaType/g, 'LegalProcess');
c = c.replace(/GlobalImmigrationData/g, 'GlobalLegalData');
c = c.replace(/selectedVisa\?/g, 'selectedProcess?');
c = c.replace(/selectedVisaId/g, 'selectedProcessId');
c = c.replace(/setSelectedVisaId/g, 'setSelectedProcessId');
c = c.replace(/visaId:/g, 'processId:');
c = c.replace(/\.visas/g, '.processes');

fs.writeFileSync('src/components/GlobalPermitsPanel.tsx', c);
