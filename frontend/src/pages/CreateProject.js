// src/pages/CreateProject.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../API_URL'

const CreateProject = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleTeamMemberChange = (index, field, value) => {
        const updated = [...teamMembers];
        updated[index][field] = value;
        setTeamMembers(updated);
    };

    const handleAddTeamMember = () => {
        if (
            teamMembers.length === 0 ||
            (teamMembers[teamMembers.length - 1].name.trim() && teamMembers[teamMembers.length - 1].email.trim())
        ) {
            setTeamMembers([...teamMembers, { name: '', email: '' }]);
        }
    };

    const handleRemoveTeamMember = (index) => {
        setTeamMembers(teamMembers.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        // Validate team members
        const hasIncomplete = teamMembers.some(
            (tm) => (tm.name.trim() && !tm.email.trim()) || (!tm.name.trim() && tm.email.trim())
        );
        if (hasIncomplete) {
            setError('Please fill out both name and email for all team members or remove incomplete rows.');
            return;
        }
        const filteredMembers = teamMembers
            .map((tm) => ({ name: tm.name.trim(), email: tm.email.trim() }))
            .filter((tm) => tm.name && tm.email);
        try {
            setLoading(true);
            const response = await axios.post(
                `${API_URL}/api/projects`,
                {
                    name,
                    description,
                    status: 'Active',
                    teamMembers: filteredMembers
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            navigate(`/projects/${response.data._id}`);
        } catch (error) {
            setError(
                error.response?.data?.message || 'Failed to create project. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-2xl leading-6 font-bold text-gray-900 mb-2">Create New Project</h3>
                        <p className="text-gray-500 mb-6">Fill in the details and add your team members.</p>
                        {error && (
                            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Project Name
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        placeholder="Enter project name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={4}
                                        required
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        placeholder="Enter project description"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Team Members
                                </label>
                                <div className="space-y-4">
                                    {teamMembers.map((member, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row sm:space-x-4 items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                                            <input
                                                type="text"
                                                placeholder="Name"
                                                value={member.name}
                                                onChange={(e) => handleTeamMemberChange(idx, 'name', e.target.value)}
                                                className="mb-2 sm:mb-0 flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                value={member.email}
                                                onChange={(e) => handleTeamMemberChange(idx, 'email', e.target.value)}
                                                className="mb-2 sm:mb-0 flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTeamMember(idx)}
                                                className="ml-0 sm:ml-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddTeamMember}
                                    className="mt-3 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none"
                                >
                                    + Add Team Member
                                </button>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateProject; 