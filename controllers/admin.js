// controllers/admin.js

import User from '../models/User.js';
import Resource from '../models/Resource.js';
import Category from '../models/Category.js';
import fs from 'fs/promises'; // Import the file system module

// --- EXISTING FUNCTIONS (No changes) ---

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      message: 'Users retrieved successfully',
      count: users.length,
      data: users,
    });
  } catch (err) {
    console.error('Admin Get Users Error:', err);
    res.status(500).json({ error: 'Server error while retrieving users' });
  }
};

export const getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find()
      .populate('category', 'name')
      .populate('uploadedBy', 'name email');
    res.status(200).json({
      message: 'Resources retrieved successfully',
      count: resources.length,
      data: resources,
    });
  } catch (err) {
    console.error('Admin Get Resources Error:', err);
    res.status(500).json({ error: 'Server error while retrieving resources' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = new Category({ name });
    await category.save();
    res.status(201).json({ message: 'Category created successfully', data: category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};


// --- NEW DELETE FUNCTIONS ADDED BELOW ---

/**
 * @desc    Delete a user and all their uploaded resources
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find all resources uploaded by this user
        const resources = await Resource.find({ uploadedBy: user._id });

        // Delete all associated files from the server
        for (const resource of resources) {
            try {
                await fs.unlink(resource.filePath);
            } catch (fileError) {
                console.error(`Could not delete file for resource ${resource._id}: ${fileError.message}`);
            }
        }

        // Delete all resource documents from the database
        await Resource.deleteMany({ uploadedBy: user._id });

        // Finally, delete the user
        await user.deleteOne();

        res.status(200).json({ message: 'User and all associated resources have been deleted.' });
    } catch (err) {
        console.error('Admin Delete User Error:', err);
        res.status(500).json({ error: 'Server error while deleting user.' });
    }
};

/**
 * @desc    Delete a single resource
 * @route   DELETE /api/admin/resources/:id
 * @access  Private/Admin
 */
export const deleteResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }

        // Delete the physical file
        try {
            await fs.unlink(resource.filePath);
        } catch (fileError) {
            console.error(`Could not delete file ${resource.filePath}: ${fileError.message}`);
        }

        // Delete the database record
        await resource.deleteOne();

        res.status(200).json({ message: 'Resource deleted successfully.' });
    } catch (err) {
        console.error('Admin Delete Resource Error:', err);
        res.status(500).json({ error: 'Server error while deleting resource.' });
    }
};

/**
 * @desc    Delete a category
 * @route   DELETE /api/admin/categories/:id
 * @access  Private/Admin
 */
export const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        
        // Safety Check: Ensure no resources are using this category
        const resourceCount = await Resource.countDocuments({ category: categoryId });
        if (resourceCount > 0) {
            return res.status(400).json({ 
                error: `Cannot delete category. It is currently associated with ${resourceCount} resource(s).` 
            });
        }

        const category = await Category.findByIdAndDelete(categoryId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.status(200).json({ message: 'Category deleted successfully.' });
    } catch (err) {
        console.error('Admin Delete Category Error:', err);
        res.status(500).json({ error: 'Server error while deleting category.' });
    }
};
