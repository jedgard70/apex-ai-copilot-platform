export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS')
  if(req.method==='OPTIONS')return res.status(200).end()
  try{
    const path=req.url?.split('?')[0]||''
    if(path==='/api/enterprise/integrations'&&req.method==='GET'){
      const integrations=[
        {nome:'Revit',tipo:'BIM',status:'conectado',descricao:'Conexão via APS e IFC',doc:'api/aps/'},
        {nome:'Navisworks',tipo:'BIM',status:'disponivel',descricao:'Importar clashes via NWC',doc:'server/service/bimClash.mjs'},
        {nome:'Tekla',tipo:'BIM',status:'disponivel',descricao:'Via IFC/Tekla API',doc:'server/service/bimClash.mjs'},
        {nome:'ArchiCAD',tipo:'BIM',status:'disponivel',descricao:'Via IFC/BIMx',doc:'-'},
        {nome:'Solibri',tipo:'BIM',status:'disponivel',descricao:'Via IFC',doc:'-'},
        {nome:'ACC (Autodesk)',tipo:'BIM',status:'conectado',descricao:'API APS',doc:'api/aps/'},
        {nome:'SAP',tipo:'ERP',status:'planejado',descricao:'Integração futura com SAP Business One',doc:'-'},
        {nome:'Oracle',tipo:'ERP',status:'planejado',descricao:'Integração futura Oracle NetSuite',doc:'-'},
        {nome:'HubSpot',tipo:'CRM',status:'planejado',descricao:'Integração futura CRM vendas',doc:'-'},
        {nome:'n8n',tipo:'Automação',status:'planejado',descricao:'Workflows low-code',doc:'-'},
        {nome:'Make (Integromat)',tipo:'Automação',status:'planejado',descricao:'Workflows low-code',doc:'-'},
        {nome:'Zapier',tipo:'Automação',status:'planejado',descricao:'Automação sem código',doc:'-'},
        {nome:'LangGraph',tipo:'Multi-Agent',status:'planejado',descricao:'Orquestração agentes LangChain',doc:'server/service/cognitiveAgents.mjs'},
        {nome:'CrewAI',tipo:'Multi-Agent',status:'planejado',descricao:'Framework multi-agente',doc:'server/service/cognitiveAgents.mjs'},
        {nome:'AutoGen',tipo:'Multi-Agent',status:'planejado',descricao:'Framework Microsoft multi-agente',doc:'-'},
      ]
      return res.status(200).json({providerStatus:'connected',integrations})
    }
    return res.status(404).json({error:'Not found'})
  }catch(err){console.error('[enterprise] Error:',err.message);return res.status(500).json({error:err.message})}
}
