/**
 * server/agent/msprojectConnector.mjs
 *
 * MS Project connector for the Apex live agent.
 * Allows the AI to parse, analyze, and report on MS Project files
 * conversationally via tool calling.
 */

import { parseMsProjectXml, analyzeProject, generateSchedulingReport, projectToSimplifiedJson } from '../service/msproject.mjs'

/**
 * Tool definition for the live agent tool registry.
 */
export function buildMsProjectToolDefinitions() {
  return [
    {
      type: 'function',
      function: {
        name: 'parse_msproject_xml',
        description: 'Parse MS Project XML (MSPDI format) and return structured task/resource data with scheduling analysis.',
        parameters: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'The full MSPDI XML content to parse.',
            },
            includeResources: {
              type: 'boolean',
              description: 'Whether to include resource data. Default: true.',
            },
          },
          required: ['content'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'analyze_msproject_schedule',
        description: 'Analyze a previously parsed MS Project schedule for delays, critical path, baseline variance and milestones.',
        parameters: {
          type: 'object',
          properties: {
            projectXml: {
              type: 'string',
              description: 'The MSPDI XML to analyze.',
            },
          },
          required: ['projectXml'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'generate_msproject_report',
        description: 'Generate a complete Markdown scheduling report from MS Project XML.',
        parameters: {
          type: 'object',
          properties: {
            projectXml: {
              type: 'string',
              description: 'The MSPDI XML to generate a report from.',
            },
          },
          required: ['projectXml'],
        },
      },
    },
  ]
}

/**
 * Execute an MS Project connector tool call.
 * @param {Object} toolCall - The tool call from the AI
 * @returns {Promise<Object>} Result object
 */
export async function executeMsProjectToolCall(toolCall) {
  const name = toolCall?.function?.name || ''
  let args = {}
  try {
    args = JSON.parse(toolCall.function.arguments || '{}')
  } catch {
    return { providerStatus: 'error', error: 'Invalid arguments for MS Project tool.' }
  }

  switch (name) {
    case 'parse_msproject_xml': {
      const xml = args.content || args.xml
      if (!xml) return { providerStatus: 'error', error: 'No MS Project XML content provided.' }
      try {
        const project = parseMsProjectXml(xml, {
          includeResources: args.includeResources !== false,
          includeCalendars: false,
        })
        const analysis = analyzeProject(project)
        const simplified = projectToSimplifiedJson(project)
        return {
          providerStatus: 'connected',
          project: simplified,
          analysis,
          summary: `${project.tasks.length} tasks, ${project.resources.length} resources, ${analysis.summary.percentComplete}% complete`,
        }
      } catch (err) {
        return { providerStatus: 'error', message: 'Failed to parse MS Project XML', detail: err.message }
      }
    }

    case 'analyze_msproject_schedule': {
      const xml = args.projectXml || args.content
      if (!xml) return { providerStatus: 'error', error: 'No MS Project XML provided.' }
      try {
        const project = parseMsProjectXml(xml)
        const analysis = analyzeProject(project)
        return { providerStatus: 'connected', analysis }
      } catch (err) {
        return { providerStatus: 'error', message: 'Failed to analyze schedule', detail: err.message }
      }
    }

    case 'generate_msproject_report': {
      const xml = args.projectXml || args.content
      if (!xml) return { providerStatus: 'error', error: 'No MS Project XML provided.' }
      try {
        const project = parseMsProjectXml(xml)
        const report = generateSchedulingReport(project)
        return { providerStatus: 'connected', report, format: 'markdown' }
      } catch (err) {
        return { providerStatus: 'error', message: 'Failed to generate report', detail: err.message }
      }
    }

    default:
      return { providerStatus: 'error', error: `Unknown MS Project tool: ${name}` }
  }
}
