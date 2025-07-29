// routes/auth.js

import express from 'express';
import { 
    register, 
    login, 
    changepassword, 
    deleteaccount, 
    logout,
    forgotPassword, // Import new function
    resetPassword   // Import new function
} from '../controllers/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { 
    registerValidation, 
    loginValidation, 
    changePasswordValidation, 
    deleteAccountValidation, 
    validateRequest,
    forgotPasswordValidation, // Import new validation
    resetPasswordValidation   // Import new validation
} from '../middleware/validate.js';

const router = express.Router();

// --- PUBLIC ROUTES ---
router.post('/register', express.json(), registerValidation, validateRequest, register);
router.post('/login', express.json(), loginValidation, validateRequest, login);

// --- NEW PUBLIC ROUTES FOR PASSWORD RESET ---
router.post('/forgotpassword', express.json(), forgotPasswordValidation, validateRequest, forgotPassword);
router.put('/resetpassword/:resettoken', express.json(), resetPasswordValidation, validateRequest, resetPassword);


// --- PROTECTED ROUTES (Require a valid token) ---
router.post('/changepassword', express.json(), authMiddleware, changePasswordValidation, validateRequest, changepassword);
router.delete('/deleteaccount', express.json(), authMiddleware, deleteAccountValidation, validateRequest, deleteaccount);
router.post('/logout', express.json(), authMiddleware, logout);

export default router;
