require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const multer = require('multer'); 
const { cleanupOrphanedFiles } = require('./utils/cleanupUploads');

const app = express();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', 
  require('./middleware/fileExists'),
  express.static(path.join(__dirname, 'uploads'))
);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bug-tracker')
.then(() => {
  console.log('MongoDB Connected');
  
  if (process.env.NODE_ENV === 'production') {
    setInterval(async () => {
      try {
        await cleanupOrphanedFiles();
        console.log('Upload cleanup completed');
      } catch (err) {
        console.error('Upload cleanup error:', err);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
    console.log('Upload cleanup job initialized');
  }
})
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1); 
});

const limiter = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
if (process.env.NODE_ENV === 'production') app.use('/api/', limiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/comments', require('./routes/comments'));

app.get('/health', (req, res) => res.status(200).json({ status: 'healthy' }));

app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      message: 'File too large',
      details: 'Maximum file size is 5MB' 
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ 
      message: 'File upload error',
      details: err.message 
    });
  }

  if (err.code === 'ENOENT') {
    return res.status(404).json({ 
      message: 'File not found',
      details: err.path 
    });
  }

  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => 
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
);