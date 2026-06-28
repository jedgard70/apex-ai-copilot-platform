/**
 * server/service/autoTrader.mjs
 * 
 * Apex AI Auto-Trading Engine
 * - Executa negociações autônomas baseadas em algoritmos de inteligência.
 * - Simula ou gerencia um portfólio real (JSON persistido).
 * - Monitora o Equity Guard (Cut Loss) contra as cotações em tempo real do Yahoo Finance.
 */

import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { fetchQuotes } from './stockMarket.mjs'

const DB_DIR = path.join(process.cwd(), '.system_generated')
const PORTFOLIO_FILE = path.join(DB_DIR, 'investment_portfolio.json')

let PORTFOLIO = {
  status: 'IDLE', // IDLE, RUNNING, STOPPED_BY_EQUITY_GUARD
  startingCapital: 10000,
  balance: 10000,
  equityGuardPercent: 30,
  positions: [] // { id, symbol, entryPrice, quantity, side: 'LONG'|'SHORT', date }
}

function loadDB() {
  try {
    if (fs.existsSync(PORTFOLIO_FILE)) {
      const data = JSON.parse(fs.readFileSync(PORTFOLIO_FILE, 'utf-8'))
      PORTFOLIO = { ...PORTFOLIO, ...data }
    }
  } catch (err) {
    console.error('[autoTrader] Error loading DB:', err)
  }
}

function saveDB() {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true })
    fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(PORTFOLIO, null, 2))
  } catch (err) {
    console.error('[autoTrader] Error saving DB:', err)
  }
}

loadDB()

export function getPortfolioStatus() {
  return PORTFOLIO;
}

export function setupPortfolio(config) {
  if (config.startingCapital) PORTFOLIO.startingCapital = config.startingCapital;
  if (config.balance) PORTFOLIO.balance = config.balance;
  if (config.equityGuardPercent) PORTFOLIO.equityGuardPercent = config.equityGuardPercent;
  PORTFOLIO.status = 'READY';
  PORTFOLIO.positions = []; // Reseta posições ao refazer setup
  saveDB();
  return PORTFOLIO;
}

export async function startBot() {
  if (PORTFOLIO.status === 'RUNNING') throw new Error("O bot já está rodando.");
  if (PORTFOLIO.balance <= 0) throw new Error("Saldo insuficiente para iniciar o bot.");

  PORTFOLIO.status = 'RUNNING';
  
  // Seleção AI de Criptos (Simulado Top 3 para POC)
  const coinsToAnalyze = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD'];
  const quotes = await fetchQuotes(coinsToAnalyze);
  
  const capitalPerCoin = PORTFOLIO.balance / 3;
  const validQuotes = quotes.filter(q => q.price !== null).slice(0, 3);
  
  for (const quote of validQuotes) {
    const qty = capitalPerCoin / quote.price;
    PORTFOLIO.positions.push({
      id: randomUUID(),
      symbol: quote.symbol,
      entryPrice: quote.price,
      quantity: qty,
      side: 'LONG',
      date: new Date().toISOString()
    });
    PORTFOLIO.balance -= capitalPerCoin;
  }
  
  saveDB();
  return PORTFOLIO;
}

export function stopBot() {
  PORTFOLIO.status = 'IDLE';
  saveDB();
  return PORTFOLIO;
}

export async function calculateLiveEquity() {
  if (PORTFOLIO.positions.length === 0) {
    return { equity: PORTFOLIO.balance, pnl: 0, pnlPercent: 0, livePositions: [], ...PORTFOLIO };
  }

  const symbols = [...new Set(PORTFOLIO.positions.map(p => p.symbol))];
  const quotes = await fetchQuotes(symbols);
  const quoteMap = {};
  quotes.forEach(q => { if(q.price) quoteMap[q.symbol] = q.price });

  let totalEquity = PORTFOLIO.balance;
  let totalPNL = 0;
  const livePositions = [];

  for (const p of PORTFOLIO.positions) {
    const currentPrice = quoteMap[p.symbol] || p.entryPrice;
    const positionValue = p.quantity * currentPrice;
    const cost = p.quantity * p.entryPrice;
    let pnl = positionValue - cost;
    if (p.side === 'SHORT') pnl = -pnl; 

    totalPNL += pnl;
    totalEquity += cost + pnl;

    livePositions.push({
      ...p,
      currentPrice,
      pnl,
      pnlPercent: (pnl / cost) * 100
    });
  }

  // Verificar Equity Guard
  const maxDrawdownAmount = PORTFOLIO.startingCapital * (PORTFOLIO.equityGuardPercent / 100);
  const cutLossThreshold = PORTFOLIO.startingCapital - maxDrawdownAmount;

  if (PORTFOLIO.status === 'RUNNING' && totalEquity <= cutLossThreshold) {
    console.warn(`[EQUITY GUARD] Equity (${totalEquity}) atingiu cut-loss (${cutLossThreshold}). Liquidando...`);
    PORTFOLIO.status = 'STOPPED_BY_EQUITY_GUARD';
    PORTFOLIO.balance = totalEquity;
    PORTFOLIO.positions = [];
    saveDB();
  }

  return {
    ...PORTFOLIO,
    equity: totalEquity,
    pnl: totalPNL,
    pnlPercent: (totalPNL / PORTFOLIO.startingCapital) * 100,
    livePositions,
    cutLossLevel: cutLossThreshold
  };
}
