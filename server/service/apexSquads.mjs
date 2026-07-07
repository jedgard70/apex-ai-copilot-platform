import fs from 'fs';
import path from 'path';

// Engine de Orquestração Multi-Agente (Apex Squads)
// Inspirado na lógica do OpenSquad, mas white-label e integrado ao ecosistema Apex AI.

const SQUADS_DB_PATH = path.join(process.cwd(), '.data', 'squads.json');

// Garante que o banco local existe
if (!fs.existsSync(path.dirname(SQUADS_DB_PATH))) {
  fs.mkdirSync(path.dirname(SQUADS_DB_PATH), { recursive: true });
}
if (!fs.existsSync(SQUADS_DB_PATH)) {
  fs.writeFileSync(SQUADS_DB_PATH, JSON.stringify({ squads: [] }, null, 2));
}

function readDb() {
  return JSON.parse(fs.readFileSync(SQUADS_DB_PATH, 'utf-8'));
}

function writeDb(data) {
  fs.writeFileSync(SQUADS_DB_PATH, JSON.stringify(data, null, 2));
}

export function createSquad({ name, goal, skill }) {
  const db = readDb();
  const newSquad = {
    id: `sqd_${Date.now()}`,
    name,
    goal,
    skill, // ex: 'marketing-automation'
    status: 'idle',
    createdAt: new Date().toISOString(),
    agents: [
      { id: 'agt_investigador', role: 'Investigador de Tendências', status: 'pending', output: null },
      { id: 'agt_estrategista', role: 'Estrategista de Campanhas', status: 'pending', output: null },
      { id: 'agt_copywriter', role: 'Copywriter & Roteirista', status: 'pending', output: null },
      { id: 'agt_revisor', role: 'Revisor de Qualidade', status: 'pending', output: null }
    ],
    currentStep: 0,
    checkpoints: []
  };
  
  db.squads.push(newSquad);
  writeDb(db);
  return newSquad;
}

export function getSquads() {
  return readDb().squads;
}

export function getSquadById(id) {
  return readDb().squads.find(s => s.id === id);
}

export function runSquadStep(squadId) {
  const db = readDb();
  const squadIndex = db.squads.findIndex(s => s.id === squadId);
  if (squadIndex === -1) throw new Error('Squad não encontrado');
  
  const squad = db.squads[squadIndex];
  
  if (squad.currentStep >= squad.agents.length) {
    squad.status = 'completed';
    writeDb(db);
    return squad;
  }
  
  squad.status = 'running';
  const currentAgent = squad.agents[squad.currentStep];
  currentAgent.status = 'running';
  
  // Mocking the AI agent execution for the API
  // Na vida real, chamaríamos o geminiAgentsConnector.mjs aqui com o prompt da skill.
  setTimeout(() => {
    const updatedDb = readDb();
    const updatedSquad = updatedDb.squads[squadIndex];
    updatedSquad.agents[updatedSquad.currentStep].status = 'completed';
    updatedSquad.agents[updatedSquad.currentStep].output = `[Output do ${currentAgent.role}] Tarefa concluída para o objetivo: ${squad.goal}`;
    
    // Define a checkpoint if it's the strategist or copywriter
    if (currentAgent.id === 'agt_estrategista' || currentAgent.id === 'agt_copywriter') {
      updatedSquad.status = 'checkpoint_waiting';
      updatedSquad.checkpoints.push({
        step: updatedSquad.currentStep,
        message: `O ${currentAgent.role} finalizou sua parte. Deseja aprovar e seguir para o próximo agente?`
      });
    } else {
      updatedSquad.currentStep += 1;
      if (updatedSquad.currentStep >= updatedSquad.agents.length) {
        updatedSquad.status = 'completed';
      }
    }
    
    writeDb(updatedDb);
  }, 2000); // Simulando o tempo de processamento do LLM
  
  writeDb(db);
  return squad;
}

export function approveCheckpoint(squadId) {
  const db = readDb();
  const squadIndex = db.squads.findIndex(s => s.id === squadId);
  if (squadIndex === -1) throw new Error('Squad não encontrado');
  
  const squad = db.squads[squadIndex];
  if (squad.status !== 'checkpoint_waiting') throw new Error('Nenhum checkpoint aguardando aprovação');
  
  squad.status = 'running';
  squad.currentStep += 1;
  writeDb(db);
  
  // Continua a execução automaticamente
  return runSquadStep(squadId);
}
