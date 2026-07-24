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
import { generateText } from 'ai'
import { createGoogleGenAI } from '@ai-sdk/google'

const DB_DIR = path.join(process.cwd(), '.system_generated')
const PORTFOLIO_FILE = path.join(DB_DIR, 'investment_portfolio.json')

let PORTFOLIO = {
  status: 'IDLE', // IDLE, RUNNING, STOPPED_BY_EQUITY_GUARD
  startingCapital: 10000,
  balance: 10000,
  highWaterMark: 10000,
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
  if (config.startingCapital) {
    PORTFOLIO.startingCapital = config.startingCapital;
    PORTFOLIO.highWaterMark = config.startingCapital;
  }
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
  PORTFOLIO.highWaterMark = PORTFOLIO.balance;
  
  // Seleção AI de Criptos + Indicadores
  const coinsToAnalyze = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'AVAX-USD'];
  const quotes = await fetchQuotes(coinsToAnalyze);
  const validQuotes = quotes.filter(q => q.price !== null);
  
  // Calcula indicadores sintéticos baseados no fechamento (simulação para MVP)
  const enrichedQuotes = validQuotes.map(q => {
    // Math random simulation to emulate RSI (30-70) and MACD crossover
    const rsi = Math.floor(Math.random() * (85 - 20 + 1) + 20); 
    const macdSignal = Math.random() > 0.5 ? 'BULLISH' : 'BEARISH';
    return { ...q, rsi, macdSignal };
  });

  const google = createGoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `Você é o Auto-Trader IA Institucional da Apex.
Analise os ativos abaixo com seus preços, RSI e sinal MACD.
Regras:
1. RSI abaixo de 40 indica sobrevendido (bom para comprar).
2. Sinal MACD BULLISH indica tendência de alta.
3. Escolha exatamente as 3 melhores moedas para alocar nosso capital agora.
Responda APENAS com os símbolos (ex: BTC-USD, ETH-USD, SOL-USD), separados por vírgula.
Ativos:
${enrichedQuotes.map(q => `${q.symbol}: Preço $${q.price}, RSI ${q.rsi}, MACD ${q.macdSignal}`).join('\n')}`;

  let chosenSymbols = ['BTC-USD', 'ETH-USD', 'SOL-USD']; // fallback
  try {
    const { text } = await generateText({ model: google('gemini-2.5-flash'), prompt });
    const parsed = text.split(',').map(s => s.trim().toUpperCase());
    if (parsed.length >= 3) chosenSymbols = parsed.slice(0, 3);
  } catch(e) {
    console.error('[AutoTrader] Erro no Gemini AI, usando fallback:', e);
  }

  const selectedQuotes = enrichedQuotes.filter(q => chosenSymbols.includes(q.symbol)).slice(0, 3);
  const capitalPerCoin = PORTFOLIO.balance / selectedQuotes.length;
  
  for (const quote of selectedQuotes) {
    const qty = capitalPerCoin / quote.price;
    PORTFOLIO.positions.push({
      id: randomUUID(),
      symbol: quote.symbol,
      entryPrice: quote.price,
      quantity: qty,
      side: 'LONG',
      rsiAtEntry: quote.rsi,
      macdAtEntry: quote.macdSignal,
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

  // Update Trailing High-Water Mark
  if (PORTFOLIO.status === 'RUNNING' && totalEquity > (PORTFOLIO.highWaterMark || PORTFOLIO.startingCapital)) {
    PORTFOLIO.highWaterMark = totalEquity;
    saveDB();
  }

  // Verificar Trailing Equity Guard
  const referenceCapital = PORTFOLIO.highWaterMark || PORTFOLIO.startingCapital;
  const maxDrawdownAmount = referenceCapital * (PORTFOLIO.equityGuardPercent / 100);
  const cutLossThreshold = referenceCapital - maxDrawdownAmount;

  if (PORTFOLIO.status === 'RUNNING' && totalEquity <= cutLossThreshold) {
    console.warn(`[EQUITY GUARD TRAILING] Equity (${totalEquity}) atingiu cut-loss (${cutLossThreshold}) protegido a partir do HighWaterMark (${referenceCapital}). Liquidando...`);
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
    cutLossLevel: cutLossThreshold,
    highWaterMark: PORTFOLIO.highWaterMark || PORTFOLIO.startingCapital
  };
}
