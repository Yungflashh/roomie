import request from 'supertest';
import { app } from '../../src/server';
import { User } from '../../src/models';

describe('Authentication Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    const validUser = {
      email: 'test@example.com',
      password: 'Test@12345',
      confirmPassword: 'Test@12345',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1995-01-01',
      gender: 'male',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUser.email);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should fail with duplicate email', async () => {
      await User.create({
        ...validUser,
        password: 'hashedpassword',
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, email: 'invalidemail' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, password: 'weak', confirmPassword: 'weak' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail when passwords do not match', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, confirmPassword: 'DifferentPass@123' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with underage user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, dateOfBirth: '2010-01-01' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a user
      await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'Test@12345',
        confirmPassword: 'Test@12345',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1995-01-01',
        gender: 'male',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@12345',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tokens');
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test@12345',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'Test@12345',
        confirmPassword: 'Test@12345',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1995-01-01',
        gender: 'male',
      });

      accessToken = response.body.data.tokens.accessToken;
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'Test@12345',
        confirmPassword: 'Test@12345',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1995-01-01',
        gender: 'male',
      });

      refreshToken = response.body.data.tokens.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'invalidtoken' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});