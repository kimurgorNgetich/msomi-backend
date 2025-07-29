// __tests__/auth.test.js

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js'; // We will need to export 'app' from server.js
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables for the test
dotenv.config();

// Connect to the database before running any tests
beforeAll(async () => {
  // Use the same connection string from your main app for now
  await mongoose.connect(process.env.MONGO_URI);
});

// Clear the User collection after each test to ensure a clean slate
afterEach(async () => {
  await User.deleteMany({});
});

// Disconnect from the database after all tests are finished
afterAll(async () => {
  await mongoose.connection.close();
});

// Group tests for the /api/auth endpoint
describe('Auth API - /api/auth', () => {

  // Test case for user registration
  it('should register a new user successfully', async () => {
    // Define the new user's data
    const newUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    // Use supertest to make a POST request to the /register endpoint
    const response = await request(app)
      .post('/api/auth/register')
      .send(newUser);

    // Assert (check) the results
    // 1. We expect the server to respond with a 201 "Created" status
    expect(response.statusCode).toBe(201);

    // 2. We expect the response body to contain a message
    expect(response.body).toHaveProperty('message', 'User registered successfully');

    // 3. We expect the response body to contain a JWT token
    expect(response.body).toHaveProperty('token');

    // 4. (Optional but good) Verify the user was actually saved to the database
    const savedUser = await User.findOne({ email: 'test@example.com' });
    expect(savedUser).not.toBeNull();
    expect(savedUser.name).toBe('Test User');
  });

  // We will add more tests here for login, password change, etc.
});
