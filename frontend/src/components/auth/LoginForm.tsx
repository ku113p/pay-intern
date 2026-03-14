import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../stores/auth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [devLink, setDevLink] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await authApi.requestMagicLink(email, 'developer');
      setMagicLinkSent(true);
      if (res.data.dev_link) {
        setDevLink(res.data.dev_link);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send magic link');
    }
  };

  const handleDevVerify = async () => {
    try {
      const url = new URL(devLink);
      const token = url.searchParams.get('token') || '';
      const emailParam = url.searchParams.get('email') || '';
      const res = await authApi.verifyMagicLink(emailParam, token);
      setTokens(res.data.access_token, res.data.refresh_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    }
  };

  if (magicLinkSent) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800">Magic link sent to {email}!</p>
          <p className="text-green-600 text-sm mt-1">Check your email and click the link to log in.</p>
        </div>
        {devLink && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-yellow-800 text-sm font-medium">Dev mode: Click to verify instantly</p>
            <button
              onClick={handleDevVerify}
              className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700"
            >
              Verify (Dev)
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleMagicLink} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
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
        className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
      >
        Send magic link
      </button>
    </form>
  );
}
