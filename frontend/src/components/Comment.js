// src/components/Comment.js
import React from 'react';
import { format } from 'date-fns';
import FileAttachment from './FileAttachment';

const Comment = ({ comment, onReply, depth = 0 }) => {
  return (
    <div 
      className={`mb-4 p-4 bg-white rounded-lg shadow ${depth > 0 ? 'ml-6 border-l-2 border-gray-200' : ''}`}
      style={{ marginLeft: `${depth * 20}px` }}
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
          <h4 className="text-sm font-medium text-gray-500 mb-1">Attachments:</h4>
          <div className="space-y-2">
            {comment.attachments.map((filePath, index) => (
              <FileAttachment key={index} filePath={filePath} />
            ))}
          </div>
        </div>
      )}

      <button 
        onClick={() => onReply(comment._id)}
        className="text-blue-600 text-xs mt-2 hover:underline"
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

export default Comment;