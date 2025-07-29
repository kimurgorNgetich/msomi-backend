import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  image: { type: String, required: false }, // Added for seedCategories.js
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Category', categorySchema);