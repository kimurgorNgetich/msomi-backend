// controllers/resources.js

import Resource from '../models/Resource.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs/promises';


// --- NEW FUNCTION ADDED ---
/**
 * @desc    Get a single resource by its ID
 * @route   GET /api/resources/:id
 * @access  Public
 */
export const getResourceById = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id)
            .populate('category', 'name')
            .populate('uploadedBy', 'name');

        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }

        res.status(200).json({
            message: 'Resource retrieved successfully',
            data: resource,
        });
    } catch (err) {
        console.error('Get Resource By ID Error:', err);
        // Handle cases where the ID is not a valid MongoDB ObjectId
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Resource not found' });
        }
        res.status(500).json({ error: 'Server error while retrieving the resource' });
    }
};

// --- NO CHANGES TO EXISTING FUNCTIONS ---

export const getMyResources = async (req, res) => {
  try {
    const resources = await Resource.find({ uploadedBy: req.user.id })
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({
      message: 'User resources retrieved successfully',
      data: resources,
    });
  } catch (err) {
    console.error('Get My Resources Error:', err);
    res.status(500).json({ error: 'Server error while retrieving resources' });
  }
};

export const getResources = async (req, res) => {
  try {
    const { category, page = 1, limit = 6 } = req.query; 
    const query = category ? { category } : {};
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const totalDocuments = await Resource.countDocuments(query);
    const totalPages = Math.ceil(totalDocuments / limitNum);
    const resources = await Resource.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('category', 'name')
      .populate('uploadedBy', 'name _id');
    res.status(200).json({
      message: 'Resources retrieved successfully',
      data: resources,
      pagination: { currentPage: pageNum, totalPages, totalDocuments }
    });
  } catch (err) {
    console.error('Resource GET Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const uploadResource = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    if (!title || !description || !category || !req.file) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!mongoose.isValidObjectId(category)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ error: 'Category not found' });
    }
    const resource = new Resource({
      title, description, category,
      filePath: req.file.path,
      fileName: req.file.filename,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
    });
    await resource.save();
    res.status(201).json({ message: 'Resource uploaded', data: resource });
  } catch (err) {
    console.error('Resource POST Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const searchResources = async (req, res) => {
  try {
    const { q: query } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search term must be a valid string' });
    }
    const searchTerm = query.trim();
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term cannot be empty' });
    }
    const resources = await Resource.find({
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ],
    })
      .populate('category', 'name')
      .populate('uploadedBy', 'name');
    res.status(200).json({ message: 'Search results retrieved', data: resources });
  } catch (err) {
    console.error('Resource Search Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const downloadResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.download(resource.filePath, resource.fileName);
  } catch (err) {
    console.error('Resource Download Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    const userIsAdmin = req.user.role === 'admin';
    // --- THIS IS THE FIX ---
    // Using the .equals() method is the correct and safest way
    // to compare Mongoose ObjectIds.
    const userIsOwner = resource.uploadedBy.equals(req.user.id);

    if (!userIsOwner && !userIsAdmin) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this resource' });
    }
    
    try {
      await fs.unlink(resource.filePath);
    } catch (fileError) {
      console.error(`Could not delete file: ${resource.filePath}. It may have been already removed. Error: ${fileError.message}`);
    }
    await resource.deleteOne();
    res.status(200).json({ message: 'Resource deleted successfully' });
  } catch (err) {
    console.error('Resource Delete Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// --- NEW FUNCTION ADDED ---
/**
 * @desc    Add or update a rating for a resource
 * @route   POST /api/resources/:id/rate
 * @access  Private
 */
export const addRating = async (req, res) => {
    const { rating } = req.body;
    const resourceId = req.params.id;
    const userId = req.user.id;

    // Basic validation
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Please provide a rating between 1 and 5.' });
    }

    try {
        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found.' });
        }

        // Check if the user is the one who uploaded the resource
        if (resource.uploadedBy.toString() === userId) {
            return res.status(400).json({ error: 'You cannot rate your own resource.' });
        }

        // Check if the user has already rated this resource
        const existingRating = resource.ratings.find(r => r.user.toString() === userId);

        if (existingRating) {
            // If they have, update their rating
            existingRating.rating = rating;
        } else {
            // If they haven't, add a new rating to the array
            resource.ratings.push({ user: userId, rating });
        }

        await resource.save();
        res.status(200).json({ message: 'Rating submitted successfully', data: resource });

    } catch (err) {
        console.error('Add Rating Error:', err);
        res.status(500).json({ error: 'Server error while adding rating.' });
    }
};
