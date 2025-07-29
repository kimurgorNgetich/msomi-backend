// server.js

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import resourceRoutes from './routes/resources.js';
import categoryRoutes from './routes/categories.js';
import adminRoutes from './routes/admin.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Logging
app.use(morgan('combined'));

// --- CHANGE: More robust CORS setup ---
const allowedOrigins = ['http://127.0.0.1:8082', 'http://localhost:8082', 'http://127.0.0.1:5500', 'http://localhost:5500'];
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // This is important for cookies
}));
// --- END OF CHANGE ---

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));

// Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);

// --- CHANGE: The server listening part is moved ---
// This allows our test file to import 'app' without starting the server.
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
  
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// --- CHANGE: Export the app for testing ---
export default app;
