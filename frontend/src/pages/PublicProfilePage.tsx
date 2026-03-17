import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { profilesApi, type IndividualProfile, type OrganizationProfile } from '../api/profiles';
import { PublicIndividualProfile, PublicOrganizationProfile } from '../components/profiles/PublicProfile';

export function PublicProfilePage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [individualProfile, setIndividualProfile] = useState<IndividualProfile | null>(null);
  const [orgProfile, setOrgProfile] = useState<OrganizationProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !type) return;
    if (type === 'individual') {
      profilesApi.getPublicIndividualProfile(id).then((r) => setIndividualProfile(r.data)).catch(() => setError('Profile not found'));
    } else {
      profilesApi.getPublicOrganizationProfile(id).then((r) => setOrgProfile(r.data)).catch(() => setError('Profile not found'));
    }
  }, [type, id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!individualProfile && !orgProfile) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {type === 'individual' ? 'Individual' : 'Organization'} Profile
      </h1>
      {individualProfile && <PublicIndividualProfile profile={individualProfile} />}
      {orgProfile && <PublicOrganizationProfile profile={orgProfile} />}
    </div>
  );
}
