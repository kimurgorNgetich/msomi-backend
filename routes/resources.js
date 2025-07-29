// routes/resources.js

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
    uploadResource, 
    getResources, 
    searchResources, 
    deleteResource, 
    downloadResource, 
    getMyResources,
    addRating,
    getResourceById
} from '../controllers/resources.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, path.join(__dirname, '../Uploads')); },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf', 'image/jpeg', 'image/png', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedTypes.includes(file.mimetype)) { cb(null, true); } 
  else { cb(new Error('Only PDF, JPEG, PNG, DOC, and DOCX files are allowed')); }
};

// --- THIS IS THE CHANGE ---
// The file size limit has been increased from 10MB to 50MB.
const upload = multer({ 
  storage, 
  fileFilter, 
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
}).single('file');


// --- ROUTES (No changes below) ---
router.get('/', getResources);
router.get('/search', searchResources);
router.get('/my-resources', authMiddleware, getMyResources);
router.get('/:id', getResourceById);
router.get('/:id/download', authMiddleware, downloadResource);
router.post('/:id/rate', authMiddleware, addRating);
router.delete('/:id', authMiddleware, deleteResource);
router.post('/', authMiddleware, upload, uploadResource); 

export default router;
