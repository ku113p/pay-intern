import { useState } from 'react';
import { reviewsApi, type CriterionResult } from '../../api/reviews';
import { getApiErrorMessage } from '../../lib/errors';

interface Props {
  applicationId: string;
  criteria: string[];
  onCreated: () => void;
}

export function ReviewForm({ applicationId, criteria, onCreated }: Props) {
  const [results, setResults] = useState<CriterionResult[]>(
    criteria.map((c) => ({ criterion: c, result: 'pass' as const }))
  );
  const [recommendation, setRecommendation] = useState('ready_to_hire');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateResult = (index: number, result: 'pass' | 'partial' | 'fail') => {
    const updated = [...results];
    updated[index] = { ...updated[index], result };
    setResults(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await reviewsApi.create({
        application_id: applicationId,
        criteria_results: results,
        overall_recommendation: recommendation,
        comment: comment || undefined,
      });
      onCreated();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to create review'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Criteria Results</h4>
        {results.map((cr, i) => (
          <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2 bg-gray-50 rounded p-3">
            <span className="text-sm text-gray-700">{cr.criterion}</span>
            <select
              value={cr.result}
              onChange={(e) => updateResult(i, e.target.value as 'pass' | 'partial' | 'fail')}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="pass">Pass</option>
              <option value="partial">Partial</option>
              <option value="fail">Fail</option>
            </select>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Overall Recommendation</label>
        <select
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="ready_to_hire">Ready to Hire</option>
          <option value="needs_practice">Needs More Practice</option>
          <option value="not_recommended">Not Recommended</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Comment</label>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
