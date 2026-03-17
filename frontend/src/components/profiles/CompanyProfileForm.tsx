import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { profilesApi, type OrganizationProfile } from '../../api/profiles';

export function OrganizationProfileForm() {
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    profilesApi.getMyOrganizationProfile()
      .then((r) => setProfile(r.data))
      .catch(() => {
        setNotFound(true);
        setProfile({
          user_id: '',
          organization_name: '',
          description: '',
          industry: '',
          size: 'startup',
          skills_sought: [],
          contact_email: null,
          links: [],
        });
      });
  }, []);

  if (!profile) return <p className="text-gray-500">Loading profile...</p>;

  const addSkill = () => {
    const t = skillInput.trim();
    if (t && !profile.skills_sought.includes(t)) {
      setProfile({ ...profile, skills_sought: [...profile.skills_sought, t] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setProfile({ ...profile, skills_sought: profile.skills_sought.filter((s) => s !== skill) });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await profilesApi.upsertOrganizationProfile({
        organization_name: profile.organization_name,
        description: profile.description,
        industry: profile.industry,
        size: profile.size,
        skills_sought: profile.skills_sought,
        contact_email: profile.contact_email || undefined,
      });
      setProfile(res.data);
      setNotFound(false);
      toast.success('Organization profile saved!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {notFound && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-3">
          No organization profile yet. Fill in the fields below to create one.
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Organization Name</label>
        <input
          required
          value={profile.organization_name}
          onChange={(e) => setProfile({ ...profile, organization_name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Industry</label>
        <input
          value={profile.industry}
          onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="e.g. technology, healthcare, finance"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          rows={3}
          value={profile.description}
          onChange={(e) => setProfile({ ...profile, description: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Organization Size</label>
        <select
          value={profile.size}
          onChange={(e) => setProfile({ ...profile, size: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="startup">Startup</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Skills Sought</label>
        <div className="flex gap-2 mt-1">
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            placeholder="Add skill"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2"
          />
          <button type="button" onClick={addSkill} className="bg-gray-200 px-4 py-2 rounded-md text-sm">Add</button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {profile.skills_sought.map((skill) => (
            <span key={skill} className="text-sm bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded flex items-center gap-1">
              {skill}
              <button type="button" onClick={() => removeSkill(skill)} className="text-indigo-400 hover:text-indigo-600">&times;</button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Contact Email</label>
        <input
          type="email"
          value={profile.contact_email || ''}
          onChange={(e) => setProfile({ ...profile, contact_email: e.target.value || null })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="hiring@yourcompany.com"
        />
        <p className="text-xs text-gray-500 mt-1">Shared when an application is accepted. Leave blank to use your account email.</p>
      </div>

      <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Organization Profile'}
      </button>
    </form>
  );
}

export { OrganizationProfileForm as CompanyProfileForm };
