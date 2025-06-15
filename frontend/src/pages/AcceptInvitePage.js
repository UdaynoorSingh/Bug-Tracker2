// src/pages/AcceptInvitePage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../API_URL';

const AcceptInvitePage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Processing invitation...');

    useEffect(() => {
        const authToken = localStorage.getItem('token');

        if (!authToken) {
            // Save token and redirect to login
            localStorage.setItem('pendingInviteToken', token);
            setStatus('Redirecting to login...');
            setTimeout(() => navigate('/login'), 1500);
            return;
        }

        const acceptInvite = async () => {
            try {
                const res = await axios.post(
                    `${API_URL}/accept-invite/${token}`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                        },
                    }
                );

                setStatus(res.data.message);
                localStorage.removeItem('pendingInviteToken');
                setTimeout(() => navigate('/'), 2000);
            } catch (error) {
                console.error(error);
                setStatus(
                    error.response?.data?.message || 'Something went wrong.'
                );
            }
        };

        acceptInvite();
    }, [token, navigate]);

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Accepting Invitation</h2>
            <p>{status}</p>
        </div>
    );
};

export default AcceptInvitePage;
