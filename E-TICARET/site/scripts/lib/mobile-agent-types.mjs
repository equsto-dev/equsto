/** @typedef {'critical'|'high'|'medium'|'low'|'info'} MobileIssueSeverity */

/**
 * @typedef {object} MobileIssue
 * @property {string} id
 * @property {string} platform
 * @property {MobileIssueSeverity} severity
 * @property {string} type
 * @property {string} area
 * @property {string} message
 * @property {string} [file]
 * @property {string} [fix]
 * @property {Record<string, unknown>} [meta]
 */

/**
 * @typedef {object} MobileAgentReport
 * @property {string} generatedAt
 * @property {number} durationMs
 * @property {'ok'|'info'|'warn'|'error'} status
 * @property {object} summary
 * @property {Record<string, object>} checks
 * @property {MobileIssue[]} issues
 * @property {number} issueCount
 * @property {string|null} aiSummary
 */

export {};
