import { describe, expect, it } from 'vitest'
import { EXECUTION_CLASSES, getExecutionCapabilityMatrix, getToolRegistry } from '../../server/agent/toolRegistry.mjs'

describe('tool registry capability matrix', () => {
  it('includes an h6_write capability for unclassified dangerous actions', () => {
    const registry = getToolRegistry()
    const unclassified = registry.find(tool => tool.id === 'dangerous.unclassified')

    expect(unclassified).toBeTruthy()
    expect(unclassified?.executionClass).toBe(EXECUTION_CLASSES.H6_WRITE)
    expect(unclassified?.mutates).toBe(true)

    const matrixItem = getExecutionCapabilityMatrix().find(item => item.toolId === 'dangerous.unclassified')
    expect(matrixItem).toBeTruthy()
    expect(matrixItem?.executionClass).toBe(EXECUTION_CLASSES.H6_WRITE)
    expect(matrixItem?.status).toBe('available')
  })
})
