import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useDeveloperFeed, useCompanyFeed, useMyListings } from '../hooks/useListings';
import { ListingCard } from '../components/listings/ListingCard';
import { profilesApi, type UserResponse } from '../api/profiles';

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
            Your Listings{myListings ? ` (${myListings.length})` : ''}
          </h2>
        </div>
        {myListings && myListings.length > 0 ? (
          <div className="space-y-3">
            {myListings.slice(0, 3).map((listing) => (
              <div key={listing.id} className="relative">
                {listing.status !== 'active' && (
                  <div className="absolute inset-0 bg-gray-50/60 rounded-lg z-10 pointer-events-none" />
                )}
                <ListingCard listing={listing} currentUserId={user.id} />
              </div>
            ))}
            {myListings.length > 3 && (
              <p className="text-sm text-gray-500 text-center pt-1">
                and {myListings.length - 3} more
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
              <ListingCard key={listing.id} listing={listing} currentUserId={user.id} />
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
  );
}

// ── Marketing Home (logged-out) ────────────────────────────────────────

function DeveloperHero() {
  return (
    <div className="mt-8 max-w-3xl mx-auto text-center">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
        You can't get hired without experience.<br />
        You can't get experience without getting hired.<br />
        <span className="text-indigo-600">We fixed that.</span>
      </h1>
      <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
        DevStage connects developers with real companies for structured,
        mentored engagements &mdash; production code, dedicated mentorship,
        and measurable outcomes you can prove to your next employer.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-8">
        <Link
          to="/developers"
          className="bg-indigo-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-indigo-700 text-center"
        >
          Browse Company Listings
        </Link>
        <Link
          to="/listings/new"
          className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-md text-sm font-medium hover:bg-indigo-50 text-center"
        >
          Post a Developer Listing
        </Link>
      </div>
    </div>
  );
}

function CompanyHero() {
  return (
    <div className="mt-8 max-w-3xl mx-auto text-center">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
        Stop paying to find developers.<br />
        <span className="text-indigo-600">Get paid to evaluate them.</span>
      </h1>
      <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
        Browse motivated developers ready to invest in their growth.
        Or post listings with structured outcomes and attract
        self-selected candidates.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-8">
        <Link
          to="/companies"
          className="bg-indigo-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-indigo-700 text-center"
        >
          Browse Developer Listings
        </Link>
        <Link
          to="/listings/new"
          className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-md text-sm font-medium hover:bg-indigo-50 text-center"
        >
          Post a Company Listing
        </Link>
      </div>
    </div>
  );
}

function DefaultHero() {
  return (
    <div className="mt-8 max-w-3xl mx-auto text-center">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
        Real experience. Real proof.
      </h1>
      <p className="text-lg text-gray-600 mt-4">
        Choose your role above to get started.
      </p>
    </div>
  );
}

const devSteps = [
  { title: 'Browse', desc: 'Find company listings with clear outcome criteria and dedicated mentors.' },
  { title: 'Work', desc: 'Spend 4-12 weeks embedded in a real team, shipping real code.' },
  { title: 'Prove', desc: 'Graduate with verified outcomes, merged PRs, and references.' },
];

const companySteps = [
  { title: 'Post', desc: 'Define outcome criteria, tech stack, and project scope. Or browse developer profiles.' },
  { title: 'Mentor', desc: '5-10 hrs/week per developer. Structured milestones and code review.' },
  { title: 'Hire', desc: 'Every engagement is a working interview. Hire the ones who deliver.' },
];

const defaultSteps = [
  { title: 'For Developers', desc: 'Invest in structured, mentored experience with real companies. Prove what you can do.' },
  { title: 'For Companies', desc: 'Monetize mentorship. Find motivated developers willing to invest in their growth.' },
  { title: 'Outcome Criteria', desc: 'Every engagement has measurable goals. No ambiguity — clear expectations and transparent results.' },
];

function HowItWorks({ role }: { role: 'developer' | 'company' | null }) {
  const steps = role === 'developer' ? devSteps : role === 'company' ? companySteps : defaultSteps;
  return (
    <section className="mt-16 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 text-center mb-8">
        {role ? 'How It Works' : 'Two Sides, One Marketplace'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 text-left">
        {steps.map((step, i) => (
          <div key={i} className="space-y-2">
            <h3 className="font-semibold text-gray-900">
              {role && <span className="text-indigo-600 mr-1">{i + 1}.</span>}
              {step.title}
            </h3>
            <p className="text-sm text-gray-600">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarketingHome() {
  const [role, setRole] = useState<'developer' | 'company' | null>(null);
  const { data: preview } = useDeveloperFeed({ per_page: 4 });

  return (
    <div className="py-12">
      <p className="text-center text-sm font-medium text-indigo-600 tracking-wide uppercase">
        The two-sided developer marketplace
      </p>

      <div className="flex justify-center gap-2 mt-6">
        <button
          onClick={() => setRole('developer')}
          className={`px-6 py-2.5 rounded-md text-sm font-medium border transition ${
            role === 'developer'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
          }`}
        >
          I'm a Developer
        </button>
        <button
          onClick={() => setRole('company')}
          className={`px-6 py-2.5 rounded-md text-sm font-medium border transition ${
            role === 'company'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
          }`}
        >
          I'm a Company
        </button>
      </div>

      {role === 'developer' && <DeveloperHero />}
      {role === 'company' && <CompanyHero />}
      {!role && <DefaultHero />}

      <p className="text-center text-sm text-gray-400 mt-8">
        Not a bootcamp. Not a job board. Real work with real teams.
      </p>

      <HowItWorks role={role} />

      {preview?.data && preview.data.length > 0 && (
        <section className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Listings</h2>
          <div className="space-y-3">
            {preview.data.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          <div className="text-center mt-4">
            <Link to="/developers" className="text-sm text-indigo-600 hover:text-indigo-800">
              View all listings →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

// ── Router entry point ─────────────────────────────────────────────────

export function HomePage() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return <Dashboard user={user} />;
  }

  return <MarketingHome />;
}
