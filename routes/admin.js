// routes/admin.js

import express from 'express';
import { 
    getAllUsers, 
    getAllResources, 
    createCategory,
    deleteUser,       // Import new function
    deleteResource,   // Import new function
    deleteCategory    // Import new function
} from '../controllers/admin.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { validateRequest, categoryValidation } from '../middleware/validate.js';

const router = express.Router();

// All routes in this file are protected and require admin access.
router.use(authMiddleware, adminMiddleware);

// --- GET ROUTES ---
router.get('/users', getAllUsers);
router.get('/resources', getAllResources);

// --- POST ROUTES ---
router.post('/categories', categoryValidation, validateRequest, createCategory); // Changed route for clarity

// --- DELETE ROUTES ---
router.delete('/users/:id', deleteUser);
router.delete('/resources/:id', deleteResource);
router.delete('/categories/:id', deleteCategory);

export default router;
