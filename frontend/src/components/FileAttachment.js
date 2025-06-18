import React from 'react';
const API_URL = require('../API_URL');

const FileAttachment = ({ filePath }) => {
  const filename = filePath.split('/').pop();
  const fileUrl = new URL(filePath, API_URL).href;
  const extension = filename.split('.').pop().toLowerCase();

  const fileIcons = {
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    default: '📁'
  };

  const icon = fileIcons[extension] || fileIcons.default;

  return (
    <div className="flex items-center p-2 hover:bg-gray-100 rounded transition-colors">
      <span className="text-xl mr-2">{icon}</span>
      <a 
        href={fileUrl} 
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline text-sm"
      >
        {filename}
      </a>
    </div>
  );
};

export default FileAttachment;