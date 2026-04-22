import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Dashboard } from "./Dashboard";
import { ReportsList } from "./ReportsList";
import { CreateReport } from "./CreateReport";
import { ReportDetail } from "./ReportDetail";
import { Settings } from "./Settings";
import { AuditLogPage } from "./AuditLogPage";

export type Page =
  | { name: "dashboard" }
  | { name: "reports" }
  | { name: "my-reports" }
  | { name: "create" }
  | { name: "report-detail"; reportId: string }
  | { name: "audit-log" }
  | { name: "settings" };

type Props = {
  profile: any;
  org: any;
};

export function MainApp({ profile, org }: Props) {
  const [page, setPage] = useState<Page>({ name: "dashboard" });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function navigate(p: Page) {
    setPage(p);
    setSidebarOpen(false);
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        profile={profile}
        org={org}
        currentPage={page.name}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="font-semibold text-gray-900">ReportIt</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          {page.name === "dashboard" && (
            <Dashboard profile={profile} org={org} onNavigate={navigate} />
          )}
          {page.name === "reports" && (
            <ReportsList profile={profile} org={org} onNavigate={navigate} />
          )}
          {page.name === "my-reports" && (
            <ReportsList
              profile={profile}
              org={org}
              onNavigate={navigate}
              myReportsOnly
            />
          )}
          {page.name === "create" && (
            <CreateReport profile={profile} org={org} onNavigate={navigate} />
          )}
          {page.name === "report-detail" && (
            <ReportDetail
              reportDocId={page.reportId}
              profile={profile}
              org={org}
              onNavigate={navigate}
            />
          )}
          {page.name === "audit-log" && <AuditLogPage org={org} />}
          {page.name === "settings" && <Settings profile={profile} org={org} />}
        </main>
      </div>
    </div>
  );
}
