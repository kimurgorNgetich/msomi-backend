import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
// --- NEW: Import the crypto module for generating secure tokens ---
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  // --- NEW FIELDS FOR PASSWORD RESET ---
  passwordResetToken: {
      type: String,
      select: false
  },
  passwordResetExpires: {
      type: Date,
      select: false
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// --- NEW METHOD TO GENERATE A PASSWORD RESET TOKEN ---
userSchema.methods.generatePasswordResetToken = function() {
    // 1. Generate a random token (unhashed)
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 2. Hash the token and save it to the user document
    // We save the hashed version for security. If the database is ever compromised,
    // attackers can't use the tokens directly.
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // 3. Set an expiration date for the token (10 minutes from now)
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    // 4. Return the unhashed token
    // This is what we will "send" to the user (i.e., log to the console).
    return resetToken;
};


// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export default mongoose.model('User', userSchema);
