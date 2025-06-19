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

const allowedOrigins = [
  'https://bug-tracker2.vercel.app',
  'http://localhost:3000',
  process.env.FRONTEND_URL
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', 
  require('./middleware/fileExists'),
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : '0'
  })
);

// MongoDB connection
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
    setTimeout(connectWithRetry, 5000);
  }
};
connectWithRetry();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP',
  validate: { trustProxy: true },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/comments', require('./routes/comments'));

// Health check
app.get('/health', (req, res) => res.status(200).json({ 
  status: 'healthy',
  timestamp: new Date().toISOString(),
  uptime: process.uptime()
}));

// Error handling
app.use((err, req, res, next) => {
  if (err.name === 'CorsError') {
    return res.status(403).json({ message: 'Not allowed by CORS' });
  }
  
  // ... rest of your error handling
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});