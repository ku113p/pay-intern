import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { interestsApi } from '../api/interests';
import { useAuthStore } from '../stores/auth';

function MatchContactReveal({ userId }: { userId: string }) {
  const [revealed, setRevealed] = useState(false);

  const { data: contact, isLoading } = useQuery({
    queryKey: ['match-contact', userId],
    queryFn: () => interestsApi.getMatchContact(userId).then((r) => r.data),
    enabled: revealed,
  });

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
      .then(() => toast.success('Email copied!'))
      .catch(() => toast.error('Failed to copy email'));
  };

  if (!revealed) {
    return (
      <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
        <span className="text-sm text-green-800">Contact info available</span>
        <button
          onClick={() => setRevealed(true)}
          className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
        >
          Reveal Contact Details
        </button>
      </div>
    );
  }

  if (isLoading || !contact) {
    return (
      <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-sm text-gray-500">Loading contact info...</p>
      </div>
    );
  }

  return (
    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
      <p className="text-sm font-medium text-green-900">
        Contact Details for {contact.display_name}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Email:</span>
          <span className="text-gray-900">{contact.email}</span>
          <button
            onClick={() => copyEmail(contact.email)}
            className="text-xs text-primary-600 hover:text-primary-500 border border-primary-200 px-1.5 py-0.5 rounded"
          >
            Copy
          </button>
        </div>
        {contact.links.map((link) => (
          <div key={link.id} className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">{link.label || link.link_type}:</span>
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500">
              {link.url}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MatchesPage() {
  const activeRole = useAuthStore((s) => s.activeRole);
  const { data: matches, isLoading, error } = useQuery({
    queryKey: ['matches', activeRole],
    queryFn: () => interestsApi.getMatches().then((r) => r.data),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Matches</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Both you and the other party signaled interest</p>

      {isLoading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">Failed to load matches</p>}
      {matches?.length === 0 && (
        <p className="text-gray-500">No matches yet. Signal interest on listings in the feed to find mutual matches.</p>
      )}

      <div className="space-y-4">
        {matches?.map((match) => (
          <div
            key={`${match.my_listing_id}-${match.their_listing_id}`}
            className="bg-white rounded-lg border border-gray-200 p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-rose-500">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0}>
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </span>
              <span className="font-semibold text-gray-900">{match.matched_user_name}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-1">Your listing</p>
                <Link to={`/listings/${match.my_listing_id}`} className="text-primary-600 hover:underline">
                  {match.my_listing_title}
                </Link>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Their listing</p>
                <Link to={`/listings/${match.their_listing_id}`} className="text-primary-600 hover:underline">
                  {match.their_listing_title}
                </Link>
              </div>
            </div>

            <MatchContactReveal userId={match.matched_user_id} />

            <div className="mt-4">
              <Link
                to={`/listings/${match.their_listing_id}`}
                className="text-sm bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 inline-block"
              >
                View & Apply
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
