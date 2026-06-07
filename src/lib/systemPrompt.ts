import runtimeKnowledge from './runtimeKnowledge.json'

export const apexSystemPrompt = runtimeKnowledge.systemPrompt.join('\n')

export const memorySummary = runtimeKnowledge.memorySummary.join('\n')
