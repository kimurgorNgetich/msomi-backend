// controllers/auth.js

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

// Helper function to set the cookie with the correct options
const sendTokenResponse = (user, statusCode, res) => {
    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    };

    // --- THIS IS THE FIX ---
    // If we are in production, we must add the 'secure' and 'sameSite' attributes
    // for cross-domain cookies to work.
    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
        cookieOptions.sameSite = 'none';
    }

    res.cookie('token', token, cookieOptions);

    const userObj = user.toObject();
    delete userObj.password;

    res.status(statusCode).json({
        message: 'Success',
        token,
        user: userObj
    });
};



export const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    user = new User({ name, email, password });
    await user.save();
    
    // Use the helper to send the token and response
    sendTokenResponse(user, 201, res);

  } catch (err) {
    console.error('Register Error:', err.message);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Use the helper to send the token and response
    sendTokenResponse(user, 200, res);

  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

// The rest of the functions (changepassword, deleteaccount, logout) remain the same
// as the secure versions from our previous step.

export const changepassword = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // --- THIS IS THE FIX ---
        // We assign the plain-text new password directly.
        // The 'pre-save' hook in User.js will handle the hashing automatically.
        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Change Password Error:', err);
        res.status(500).json({ error: err.message });
    }
};

export const deleteaccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ error: 'Password is required for account deletion' });
        }
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Password is incorrect' });
        }
        await User.deleteOne({ _id: user._id });
        res.clearCookie('token');
        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error('Delete Account Error:', err);
        res.status(500).json({ error: err.message });
    }
};

export const logout = async (_req, res) => {
  try {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout Error:', err.message);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

// --- NEW FUNCTIONS FOR PASSWORD RESET ---

/**
 * @desc    Handle "forgot password" request
 * @route   POST /api/auth/forgotpassword
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({ message: 'If an account with that email exists, a reset link will be sent.' });
        }

        const resetToken = user.generatePasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // --- THIS IS THE FIX ---
        // The link now uses the FRONTEND_URL from your .env file, ensuring it points to the correct server (port 8082).
        const resetUrl = `${process.env.FRONTEND_URL}/ResetPassword.html?token=${resetToken}`;
        
        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please visit this URL: \n\n ${resetUrl}`;

        await sendEmail({
            email: user.email,
            subject: 'Password Reset Token',
            message,
        });

        res.status(200).json({ message: 'If an account with that email exists, a reset link will be sent.' });

    } catch (err) {
        console.error('Forgot Password Error:', err);
        // This logic is safer inside the catch block
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * @desc    Handle the actual password reset
 * @route   PUT /api/auth/resetpassword/:resettoken
 * @access  Public
 */
export const resetPassword = async (req, res) => {
    try {
        // 1. Get the unhashed token from the URL params
        const resetToken = req.params.resettoken;

        // 2. Hash it to match the version stored in the database
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // 3. Find the user with the matching hashed token that has not expired
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }, // Check if the token is still valid
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired token.' });
        }

        // 4. Set the new password
        user.password = req.body.password;
        // 5. Clear the reset token fields
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        // The pre-save hook will automatically hash the new password
        await user.save();

        // Send a new login token as a convenience
        sendTokenResponse(user, 200, res);

    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
