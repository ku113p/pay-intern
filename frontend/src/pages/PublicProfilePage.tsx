import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { profilesApi, type DeveloperProfile, type CompanyProfile } from '../api/profiles';
import { PublicDeveloperProfile, PublicCompanyProfile } from '../components/profiles/PublicProfile';

export function PublicProfilePage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [devProfile, setDevProfile] = useState<DeveloperProfile | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !type) return;
    if (type === 'developer') {
      profilesApi.getPublicDeveloperProfile(id).then((r) => setDevProfile(r.data)).catch(() => setError('Profile not found'));
    } else {
      profilesApi.getPublicCompanyProfile(id).then((r) => setCompanyProfile(r.data)).catch(() => setError('Profile not found'));
    }
  }, [type, id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!devProfile && !companyProfile) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {type === 'developer' ? 'Developer' : 'Company'} Profile
      </h1>
      {devProfile && <PublicDeveloperProfile profile={devProfile} />}
      {companyProfile && <PublicCompanyProfile profile={companyProfile} />}
    </div>
  );
}
