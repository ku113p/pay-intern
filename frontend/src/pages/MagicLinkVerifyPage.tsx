import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/auth';

export function MagicLinkVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [error, setError] = useState('');
  const verifyInitiated = useRef(false);

  useEffect(() => {
    if (verifyInitiated.current) return;
    verifyInitiated.current = true;

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      setError('Invalid magic link');
      return;
    }

    authApi
      .verifyMagicLink(email, token)
      .then((res) => {
        setTokens(res.data.access_token, res.data.refresh_token);
        navigate('/');
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Verification failed');
      });
  }, [searchParams, navigate, setTokens]);

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Verifying...</h1>
      <p className="text-gray-500">Please wait while we verify your magic link.</p>
    </div>
  );
}
