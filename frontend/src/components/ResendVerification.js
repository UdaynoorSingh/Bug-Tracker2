// components/ResendVerification.js
import { useState } from 'react';
import axios from 'axios';

export default function ResendVerification({ email }) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResend = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const response = await axios.post('/api/auth/resend-verification', { email });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 border rounded-lg bg-blue-50">
      <p className="text-sm text-gray-600">
        Didn't receive the email? 
        <button 
          onClick={handleResend}
          disabled={isLoading}
          className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          {isLoading ? 'Sending...' : 'Resend Verification Email'}
        </button>
      </p>
      {message && (
        <p className={`mt-2 text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}