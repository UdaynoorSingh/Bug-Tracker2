import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtVerify } from 'jose';
import API_URL from '../API_URL';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            checkAuth();
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuth = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/auth/me`);
            setCurrentUser(response.data.user);
        } catch (error) {
            console.error('Auth check failed:', error);
            handleAuthError();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, {
                email,
                password,
            });
            handleLoginSuccess(response.data);
            return response.data.user;
        } catch (error) {
            console.error('Login failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to login');
        }
    };

    const loginWithToken = async (token) => {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid token structure');
            }
            
            const payload = JSON.parse(atob(parts[1]));
            if (!payload.userId) {
                throw new Error('Invalid token payload');
            }

            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            const response = await axios.get(`${API_URL}/api/auth/me`);
            setCurrentUser(response.data.user);
            
            return true;
        } catch (error) {
            console.error('Token login failed:', error);
            handleAuthError();
            throw error;
        }
    };

    const verifyToken = async (token) => {
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET);
            const { payload } = await jwtVerify(token, secret);
            return payload;
        } catch (error) {
            console.error('Token verification failed:', error);
            throw error;
        }
    };

    const register = async (name, email, password) => {
        try {
            const response = await axios.post(`${API_URL}/api/auth/register`, {
                name,
                email,
                password,
            });
            return response.data.message; 
        } catch (error) {
            console.error('Registration failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to register');
        }
    };

    const logout = () => {
        handleAuthError();
    };

    const handleLoginSuccess = (data) => {
        localStorage.setItem('token', data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        setCurrentUser(data.user);
    };

    const handleAuthError = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setCurrentUser(null);
    };

    const value = {
        currentUser,
        loading,
        login,
        loginWithToken,
        verifyToken, 
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};