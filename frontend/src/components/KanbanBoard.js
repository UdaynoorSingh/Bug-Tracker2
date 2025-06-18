// src/components/KanbanBoard.js
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from 'axios';
import API_URL from '../API_URL'

const StrictModeDroppable = ({children, ...props }) => {
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);
    if (!enabled) {
        return null;
    }
    return <Droppable {...props}>{children}</Droppable>;
};

const KanbanBoard =({ projectId }) =>{
    const [tickets, setTickets] = useState({
        'todo': [],
        'in-progress': [],
        'done': []
    });
    const [loading, setLoading] =useState(true);
    const [error, setError]= useState(null);

    useEffect(() => {
        fetchTickets();
    }, [projectId]);

    const fetchTickets=async () => {
        try{
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/tickets/project/${projectId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
            }
            });

            const groupedTickets = response.data.reduce((acc, ticket) => {
                if(!ticket || !ticket._id) {
                    console.warn('Invalid ticket data:', ticket);
                    return acc;
                }
                let status = (ticket.status || 'todo').toLowerCase().replace(/\s+/g, '-');
                if(!['todo', 'in-progress', 'done'].includes(status)) {
                    status = 'todo';
                }

                const normalizedTicket ={
                    _id: ticket._id.toString(), 
                    title: ticket.title || 'Untitled',
                    description: ticket.description || '',
                    priority: ticket.priority || 'medium',
                    status: status,
                    assignee: ticket.assignee || null,
                    projectId: ticket.project || projectId
                };

                if (!acc[status]) acc[status] = [];
                acc[status].push(normalizedTicket);
                return acc;
            }, {
                'todo': [],
                'in-progress': [],
                'done': []
            });

            setTickets(groupedTickets);
            setError(null);
        }
         catch(error) {
            console.error('Error fetching tickets:', error);
            setError('Failed to load tickets');
        }
         finally{
            setLoading(false);
        }
    };

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        if(!destination || !draggableId) return;

        if(
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) return;

        try{
            const sourceColumn = [...tickets[source.droppableId]];
            const destColumn = source.droppableId === destination.droppableId
                ? sourceColumn
                : [...tickets[destination.droppableId]];

            const ticketIndex = sourceColumn.findIndex(ticket => ticket._id === draggableId);
            if (ticketIndex === -1) {
                throw new Error(`Ticket with id ${draggableId} not found`);
            }

            const [movedTicket] = sourceColumn.splice(ticketIndex, 1);

            movedTicket.status = destination.droppableId;

            destColumn.splice(destination.index, 0, movedTicket);

            const newTickets = {
                ...tickets,
                [source.droppableId]: sourceColumn,
                [destination.droppableId]: destColumn
            };
            setTickets(newTickets);

            await axios.patch(
                `${API_URL}/api/tickets/${draggableId}`,
                { status: destination.droppableId },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
        } catch (error) {
            console.error('Error updating ticket:', error);
            fetchTickets();
        }
    };

    const columns = {
        'todo': { title: 'To Do', color: 'bg-gray-100' },
        'in-progress': { title: 'In Progress', color: 'bg-blue-100' },
        'done': { title: 'Done', color: 'bg-green-100' }
    };

    if (loading) {
        return <div className="text-center p-4">Loading tickets...</div>;
    }

    if (error) {
        return <div className="text-center text-red-600 p-4">{error}</div>;
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                {Object.entries(columns).map(([columnId, column]) => (
                    <div key={columnId} className="flex flex-col">
                        <h3 className="text-lg font-semibold mb-4">
                            {column.title} ({tickets[columnId]?.length || 0})
                        </h3>
                        <StrictModeDroppable droppableId={columnId}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`${column.color} p-4 rounded-lg min-h-[500px] ${snapshot.isDraggingOver ? 'ring-2 ring-blue-500' : ''
                                        }`}
                                >
                                    {tickets[columnId].map((ticket, index) => (
                                        <Draggable
                                            key={ticket._id}
                                            draggableId={ticket._id}
                                            index={index}
                                        >
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`bg-white p-4 mb-4 rounded shadow ${snapshot.isDragging ? 'ring-2 ring-blue-500' : ''
                                                        }`}
                                                >
                                                    <h4 className="font-medium">{ticket.title}</h4>
                                                    <p className="text-sm text-gray-600 mt-2">
                                                        {ticket.description}
                                                    </p>
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className={`px-2 py-1 rounded text-xs ${ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                            {ticket.priority}
                                                        </span>
                                                        {ticket.assignee && (
                                                            <span className="text-sm text-gray-500">
                                                                {ticket.assignee.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </StrictModeDroppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
};

export default KanbanBoard; 