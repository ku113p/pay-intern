import { useState } from 'react';
import { useAuthStore } from '../stores/auth';
import { profilesApi } from '../api/profiles';
import { DeveloperProfileForm } from '../components/profiles/DeveloperProfileForm';
import { CompanyProfileForm } from '../components/profiles/CompanyProfileForm';

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');

  const saveName = async () => {
    try {
      const res = await profilesApi.updateMe(displayName);
      setUser(res.data);
      setEditingName(false);
    } catch {
      // ignore
    }
  };

  if (!user) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
        <p className="text-sm text-gray-500">{user.email} &middot; {user.role}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Display Name</h2>
          {!editingName && (
            <button onClick={() => setEditingName(true)} className="text-sm text-indigo-600 hover:underline">
              Edit
            </button>
          )}
        </div>
        {editingName ? (
          <div className="flex gap-2">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2"
            />
            <button onClick={saveName} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm">Save</button>
            <button onClick={() => setEditingName(false)} className="text-gray-500 text-sm">Cancel</button>
          </div>
        ) : (
          <p className="text-gray-700">{user.display_name}</p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-semibold text-gray-900 mb-4">
          {user.role === 'developer' ? 'Developer' : 'Company'} Profile
        </h2>
        {user.role === 'developer' ? <DeveloperProfileForm /> : <CompanyProfileForm />}
      </div>
    </div>
  );
}
