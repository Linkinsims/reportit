import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createOrganization = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    role: v.union(v.literal("employee"), v.literal("manager"), v.literal("admin")),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error("Organization slug already taken");

    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      plan: "trial",
      isActive: true,
    });

    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      organizationId: orgId,
      role: args.role,
      displayName: args.displayName,
      isActive: true,
    });

    await ctx.db.insert("auditLog", {
      organizationId: orgId,
      actorId: profileId,
      action: "organization_created",
      metadata: JSON.stringify({ name: args.name }),
      timestamp: Date.now(),
    });

    return { orgId, profileId };
  },
});

export const joinOrganization = mutation({
  args: {
    slug: v.string(),
    role: v.union(v.literal("employee"), v.literal("manager"), v.literal("admin")),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!org) throw new Error("Organization not found");

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId_and_organizationId", (q) =>
        q.eq("userId", userId).eq("organizationId", org._id)
      )
      .unique();
    if (existingProfile) return { orgId: org._id, profileId: existingProfile._id };

    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      organizationId: org._id,
      role: args.role,
      displayName: args.displayName,
      isActive: true,
    });

    return { orgId: org._id, profileId };
  },
});

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return null;

    const org = await ctx.db.get(profile.organizationId);
    return { profile, org };
  },
});

export const getOrgMembers = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const members = await ctx.db
      .query("userProfiles")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    return members;
  },
});
