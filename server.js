// server.js

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import resourceRoutes from './routes/resources.js';
import categoryRoutes from './routes/categories.js';
import adminRoutes from './routes/admin.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'; // Import the standard 'fs' module for synchronous operations

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000; // Render uses port 10000

app.set('trust proxy', 1);
connectDB();
app.use(morgan('combined'));

// --- NEW CODE BLOCK TO ENSURE UPLOADS DIRECTORY EXISTS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'Uploads');

if (!fs.existsSync(uploadsDir)) {
    console.log(`Creating directory: ${uploadsDir}`);
    fs.mkdirSync(uploadsDir);
}
// --- END OF NEW CODE BLOCK ---

// CORS
const allowedOrigins = [
    'http://127.0.0.1:8082', 
    'http://localhost:8082', 
    'http://127.0.0.1:5500', 
    'http://localhost:5500',
    process.env.FRONTEND_URL
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
// Note: We serve the 'Uploads' directory with a different name for security
app.use('/public-uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err.stack);
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File is too large. Maximum size is 50MB.' });
        }
        return res.status(400).json({ error: err.message });
    }
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'An unexpected error occurred on the server.' });
});

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
  
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
