import type { OutcomeReview } from '../../api/reviews';

const recommendationLabels: Record<string, { label: string; color: string }> = {
  ready_to_hire: { label: 'Ready to Hire', color: 'bg-green-100 text-green-700' },
  needs_practice: { label: 'Needs More Practice', color: 'bg-yellow-100 text-yellow-700' },
  not_recommended: { label: 'Not Recommended', color: 'bg-red-100 text-red-700' },
};

const resultColors: Record<string, string> = {
  pass: 'text-green-600',
  partial: 'text-yellow-600',
  fail: 'text-red-600',
};

export function ReviewDisplay({ review }: { review: OutcomeReview }) {
  const rec = recommendationLabels[review.overall_recommendation] || {
    label: review.overall_recommendation,
    color: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
        <h3 className="font-semibold text-gray-900">Outcome Review</h3>
        <span className={`text-sm font-medium px-3 py-1 rounded ${rec.color}`}>
          {rec.label}
        </span>
      </div>

      <div className="space-y-2">
        {review.criteria_results.map((cr, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">{cr.criterion}</span>
            <span className={`font-medium capitalize ${resultColors[cr.result] || ''}`}>
              {cr.result}
            </span>
          </div>
        ))}
      </div>

      {review.comment && (
        <div>
          <p className="text-sm text-gray-500 font-medium">Comment</p>
          <p className="text-sm text-gray-700 mt-1">{review.comment}</p>
        </div>
      )}

      {review.developer_response && (
        <div className="bg-gray-50 rounded p-3">
          <p className="text-sm text-gray-500 font-medium">Developer Response</p>
          <p className="text-sm text-gray-700 mt-1">{review.developer_response}</p>
        </div>
      )}

      <p className="text-xs text-gray-400">
        {new Date(review.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
