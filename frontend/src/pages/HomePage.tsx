import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

export function HomePage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold text-gray-900">
        Real internships.<br />Real experience.
      </h1>
      <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
        DevStage connects junior developers with companies offering paid internships
        with clear, measurable outcome criteria. Stop paying for fake courses &mdash;
        invest in real experience.
      </p>

      <div className="flex justify-center gap-4 mt-8">
        <Link
          to="/developers"
          className="bg-indigo-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          Browse Developer Listings
        </Link>
        {isAuthenticated ? (
          <Link
            to="/companies"
            className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-md text-sm font-medium hover:bg-indigo-50"
          >
            Browse Company Listings
          </Link>
        ) : (
          <Link
            to="/register"
            className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-md text-sm font-medium hover:bg-indigo-50"
          >
            Get Started
          </Link>
        )}
      </div>

      <div className="grid grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto text-left">
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">For Developers</h3>
          <p className="text-sm text-gray-600">
            Pay for real project experience with mentorship, not fake resume padding.
            Get an objective review that proves your skills.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">For Companies</h3>
          <p className="text-sm text-gray-600">
            Monetize your mentorship. Find motivated juniors willing to invest in
            their growth. Hire the best ones.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">Outcome Criteria</h3>
          <p className="text-sm text-gray-600">
            Every internship has measurable goals. No ambiguity &mdash; clear
            expectations and transparent results.
          </p>
        </div>
      </div>
    </div>
  );
}
