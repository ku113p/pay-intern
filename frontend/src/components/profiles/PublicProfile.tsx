import type { IndividualProfile, OrganizationProfile } from '../../api/profiles';

export function PublicIndividualProfile({ profile }: { profile: IndividualProfile }) {
  return (
    <div className="space-y-4">
      {profile.headline && (
        <p className="text-lg font-medium text-gray-800">{profile.headline}</p>
      )}
      <p className="text-gray-700">{profile.bio || 'No bio yet.'}</p>

      <div className="flex gap-4 text-sm text-gray-500">
        {profile.profession && <span>Profession: <span className="capitalize">{profile.profession}</span></span>}
        <span>Level: <span className="capitalize">{profile.experience_level}</span></span>
      </div>

      {profile.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {profile.skills.map((skill) => (
            <span key={skill} className="text-sm bg-gray-100 text-gray-700 px-2.5 py-1 rounded">
              {skill}
            </span>
          ))}
        </div>
      )}

      {profile.links.length > 0 && (
        <div className="flex gap-4 text-sm">
          {profile.links.map((link) => (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
              {link.label || link.link_type}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function PublicOrganizationProfile({ profile }: { profile: OrganizationProfile }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">{profile.organization_name}</h2>
      <p className="text-gray-700">{profile.description || 'No description yet.'}</p>

      <div className="flex gap-4 text-sm text-gray-500">
        {profile.industry && <span>Industry: <span className="capitalize">{profile.industry}</span></span>}
        <span>Size: <span className="capitalize">{profile.size}</span></span>
      </div>

      {profile.skills_sought.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {profile.skills_sought.map((skill) => (
            <span key={skill} className="text-sm bg-gray-100 text-gray-700 px-2.5 py-1 rounded">
              {skill}
            </span>
          ))}
        </div>
      )}

      {profile.links.length > 0 && (
        <div className="flex gap-4 text-sm">
          {profile.links.map((link) => (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
              {link.label || link.link_type}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export { PublicIndividualProfile as PublicDeveloperProfile };
export { PublicOrganizationProfile as PublicCompanyProfile };
