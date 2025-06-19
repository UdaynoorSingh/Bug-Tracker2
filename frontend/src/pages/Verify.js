import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        if (!token) {
          throw new Error('Missing verification token');
        }

        const response = await fetch(`bug-tracker2.vercel.app/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Verification failed');
        }

        // If using token in URL
        if (token) {
          await loginWithToken(token);
        }

        navigate('/dashboard');
      } catch (error) {
        console.error('Verification error:', error);
        navigate('/verify-error', { state: { error: error.message } });
      }
    };

    verifyEmail();
  }, [token, navigate, loginWithToken]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Verifying your email...</h1>
        <p>Please wait while we verify your email address.</p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;