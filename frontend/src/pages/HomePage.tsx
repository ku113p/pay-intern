import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFeed, useMyListings } from '../hooks/useListings';
import { ListingCard } from '../components/listings/ListingCard';
import { Header } from '../components/layout/Header';
import { LandingPage } from '../components/landing/LandingPage';
import type { UserResponse } from '../api/profiles';
import { useAuthStore } from '../stores/auth';

function Dashboard({ user }: { user: UserResponse }) {
  const activeRole = useAuthStore((s) => s.activeRole);
  const { data: myListings } = useMyListings();
  const { data: feed } = useFeed({ per_page: 4 });

  const needsProfile = !user.has_individual_profile && !user.has_organization_profile;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4">
        <div className="py-8 space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {user.display_name}!
            </h1>
            {activeRole && (
              <span
                className={`inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded ${
                  activeRole === 'organization'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {activeRole}
              </span>
            )}
          </div>

          {needsProfile && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-amber-800">Set up your profile</p>
                <p className="text-sm text-amber-600">
                  Create an individual or organization profile to get started
                </p>
              </div>
              <Link
                to="/profile"
                className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-700 whitespace-nowrap"
              >
                Set Up Profile
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              to="/browse"
              className="border border-gray-200 rounded-lg p-4 text-center hover:border-primary-300 hover:shadow-sm transition"
            >
              <p className="text-sm font-medium text-gray-900">Browse Listings</p>
            </Link>
            <Link
              to="/listings/new"
              className="border border-gray-200 rounded-lg p-4 text-center hover:border-primary-300 hover:shadow-sm transition"
            >
              <p className="text-sm font-medium text-gray-900">Post a Listing</p>
            </Link>
            <Link
              to="/applications"
              className="border border-gray-200 rounded-lg p-4 text-center hover:border-primary-300 hover:shadow-sm transition"
            >
              <p className="text-sm font-medium text-gray-900">My Applications</p>
            </Link>
            <Link
              to="/profile"
              className="border border-gray-200 rounded-lg p-4 text-center hover:border-primary-300 hover:shadow-sm transition"
            >
              <p className="text-sm font-medium text-gray-900">My Profile</p>
            </Link>
          </div>

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
                    <ListingCard listing={listing} currentUserId={user.id} />
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
                  className="bg-primary-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
                >
                  Create Your First Listing
                </Link>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Loading...</p>
            )}
          </section>

          {feed?.data && feed.data.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Listings
              </h2>
              <div className="space-y-3">
                {feed.data.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} currentUserId={user.id} />
                ))}
              </div>
              <div className="text-center mt-4">
                <Link to="/browse" className="text-sm text-primary-600 hover:text-primary-800">
                  View all listings →
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export function HomePage() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return <Dashboard user={user} />;
  }

  return <LandingPage />;
}
