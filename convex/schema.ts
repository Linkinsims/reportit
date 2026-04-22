import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    plan: v.union(v.literal("trial"), v.literal("starter"), v.literal("pro")),
    isActive: v.boolean(),
  }).index("by_slug", ["slug"]),

  userProfiles: defineTable({
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    role: v.union(
      v.literal("employee"),
      v.literal("manager"),
      v.literal("admin")
    ),
    displayName: v.string(),
    isActive: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_organizationId", ["organizationId"])
    .index("by_userId_and_organizationId", ["userId", "organizationId"]),

  reports: defineTable({
    reportId: v.string(),
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("safety"),
      v.literal("hr"),
      v.literal("equipment"),
      v.literal("other")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    incidentAt: v.number(),
    reporterProfileId: v.optional(v.id("userProfiles")),
    assigneeId: v.optional(v.id("userProfiles")),
    resolutionSummary: v.optional(v.string()),
    isArchived: v.boolean(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_organizationId_and_status", ["organizationId", "status"])
    .index("by_organizationId_and_category", ["organizationId", "category"])
    .index("by_organizationId_and_priority", ["organizationId", "priority"])
    .index("by_reporterProfileId", ["reporterProfileId"])
    .index("by_reportId", ["reportId"]),

  reportPhotos: defineTable({
    reportId: v.id("reports"),
    organizationId: v.id("organizations"),
    storageId: v.id("_storage"),
    uploadedBy: v.optional(v.id("userProfiles")),
    fileName: v.string(),
    contentType: v.string(),
    sizeBytes: v.number(),
  }).index("by_reportId", ["reportId"]),

  statusHistory: defineTable({
    reportId: v.id("reports"),
    organizationId: v.id("organizations"),
    fromStatus: v.string(),
    toStatus: v.string(),
    changedBy: v.id("userProfiles"),
    note: v.optional(v.string()),
  }).index("by_reportId", ["reportId"]),

  internalNotes: defineTable({
    reportId: v.id("reports"),
    organizationId: v.id("organizations"),
    authorId: v.id("userProfiles"),
    content: v.string(),
  }).index("by_reportId", ["reportId"]),

  auditLog: defineTable({
    reportId: v.optional(v.id("reports")),
    organizationId: v.id("organizations"),
    actorId: v.optional(v.id("userProfiles")),
    action: v.string(),
    metadata: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_reportId", ["reportId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
