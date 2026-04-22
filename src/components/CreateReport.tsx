import { useState, useRef } from "react";
import { useSupabaseClient, useSession } from "@supabase/auth-helpers-react";
import { createReport, uploadPhoto } from "../lib/supabaseApi";
import { Page } from "./MainApp";
import { toast } from "sonner";

type Props = {
  profile: any;
  org: any;
  onNavigate: (page: Page) => void;
};

export function CreateReport({ profile, org, onNavigate }: Props) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "safety" as "safety" | "hr" | "equipment" | "other",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    incidentAt: new Date().toISOString().slice(0, 16),
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = useSupabaseClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const reportId = await createReport({
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        incidentAt: new Date(form.incidentAt).getTime(),
        organizationId: org.id,
      });

      for (const file of files) {
        await uploadPhoto(reportId, org.id, file);
      }

      toast.success("Report submitted successfully!");
      onNavigate({ name: "report-detail", reportId });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => onNavigate({ name: "my-reports" })}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          New Incident Report
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Fill in the details below to submit a report
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            required
            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Brief description of the incident"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Provide a detailed description of what happened..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as any })
              }
            >
              <option value="safety">🦺 Safety</option>
              <option value="hr">👥 HR</option>
              <option value="equipment">🔧 Equipment</option>
              <option value="other">📌 Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value as any })
              }
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
              <option value="critical">🚨 Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Date & Time of Incident <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            required
            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.incidentAt}
            onChange={(e) => setForm({ ...form, incidentAt: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Attachments (optional)
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
          >
            <svg
              className="w-8 h-8 text-gray-300 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-500">
              Click to upload images or documents
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG, PDF up to 10MB
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2"
                >
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  {f.name}
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    className="ml-auto text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate({ name: "my-reports" })}
            className="flex-1 py-2.5 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </form>
    </div>
  );
}
