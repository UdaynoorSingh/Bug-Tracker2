// utils/cleanupUploads.js
const fs = require('fs');
const path = require('path');
const Comment = require('../models/Comment');

async function cleanupOrphanedFiles() {
  try {
    const usedFiles = (await Comment.find({}))
      .flatMap(comment => comment.attachments)
      .map(file => path.basename(file));

    fs.readdir('uploads', (err, files) => {
      if (err) throw err;

      files.forEach(file => {
        if (!usedFiles.includes(file)) {
          fs.unlink(path.join('uploads', file), err => {
            if (err) console.error('Error deleting file:', err);
            else console.log('Deleted orphaned file:', file);
          });
        }
      });
    });
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

setInterval(cleanupOrphanedFiles, 24*60*60*1000);