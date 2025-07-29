import mongoose from 'mongoose';

// Schema for individual ratings
const ratingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
});

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
  },
  fileType: {
    type: String,
    required: [true, 'File type is required'],
  },
  fileSize: {
    type: Number,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // The 'ratings' array is kept
  ratings: [ratingSchema],
  // The 'comments' array and schema have been removed
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// The virtual property for averageRating is kept
resourceSchema.virtual('averageRating').get(function() {
    if (this.ratings && this.ratings.length > 0) {
        const sum = this.ratings.reduce((acc, item) => acc + item.rating, 0);
        return (sum / this.ratings.length).toFixed(1);
    }
    return 0;
});

export default mongoose.model('Resource', resourceSchema);
