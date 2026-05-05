import { useAuth } from "./contexts/AuthContext";
import { useQuery } from "./lib/useSupabaseQuery";
import { useCallback } from "react";
import { supabase } from "./lib/supabase";
import { SignInForm } from "./SignInForm";
import { Toaster } from "sonner";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { MainApp } from "./components/MainApp";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      <AuthRouter />
    </div>
  );
}

function AuthRouter() {
  const { user, loading: authLoading } = useAuth();

  const profileQuery = useCallback(async () => {
    if (!user) return null;
    const { data, error } = await supabase.rpc("get_my_profile");
    if (error) throw error;
    return data;
  }, [user?.id]);

  const { data: profileData, loading: profileLoading } = useQuery(
    profileQuery,
    { enabled: !!user },
  );

  const loading = authLoading || (!!user && profileLoading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user) return <LandingPage />;
  if (!profileData) return <OnboardingFlow />;
  return <MainApp profile={profileData.profile} org={profileData.org} />;
}

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
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
          <span className="text-xl font-bold text-gray-900">ReportIt</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-9 h-9 text-white"
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to ReportIt
            </h1>
            <p className="text-gray-500">
              Incident reporting made simple for modern teams.
            </p>
          </div>
                 <div className="bg-white rounded-2xl shadow-sm border p-8">
            <SignInForm />
          </div>
          <div className="text-center mt-4">
            <button
              onClick={async () => {
                await supabase.auth.signInWithPassword({
                  email: "demo@linkin.com",
                  password: "demo123",
                });
              }}
              className="text-sm text-indigo-600 hover:underline font-medium"
            >
              View live demo →
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
