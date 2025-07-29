import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category.js';

dotenv.config();

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log('Connected to MongoDB');
    await Category.deleteMany({});
    console.log('Existing categories cleared');
    const categories = await Category.insertMany([
      { name: 'Business & Economics', image: 'bizzz.jpg' },
      { name: 'ICT', image: 'comps.jpg' },
      { name: 'Law', image: 'juris.jpg' },
      { name: 'Education', image: 'educ.jpg' },
      { name: 'Music', image: 'musik.jpg' },
      { name: 'Health Sciences', image: 'smhs.jpg' },
      { name: 'Mathematics', image: 'mathz.jpg' },
      { name: 'Physics & Engineering', image: 'Gears.jpg' },
      { name: 'Hospitality', image: 'hospi.jpg' }
    ]);
    console.log('Categories seeded successfully:', categories);
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding categories:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedCategories();