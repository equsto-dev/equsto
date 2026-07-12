/**
 * @typedef {'critical'|'high'|'medium'|'low'|'info'} BlogTopicPriority
 */

/**
 * @typedef {object} CompetitorBlogTopic
 * @property {string} id
 * @property {string} site
 * @property {string} title
 * @property {string[]} keywords
 * @property {string} category
 * @property {BlogTopicPriority} priority
 */

/**
 * @typedef {object} TopicGap
 * @property {string} id
 * @property {string} title
 * @property {string} category
 * @property {BlogTopicPriority} priority
 * @property {string[]} keywords
 * @property {string[]} competitorSites
 * @property {string} rationale
 * @property {number} competitorCount
 */

/**
 * @typedef {object} BlogDraft
 * @property {string} id
 * @property {string} slug
 * @property {string} geoKey
 * @property {string} title
 * @property {string} description
 * @property {string} h1
 * @property {string} [lead]
 * @property {string} body
 * @property {string} profile
 * @property {string} topicId
 * @property {string} status
 * @property {string} createdAt
 * @property {string} [publishedAt]
 * @property {string} [source]
 */

/**
 * @typedef {object} BlogAgentReport
 * @property {string} generatedAt
 * @property {number} durationMs
 * @property {'ok'|'info'|'warn'|'error'} status
 * @property {object} summary
 * @property {number} summary.competitorTopics
 * @property {number} summary.equstoArticles
 * @property {number} summary.gapTopics
 * @property {number} summary.draftsTotal
 * @property {number} summary.draftsPending
 * @property {string} summary.currentWeek
 * @property {boolean} summary.weeklyDraftCreated
 * @property {object} checks
 * @property {TopicGap[]} gapTopics
 * @property {BlogDraft|null} latestDraft
 * @property {BlogDraft[]} drafts
 * @property {string|null} aiSummary
 * @property {string} [message]
 */

export {};
