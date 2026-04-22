import { supabase } from "./supabase";

// Types
export interface Profile {
  id: string;
  userId: string;
  organizationId: string;
  role: "employee" | "manager" | "admin";
  displayName: string;
  isActive: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "trial" | "starter" | "pro";
  isActive: boolean;
}

export interface Report {
  id: string;
  reportId: string;
  organizationId: string;
  title: string;
  description: string;
  category: "safety" | "hr" | "equipment" | "other";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  incidentAt: number;
  reporterProfileId: string;
  assigneeId: string | null;
  resolutionSummary: string | null;
  isArchived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReportWithDetails extends Report {
  reporterName: string;
  assigneeName: string | null;
  photos: ReportPhoto[];
  statusHistory: StatusHistory[];
  notes: InternalNote[];
  auditLog: AuditLogEntry[];
}

export interface ReportPhoto {
  id: string;
  reportId: string;
  organizationId: string;
  storagePath: string;
  uploadedBy: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface StatusHistory {
  id: string;
  reportId: string;
  organizationId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  note: string | null;
  created_at: string;
  changerName?: string;
}

export interface InternalNote {
  id: string;
  reportId: string;
  organizationId: string;
  authorId: string;
  content: string;
  created_at: string;
  author?: { display_name: string };
}

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  reportId: string | null;
  actorId: string | null;
  action: string;
  metadata: any;
  timestamp: number;
  actorName?: string;
}

export interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  highPriority: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  trend: Array<{ date: string; count: number }>;
}

// Queries
export async function getProfile(): Promise<{
  profile: Profile;
  org: Organization;
} | null> {
  const { data, error } = await supabase.rpc("get_my_profile");
  if (error) throw error;
  return data;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc("get_dashboard_stats");
  if (!error && data) return data;

  // Fallback: compute from reports if RPC not yet created
  const { data: reports, error: reportsError } = await supabase
    .from("reports")
    .select("*");

  if (reportsError) throw reportsError;
  const r = reports || [];

  const total = r.length;
  const open = r.filter((rep: any) => rep.status === "open").length;
  const inProgress = r.filter(
    (rep: any) => rep.status === "in_progress",
  ).length;
  const resolved = r.filter((rep: any) => rep.status === "resolved").length;
  const highPriority = r.filter(
    (rep: any) => rep.priority === "high" || rep.priority === "critical",
  ).length;

  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};

  r.forEach((rep: any) => {
    byCategory[rep.category] = (byCategory[rep.category] || 0) + 1;
    byStatus[rep.status] = (byStatus[rep.status] || 0) + 1;
    byPriority[rep.priority] = (byPriority[rep.priority] || 0) + 1;
  });

  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const start = new Date(date.setHours(0, 0, 0, 0));
    const end = new Date(date.setHours(23, 59, 59, 999));
    const count = r.filter((rep: any) => {
      const created = new Date(rep.created_at);
      return created >= start && created <= end;
    }).length;
    trend.push({
      date: date.toLocaleDateString("en-US", { weekday: "short" }),
      count,
    });
  }

  return {
    total,
    open,
    inProgress,
    resolved,
    highPriority,
    byCategory,
    byStatus,
    byPriority,
    trend,
  };
}

export async function listReports(
  orgId: string,
  filters?: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
  },
): Promise<any[]> {
  let query = supabase
    .from("reports")
    .select(
      `
      *,
      reporter:user_profiles(id, display_name),
      assignee:user_profiles(id, display_name)
    `,
    )
    .eq("organization_id", orgId);

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.priority) query = query.eq("priority", filters.priority);
  if (filters?.search)
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
    );

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getMyReports(orgId: string): Promise<any[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return [];

  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      *,
      reporter:user_profiles(id, display_name),
      assignee:user_profiles(id, display_name)
    `,
    )
    .eq("organization_id", orgId)
    .eq("reporter_profile_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getReport(
  reportId: string,
): Promise<ReportWithDetails | null> {
  const { data: report, error } = await supabase
    .from("reports")
    .select(
      `
      *,
      reporter:user_profiles(id, display_name),
      assignee:user_profiles(id, display_name)
    `,
    )
    .eq("report_id", reportId)
    .single();

  if (error) return null;

  const { data: photos } = await supabase
    .from("report_photos")
    .select("*")
    .eq("report_id", report.id);

  const { data: statusHistory } = await supabase
    .from("status_history")
    .select("*")
    .eq("report_id", report.id)
    .order("created_at", { ascending: false });

  const { data: notes } = await supabase
    .from("internal_notes")
    .select(
      `
      *,
      author:user_profiles(id, display_name)
    `,
    )
    .eq("report_id", report.id)
    .order("created_at", { ascending: false });

  const { data: audit } = await supabase
    .from("audit_log")
    .select("*")
    .eq("report_id", report.id)
    .order("timestamp", { ascending: false });

  return {
    ...report,
    photos: photos || [],
    statusHistory: statusHistory || [],
    notes: (notes || []).map((n: any) => ({
      ...n,
      authorName: n.author?.display_name || "Unknown",
    })),
    auditLog: (audit || []).map((a: any) => ({
      ...a,
      actorName: a.actorId ? "User" : "System",
    })),
    reporterName: report.reporter?.display_name || "Unknown",
    assigneeName: report.assignee?.display_name || null,
  };
}

export async function getOrgMembers(orgId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("organization_id", orgId);
  if (error) throw error;
  return data || [];
}

export async function getAuditLog(orgId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .eq("organization_id", orgId)
    .order("timestamp", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

// Mutations
export async function createReport(data: {
  title: string;
  description: string;
  category: string;
  priority: string;
  incidentAt: number;
  organizationId: string;
}): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const { data: reportIdData } = await supabase.rpc("generate_report_id");
  const reportId = reportIdData?.[0] || `S-${Date.now()}`;

  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      report_id: reportId,
      organization_id: data.organizationId,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: "open",
      incident_at: data.incidentAt,
      reporter_profile_id: profile.id,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_log").insert({
    report_id: report.id,
    organization_id: data.organizationId,
    action: "report_created",
    timestamp: Date.now(),
  });

  return reportId;
}

export async function updateStatus(
  reportId: string,
  newStatus: string,
  note?: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("report_id", reportId)
    .single();

  if (!report) throw new Error("Report not found");

  const { error } = await supabase
    .from("reports")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", report.id);

  if (error) throw error;

  await supabase.from("status_history").insert({
    report_id: report.id,
    organization_id: report.organization_id,
    from_status: report.status,
    to_status: newStatus,
    changed_by: profile.id,
    note: note || null,
  });

  await supabase.from("audit_log").insert({
    report_id: report.id,
    organization_id: report.organization_id,
    action: "status_changed",
    metadata: { from: report.status, to: newStatus, note },
    timestamp: Date.now(),
  });
}

export async function assignReport(
  reportId: string,
  assigneeId: string | null,
  orgId: string,
): Promise<void> {
  const { error } = await supabase
    .from("reports")
    .update({
      assignee_id: assigneeId,
      updated_at: new Date().toISOString(),
    })
    .eq("report_id", reportId);

  if (error) throw error;

  const { data: report } = await supabase
    .from("reports")
    .select("id")
    .eq("report_id", reportId)
    .single();

  await supabase.from("audit_log").insert({
    report_id: report?.id,
    organization_id: orgId,
    action: assigneeId ? "report_assigned" : "report_unassigned",
    timestamp: Date.now(),
  });
}

export async function addNote(
  reportId: string,
  content: string,
  orgId: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const { data: report } = await supabase
    .from("reports")
    .select("id")
    .eq("report_id", reportId)
    .single();

  const { error } = await supabase.from("internal_notes").insert({
    report_id: report?.id,
    organization_id: orgId,
    author_id: profile.id,
    content,
  });

  if (error) throw error;

  await supabase.from("audit_log").insert({
    report_id: report?.id,
    organization_id: orgId,
    action: "note_added",
    timestamp: Date.now(),
  });
}

// Organization
export async function createOrganization(
  name: string,
  slug: string,
  userId: string,
  displayName: string,
  role: string,
): Promise<{ profileId: string; orgId: string }> {
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name, slug, plan: "trial" })
    .select()
    .single();

  if (orgError) throw orgError;

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .insert({
      user_id: userId,
      organization_id: org.id,
      role,
      display_name: displayName,
    })
    .select()
    .single();

  if (profileError) throw profileError;

  return { profileId: profile.id, orgId: org.id };
}

export async function joinOrganization(
  slug: string,
  userId: string,
  displayName: string,
  role: string,
): Promise<{ profileId: string; orgId: string }> {
  const { data: org, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) throw new Error("Organization not found");

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .insert({
      user_id: userId,
      organization_id: org.id,
      role,
      display_name: displayName,
    })
    .select()
    .single();

  if (profileError) throw profileError;

  return { profileId: profile.id, orgId: org.id };
}

// File upload with Supabase Storage
export async function uploadPhoto(
  reportId: string,
  orgId: string,
  file: File,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${orgId}/${reportId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("report-attachments")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: report } = await supabase
    .from("reports")
    .select("id")
    .eq("report_id", reportId)
    .single();

  const { error: dbError } = await supabase.from("report_photos").insert({
    report_id: report?.id,
    organization_id: orgId,
    storage_path: filePath,
    uploaded_by: profile.id,
    file_name: file.name,
    content_type: file.type,
    size_bytes: file.size,
  });

  if (dbError) throw dbError;
}

export function getPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from("report-attachments")
    .getPublicUrl(storagePath);
  return data.publicUrl;
}
