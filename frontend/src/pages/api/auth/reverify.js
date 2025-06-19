// pages/api/auth/reverify.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const backendResponse = await axios.post(
      `https://bug-tracker2-1.onrender.com/api/auth/reverify`,
      req.body
    );
    res.status(backendResponse.status).json(backendResponse.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Internal server error'
    });
  }
}