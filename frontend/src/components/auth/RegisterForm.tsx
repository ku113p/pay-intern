import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../stores/auth';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'developer' | 'company'>('developer');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [devLink, setDevLink] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await authApi.requestMagicLink(email, role);
      setMagicLinkSent(true);
      if (res.data.dev_link) {
        setDevLink(res.data.dev_link);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleDevVerify = async () => {
    try {
      const url = new URL(devLink);
      const token = url.searchParams.get('token') || '';
      const emailParam = url.searchParams.get('email') || '';
      const res = await authApi.verifyMagicLink(emailParam, token);
      setTokens(res.data.access_token, res.data.refresh_token);
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    }
  };

  if (magicLinkSent) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800">Magic link sent to {email}!</p>
        </div>
        {devLink && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-yellow-800 text-sm font-medium">Dev mode: Click to verify</p>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setRole('developer')}
            className={`flex-1 py-3 rounded-md border text-sm font-medium ${
              role === 'developer'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            Developer
          </button>
          <button
            type="button"
            onClick={() => setRole('company')}
            className={`flex-1 py-3 rounded-md border text-sm font-medium ${
              role === 'company'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            Company
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          id="reg-email"
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
        Sign up
      </button>
    </form>
  );
}
