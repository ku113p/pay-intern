import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/auth';
import { profilesApi } from '../api/profiles';
import { IndividualProfileForm } from '../components/profiles/DeveloperProfileForm';
import { OrganizationProfileForm } from '../components/profiles/CompanyProfileForm';

export function ProfilePage() {
  const { user, setUser, activeRole, logout } = useAuthStore();
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<'individual' | 'organization'>(
    activeRole === 'organization' ? 'organization' : 'individual'
  );

  useEffect(() => {
    if (!editingName) {
      setDisplayName(user?.display_name || '');
    }
  }, [user?.display_name, editingName]);

  useEffect(() => {
    if (activeRole && activeRole !== tab) {
      setTab(activeRole);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole]);

  const saveName = async () => {
    try {
      const res = await profilesApi.updateMe(displayName);
      setUser(res.data);
      setEditingName(false);
    } catch {
      // ignore
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    setDeleting(true);
    try {
      await profilesApi.deleteAccount();
      logout();
      navigate('/');
      toast.success('Account deleted');
    } catch {
      toast.error('Failed to delete account');
      setDeleting(false);
    }
  };

  if (!user) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Display Name</h2>
          {!editingName && (
            <button onClick={() => setEditingName(true)} className="text-sm text-primary-600 hover:underline">
              Edit
            </button>
          )}
        </div>
        {editingName ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2"
            />
            <button onClick={saveName} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm">Save</button>
            <button onClick={() => setEditingName(false)} className="text-gray-500 text-sm">Cancel</button>
          </div>
        ) : (
          <p className="text-gray-700">{user.display_name}</p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('individual')}
            className={`flex-1 py-3 text-sm font-medium text-center ${
              tab === 'individual'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Individual Profile
          </button>
          <button
            onClick={() => setTab('organization')}
            className={`flex-1 py-3 text-sm font-medium text-center ${
              tab === 'organization'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Organization Profile
          </button>
        </div>
        <div className="p-5">
          {tab === 'individual' ? <IndividualProfileForm /> : <OrganizationProfileForm />}
        </div>
      </div>

      <div className="border border-red-200 rounded-lg p-5">
        <h2 className="font-semibold text-red-700 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-600 mb-4">
          Permanently delete your account and anonymize all associated data. This action cannot be undone.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete My Account'}
        </button>
      </div>
    </div>
  );
}
