import { Doc } from "../../convex/_generated/dataModel";
import { SignOutButton } from "../SignOutButton";

type Props = {
  profile: Doc<"userProfiles">;
  org: Doc<"organizations">;
};

export function Settings({ profile, org }: Props) {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and organization</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Your Profile</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-700 font-bold text-lg">
                {profile.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{profile.displayName}</div>
              <div className="text-sm text-gray-500 capitalize">{profile.role}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-0.5">Role</div>
              <div className="font-medium capitalize text-gray-800">{profile.role}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-0.5">Status</div>
              <div className="font-medium text-gray-800">{profile.isActive ? "Active" : "Inactive"}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Organization</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-0.5">Name</div>
              <div className="font-medium text-gray-800">{org.name}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-0.5">Slug</div>
              <div className="font-medium text-gray-800 font-mono">{org.slug}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-0.5">Plan</div>
              <div className="font-medium text-gray-800 capitalize">{org.plan}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-0.5">Status</div>
              <div className="font-medium text-gray-800">{org.isActive ? "Active" : "Inactive"}</div>
            </div>
          </div>
          <div className="mt-3 bg-indigo-50 rounded-lg p-3 text-sm">
            <div className="text-indigo-700 font-medium mb-0.5">Share your workspace</div>
            <div className="text-indigo-600 text-xs">
              Teammates can join by entering the slug: <span className="font-mono font-semibold">{org.slug}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Account</h2>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
