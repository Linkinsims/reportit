import { useState, useEffect } from "react";
import { listReports, getMyReports } from "../lib/supabaseApi";
import { Page } from "./MainApp";
import { PriorityBadge, StatusBadge, CategoryBadge } from "./Badges";

type Props = {
  profile: any;
  org: any;
  onNavigate: (page: Page) => void;
  myReportsOnly?: boolean;
};

export function ReportsList({
  profile,
  org,
  onNavigate,
  myReportsOnly,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = myReportsOnly
          ? await getMyReports(org.id)
          : await listReports(org.id, {
              status: statusFilter !== "all" ? statusFilter : undefined,
              category: categoryFilter !== "all" ? categoryFilter : undefined,
              priority: priorityFilter !== "all" ? priorityFilter : undefined,
              search: search || undefined,
            });
        setReports(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [
    org.id,
    myReportsOnly,
    statusFilter,
    categoryFilter,
    priorityFilter,
    search,
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {myReportsOnly ? "My Reports" : "All Reports"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {reports?.length ?? 0} report{reports?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => onNavigate({ name: "create" })}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Report
        </button>
      </div>

      {!myReportsOnly && (
        <div className="bg-white rounded-xl border p-4 mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-48 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="safety">Safety</option>
            <option value="hr">HR</option>
            <option value="equipment">Equipment</option>
            <option value="other">Other</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="font-medium">No reports found</p>
            <p className="text-sm mt-1">
              {myReportsOnly
                ? "You haven't submitted any reports yet."
                : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Priority
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                    Reporter
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() =>
                      onNavigate({
                        name: "report-detail",
                        reportId: report.report_id,
                      })
                    }
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">
                      {report.report_id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">
                        {report.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {report.description}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <CategoryBadge category={report.category} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={report.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
                      {report.reporter?.display_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 hidden lg:table-cell whitespace-nowrap">
                      {new Date(report.incident_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
