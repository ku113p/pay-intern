import { useState, useEffect } from 'react';
import { profilesApi, type CompanyProfile } from '../../api/profiles';

export function CompanyProfileForm() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [techInput, setTechInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    profilesApi.getMyCompanyProfile().then((r) => setProfile(r.data)).catch(() => {});
  }, []);

  if (!profile) return <p className="text-gray-500">Loading profile...</p>;

  const addTech = () => {
    const t = techInput.trim();
    if (t && !profile.tech_stack.includes(t)) {
      setProfile({ ...profile, tech_stack: [...profile.tech_stack, t] });
      setTechInput('');
    }
  };

  const removeTech = (tech: string) => {
    setProfile({ ...profile, tech_stack: profile.tech_stack.filter((t) => t !== tech) });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    setSaved(false);
    try {
      const res = await profilesApi.updateCompanyProfile({
        company_name: profile.company_name,
        description: profile.description,
        website: profile.website || undefined,
        size: profile.size,
        tech_stack: profile.tech_stack,
      });
      setProfile(res.data);
      setSaved(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {saved && <p className="text-green-600 text-sm">Profile saved!</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700">Company Name</label>
        <input
          required
          value={profile.company_name}
          onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
        <label className="block text-sm font-medium text-gray-700">Company Size</label>
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
        <label className="block text-sm font-medium text-gray-700">Website</label>
        <input
          value={profile.website || ''}
          onChange={(e) => setProfile({ ...profile, website: e.target.value || null })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="https://yourcompany.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tech Stack</label>
        <div className="flex gap-2 mt-1">
          <input
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
            placeholder="Add technology"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2"
          />
          <button type="button" onClick={addTech} className="bg-gray-200 px-4 py-2 rounded-md text-sm">Add</button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {profile.tech_stack.map((tech) => (
            <span key={tech} className="text-sm bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded flex items-center gap-1">
              {tech}
              <button type="button" onClick={() => removeTech(tech)} className="text-indigo-400 hover:text-indigo-600">&times;</button>
            </span>
          ))}
        </div>
      </div>

      <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}
