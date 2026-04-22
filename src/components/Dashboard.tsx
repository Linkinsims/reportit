import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { getDashboardStats } from "../lib/supabaseApi";
import { Page } from "./MainApp";

type Props = {
  profile: any;
  org: any;
  onNavigate: (page: Page) => void;
};

const COLORS = {
  safety: "#EF4444",
  hr: "#8B5CF6",
  equipment: "#F59E0B",
  other: "#6B7280",
};

const STATUS_COLORS = {
  open: "#EF4444",
  in_progress: "#F59E0B",
  resolved: "#10B981",
};

export function Dashboard({ profile, org, onNavigate }: Props) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabaseClient();

  useEffect(() => {
    async function load() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [org.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats) {
    return <div>Failed to load dashboard</div>;
  }

  const maxTrend = Math.max(...stats.trend.map((d) => d.count), 1);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Overview of incidents at {org.name}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Reports"
          value={stats.total}
          color="indigo"
          icon="📋"
        />
        <StatCard label="Open" value={stats.open} color="red" icon="🔴" />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          color="yellow"
          icon="🟡"
        />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          color="green"
          icon="✅"
        />
      </div>

      {stats.highPriority > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-semibold text-red-800">
              {stats.highPriority} High Priority Incident
              {stats.highPriority !== 1 ? "s" : ""} Need Attention
            </div>
            <div className="text-sm text-red-600">
              These require immediate review
            </div>
          </div>
          <button
            onClick={() => onNavigate({ name: "reports" })}
            className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            View
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Trend chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">
            Reports This Week
          </h3>
          <div className="flex items-end gap-2 h-32">
            {stats.trend.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-indigo-500 rounded-t-md transition-all"
                  style={{
                    height: `${(day.count / maxTrend) * 100}%`,
                    minHeight: day.count > 0 ? "4px" : "0",
                  }}
                />
                <span className="text-xs text-gray-400">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By category */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">By Category</h3>
          <div className="space-y-3">
            {Object.entries(stats.byCategory).map(([cat, count]) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize text-gray-600">{cat}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width:
                        stats.total > 0
                          ? `${(count / stats.total) * 100}%`
                          : "0%",
                      backgroundColor: COLORS[cat as keyof typeof COLORS],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By status donut */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Status Breakdown</h3>
          <div className="flex items-center gap-6">
            <DonutChart
              data={[
                { label: "Open", value: stats.byStatus.open, color: "#EF4444" },
                {
                  label: "In Progress",
                  value: stats.byStatus.in_progress,
                  color: "#F59E0B",
                },
                {
                  label: "Resolved",
                  value: stats.byStatus.resolved,
                  color: "#10B981",
                },
              ]}
              total={stats.total}
            />
            <div className="space-y-2">
              {[
                { label: "Open", value: stats.byStatus.open, color: "#EF4444" },
                {
                  label: "In Progress",
                  value: stats.byStatus.in_progress,
                  color: "#F59E0B",
                },
                {
                  label: "Resolved",
                  value: stats.byStatus.resolved,
                  color: "#10B981",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-sm"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900 ml-auto">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* By priority */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">By Priority</h3>
          <div className="space-y-3">
            {[
              { key: "critical", label: "Critical", color: "#7C3AED" },
              { key: "high", label: "High", color: "#EF4444" },
              { key: "medium", label: "Medium", color: "#F59E0B" },
              { key: "low", label: "Low", color: "#10B981" },
            ].map(({ key, label, color }) => {
              const count =
                stats.byPriority[key as keyof typeof stats.byPriority];
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width:
                          stats.total > 0
                            ? `${(count / stats.total) * 100}%`
                            : "0%",
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 border-indigo-100",
    red: "bg-red-50 border-red-100",
    yellow: "bg-yellow-50 border-yellow-100",
    green: "bg-green-50 border-green-100",
  };
  const textMap: Record<string, string> = {
    indigo: "text-indigo-700",
    red: "text-red-700",
    yellow: "text-yellow-700",
    green: "text-green-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-3xl font-bold ${textMap[color]}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function DonutChart({
  data,
  total,
}: {
  data: Array<{ label: string; value: number; color: string }>;
  total: number;
}) {
  const size = 80;
  const radius = 30;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = data.map((d) => {
    const pct = total > 0 ? d.value / total : 0;
    const dash = pct * circumference;
    const seg = { ...d, dash, offset, pct };
    offset += dash;
    return seg;
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="flex-shrink-0"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#F3F4F6"
        strokeWidth={12}
      />
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={seg.color}
          strokeWidth={12}
          strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
          strokeDashoffset={-seg.offset + circumference / 4}
          style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
        />
      ))}
      <text
        x={size / 2}
        y={size / 2 + 5}
        textAnchor="middle"
        className="text-xs font-bold"
        fill="#111827"
        fontSize="14"
        fontWeight="bold"
      >
        {total}
      </text>
    </svg>
  );
}
