// src/pages/CreateTicket.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateTicket = () => {
    const { projectId } = useParams();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [assignee, setAssignee] = useState('');
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [comment, setComment] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch project to get team members
        const fetchProject = async () => {
            try {
                const response = await axios.get(`https://bug-tracker2-1.onrender.com/api/projects/${projectId}`);
                setTeamMembers(response.data.teamMembers || []);
            } catch (err) {
                setError('Failed to fetch project team members');
            }
        };
        fetchProject();
    }, [projectId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!assignee) {
            setError('Please select an assignee.');
            return;
        }
        const selectedAssignee = teamMembers.find(tm => tm.email === assignee);
        if (!selectedAssignee) {
            setError('Invalid assignee selected.');
            return;
        }
        try {
            setLoading(true);
            await axios.post('https://bug-tracker2-1.onrender.com/api/tickets', {
                title,
                description,
                priority,
                assignee: selectedAssignee,
                project: projectId,
                comment: comment.trim() ? comment : undefined
            });
            navigate(`/projects/${projectId}`);
        } catch (error) {
            setError('Failed to create ticket. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Create New Ticket
                        </h2>
                    </div>
                </div>

                <div className="mt-8 bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                    Title
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="title"
                                        id="title"
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
                                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                                    Initial Comment (optional)
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="comment"
                                        name="comment"
                                        rows={3}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        placeholder="Add an initial comment..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                                        Priority
                                    </label>
                                    <select
                                        id="priority"
                                        name="priority"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">
                                        Assignee
                                    </label>
                                    <select
                                        id="assignee"
                                        name="assignee"
                                        value={assignee}
                                        onChange={(e) => setAssignee(e.target.value)}
                                        required
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                    >
                                        <option value="">Select team member</option>
                                        {teamMembers.map((tm) => (
                                            <option key={tm.email} value={tm.email}>
                                                {tm.name} ({tm.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/projects/${projectId}`)}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTicket; 