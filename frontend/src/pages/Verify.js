// pages/VerifyEmailPage.js
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Verifying...');
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:5000/api/auth/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        setMessage(data.message);
        setTimeout(() => navigate('/login'), 3000);
      })
      .catch(() => setMessage('Verification failed'));
  }, [token, navigate]);

  return <div>{message}</div>;
};

export default VerifyEmailPage;