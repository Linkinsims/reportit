import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { Page } from "./MainApp";
import { PriorityBadge, StatusBadge, CategoryBadge } from "./Badges";
import { toast } from "sonner";

type Props = {
  reportDocId: Id<"reports">;
  profile: Doc<"userProfiles">;
  org: Doc<"organizations">;
  onNavigate: (page: Page) => void;
};

export function ReportDetail({ reportDocId, profile, org, onNavigate }: Props) {
  const report = useQuery(api.reports.getReport, { reportId: reportDocId });
  const members = useQuery(api.organizations.getOrgMembers, { organizationId: org._id });

  const updateStatus = useMutation(api.reports.updateStatus);
  const assignReport = useMutation(api.reports.assignReport);
  const addNote = useMutation(api.reports.addNote);

  const [noteText, setNoteText] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "history" | "notes" | "audit">("details");

  const canManage = profile.role === "manager" || profile.role === "admin";

  if (report === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6 text-center text-gray-500">Report not found.</div>
    );
  }

  async function handleStatusChange(newStatus: "open" | "in_progress" | "resolved" | "closed") {
    try {
      await updateStatus({
        reportId: reportDocId,
        newStatus,
        note: statusNote || undefined,
        organizationId: org._id,
      });
      setStatusNote("");
      toast.success("Status updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleAssign(assigneeId: string) {
    try {
      await assignReport({
        reportId: reportDocId,
        assigneeId: assigneeId ? (assigneeId as Id<"userProfiles">) : undefined,
        organizationId: org._id,
      });
      toast.success("Assignee updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    try {
      await addNote({
        reportId: reportDocId,
        content: noteText,
        organizationId: org._id,
      });
      setNoteText("");
      toast.success("Note added");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingNote(false);
    }
  }

  const statusOptions = ["open", "in_progress", "resolved", "closed"] as const;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => onNavigate({ name: "reports" })}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
      >
        ← Back to Reports
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-400">{report.reportId}</span>
            <CategoryBadge category={report.category} />
            <PriorityBadge priority={report.priority} />
            <StatusBadge status={report.status} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Reported by <span className="font-medium">{report.reporterName}</span> · {new Date(report.incidentAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {(["details", "history", "notes", "audit"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                  activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "history" ? "Status History" : tab === "audit" ? "Audit Log" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "details" && (
            <div className="bg-white rounded-xl border p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{report.description}</p>
              </div>
              {report.resolutionSummary && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Resolution Summary</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{report.resolutionSummary}</p>
                </div>
              )}
              {report.photos && report.photos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Attachments</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {report.photos.map((photo) => (
                      <div key={photo._id} className="rounded-lg overflow-hidden border bg-gray-50">
                        {photo.contentType.startsWith("image/") && photo.url ? (
                          <img src={photo.url} alt={photo.fileName} className="w-full h-32 object-cover" />
                        ) : (
                          <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
                            📄 {photo.fileName}
                          </div>
                        )}
                        <div className="px-2 py-1 text-xs text-gray-400 truncate">{photo.fileName}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Status History</h3>
              {report.statusHistory && report.statusHistory.length > 0 ? (
                <div className="space-y-3">
                  {report.statusHistory.map((h) => (
                    <div key={h._id} className="flex gap-3 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-700">{h.changerName}</span>
                        <span className="text-gray-500"> changed status from </span>
                        <StatusBadge status={h.fromStatus} />
                        <span className="text-gray-500"> → </span>
                        <StatusBadge status={h.toStatus} />
                        {h.note && <p className="text-gray-500 mt-0.5 italic">"{h.note}"</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(h._creationTime).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No status changes yet.</p>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="bg-white rounded-xl border p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Internal Notes</h3>
              {report.notes && report.notes.length > 0 ? (
                <div className="space-y-3">
                  {report.notes.map((note) => (
                    <div key={note._id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{note.authorName}</span>
                        <span className="text-xs text-gray-400">{new Date(note._creationTime).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No notes yet.</p>
              )}
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Add an internal note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={submittingNote || !noteText.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submittingNote ? "Adding..." : "Add Note"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Audit Log</h3>
              {report.auditLog && report.auditLog.length > 0 ? (
                <div className="space-y-2">
                  {report.auditLog.map((entry) => (
                    <div key={entry._id} className="flex gap-3 text-sm py-2 border-b last:border-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-700">{entry.actorName}</span>
                        <span className="text-gray-500"> · {entry.action.replace(/_/g, " ")}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(entry.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No audit entries.</p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {canManage && (
            <div className="bg-white rounded-xl border p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Manage Report</h3>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Update Status</label>
                <div className="space-y-1.5">
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={report.status === s}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        report.status === s
                          ? "bg-indigo-50 text-indigo-700 font-medium cursor-default"
                          : "hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <StatusBadge status={s} />
                    </button>
                  ))}
                </div>
                <input
                  className="mt-2 w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Optional note for status change..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Assignee</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={report.assigneeId ?? ""}
                  onChange={(e) => handleAssign(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {members?.map((m) => (
                    <option key={m._id} value={m._id}>{m.displayName}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Details</h3>
            <DetailRow label="Reporter" value={report.reporterName} />
            <DetailRow label="Assignee" value={report.assigneeName ?? "Unassigned"} />
            <DetailRow label="Category" value={<CategoryBadge category={report.category} />} />
            <DetailRow label="Priority" value={<PriorityBadge priority={report.priority} />} />
            <DetailRow label="Status" value={<StatusBadge status={report.status} />} />
            <DetailRow label="Incident Date" value={new Date(report.incidentAt).toLocaleDateString()} />
            <DetailRow label="Submitted" value={new Date(report._creationTime).toLocaleDateString()} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}
