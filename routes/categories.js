// routes/categories.js

import express from 'express';
import { getCategories, getCategoryById } from '../controllers/categories.js';
// Both authMiddleware and adminMiddleware are imported.


const router = express.Router();

// Public routes: Anyone can view the list of categories or a single category.
router.get('/', getCategories);
router.get('/:id', getCategoryById);



export default router;
