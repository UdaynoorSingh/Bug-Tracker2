import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { currentUser, logout } = useAuth();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/projects', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setProjects(response.data);
            setLoading(false);
        } catch (error) {
            setError('Failed to fetch projects');
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            setError('Failed to log out');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <h1 className="text-xl font-bold text-gray-900">Bug Tracker</h1>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-700 mr-4">Welcome, {currentUser?.name}</span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
                        <Link
                            to="/projects/new"
                            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                        >
                            Create New Project
                        </Link>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {projects.length === 0 ? (
                        <div className="text-center py-12">
                            <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {projects.map((project) => (
                                <Link
                                    key={project._id}
                                    to={`/projects/${project._id}`}
                                    className="block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
                                >
                                    <div className="px-4 py-5 sm:p-6">
                                        <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                                        <p className="mt-1 text-sm text-gray-500">{project.description}</p>
                                        <div className="mt-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {project.status}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 