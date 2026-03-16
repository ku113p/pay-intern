import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { profilesApi, type DeveloperProfile } from '../../api/profiles';

export function DeveloperProfileForm() {
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [techInput, setTechInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    profilesApi.getMyDeveloperProfile().then((r) => setProfile(r.data)).catch(() => {});
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
    setSaving(true);
    try {
      const res = await profilesApi.updateDeveloperProfile({
        bio: profile.bio,
        tech_stack: profile.tech_stack,
        github_url: profile.github_url || undefined,
        linkedin_url: profile.linkedin_url || undefined,
        level: profile.level,
      });
      setProfile(res.data);
      toast.success('Profile saved!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700">Bio</label>
        <textarea
          rows={3}
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Level</label>
        <select
          value={profile.level}
          onChange={(e) => setProfile({ ...profile, level: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="junior">Junior</option>
          <option value="mid">Mid</option>
          <option value="senior">Senior</option>
        </select>
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

      <div>
        <label className="block text-sm font-medium text-gray-700">GitHub URL</label>
        <input
          value={profile.github_url || ''}
          onChange={(e) => setProfile({ ...profile, github_url: e.target.value || null })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="https://github.com/username"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
        <input
          value={profile.linkedin_url || ''}
          onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value || null })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="https://linkedin.com/in/username"
        />
      </div>

      <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}
