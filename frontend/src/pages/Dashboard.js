// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Modal from 'react-modal';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    // New state variables for project editing
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedProjectForEdit, setSelectedProjectForEdit] = useState(null);
    const [editFields, setEditFields] = useState({ name: '', description: '', status: '' });
    const [editTeamMembers, setEditTeamMembers] = useState([]);
    const [newTeamMember, setNewTeamMember] = useState({ name: '', email: '' });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await axios.get('https://bug-tracker2-1.onrender.com/api/projects', {
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

    const handleEditClick = (e, project) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedProjectForEdit(project);
        setEditFields({
            name: project.name,
            description: project.description,
            status: project.status
        });
        setEditTeamMembers(project.teamMembers || []);
        setEditModalOpen(true);
    };

    const handleDeleteClick = (e, project) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation(); // Prevent event bubbling
        setSelectedProjectForEdit(project);
        setDeleteModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`https://bug-tracker2-1.onrender.com/api/projects/${selectedProjectForEdit._id}`, editFields);
            setEditModalOpen(false);
            fetchProjects();
        } catch (error) {
            setError('Failed to update project');
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await axios.delete(`https://bug-tracker2-1.onrender.com/api/projects/${selectedProjectForEdit._id}`);
            setDeleteModalOpen(false);
            fetchProjects();
        } catch (error) {
            setError('Failed to delete project');
        }
    };

    const handleAddTeamMember = async (e) => {
        e.preventDefault();
        if (!newTeamMember.name.trim() || !newTeamMember.email.trim()) return;
        try {
            await axios.post(`https://bug-tracker2-1.onrender.com/api/projects/${selectedProjectForEdit._id}/members`, newTeamMember);
            setNewTeamMember({ name: '', email: '' });
            // Refresh team members
            const { data } = await axios.get(`https://bug-tracker2-1.onrender.com/api/projects/${selectedProjectForEdit._id}`);
            setEditTeamMembers(data.teamMembers || []);
            fetchProjects();
        } catch (error) {
            setError('Failed to add team member');
        }
    };

    const handleRemoveTeamMember = async (email) => {
        try {
            await axios.delete(`https://bug-tracker2-1.onrender.com/api/projects/${selectedProjectForEdit._id}/members/${email}`);
            // Refresh team members
            const { data } = await axios.get(`https://bug-tracker2-1.onrender.com/api/projects/${selectedProjectForEdit._id}`);
            setEditTeamMembers(data.teamMembers || []);
            fetchProjects();
        } catch (error) {
            setError('Failed to remove team member');
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
                                <div
                                    key={project._id}
                                    className="block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
                                >
                                    <div className="px-4 py-5 sm:p-6">
                                        <div className="flex justify-between items-start">
                                            <Link
                                                to={`/projects/${project._id}`}
                                                className="flex-1"
                                            >
                                                <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                                                <p className="mt-1 text-sm text-gray-500">{project.description}</p>
                                                <div className="mt-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {project.status}
                                                    </span>
                                                </div>
                                            </Link>
                                            <div className="flex space-x-2 ml-4">
                                                <button
                                                    onClick={(e) => handleEditClick(e, project)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteClick(e, project)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Edit Project Modal */}
            <Modal
                isOpen={editModalOpen}
                onRequestClose={() => setEditModalOpen(false)}
                className="bg-white rounded-lg p-6 max-w-2xl w-full mx-auto mt-20 focus:outline-none"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                style={{
                    content: {
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        padding: '0',
                        position: 'relative',
                        inset: 'unset',
                        margin: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                    overlay: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }
                }}
            >
                <div className="space-y-4 p-6">
                    <h3 className="text-xl font-bold text-gray-900">Edit Project</h3>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Project Name</label>
                            <input
                                type="text"
                                value={editFields.name}
                                onChange={(e) => setEditFields({ ...editFields, name: e.target.value })}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={editFields.description}
                                onChange={(e) => setEditFields({ ...editFields, description: e.target.value })}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                rows="4"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select
                                value={editFields.status}
                                onChange={(e) => setEditFields({ ...editFields, status: e.target.value })}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            >
                                <option value="Active">Active</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="mt-6">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">Team Members</h4>
                            <div className="space-y-4">
                                {editTeamMembers.map((member, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                                        <div>
                                            <p className="font-medium">{member.name}</p>
                                            <p className="text-sm text-gray-500">{member.email}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTeamMember(member.email)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setEditModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                    <div className="mt-4 p-4 border border-gray-200 rounded-md">
                        <h5 className="font-medium mb-2">Add New Team Member</h5>
                        <div className="space-y-3">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={newTeamMember.name}
                                    onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-md px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={newTeamMember.email}
                                    onChange={(e) => setNewTeamMember({ ...newTeamMember, email: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-md px-3 py-2"
                                    required
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddTeamMember}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                Add Member
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onRequestClose={() => setDeleteModalOpen(false)}
                className="bg-white rounded-lg p-6 max-w-md mx-auto mt-20"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            >
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">Delete Project</h3>
                    <p className="text-gray-600">
                        Are you sure you want to delete "{selectedProjectForEdit?.name}"? This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            onClick={() => setDeleteModalOpen(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteConfirm}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Dashboard; 