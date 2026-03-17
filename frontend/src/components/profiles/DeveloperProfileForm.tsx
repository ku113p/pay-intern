import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../../lib/errors';
import { profilesApi, type IndividualProfile } from '../../api/profiles';

export function IndividualProfileForm() {
  const [profile, setProfile] = useState<IndividualProfile | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    profilesApi.getMyIndividualProfile()
      .then((r) => setProfile(r.data))
      .catch(() => {
        setNotFound(true);
        setProfile({
          user_id: '',
          bio: '',
          headline: '',
          profession: '',
          skills: [],
          experience_level: 'entry',
          contact_email: null,
          links: [],
        });
      });
  }, []);

  if (!profile) return <p className="text-gray-500">Loading profile...</p>;

  const addSkill = () => {
    const t = skillInput.trim();
    if (t && !profile.skills.includes(t)) {
      setProfile({ ...profile, skills: [...profile.skills, t] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setProfile({ ...profile, skills: profile.skills.filter((s) => s !== skill) });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await profilesApi.upsertIndividualProfile({
        bio: profile.bio,
        headline: profile.headline,
        profession: profile.profession,
        skills: profile.skills,
        experience_level: profile.experience_level,
        contact_email: profile.contact_email || undefined,
      });
      setProfile(res.data);
      setNotFound(false);
      toast.success('Individual profile saved!');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to save profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {notFound && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-3">
          No individual profile yet. Fill in the fields below to create one.
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Headline</label>
        <input
          value={profile.headline}
          onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="e.g. Full-Stack Developer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Profession</label>
        <input
          value={profile.profession}
          onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="e.g. software_engineering, design, marketing"
        />
      </div>

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
        <label className="block text-sm font-medium text-gray-700">Experience Level</label>
        <select
          value={profile.experience_level}
          onChange={(e) => setProfile({ ...profile, experience_level: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="entry">Entry</option>
          <option value="mid">Mid</option>
          <option value="senior">Senior</option>
          <option value="expert">Expert</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Skills</label>
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
          {profile.skills.map((skill) => (
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
          placeholder="work@example.com"
        />
        <p className="text-xs text-gray-500 mt-1">Shared when an application is accepted. Leave blank to use your account email.</p>
      </div>

      <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Individual Profile'}
      </button>
    </form>
  );
}

export { IndividualProfileForm as DeveloperProfileForm };
