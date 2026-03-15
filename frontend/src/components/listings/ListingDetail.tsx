import { useState } from 'react';
import type { Listing } from '../../api/listings';
import { applicationsApi } from '../../api/applications';
import { useAuthStore } from '../../stores/auth';

export function ListingDetail({ listing }: { listing: Listing }) {
  const user = useAuthStore((s) => s.user);
  const isOwner = user?.id === listing.author_id;
  const canApply = user && !isOwner && user.role !== listing.listing_type;

  const [message, setMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setApplying(true);
    try {
      await applicationsApi.create(listing.id, message);
      setApplied(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
          <p className="text-gray-500 mt-1">
            {listing.duration_weeks} weeks &middot; {listing.format}
            {listing.price_usd != null && ` · $${listing.price_usd}`}
          </p>
        </div>
        <span
          className={`text-sm font-medium px-3 py-1 rounded ${
            listing.listing_type === 'company'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {listing.listing_type}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {listing.tech_stack.map((tech) => (
          <span key={tech} className="text-sm bg-gray-100 text-gray-700 px-2.5 py-1 rounded">
            {tech}
          </span>
        ))}
      </div>

      <div className="prose max-w-none">
        <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
      </div>

      {listing.outcome_criteria && listing.outcome_criteria.length > 0 && (
        <div className="bg-indigo-50 rounded-lg p-5">
          <h3 className="font-semibold text-indigo-900 mb-3">Outcome Criteria</h3>
          <ul className="space-y-2">
            {listing.outcome_criteria.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-indigo-800">
                <span className="text-indigo-400 mt-0.5">&#10003;</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {canApply && !applied && (
        <form onSubmit={handleApply} className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">Apply to this listing</h3>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <textarea
            required
            minLength={10}
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a message to introduce yourself..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={applying}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {applying ? 'Sending...' : 'Send Application'}
          </button>
        </form>
      )}

      {applied && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800">Application sent successfully!</p>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Posted {new Date(listing.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
