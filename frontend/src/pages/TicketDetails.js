import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';
import { 
  FiPaperclip, 
  FiImage,
  FiFileText,
  FiFile,
  FiDownload
} from 'react-icons/fi';
import { format } from 'date-fns';
import API_URL from '../API_URL';

const Comment = ({ comment, onReply, depth = 0 }) => {
  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch(ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FiImage className="text-blue-500" />;
      case 'pdf':
        return <FiFileText className="text-red-500" />;
      case 'doc':
      case 'docx':
        return <FiFileText className="text-blue-600" />;
      case 'xls':
      case 'xlsx':
        return <FiFileText className="text-green-600" />;
      default:
        return <FiFile className="text-gray-500" />;
    }
  };

  return (
    <div 
      className={`mb-4 p-4 bg-white rounded-lg shadow ${depth > 0 ? 'ml-6 border-l-2 border-gray-200' : ''}`}
      style={{ marginLeft: `${depth * 1.5}rem` }}
    >
      <div className="flex items-center mb-2">
        <div className="font-semibold text-gray-800">
          {comment.userId?.name || 'Unknown User'}
        </div>
        <span className="mx-2 text-gray-400">•</span>
        <div className="text-sm text-gray-500">
          {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
        </div>
      </div>
      
      <p className="text-gray-700 mb-2 whitespace-pre-wrap">{comment.text}</p>
      
      {comment.attachments?.length > 0 && (
        <div className="mt-3">
          <div className="space-y-2">
            {comment.attachments.map((file, index) => (
              <div key={index} className="flex items-center">
                <span className="mr-2">
                  {getFileIcon(file)}
                </span>
                <a
                  href={`${API_URL}/${file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm flex items-center"
                  download
                >
                  {file.split('/').pop()}
                  <FiDownload className="ml-1 text-xs" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <button 
        onClick={() => onReply(comment._id)}
        className="text-blue-600 text-xs mt-2 hover:underline flex items-center"
      >
        Reply
      </button>

      {comment.replies?.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => (
            <Comment 
              key={reply._id} 
              comment={reply} 
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TicketDetails = () => {
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editFields, setEditFields] = useState({ 
      title: '', 
      description: '', 
      priority: '', 
      status: '', 
      assignee: '' 
    });
    const [teamMembers, setTeamMembers] = useState([]);
    const [comments, setComments] = useState([]);
    const [replyTo, setReplyTo] = useState(null);
    const [files, setFiles] = useState([]);
    const [fileUploading, setFileUploading] = useState(false);

    useEffect(() => {
        fetchTicket();
        fetchComments();
        const interval = setInterval(fetchComments, 3000);
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        if (ticket?.project) {
            axios.get(`${API_URL}/api/projects/${ticket.project}`)
                .then(res => setTeamMembers(res.data.teamMembers || []));
        }
    }, [ticket?.project]);

    const fetchTicket = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/tickets/${id}`);
            setTicket(response.data);
        } catch (error) {
            setError('Failed to fetch ticket details');
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/comments/ticket/${id}`);
            setComments(response.data);
        } catch (error) {
            console.error('Failed to fetch comments', error);
        }
    };

    const buildCommentThread = (comments) => {
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
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await axios.put(`${API_URL}/api/tickets/${id}`, { status: newStatus });
            setTicket({ ...ticket, status: newStatus });
        } catch (error) {
            setError('Failed to update ticket status');
        }
    };

    const handlePriorityChange = async (newPriority) => {
        try {
            await axios.put(`${API_URL}/api/tickets/${id}`, { priority: newPriority });
            setTicket({ ...ticket, priority: newPriority });
        } catch (error) {
            setError('Failed to update ticket priority');
        }
    };

    const handleFileChange = (e) => {
        setFiles([...e.target.files]);
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim() && files.length === 0) return;
        
        try {
            setSubmitting(true);
            
            let fileUrls = [];
            if (files.length > 0) {
                setFileUploading(true);
                const formData = new FormData();
                files.forEach(file => formData.append('files', file));
                
                const uploadResponse = await axios.post(
                  `${API_URL}/api/comments/upload`, 
                  formData,
                  { headers: { 'Content-Type': 'multipart/form-data' } }
                );
                fileUrls = uploadResponse.data.fileUrls;
            }
            
            await axios.post(`${API_URL}/api/comments`, {
                ticketId: id,
                text: comment,
                parentId: replyTo,
                attachments: fileUrls
            });
            
            setComment('');
            setFiles([]);
            setReplyTo(null);
            fetchComments();
        } catch (error) {
            setError('Failed to add comment');
            console.error(error?.response?.data || error);
        } finally {
            setSubmitting(false);
            setFileUploading(false);
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
            await axios.put(`${API_URL}/api/tickets/${id}`, {
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
                                {buildCommentThread(comments).map(comment => (
                                  <Comment 
                                    key={comment._id} 
                                    comment={comment} 
                                    onReply={setReplyTo}
                                  />
                                ))}
                            </div>
                            <form onSubmit={handleCommentSubmit} className="mt-4 flex flex-col gap-2">
                                {replyTo && (
                                    <div className="text-xs text-blue-600">
                                      Replying to comment {replyTo} 
                                      <button 
                                        type="button" 
                                        onClick={() => setReplyTo(null)} 
                                        className="ml-2 text-red-500 hover:underline"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                )}
                                <div>
                                    <label htmlFor="comment" className="sr-only">Add a comment</label>
                                    <textarea
                                        id="comment"
                                        name="comment"
                                        rows={3}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        placeholder="Add a comment..."
                                    />
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer p-2 rounded-full hover:bg-gray-100">
                                        <FiPaperclip className="text-gray-500" />
                                        <input
                                            type="file"
                                            multiple
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept=".txt,.pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        />
                                    </label>
                                    <span className="text-xs text-gray-500">
                                        {files.length > 0 ? `${files.length} file(s) selected` : 'Attach files'}
                                    </span>
                                </div>
                                
                                {files.length > 0 && (
                                    <div className="text-xs text-gray-600 space-y-1">
                                        {Array.from(files).map((file, index) => (
                                            <div key={index} className="flex items-center">
                                              <FiFile className="mr-1 text-gray-400" />
                                              {file.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submitting || fileUploading || (!comment.trim() && files.length === 0)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        {submitting || fileUploading ? 'Uploading...' : 'Add Comment'}
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