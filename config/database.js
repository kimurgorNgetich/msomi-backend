import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database Connected (Promise)');
  } catch (error) {
    console.error('Database connection error:', error.message);
    throw error;
  }
};

export default connectDB;