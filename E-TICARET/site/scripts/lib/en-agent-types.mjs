/** @typedef {'critical'|'high'|'medium'|'low'|'info'} EnIssueSeverity */

/**
 * @typedef {object} EnIssue
 * @property {string} id
 * @property {string} area
 * @property {EnIssueSeverity} severity
 * @property {string} type
 * @property {string} message
 * @property {string} [file]
 * @property {string} [fix]
 * @property {Record<string, unknown>} [meta]
 */

/**
 * @typedef {object} EnImprovementPlan
 * @property {string} locale
 * @property {string} urlPrefix
 * @property {object} productCoverage
 * @property {object} uiParity
 * @property {string[]} recommendedCommands
 * @property {object[]} actions
 * @property {object[]} priorityPages
 */

/**
 * @typedef {object} EnAgentReport
 * @property {string} generatedAt
 * @property {number} durationMs
 * @property {'ok'|'info'|'warn'|'error'} status
 * @property {object} summary
 * @property {Record<string, object>} checks
 * @property {EnImprovementPlan} improvementPlan
 * @property {EnIssue[]} issues
 * @property {number} issueCount
 * @property {string|null} aiSummary
 */

export {};
