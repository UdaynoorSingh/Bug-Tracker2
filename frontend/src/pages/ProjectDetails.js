// src/pages/ProjectDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Modal from 'react-modal';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [assigneeFilter, setAssigneeFilter] = useState('');
    const [search, setSearch] = useState('');
    const [assignees, setAssignees] = useState([]);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editTicket, setEditTicket] = useState(null);
    const [editFields, setEditFields] = useState({ title: '', description: '', priority: '', status: '', assignee: '' });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTicketId, setDeleteTicketId] = useState(null);
    const [currentUser, setCurrentUser] = useState({ role: 'user', email: '' });
    const [editProjectModalOpen, setEditProjectModalOpen] = useState(false);
    const [editProjectFields, setEditProjectFields] = useState({ name: '', description: '', status: '' });
    const [newTeamMember, setNewTeamMember] = useState({ name: '', email: '' });

    useEffect(() => {
        fetchProject();
        fetchTickets();
    }, [id]);

    useEffect(() => {
        // Extract unique assignees for filter dropdown
        setAssignees([...new Set(tickets.map(t => t.assignee?.name).filter(Boolean))]);
    }, [tickets]);

    useEffect(() => {
        // Simulate fetching current user (replace with real auth)
        setCurrentUser({ role: 'admin', email: 'admin@example.com' });
    }, []);

    const fetchProject = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/projects/${id}`);
            setProject(response.data);
        } catch (error) {
            setError('Failed to fetch project details');
        }
    };

    const fetchTickets = async () => {
        try {
            let url = `http://localhost:5000/api/tickets/project/${id}?`;
            if (statusFilter) url += `status=${statusFilter}&`;
            if (priorityFilter) url += `priority=${priorityFilter}&`;
            if (assigneeFilter) url += `assignee=${encodeURIComponent(assigneeFilter)}&`;
            if (search) url += `q=${encodeURIComponent(search)}&`;
            const response = await axios.get(url);
            setTickets(response.data);
        } catch (error) {
            setError('Failed to fetch tickets');
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        const ticket = tickets.find((t) => t._id === draggableId);
        const newStatus = destination.droppableId;

        try {
            await axios.put(`http://localhost:5000/api/tickets/${draggableId}`, {
                status: newStatus,
            });

            const newTickets = tickets.map((t) =>
                t._id === draggableId ? { ...t, status: newStatus } : t
            );
            setTickets(newTickets);
        } catch (error) {
            setError('Failed to update ticket status');
        }
    };

    const openEditModal = (ticket) => {
        setEditTicket(ticket);
        setEditFields({
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            status: ticket.status,
            assignee: ticket.assignee?.name || ''
        });
        setEditModalOpen(true);
    };

    const closeEditModal = () => setEditModalOpen(false);

    const handleEditChange = (field, value) => {
        setEditFields({ ...editFields, [field]: value });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:5000/api/tickets/${editTicket._id}`, {
                title: editFields.title,
                description: editFields.description,
                priority: editFields.priority,
                status: editFields.status,
                assignee: tickets.find(t => t.assignee?.name === editFields.assignee)?.assignee || editTicket.assignee
            });
            setEditModalOpen(false);
            fetchTickets();
        } catch (error) {
            setError('Failed to update ticket');
        }
    };

    const openDeleteConfirm = (ticketId) => {
        setDeleteTicketId(ticketId);
        setDeleteConfirmOpen(true);
    };

    const closeDeleteConfirm = () => setDeleteConfirmOpen(false);

    const handleDelete = async () => {
        try {
            await axios.delete(`http://localhost:5000/api/tickets/${deleteTicketId}`);
            setDeleteConfirmOpen(false);
            fetchTickets();
        } catch (error) {
            setError('Failed to delete ticket');
        }
    };

    const openEditProjectModal = () => {
        setEditProjectFields({
            name: project.name,
            description: project.description,
            status: project.status
        });
        setEditProjectModalOpen(true);
    };

    const closeEditProjectModal = () => setEditProjectModalOpen(false);

    const handleProjectEditChange = (field, value) => {
        setEditProjectFields({ ...editProjectFields, [field]: value });
    };

    const handleProjectEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:5000/api/projects/${id}`, editProjectFields);
            setEditProjectModalOpen(false);
            fetchProject();
        } catch (error) {
            setError('Failed to update project');
        }
    };

    const handleRemoveTeamMember = async (email) => {
        try {
            await axios.delete(`http://localhost:5000/api/projects/${id}/members/${email}`);
            fetchProject();
        } catch (error) {
            setError('Failed to remove team member');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const columns = {
        todo: tickets.filter((ticket) => ticket.status === 'todo'),
        'in-progress': tickets.filter((ticket) => ticket.status === 'in-progress'),
        done: tickets.filter((ticket) => ticket.status === 'done'),
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-3xl font-extrabold text-blue-700 mb-1">{project?.name}</h2>
                            <div className="h-1 w-16 bg-blue-400 rounded mb-2"></div>
                            <p className="mt-1 text-md text-gray-600">{project?.description}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                            <button
                                onClick={openEditProjectModal}
                                className="mb-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none"
                            >
                                Edit Project
                            </button>
                            <button
                                onClick={() => navigate('/projects/new')}
                                className="mb-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none"
                            >
                                Back to Create Project
                            </button>
                            <Link
                                to={`/projects/${id}/tickets/new`}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                            >
                                Create Ticket
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-4 mb-6 items-center">
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') fetchTickets(); }}
                            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setLoading(true); setTimeout(fetchTickets, 0); }}
                            className="border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                        </select>
                        <select
                            value={priorityFilter}
                            onChange={e => { setPriorityFilter(e.target.value); setLoading(true); setTimeout(fetchTickets, 0); }}
                            className="border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                            <option value="">All Priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                        <select
                            value={assigneeFilter}
                            onChange={e => { setAssigneeFilter(e.target.value); setLoading(true); setTimeout(fetchTickets, 0); }}
                            className="border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                            <option value="">All Assignees</option>
                            {assignees.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                        <button
                            onClick={fetchTickets}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                        >
                            Filter
                        </button>
                        <button
                            onClick={() => {
                                setStatusFilter('');
                                setPriorityFilter('');
                                setAssigneeFilter('');
                                setSearch('');
                                setLoading(true);
                                setTimeout(fetchTickets, 0);
                            }}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                        >
                            Reset
                        </button>
                    </div>

                    {tickets.length === 0 && (
                        <div className="text-center text-gray-500 mt-8">No tickets found for the selected filters.</div>
                    )}

                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            {Object.entries(columns).map(([status, tickets]) => (
                                <div key={status} className="bg-gray-100 rounded-lg p-4">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4 capitalize">
                                        {status.replace('-', ' ')}
                                    </h3>
                                    <Droppable droppableId={status}>
                                        {(provided) => (
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className="space-y-4"
                                            >
                                                {tickets.map((ticket, index) => (
                                                    <Draggable
                                                        key={ticket._id}
                                                        draggableId={ticket._id}
                                                        index={index}
                                                    >
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className="bg-white p-4 rounded-lg shadow"
                                                            >
                                                                <Link
                                                                    to={`/tickets/${ticket._id}`}
                                                                    className="block hover:bg-gray-50"
                                                                >
                                                                    <h4 className="text-sm font-medium text-gray-900">
                                                                        {ticket.title}
                                                                    </h4>
                                                                    <div className="mt-2 flex items-center justify-between">
                                                                        <span
                                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticket.priority === 'high'
                                                                                ? 'bg-red-100 text-red-800'
                                                                                : ticket.priority === 'medium'
                                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                                    : 'bg-green-100 text-green-800'
                                                                                }`}
                                                                        >
                                                                            {ticket.priority}
                                                                        </span>
                                                                        {ticket.assignee && (
                                                                            <span className="text-xs text-gray-500">
                                                                                {ticket.assignee.name}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </Link>
                                                                {(currentUser.role === 'admin' || currentUser.email === ticket.assignee?.email) && (
                                                                    <div className="flex gap-2 mt-2">
                                                                        <button
                                                                            onClick={() => openEditModal(ticket)}
                                                                            className="text-blue-600 text-xs hover:underline"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => openDeleteConfirm(ticket._id)}
                                                                            className="text-red-600 text-xs hover:underline"
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            ))}
                        </div>
                    </DragDropContext>
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
                                {assignees.map(name => (
                                    <option key={name} value={name}>{name}</option>
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
            <Modal
                isOpen={deleteConfirmOpen}
                onRequestClose={closeDeleteConfirm}
                contentLabel="Delete Ticket"
                className="fixed inset-0 flex items-center justify-center z-50"
                overlayClassName="fixed inset-0 bg-black bg-opacity-30 z-40"
                ariaHideApp={false}
            >
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                    <h2 className="text-xl font-bold mb-4 text-red-600">Delete Ticket</h2>
                    <p>Are you sure you want to delete this ticket? This action cannot be undone.</p>
                    <div className="flex justify-end space-x-2 mt-6">
                        <button
                            type="button"
                            onClick={closeDeleteConfirm}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
            <Modal
                isOpen={editProjectModalOpen}
                onRequestClose={closeEditProjectModal}
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
                    <form onSubmit={handleProjectEditSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Project Name</label>
                            <input
                                type="text"
                                value={editProjectFields.name}
                                onChange={(e) => handleProjectEditChange('name', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={editProjectFields.description}
                                onChange={(e) => handleProjectEditChange('description', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                rows="4"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select
                                value={editProjectFields.status}
                                onChange={(e) => handleProjectEditChange('status', e.target.value)}
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
                                {project?.teamMembers.map((member, index) => (
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
                                onClick={closeEditProjectModal}
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

export default ProjectDetails; 