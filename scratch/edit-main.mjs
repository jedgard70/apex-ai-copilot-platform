import { readFileSync, writeFileSync } from 'fs'

let c = readFileSync('src/main.tsx', 'utf8')

// Panel rendering after Trip
const old1 = `            <TripPlannerPanel
              onClear={() => setTripOutput(false)}
            />
          )}

          {campaignAutomationOutput && (`
const new1 = `            <TripPlannerPanel
              onClear={() => setTripOutput(false)}
            />
          )}

          {nrOutput && (
            <NRCompliancePanel
              onClear={() => setNrOutput(false)}
            />
          )}

          {accountingOutput && (
            <AccountingPanel
              onClear={() => setAccountingOutput(false)}
            />
          )}

          {permitsOutput && (
            <AmericanPermitsPanel
              onClear={() => setPermitsOutput(false)}
            />
          )}

          {campaignAutomationOutput && (`
c = c.replace(old1, new1)

// Owner Console buttons
const old2 = `onClick={() => { setTripOutput(true); setOwnerConsoleOpen(false) }}>Trip Planner</button>`
const new2 = `onClick={() => { setTripOutput(true); setOwnerConsoleOpen(false) }}>Trip Planner</button>
              <button type="button" onClick={() => { setNrOutput(true); setOwnerConsoleOpen(false) }}>NR CREA/OE</button>
              <button type="button" onClick={() => { setAccountingOutput(true); setOwnerConsoleOpen(false) }}>Contabilidade CRC</button>
              <button type="button" onClick={() => { setPermitsOutput(true); setOwnerConsoleOpen(false) }}>American Permits</button>`
c = c.replace(old2, new2)

writeFileSync('src/main.tsx', c)
console.log('OK')
