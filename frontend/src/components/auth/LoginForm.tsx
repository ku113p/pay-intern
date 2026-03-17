import { useState } from 'react';
import { toast } from 'sonner';
import { authApi } from '../../api/auth';
import { getApiErrorMessage } from '../../lib/errors';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.requestMagicLink(email);
      setMagicLinkSent(true);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to send magic link'));
    } finally {
      setLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800">Magic link sent to {email}!</p>
          <p className="text-green-600 text-sm mt-1">Check your email and click the link to sign in.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="you@example.com"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send magic link'}
      </button>
      <p className="text-xs text-gray-500 text-center">
        Sign in or create an account. You can set up your profile after signing in.
      </p>
    </form>
  );
}
