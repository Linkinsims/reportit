"use client";
import { useSupabaseClient, useSession } from "@supabase/auth-helpers-react";

export function SignOutButton() {
  const session = useSession();
  const supabase = useSupabaseClient();

  if (!session) {
    return null;
  }

  return (
    <button
      className="px-4 py-2 rounded bg-white text-secondary border border-gray-200 font-semibold hover:bg-gray-50 hover:text-secondary-hover transition-colors shadow-sm hover:shadow"
      onClick={() => supabase.auth.signOut()}
    >
      Sign out
    </button>
  );
}
