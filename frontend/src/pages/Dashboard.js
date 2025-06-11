import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

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

    const handleProjectSelect = (e) => {
        setSelectedProject(e.target.value);
        if (e.target.value) {
            navigate(`/projects/${e.target.value}`);
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
        <div className="min-h-screen bg-gray-100 flex">
            <Sidebar onLogout={handleLogout} />
            <div className="flex-1 flex flex-col">
                {/* Topbar for mobile */}
                <nav className="md:hidden bg-white shadow px-4 py-3 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900">Bug Tracker</h1>
                    <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">Logout</button>
                </nav>
                <main className="flex-1 p-6">
                    {/* Breadcrumbs */}
                    <nav className="text-sm mb-4" aria-label="Breadcrumb">
                        <ol className="list-reset flex text-gray-500">
                            <li><Link to="/dashboard" className="hover:underline text-blue-600">Dashboard</Link></li>
                            {selectedProject && (
                                <>
                                    <li><span className="mx-2">/</span></li>
                                    <li className="text-gray-700 font-medium">{projects.find(p => p._id === selectedProject)?.name}</li>
                                </>
                            )}
                        </ol>
                    </nav>
                    {/* Project Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                        <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
                        <div className="flex gap-2 items-center">
                            <select
                                value={selectedProject}
                                onChange={handleProjectSelect}
                                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select Project</option>
                                {projects.map((project) => (
                                    <option key={project._id} value={project._id}>{project.name}</option>
                                ))}
                            </select>
                            <Link
                                to="/projects/new"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                            >
                                Create New Project
                            </Link>
                        </div>
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
                </main>
            </div>
        </div>
    );
};

export default Dashboard; 