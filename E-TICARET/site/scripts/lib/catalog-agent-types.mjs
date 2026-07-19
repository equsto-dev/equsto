/** @typedef {'critical'|'high'|'medium'|'low'} CatalogIssueSeverity */
/** @typedef {'price_mismatch'|'price_update'|'missing_source'|'data_quality'|'competitor_gap'|'competitor_advantage'} CatalogIssueType */

/**
 * @typedef {object} CatalogIssue
 * @property {string} id
 * @property {string} brand
 * @property {CatalogIssueSeverity} severity
 * @property {CatalogIssueType} type
 * @property {string} sku
 * @property {string} model
 * @property {string} [name]
 * @property {string} message
 * @property {number|null} [site_tl]
 * @property {number|null} [expected_tl]
 * @property {number|null} [diff_tl]
 * @property {number|null} [liste_eur]
 * @property {string} [source]
 * @property {string|null} [competitor]
 * @property {number|null} [competitor_tl]
 * @property {Record<string, unknown>} [meta]
 */

/**
 * @typedef {object} CatalogAgentReport
 * @property {string} generatedAt
 * @property {number} kur
 * @property {boolean} kurFallback
 * @property {number} durationMs
 * @property {'ok'|'info'|'warn'|'error'} status
 * @property {object} summary
 * @property {Record<string, object>} checks
 * @property {CatalogIssue[]} issues
 * @property {CatalogIssue[]} [allIssues]
 * @property {number} issueCount
 * @property {string|null} aiSummary
 * @property {number} [usdTry]
 */

export {};
