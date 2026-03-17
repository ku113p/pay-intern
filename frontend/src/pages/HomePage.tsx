import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useDeveloperFeed, useCompanyFeed, useMyListings } from '../hooks/useListings';
import { ListingCard } from '../components/listings/ListingCard';
import { profilesApi, type UserResponse } from '../api/profiles';
import { Header } from '../components/layout/Header';
import { LandingPage } from '../components/landing/LandingPage';

// ── Dashboard (logged-in) ──────────────────────────────────────────────

function Dashboard({ user }: { user: UserResponse }) {
  const { data: myListings } = useMyListings();
  const { data: devFeed } = useDeveloperFeed({ per_page: 4 });
  const { data: companyFeed } = useCompanyFeed({ per_page: 4 });

  const devProfile = useQuery({
    queryKey: ['profile', 'developer', 'me'],
    queryFn: () => profilesApi.getMyDeveloperProfile().then((r) => r.data),
    enabled: user.role === 'developer',
  });
  const companyProfile = useQuery({
    queryKey: ['profile', 'company', 'me'],
    queryFn: () => profilesApi.getMyCompanyProfile().then((r) => r.data),
    enabled: user.role === 'company',
  });

  const profileComplete =
    user.role === 'developer'
      ? !!(devProfile.data?.bio && devProfile.data.tech_stack.length > 0)
      : !!(companyProfile.data?.company_name && companyProfile.data.description);
  const profileLoading = user.role === 'developer' ? devProfile.isLoading : companyProfile.isLoading;

  const feed = user.role === 'developer' ? devFeed : companyFeed;
  const feedLink = user.role === 'developer' ? '/developers' : '/companies';
  const feedLabel = user.role === 'developer' ? 'Company' : 'Developer';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4">
        <div className="py-8 space-y-8">
          {/* Greeting */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {user.display_name}!
            </h1>
            <span
              className={`inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded ${
                user.role === 'developer'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {user.role}
            </span>
          </div>

          {/* Profile completion banner */}
          {!profileLoading && !profileComplete && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-amber-800">Your profile is incomplete</p>
                <p className="text-sm text-amber-600">
                  Complete it to attract more attention from {user.role === 'developer' ? 'companies' : 'developers'}
                </p>
              </div>
              <Link
                to="/profile"
                className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-700 whitespace-nowrap"
              >
                Complete Profile
              </Link>
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              to={feedLink}
              className="border border-gray-200 rounded-lg p-4 text-center hover:border-indigo-300 hover:shadow-sm transition"
            >
              <p className="text-sm font-medium text-gray-900">Browse {feedLabel} Listings</p>
            </Link>
            <Link
              to="/listings/new"
              className="border border-gray-200 rounded-lg p-4 text-center hover:border-indigo-300 hover:shadow-sm transition"
            >
              <p className="text-sm font-medium text-gray-900">Post a Listing</p>
            </Link>
            <Link
              to="/applications"
              className="border border-gray-200 rounded-lg p-4 text-center hover:border-indigo-300 hover:shadow-sm transition"
            >
              <p className="text-sm font-medium text-gray-900">My Applications</p>
            </Link>
            <Link
              to="/profile"
              className="border border-gray-200 rounded-lg p-4 text-center hover:border-indigo-300 hover:shadow-sm transition"
            >
              <p className="text-sm font-medium text-gray-900">My Profile</p>
            </Link>
          </div>

          {/* Your Listings */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Listings{myListings ? ` (${myListings.pagination.total})` : ''}
              </h2>
            </div>
            {myListings && myListings.data.length > 0 ? (
              <div className="space-y-3">
                {myListings.data.slice(0, 3).map((listing: typeof myListings.data[number]) => (
                  <div key={listing.id} className="relative">
                    {listing.status !== 'active' && (
                      <div className="absolute inset-0 bg-gray-50/60 rounded-lg z-10 pointer-events-none" />
                    )}
                    <ListingCard listing={listing} currentUserId={user.id} currentUserRole={user.role} />
                  </div>
                ))}
                {myListings.pagination.total > 3 && (
                  <p className="text-sm text-gray-500 text-center pt-1">
                    and {myListings.pagination.total - 3} more
                  </p>
                )}
              </div>
            ) : myListings ? (
              <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500 mb-3">You haven't posted any listings yet.</p>
                <Link
                  to="/listings/new"
                  className="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Create Your First Listing
                </Link>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Loading...</p>
            )}
          </section>

          {/* Recommended feed */}
          {feed?.data && feed.data.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recommended {feedLabel} Listings
              </h2>
              <div className="space-y-3">
                {feed.data.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} currentUserId={user.id} currentUserRole={user.role} />
                ))}
              </div>
              <div className="text-center mt-4">
                <Link to={feedLink} className="text-sm text-indigo-600 hover:text-indigo-800">
                  View all {feedLabel.toLowerCase()} listings →
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Router entry point ─────────────────────────────────────────────────

export function HomePage() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return <Dashboard user={user} />;
  }

  return <LandingPage />;
}
