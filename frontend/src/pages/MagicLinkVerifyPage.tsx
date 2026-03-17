import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/auth';
import { getApiErrorMessage } from '../lib/errors';

export function MagicLinkVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [error, setError] = useState('');
  const verifyInitiated = useRef(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const missingParams = !token || !email;

  useEffect(() => {
    if (missingParams || verifyInitiated.current) return;
    verifyInitiated.current = true;

    authApi
      .verifyMagicLink(email, token)
      .then((res) => {
        setTokens(res.data.access_token, res.data.refresh_token);
        navigate('/');
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, 'Verification failed'));
      });
  }, [missingParams, email, token, navigate, setTokens]);

  if (missingParams) {
    return (
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h1>
        <p className="text-red-600">Invalid magic link</p>
      </div>
    );
  }

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
