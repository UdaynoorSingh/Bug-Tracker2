import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const ProjectDetails = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProject();
        fetchTickets();
    }, [id]);

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
            const response = await axios.get(`http://localhost:5000/api/tickets/project/${id}`);
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
                            <h2 className="text-2xl font-bold text-gray-900">{project?.title}</h2>
                            <p className="mt-1 text-sm text-gray-500">{project?.description}</p>
                        </div>
                        <Link
                            to={`/projects/${id}/tickets/new`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                        >
                            Create Ticket
                        </Link>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                            {error}
                        </div>
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
        </div>
    );
};

export default ProjectDetails; 