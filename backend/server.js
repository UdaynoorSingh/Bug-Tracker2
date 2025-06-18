require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { cleanupOrphanedFiles } = require('./utils/cleanupUploads');

const app = express();

app.set('trust proxy', 1);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', 
  require('./middleware/fileExists'),
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : '0'
  })
);

const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bug-tracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 50
    });
    console.log('MongoDB connected successfully');

    if (process.env.NODE_ENV === 'production') {
      setInterval(async () => {
        try {
          await cleanupOrphanedFiles();
          console.log('Upload cleanup completed');
        } catch (err) {
          console.error('Upload cleanup error:', err);
        }
      }, 24 * 60 * 60 * 1000); 
      console.log('Upload cleanup job initialized');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again later',
  validate: { trustProxy: true }, 
  standardHeaders: true, 
  legacyHeaders: false 
});

  app.use('/api/', limiter);


app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/comments', require('./routes/comments'));

app.get('/health', (req, res) => res.status(200).json({ 
  status: 'healthy',
  timestamp: new Date().toISOString(),
  uptime: process.uptime()
}));

app.use((err, req, res, next) => {
  console.error('Error:', err.stack || err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      message: 'File too large',
      details: 'Maximum file size is 10MB',
      code: 'FILE_SIZE_LIMIT_EXCEEDED'
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ 
      message: 'File upload error',
      details: err.message,
      code: 'FILE_UPLOAD_ERROR'
    });
  }

  if (err.code === 'ENOENT') {
    return res.status(404).json({ 
      message: 'File not found',
      details: err.path,
      code: 'FILE_NOT_FOUND'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(422).json({
      message: 'Validation failed',
      errors: Object.values(err.errors).map(e => e.message),
      code: 'VALIDATION_ERROR'
    });
  }

  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    code: 'INTERNAL_SERVER_ERROR'
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Server and MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Server and MongoDB connection closed');
      process.exit(0);
    });
  });
});