import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
export default defineSchema({
  ...authTables,
  userSettings: defineTable({
    userId: v.id("users"),
    isOnboardingDone: v.boolean(),
    lastUpdated: v.number(),
  }).index("by_user", ["userId"]),
  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_creation", ["createdAt"]),
  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    joinedAt: v.number(),
    role: v.union(v.literal("admin"), v.literal("member")),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_and_user", ["groupId", "userId"]),
  messages: defineTable({
    userId: v.id("users"),
    body: v.string(),
    groupId: v.id("groups"),
    createdAt: v.number(),
  })
    .index("by_group", ["groupId", "createdAt"])
    .index("by_user", ["userId", "createdAt"]),
  studySessions: defineTable({
    userId: v.id("users"),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    duration: v.number(),
    type: v.string(),
    completed: v.boolean(),
    googleCalendarEventId: v.optional(v.string()), // Google Calendar event ID if synced
    syncedToCalendar: v.optional(v.boolean()), // Whether this session was synced
    // Performance metrics for adaptive scheduling
    productivityScore: v.optional(v.number()), // 0-100 score based on completion and duration
    focusQuality: v.optional(v.number()), // 0-100 based on interruptions and consistency
    energyLevel: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    // Contextual data for correlation analysis
    hourOfDay: v.optional(v.number()), // 0-23
    dayOfWeek: v.optional(v.number()), // 0-6 (Sunday-Saturday)
    precedingEventType: v.optional(v.string()), // Type of calendar event before this session
    followingEventType: v.optional(v.string()), // Type of calendar event after this session
    breaksTaken: v.optional(v.number()), // Number of breaks during session
    breakDuration: v.optional(v.number()), // Total break time in seconds
  })
    .index("by_user", ["userId"])
    .index("by_user_and_time", ["userId", "startTime"])
    .index("by_user_and_sync", ["userId", "syncedToCalendar"])
    .index("by_user_and_hour", ["userId", "hourOfDay"])
    .index("by_user_and_productivity", ["userId", "productivityScore"]),
  studySettings: defineTable({
    userId: v.id("users"),
    studyDuration: v.number(),
    dailyGoal: v.optional(v.number()),
    totalStudyTime: v.number(),
    coinsBalance: v.optional(v.number()),
    lastUpdated: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_total_time", ["totalStudyTime"]),
  todos: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("backlog"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),
    dueDate: v.optional(v.number()),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),
  spotifyTokens: defineTable({
    userId: v.id("users"),
    accessToken: v.string(), // Encrypted
    refreshToken: v.string(), // Encrypted
    expiresAt: v.number(),
    scope: v.string(),
    tokenType: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  googleCalendarTokens: defineTable({
    userId: v.id("users"),
    accessToken: v.string(), // Encrypted
    refreshToken: v.string(), // Encrypted
    expiresAt: v.number(),
    scope: v.string(),
    tokenType: v.string(),
    calendarId: v.optional(v.string()), // Primary calendar ID
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  googleCalendarSync: defineTable({
    userId: v.id("users"),
    autoSyncEnabled: v.boolean(),
    lastSyncTime: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  googleCalendarPermissions: defineTable({
    userId: v.id("users"),
    canReadEvents: v.boolean(), // View calendar schedule
    canCreateEvents: v.boolean(), // Create study session events
    canModifyEvents: v.boolean(), // Modify/reschedule events
    canDeleteEvents: v.boolean(), // Delete events (restricted by default)
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  // Spaced repetition and review scheduling
  reviewItems: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()), // e.g., "Math", "Physics", "Programming"
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    lastReviewed: v.number(),
    nextReview: v.number(), // Scheduled next review time
    reviewCount: v.number(), // How many times reviewed
    easeFactor: v.number(), // SM-2 algorithm ease factor (2.5 default)
    interval: v.number(), // Days until next review
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_next_review", ["userId", "nextReview"])
    .index("by_user_and_category", ["userId", "category"]),
  // Adaptive calendar recommendations
  adaptiveSchedule: defineTable({
    userId: v.id("users"),
    recommendedTime: v.number(), // Suggested session start time
    duration: v.number(), // Recommended session duration in seconds
    sessionType: v.string(),
    confidence: v.number(), // 0-100 confidence score
    reason: v.string(), // Explanation for the recommendation
    basedOnMetrics: v.string(), // JSON string of metrics used
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("expired")
    ),
    calendarEventId: v.optional(v.string()), // If accepted and synced
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_user_and_time", ["userId", "recommendedTime"]),
  // Performance analytics cache
  performanceAnalytics: defineTable({
    userId: v.id("users"),
    analyticsType: v.union(
      v.literal("hourly_performance"),
      v.literal("daily_performance"),
      v.literal("event_impact"),
      v.literal("optimal_times")
    ),
    data: v.string(), // JSON string of analytics data
    lastCalculated: v.number(),
    validUntil: v.number(), // Cache expiration
  })
    .index("by_user_and_type", ["userId", "analyticsType"])
    .index("by_user_and_validity", ["userId", "validUntil"]),
  // Focus mode and calendar sync tracking
  focusSessions: defineTable({
    userId: v.id("users"),
    sessionId: v.id("studySessions"),
    calendarStatusSet: v.boolean(), // Whether "Busy" status was set
    calendarEventId: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    autoBreaksScheduled: v.boolean(),
    breakEvents: v.optional(v.string()), // JSON array of break event IDs
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_user_and_time", ["userId", "startTime"]),
})
