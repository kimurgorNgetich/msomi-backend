// middleware/validate.js

import { check, validationResult } from 'express-validator';

export const registerValidation = [
  check('name', 'Name is required').not().isEmpty().trim().escape(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password must be 8 or more characters').isLength({ min: 8 }),
];

export const loginValidation = [
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password is required').not().isEmpty(),
];
 
export const changePasswordValidation = [
  check('currentPassword', 'Current password is required').not().isEmpty(),
  check('newPassword', 'New password must be at least 8 characters long').isLength({ min: 8 }),
];

export const deleteAccountValidation = [
  check('password', 'Password is required').not().isEmpty(),
];

export const resourceValidation = [
  check('title', 'Title is required').not().isEmpty().trim().escape(),
  check('description', 'Description must be a string').optional().isString().trim().escape(),
  check('category', 'Category must be a valid ID').optional().isMongoId(),
];

export const categoryValidation = [
  check('name', 'Category name is required').not().isEmpty().isString().trim().escape(),
];

export const searchValidation = [
  check('query', 'Search query is required').not().isEmpty().trim().escape(),
];

// --- NEW VALIDATION RULES ADDED ---

export const forgotPasswordValidation = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
];

export const resetPasswordValidation = [
    check('password', 'Password must be 8 or more characters').isLength({ min: 8 }),
];


export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};
