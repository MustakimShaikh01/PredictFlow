import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import User from '../models/User';

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai_team_test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('Auth API', () => {
  it('POST /api/auth/register - should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User', email: 'test@example.com', password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/auth/login - should login with valid credentials', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Test User', email: 'login@example.com', password: 'password123',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com', password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/auth/login - should reject invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'fake@example.com', password: 'wrongpass',
    });
    expect(res.status).toBe(401);
  });
});

describe('Protected Routes', () => {
  let token: string;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Admin', email: 'admin@example.com', password: 'password123', role: 'admin',
    });
    token = res.body.token;
  });

  it('GET /api/users/me - should return current user', async () => {
    const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@example.com');
  });

  it('GET /api/analytics/dashboard - should return dashboard stats', async () => {
    const res = await request(app).get('/api/analytics/dashboard').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalTasks).toBeDefined();
  });
});
