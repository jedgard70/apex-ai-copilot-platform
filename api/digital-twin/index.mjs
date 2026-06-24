export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS')
  if(req.method==='OPTIONS')return res.status(200).end()
  try{
    const path=req.url?.split('?')[0]||''
    const mod=await import('../../server/service/digitalTwinIoT.mjs')
    if(path==='/api/digital-twin/sensors'&&req.method==='GET')return res.status(200).json({providerStatus:'connected',sensors:mod.listSensors()})
    if(path==='/api/digital-twin/alerts'&&req.method==='GET')return res.status(200).json({providerStatus:'connected',alerts:mod.getAlerts()})
    if(path==='/api/digital-twin/kpis'&&req.method==='GET')return res.status(200).json({providerStatus:'connected',kpis:mod.getKPIs()})
    return res.status(404).json({error:'Not found'})
  }catch(err){console.error('[digital-twin-iot] Error:',err.message);return res.status(500).json({error:err.message})}
}
