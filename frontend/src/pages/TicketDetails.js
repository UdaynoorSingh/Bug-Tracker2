import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const TicketDetails = () => {
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        fetchTicket();
    }, [id]);

    const fetchTicket = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/tickets/${id}`);
            setTicket(response.data);
        } catch (error) {
            setError('Failed to fetch ticket details');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await axios.put(`http://localhost:5000/api/tickets/${id}`, {
                status: newStatus,
            });
            setTicket({ ...ticket, status: newStatus });
        } catch (error) {
            setError('Failed to update ticket status');
        }
    };

    const handlePriorityChange = async (newPriority) => {
        try {
            await axios.put(`http://localhost:5000/api/tickets/${id}`, {
                priority: newPriority,
            });
            setTicket({ ...ticket, priority: newPriority });
        } catch (error) {
            setError('Failed to update ticket priority');
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        try {
            setSubmitting(true);
            await axios.post(`http://localhost:5000/api/tickets/${id}/comments`, {
                text: comment,
            });
            setComment('');
            fetchTicket(); // Refresh ticket to get new comment
        } catch (error) {
            setError('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            {ticket?.title}
                        </h2>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <button
                            onClick={() => navigate(`/projects/${ticket?.project}`)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Back to Project
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <div className="mt-8 bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    value={ticket?.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                >
                                    <option value="todo">To Do</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Priority</label>
                                <select
                                    value={ticket?.priority}
                                    onChange={(e) => handlePriorityChange(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-lg font-medium text-gray-900">Description</h3>
                            <div className="mt-2 text-sm text-gray-500 whitespace-pre-wrap">
                                {ticket?.description}
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-lg font-medium text-gray-900">Comments</h3>
                            <div className="mt-4 space-y-4">
                                {ticket?.comments.map((comment) => (
                                    <div key={comment._id} className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-900">
                                                {comment.user.name}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-gray-500">{comment.text}</p>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleCommentSubmit} className="mt-4">
                                <div>
                                    <label htmlFor="comment" className="sr-only">
                                        Add a comment
                                    </label>
                                    <textarea
                                        id="comment"
                                        name="comment"
                                        rows={3}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        placeholder="Add a comment..."
                                    />
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submitting || !comment.trim()}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                    >
                                        {submitting ? 'Posting...' : 'Post Comment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetails; 