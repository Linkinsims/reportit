import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { createOrganization, joinOrganization } from "../lib/supabaseApi";
import { toast } from "sonner";

type Step = "choice" | "create" | "join";
type Role = "employee" | "manager" | "admin";

export function OnboardingFlow() {
  const [step, setStep] = useState<Step>("choice");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const [createForm, setCreateForm] = useState({
    name: "",
    slug: "",
    displayName: "",
    role: "admin" as Role,
  });
  const [joinForm, setJoinForm] = useState({
    slug: "",
    displayName: "",
    role: "employee" as Role,
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (!user) throw new Error("Not authenticated");
      await createOrganization(
        createForm.name,
        createForm.slug.toLowerCase().replace(/\s+/g, "-"),
        user.id,
        createForm.displayName,
        createForm.role,
      );
      toast.success("Organization created!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (!user) throw new Error("Not authenticated");
      await joinOrganization(
        joinForm.slug.toLowerCase(),
        user.id,
        joinForm.displayName,
        joinForm.role,
      );
      toast.success("Joined organization!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set up ReportIt</h1>
          <p className="text-gray-500 mt-1">Create or join your organization</p>
        </div>

        {step === "choice" && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-3">
            <button
              onClick={() => setStep("create")}
              className="w-full p-4 border-2 border-indigo-100 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left group"
            >
              <div className="font-semibold text-gray-900 group-hover:text-indigo-700">
                Create Organization
              </div>
              <div className="text-sm text-gray-500 mt-0.5">
                Start fresh with a new workspace
              </div>
            </button>
            <button
              onClick={() => setStep("join")}
              className="w-full p-4 border-2 border-gray-100 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all text-left group"
            >
              <div className="font-semibold text-gray-900">
                Join Organization
              </div>
              <div className="text-sm text-gray-500 mt-0.5">
                Enter an existing workspace slug
              </div>
            </button>
          </div>
        )}

        {step === "create" && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <button
              onClick={() => setStep("choice")}
              className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <h2 className="text-lg font-semibold mb-4">Create Organization</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="John Smith"
                  value={createForm.displayName}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      displayName: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                </label>
                <input
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Acme Corp"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace Slug
                </label>
                <input
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="acme-corp"
                  value={createForm.slug}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, slug: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Share this slug with teammates to join
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Role
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      role: e.target.value as Role,
                    })
                  }
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Organization"}
              </button>
            </form>
          </div>
        )}

        {step === "join" && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <button
              onClick={() => setStep("choice")}
              className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <h2 className="text-lg font-semibold mb-4">Join Organization</h2>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="John Smith"
                  value={joinForm.displayName}
                  onChange={(e) =>
                    setJoinForm({ ...joinForm, displayName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace Slug
                </label>
                <input
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="acme-corp"
                  value={joinForm.slug}
                  onChange={(e) =>
                    setJoinForm({ ...joinForm, slug: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Role
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={joinForm.role}
                  onChange={(e) =>
                    setJoinForm({ ...joinForm, role: e.target.value as Role })
                  }
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Joining..." : "Join Organization"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
