import type { DeveloperProfile, CompanyProfile } from '../../api/profiles';

export function PublicDeveloperProfile({ profile }: { profile: DeveloperProfile }) {
  return (
    <div className="space-y-4">
      <p className="text-gray-700">{profile.bio || 'No bio yet.'}</p>

      <div>
        <span className="text-sm font-medium text-gray-500">Level: </span>
        <span className="text-sm text-gray-700 capitalize">{profile.level}</span>
      </div>

      {profile.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {profile.tech_stack.map((tech) => (
            <span key={tech} className="text-sm bg-gray-100 text-gray-700 px-2.5 py-1 rounded">
              {tech}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-4 text-sm">
        {profile.github_url && (
          <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
            GitHub
          </a>
        )}
        {profile.linkedin_url && (
          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
            LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}

export function PublicCompanyProfile({ profile }: { profile: CompanyProfile }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">{profile.company_name}</h2>
      <p className="text-gray-700">{profile.description || 'No description yet.'}</p>

      <div className="flex gap-4 text-sm text-gray-500">
        <span>Size: <span className="capitalize">{profile.size}</span></span>
        {profile.website && (
          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
            Website
          </a>
        )}
      </div>

      {profile.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {profile.tech_stack.map((tech) => (
            <span key={tech} className="text-sm bg-gray-100 text-gray-700 px-2.5 py-1 rounded">
              {tech}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
