import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";

type Props = {
  org: Doc<"organizations">;
};

export function AuditLogPage({ org }: Props) {
  const entries = useQuery(api.reports.getAuditLog, { organizationId: org._id });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-500 text-sm mt-1">Recent activity across your organization</p>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {!entries ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium">No activity yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {entries.map((entry) => (
              <div key={entry._id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-700 font-semibold text-xs">
                    {(entry.actorName ?? "S").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{entry.actorName}</span>
                    <span className="text-sm text-gray-500">{entry.action.replace(/_/g, " ")}</span>
                    {entry.reportId && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">
                        report
                      </span>
                    )}
                  </div>
                  {entry.metadata && (() => {
                    try {
                      const meta = JSON.parse(entry.metadata);
                      return (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {Object.entries(meta).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                        </p>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(entry.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
