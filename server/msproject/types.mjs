// MS Project Integration - Type Definitions
export const TaskType = Object.freeze({
  FIXED_UNITS: 'fixedUnits',
  FIXED_DURATION: 'fixedDuration',
  FIXED_WORK: 'fixedWork'
});

export const ConstraintType = Object.freeze({
  ASAP: 'asSoonAsPossible',
  ALAP: 'asLateAsPossible',
  MSO: 'mustStartOn',
  MFO: 'mustFinishOn',
  SNLT: 'startNoLaterThan',
  FNLT: 'finishNoLaterThan',
  SNET: 'startNoEarlierThan',
  FNET: 'finishNoEarlierThan'
});

export const Priority = Object.freeze({
  LOWEST: 100,
  VERY_LOW: 200,
  LOW: 300,
  MEDIUM: 400,
  HIGH: 500,
  VERY_HIGH: 600,
  HIGHEST: 700
});

/**
 * @typedef {Object} MSPTask
 * @property {string} id - Unique identifier
 * @property {string} name - Task name
 * @property {number} [duration] - Duration in days
 * @property {string} [start] - Start date ISO string
 * @property {string} [finish] - Finish date ISO string
 * @property {'fixedUnits'|'fixedDuration'|'fixedWork'} [type]
 * @property {number} [percentComplete]
 * @property {number} [actualDuration]
 * @property {number} [remainingDuration]
 * @property {number} [actualCost]
 * @property {number} [actualWork]
 * @property {number} [baselineCost]
 * @property {number} [baselineWork]
 * @property {string[]} [predecessors]
 * @property {string[]} [successors]
 * @property {number} [priority]
 * @property {string} [constraintType]
 * @property {string} [constraintDate]
 * @property {string} [status]
 * @property {string} [notes]
 * @property {Object[]} [assignments]
 */

/**
 * @typedef {Object} MSPResource
 * @property {string} id
 * @property {string} name
 * @property {string} [type] - 'work' | 'material' | 'cost'
 * @property {number} [maxUnits]
 * @property {number} [standardRate]
 * @property {number} [overtimeRate]
 * @property {number} [costPerUse]
 * @property {string} [email]
 * @property {string} [group]
 */

/**
 * @typedef {Object} MSPAssignment
 * @property {string} taskId
 * @property {string} resourceId
 * @property {number} [units]
 * @property {number} [work]
 * @property {number} [cost]
 * @property {number} [actualWork]
 * @property {number} [actualCost]
 */

/**
 * @typedef {Object} MSPBaseline
 * @property {string} id
 * @property {string} name
 * @property {date} [date]
 * @property {Object[]} taskBaselines
 */

/**
 * @typedef {Object} MSPProject
 * @property {string} name
 * @property {string} [startDate]
 * @property {string} [finishDate]
 * @property {string} [statusDate]
 * @property {string} [calendar]
 * @property {string} [currency]
 * @property {string} [company]
 * @property {string} [manager]
 * @property {MSPTask[]} tasks
 * @property {MSPResource[]} resources
 * @property {MSPAssignment[]} assignments
 * @property {MSPBaseline[]} baselines
 * @property {Object} [metadata]
 */
