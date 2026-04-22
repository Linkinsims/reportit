import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function generateReportId(category: string, counter: number): string {
  const prefix = category.substring(0, 1).toUpperCase();
  return `${prefix}-${String(counter).padStart(4, "0")}`;
}

export const createReport = mutation({
  args: {
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
    incidentAt: v.number(),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId_and_organizationId", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .unique();
    if (!profile) throw new Error("Profile not found");

    const existingReports = await ctx.db
      .query("reports")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
    const counter = existingReports.length + 1;
    const reportId = generateReportId(args.category, counter);

    const id = await ctx.db.insert("reports", {
      reportId,
      organizationId: args.organizationId,
      title: args.title,
      description: args.description,
      category: args.category,
      priority: args.priority,
      status: "open",
      incidentAt: args.incidentAt,
      reporterProfileId: profile._id,
      isArchived: false,
    });

    await ctx.db.insert("auditLog", {
      reportId: id,
      organizationId: args.organizationId,
      actorId: profile._id,
      action: "report_created",
      metadata: JSON.stringify({ title: args.title, category: args.category, priority: args.priority }),
      timestamp: Date.now(),
    });

    return id;
  },
});

export const listReports = query({
  args: {
    organizationId: v.id("organizations"),
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    priority: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let reports = await ctx.db
      .query("reports")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .collect();

    reports = reports.filter((r) => !r.isArchived);

    if (args.status && args.status !== "all") {
      reports = reports.filter((r) => r.status === args.status);
    }
    if (args.category && args.category !== "all") {
      reports = reports.filter((r) => r.category === args.category);
    }
    if (args.priority && args.priority !== "all") {
      reports = reports.filter((r) => r.priority === args.priority);
    }
    if (args.search) {
      const s = args.search.toLowerCase();
      reports = reports.filter(
        (r) =>
          r.title.toLowerCase().includes(s) ||
          r.description.toLowerCase().includes(s) ||
          r.reportId.toLowerCase().includes(s)
      );
    }

    const enriched = await Promise.all(
      reports.map(async (r) => {
        const reporter = r.reporterProfileId
          ? await ctx.db.get(r.reporterProfileId)
          : null;
        const assignee = r.assigneeId ? await ctx.db.get(r.assigneeId) : null;
        return { ...r, reporterName: reporter?.displayName ?? "Unknown", assigneeName: assignee?.displayName ?? null };
      })
    );

    return enriched;
  },
});

export const getMyReports = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId_and_organizationId", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .unique();
    if (!profile) return [];

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_reporterProfileId", (q) =>
        q.eq("reporterProfileId", profile._id)
      )
      .order("desc")
      .collect();

    return reports.filter((r) => !r.isArchived);
  },
});

export const getReport = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const report = await ctx.db.get(args.reportId);
    if (!report) return null;

    const reporter = report.reporterProfileId
      ? await ctx.db.get(report.reporterProfileId)
      : null;
    const assignee = report.assigneeId
      ? await ctx.db.get(report.assigneeId)
      : null;

    const photos = await ctx.db
      .query("reportPhotos")
      .withIndex("by_reportId", (q) => q.eq("reportId", args.reportId))
      .collect();

    const photosWithUrls = await Promise.all(
      photos.map(async (p) => ({
        ...p,
        url: await ctx.storage.getUrl(p.storageId),
      }))
    );

    const statusHistory = await ctx.db
      .query("statusHistory")
      .withIndex("by_reportId", (q) => q.eq("reportId", args.reportId))
      .order("desc")
      .collect();

    const historyEnriched = await Promise.all(
      statusHistory.map(async (h) => {
        const changer = await ctx.db.get(h.changedBy);
        return { ...h, changerName: changer?.displayName ?? "Unknown" };
      })
    );

    const notes = await ctx.db
      .query("internalNotes")
      .withIndex("by_reportId", (q) => q.eq("reportId", args.reportId))
      .order("desc")
      .collect();

    const notesEnriched = await Promise.all(
      notes.map(async (n) => {
        const author = await ctx.db.get(n.authorId);
        return { ...n, authorName: author?.displayName ?? "Unknown" };
      })
    );

    const auditEntries = await ctx.db
      .query("auditLog")
      .withIndex("by_reportId", (q) => q.eq("reportId", args.reportId))
      .order("desc")
      .collect();

    const auditEnriched = await Promise.all(
      auditEntries.map(async (a) => {
        const actor = a.actorId ? await ctx.db.get(a.actorId) : null;
        return { ...a, actorName: actor?.displayName ?? "System" };
      })
    );

    return {
      ...report,
      reporterName: reporter?.displayName ?? "Unknown",
      assigneeName: assignee?.displayName ?? null,
      photos: photosWithUrls,
      statusHistory: historyEnriched,
      notes: notesEnriched,
      auditLog: auditEnriched,
    };
  },
});

export const updateStatus = mutation({
  args: {
    reportId: v.id("reports"),
    newStatus: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    note: v.optional(v.string()),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId_and_organizationId", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .unique();
    if (!profile) throw new Error("Profile not found");

    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");

    const fromStatus = report.status;
    await ctx.db.patch(args.reportId, { status: args.newStatus });

    await ctx.db.insert("statusHistory", {
      reportId: args.reportId,
      organizationId: args.organizationId,
      fromStatus,
      toStatus: args.newStatus,
      changedBy: profile._id,
      note: args.note,
    });

    await ctx.db.insert("auditLog", {
      reportId: args.reportId,
      organizationId: args.organizationId,
      actorId: profile._id,
      action: "status_changed",
      metadata: JSON.stringify({ from: fromStatus, to: args.newStatus }),
      timestamp: Date.now(),
    });
  },
});

export const assignReport = mutation({
  args: {
    reportId: v.id("reports"),
    assigneeId: v.optional(v.id("userProfiles")),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId_and_organizationId", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .unique();
    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(args.reportId, { assigneeId: args.assigneeId });

    await ctx.db.insert("auditLog", {
      reportId: args.reportId,
      organizationId: args.organizationId,
      actorId: profile._id,
      action: "report_assigned",
      metadata: JSON.stringify({ assigneeId: args.assigneeId }),
      timestamp: Date.now(),
    });
  },
});

export const addNote = mutation({
  args: {
    reportId: v.id("reports"),
    content: v.string(),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId_and_organizationId", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .unique();
    if (!profile) throw new Error("Profile not found");

    await ctx.db.insert("internalNotes", {
      reportId: args.reportId,
      organizationId: args.organizationId,
      authorId: profile._id,
      content: args.content,
    });

    await ctx.db.insert("auditLog", {
      reportId: args.reportId,
      organizationId: args.organizationId,
      actorId: profile._id,
      action: "note_added",
      metadata: JSON.stringify({ preview: args.content.substring(0, 50) }),
      timestamp: Date.now(),
    });
  },
});

export const getDashboardStats = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    const active = reports.filter((r) => !r.isArchived);

    const total = active.length;
    const open = active.filter((r) => r.status === "open").length;
    const inProgress = active.filter((r) => r.status === "in_progress").length;
    const resolved = active.filter((r) => r.status === "resolved" || r.status === "closed").length;
    const highPriority = active.filter(
      (r) => (r.priority === "high" || r.priority === "critical") && r.status !== "resolved" && r.status !== "closed"
    ).length;

    const byCategory = {
      safety: active.filter((r) => r.category === "safety").length,
      hr: active.filter((r) => r.category === "hr").length,
      equipment: active.filter((r) => r.category === "equipment").length,
      other: active.filter((r) => r.category === "other").length,
    };

    const byStatus = { open, in_progress: inProgress, resolved };

    const byPriority = {
      low: active.filter((r) => r.priority === "low").length,
      medium: active.filter((r) => r.priority === "medium").length,
      high: active.filter((r) => r.priority === "high").length,
      critical: active.filter((r) => r.priority === "critical").length,
    };

    // Last 7 days trend
    const now = Date.now();
    const days: Array<{ date: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = now - i * 86400000;
      const dayEnd = dayStart + 86400000;
      const count = active.filter(
        (r) => r._creationTime >= dayStart && r._creationTime < dayEnd
      ).length;
      const d = new Date(dayStart);
      days.push({
        date: d.toLocaleDateString("en-US", { weekday: "short" }),
        count,
      });
    }

    return { total, open, inProgress, resolved, highPriority, byCategory, byStatus, byPriority, trend: days };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const attachPhoto = mutation({
  args: {
    reportId: v.id("reports"),
    organizationId: v.id("organizations"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    contentType: v.string(),
    sizeBytes: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId_and_organizationId", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .unique();

    await ctx.db.insert("reportPhotos", {
      reportId: args.reportId,
      organizationId: args.organizationId,
      storageId: args.storageId,
      uploadedBy: profile?._id,
      fileName: args.fileName,
      contentType: args.contentType,
      sizeBytes: args.sizeBytes,
    });
  },
});

export const getAuditLog = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const entries = await ctx.db
      .query("auditLog")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .take(100);

    const enriched = await Promise.all(
      entries.map(async (e) => {
        const actor = e.actorId ? await ctx.db.get(e.actorId) : null;
        return { ...e, actorName: actor?.displayName ?? "System" };
      })
    );

    return enriched;
  },
});
