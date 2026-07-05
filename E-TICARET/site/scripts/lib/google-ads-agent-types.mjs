/** @typedef {'critical'|'high'|'medium'|'low'|'info'} AdsIssueSeverity */

/**
 * @typedef {object} GoogleAdsIssue
 * @property {string} id
 * @property {string} area
 * @property {AdsIssueSeverity} severity
 * @property {string} type
 * @property {string} message
 * @property {string} [file]
 * @property {string} [fix]
 * @property {Record<string, unknown>} [meta]
 */

/**
 * @typedef {object} GoogleAdsCampaignConfig
 * @property {string} businessCategory
 * @property {string} businessType
 * @property {string} primaryConversion
 * @property {string} secondaryConversion
 * @property {object[]} suggestedCampaigns
 * @property {object} merchantCenter
 * @property {object} tracking
 * @property {object|null} feedStats
 * @property {object[]} landings
 */

/**
 * @typedef {object} GoogleAdsAgentReport
 * @property {string} generatedAt
 * @property {number} durationMs
 * @property {'ok'|'info'|'warn'|'error'} status
 * @property {object} summary
 * @property {Record<string, object>} checks
 * @property {GoogleAdsCampaignConfig} campaignConfig
 * @property {GoogleAdsIssue[]} issues
 * @property {number} issueCount
 * @property {string|null} aiSummary
 */

export {};
