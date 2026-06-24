/**
 * server/service/digitalTwinIoT.mjs — ACIP
 * Digital Twin com sensores IoT, alertas em tempo real e visualização 3D
 */
const SENSORS = [
  { id:'sensor-001', nome:'Sensor de Temperatura - Concretagem P10', tipo:'temperatura', valor:28.5, unidade:'°C', alerta:false, localizacao:'Pavimento 10 - Viga V12', projeto:'Residencial Park Avenue', status:'online', ultimaLeitura:new Date().toISOString(), bateria:85 },
  { id:'sensor-002', nome:'Sensor de Umidade - Cura', tipo:'umidade', valor:72, unidade:'%', alerta:false, localizacao:'Pavimento 8 - Laje L22', projeto:'Residencial Park Avenue', status:'online', ultimaLeitura:new Date().toISOString(), bateria:72 },
  { id:'sensor-003', nome:'Inclinômetro - Escavação', tipo:'inclinacao', valor:2.3, unidade:'graus', alerta:true, localizacao:'Corte A - Fundações', projeto:'Condomínio Jardins do Vale', status:'online', ultimaLeitura:new Date().toISOString(), bateria:45 },
  { id:'sensor-004', nome:'Vibração - Demolição', tipo:'vibracao', valor:12.8, unidade:'mm/s', alerta:false, localizacao:'Bloco B', projeto:'Edifício Corporativo Horizonte', status:'online', ultimaLeitura:new Date().toISOString(), bateria:90 },
  { id:'sensor-005', nome:'Consumo de Energia - Guindaste', tipo:'energia', valor:145, unidade:'kWh', alerta:false, localizacao:'Guindaste Principal', projeto:'Residencial Park Avenue', status:'offline', ultimaLeitura:new Date(Date.now()-7200000).toISOString(), bateria:12 },
  { id:'sensor-006', nome:'Pressão - Bomba d\'água', tipo:'pressao', valor:4.2, unidade:'bar', alerta:true, localizacao:'Casa de Bombas', projeto:'Condomínio Jardins do Vale', status:'online', ultimaLeitura:new Date().toISOString(), bateria:60 },
]

const TIPOS_SENSOR = ['temperatura','umidade','inclinacao','vibracao','energia','pressao','nivel','fluxo']

export function listSensors() { return SENSORS }
export function getAlerts() { return SENSORS.filter(s=>s.alerta) }
export function getKPIs() {
  return {
    total: SENSORS.length, online: SENSORS.filter(s=>s.status==='online').length, offline: SENSORS.filter(s=>s.status==='offline').length,
    alertas: SENSORS.filter(s=>s.alerta).length, bateriaMedia: Math.round(SENSORS.reduce((s,i)=>s+i.bateria,0)/SENSORS.length),
    bateriaCritica: SENSORS.filter(s=>s.bateria<20).length,
  }
}
