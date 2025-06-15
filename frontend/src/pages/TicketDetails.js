// src/pages/TicketDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
// import { useAuth } from '../contexts/AuthContext';
import Modal from 'react-modal';

function buildThread(comments) {
    const map = {};
    comments.forEach(c => map[c._id] = { ...c, replies: [] });
    const roots = [];
    comments.forEach(c => {
        if (c.parentId) {
            map[c.parentId]?.replies.push(map[c._id]);
        } else {
            roots.push(map[c._id]);
        }
    });
    return roots;
}

function CommentThread({ comments, onReply }) {
    return comments.map(comment => (
        <div key={comment._id} style={{ marginLeft: comment.parentId ? 20 : 0 }} className="mb-2">
            <div className="text-xs text-gray-500">
                <b>{comment.userId}</b> {/* Replace with user name if you populate */}
                <span> {new Date(comment.createdAt).toLocaleString()}</span>
            </div>
            <div className="mb-1">{comment.text}</div>
            <button className="text-blue-600 text-xs mb-1" onClick={() => onReply(comment._id)}>Reply</button>
            {comment.replies && comment.replies.length > 0 && (
                <CommentThread comments={comment.replies} onReply={onReply} />
            )}
        </div>
    ));
}

const TicketDetails = () => {
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    // const { user } = useAuth();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editFields, setEditFields] = useState({ title: '', description: '', priority: '', status: '', assignee: '' });
    const [teamMembers, setTeamMembers] = useState([]);
    const [comments, setComments] = useState([]);
    const [replyTo, setReplyTo] = useState(null);

    useEffect(() => {
        fetchTicket();
        fetchComments();
        const interval = setInterval(fetchComments, 3000); // Poll every 3s
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (ticket?.project) {
            axios.get(`https://bug-tracker2-1.onrender.com/api/projects/${ticket.project}`)
                .then(res => setTeamMembers(res.data.teamMembers || []));
        }
    }, [ticket?.project]);

    const fetchTicket = async () => {
        try {
            const response = await axios.get(`https://bug-tracker2-1.onrender.com/api/tickets/${id}`);
            setTicket(response.data);
        } catch (error) {
            setError('Failed to fetch ticket details');
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await axios.get(`https://bug-tracker2-1.onrender.com/api/comments/ticket/${id}`);
            setComments(response.data);
        } catch (error) {
            // Optionally handle error
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await axios.put(`https://bug-tracker2-1.onrender.com/api/tickets/${id}`, {
                status: newStatus,
            });
            setTicket({ ...ticket, status: newStatus });
        } catch (error) {
            setError('Failed to update ticket status');
        }
    };

    const handlePriorityChange = async (newPriority) => {
        try {
            await axios.put(`https://bug-tracker2-1.onrender.com/api/tickets/${id}`, {
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
            await axios.post(`https://bug-tracker2-1.onrender.com/api/comments`, {
                ticketId: id,
                text: comment,
                parentId: replyTo
            });
            setComment('');
            setReplyTo(null);
            fetchComments(); // Refresh comments
        } catch (error) {
            setError('Failed to add comment');
            console.error(error?.response?.data || error);
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = () => {
        setEditFields({
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            status: ticket.status,
            assignee: ticket.assignee?.email || ''
        });
        setEditModalOpen(true);
    };
    const closeEditModal = () => setEditModalOpen(false);

    const handleEditChange = (field, value) => {
        setEditFields({ ...editFields, [field]: value });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const selectedAssignee = teamMembers.find(tm => tm.email === editFields.assignee);
        try {
            await axios.put(`https://bug-tracker2-1.onrender.com/api/tickets/${id}`, {
                title: editFields.title,
                description: editFields.description,
                priority: editFields.priority,
                status: editFields.status,
                assignee: selectedAssignee
            });
            setTicket({ ...ticket, ...editFields, assignee: selectedAssignee });
            setEditModalOpen(false);
        } catch (error) {
            setError('Failed to update ticket');
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
                    <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
                        <button
                            onClick={() => navigate(`/projects/${ticket?.project}`)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Back to Project
                        </button>
                        <button
                            onClick={openEditModal}
                            className="inline-flex items-center px-4 py-2 border border-blue-500 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Edit Ticket
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
                                <CommentThread comments={buildThread(comments)} onReply={setReplyTo} />
                            </div>
                            <form onSubmit={handleCommentSubmit} className="mt-4 flex flex-col gap-2">
                                {replyTo && (
                                    <div className="text-xs text-blue-600">Replying to comment {replyTo} <button type="button" onClick={() => setReplyTo(null)} className="ml-2 text-red-500">Cancel</button></div>
                                )}
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
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submitting || !comment.trim()}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                    >
                                        {submitting ? 'Posting...' : 'Add Comment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={editModalOpen}
                onRequestClose={closeEditModal}
                contentLabel="Edit Ticket"
                className="fixed inset-0 flex items-center justify-center z-50"
                overlayClassName="fixed inset-0 bg-black bg-opacity-30 z-40"
                ariaHideApp={false}
            >
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
                    <h2 className="text-xl font-bold mb-4">Edit Ticket</h2>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                                type="text"
                                value={editFields.title}
                                onChange={e => handleEditChange('title', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={editFields.description}
                                onChange={e => handleEditChange('description', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                rows={3}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Priority</label>
                                <select
                                    value={editFields.priority}
                                    onChange={e => handleEditChange('priority', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    value={editFields.status}
                                    onChange={e => handleEditChange('status', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="todo">To Do</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Assignee</label>
                            <select
                                value={editFields.assignee}
                                onChange={e => handleEditChange('assignee', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                required
                            >
                                <option value="">Select team member</option>
                                {teamMembers.map(tm => (
                                    <option key={tm.email} value={tm.email}>
                                        {tm.name} ({tm.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                type="button"
                                onClick={closeEditModal}
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
                </div>
            </Modal>
        </div>
    );
};

export default TicketDetails; 