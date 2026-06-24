/**
 * Tests for MS Project Integration module
 */

import { describe, it, expect } from 'vitest'
import { parseMsProjectXml, analyzeProject, generateSchedulingReport, projectToSimplifiedJson } from './msproject.mjs'

const SAMPLE_XML = `<?xml version="1.0" encoding="utf-8"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>Test Project</Name>
  <StartDate>2026-01-01T08:00:00</StartDate>
  <FinishDate>2026-03-31T17:00:00</FinishDate>
  <Tasks>
    <Task>
      <UID>1</UID>
      <Name>Foundation</Name>
      <Duration>PT160H</Duration>
      <Start>2026-01-01T08:00:00</Start>
      <Finish>2026-01-20T17:00:00</Finish>
      <PercentComplete>100</PercentComplete>
      <WBS>1</WBS>
      <OutlineLevel>1</OutlineLevel>
    </Task>
    <Task>
      <UID>2</UID>
      <Name>Structure</Name>
      <Duration>PT240H</Duration>
      <Start>2026-01-21T08:00:00</Start>
      <Finish>2026-02-20T17:00:00</Finish>
      <PercentComplete>50</PercentComplete>
      <WBS>2</WBS>
      <OutlineLevel>1</OutlineLevel>
      <PredecessorLinks>
        <PredecessorLink><PredecessorUID>1</PredecessorUID></PredecessorLink>
      </PredecessorLinks>
    </Task>
    <Task>
      <UID>3</UID>
      <Name>Finishing</Name>
      <Duration>PT160H</Duration>
      <Start>2026-02-21T08:00:00</Start>
      <Finish>2026-03-15T17:00:00</Finish>
      <PercentComplete>0</PercentComplete>
      <WBS>3</WBS>
      <OutlineLevel>1</OutlineLevel>
      <Milestone>true</Milestone>
      <PredecessorLinks>
        <PredecessorLink><PredecessorUID>2</PredecessorUID></PredecessorLink>
      </PredecessorLinks>
    </Task>
  </Tasks>
  <Resources>
    <Resource>
      <UID>1</UID>
      <Name>Team A</Name>
      <Type>0</Type>
      <MaxUnits>100</MaxUnits>
    </Resource>
    <Resource>
      <UID>2</UID>
      <Name>Team B</Name>
      <Type>1</Type>
      <MaxUnits>50</MaxUnits>
    </Resource>
  </Resources>
</Project>`

describe('MS Project Parser', () => {
  it('should parse basic project metadata', () => {
    const project = parseMsProjectXml(SAMPLE_XML)
    expect(project.name).toBe('Test Project')
    expect(project.startDate).toContain('2026-01-01')
    expect(project.finishDate).toContain('2026-03-31')
  })

  it('should parse all tasks', () => {
    const project = parseMsProjectXml(SAMPLE_XML)
    expect(project.tasks).toHaveLength(3)
    expect(project.tasks[0].name).toBe('Foundation')
    expect(project.tasks[1].name).toBe('Structure')
    expect(project.tasks[2].name).toBe('Finishing')
  })

  it('should parse task details correctly', () => {
    const project = parseMsProjectXml(SAMPLE_XML)
    const foundation = project.tasks[0]
    expect(foundation.uid).toBe('1')
    expect(foundation.duration).toBe(160 * 60) // 160h in minutes
    expect(foundation.percentComplete).toBe(100)
    expect(foundation.status).toBe('complete')
    expect(foundation.wbs).toBe('1')
    expect(foundation.predecessors).toEqual([])
  })

  it('should compute task status from percent complete', () => {
    const project = parseMsProjectXml(SAMPLE_XML)
    expect(project.tasks[0].status).toBe('complete')
    expect(project.tasks[1].status).toBe('in-progress')
    expect(project.tasks[2].status).toBe('not-started')
  })

  it('should identify milestones', () => {
    const project = parseMsProjectXml(SAMPLE_XML)
    expect(project.tasks[0].milestones).toBe(false)
    expect(project.tasks[2].milestones).toBe(true)
  })

  it('should parse predecessor links', () => {
    const project = parseMsProjectXml(SAMPLE_XML)
    expect(project.tasks[1].predecessors).toEqual(['1'])
    expect(project.tasks[2].predecessors).toEqual(['2'])
  })

  it('should parse outline level and WBS', () => {
    const project = parseMsProjectXml(SAMPLE_XML)
    expect(project.tasks[0].outlineLevel).toBe(1)
    expect(project.tasks[0].wbs).toBe('1')
  })
})

describe('MS Project Resources', () => {
  it('should parse all resources', () => {
    const project = parseMsProjectXml(SAMPLE_XML)
    expect(project.resources).toHaveLength(2)
    expect(project.resources[0].name).toBe('Team A')
    expect(project.resources[1].name).toBe('Team B')
  })

  it('should parse resource types', () => {
    const project = parseMsProjectXml(SAMPLE_XML)
    expect(project.resources[0].type).toBe('work')
    expect(project.resources[1].type).toBe('material')
  })

  it('should parse max units', () => {
    const project = parseMsProjectXml(SAMPLE_XML)
    expect(project.resources[0].maxUnits).toBe(100)
    expect(project.resources[1].maxUnits).toBe(50)
  })

  it('should exclude resources when asked', () => {
    const project = parseMsProjectXml(SAMPLE_XML, { includeResources: false })
    expect(project.resources).toHaveLength(0)
  })
})

describe('MS Project Analysis', () => {
  it('should return summary counts', () => {
    const project = parseMsProjectXml(SAMPLE_XML)
    const analysis = analyzeProject(project)
    expect(analysis.summary.totalTasks).toBe(3)
    expect(analysis.summary.completedTasks).toBe(1)
    expect(analysis.summary.inProgressTasks).toBe(1)
    expect(analysis.summary.notStartedTasks).toBe(1)
    expect(analysis.summary.percentComplete).toBe(33)
  })

  it('should detect milestones', () => {
    const project = parseMsProjectXml(SAMPLE_XML)
    const analysis = analyzeProject(project)
    expect(analysis.summary.milestones).toBe(1)
  })
})

describe('MS Project URL', () => {
  it('should detect predecessor links', () => {
    const project = parseMsProjectXml(SAMPLE_XML)
    expect(project.tasks[2].predecessors).toEqual(['2'])
  })
})

describe('Simplified JSON', () => {
  it('should produce simplified output', () => {
    const project = parseMsProjectXml(SAMPLE_XML)
    const simplified = projectToSimplifiedJson(project)
    expect(simplified.name).toBe('Test Project')
    expect(simplified.tasks).toHaveLength(3)
    expect(simplified.resources).toHaveLength(2)
    expect(simplified.tasks[0]).not.toHaveProperty('notes')
  })
})
