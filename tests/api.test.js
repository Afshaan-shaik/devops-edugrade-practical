/**
 * API Integration Tests for EduGrade Server
 */

const request = require('supertest');
const app = require('../server');

describe('EduGrade API Endpoints', () => {
  describe('GET /health', () => {
    test('should return 200 OK with UP status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.service).toBe('edugrade-web-app');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('uptimeSeconds');
      expect(res.body).toHaveProperty('host');
    });
  });

  describe('GET /api/version', () => {
    test('should return current application release information', async () => {
      const res = await request(app).get('/api/version');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('releaseName');
    });
  });

  describe('GET /api/scale', () => {
    test('should return the 10-point grade scale', async () => {
      const res = await request(app).get('/api/scale');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.scale)).toBe(true);
      expect(res.body.scale.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/calculate', () => {
    test('should calculate results successfully with valid payload', async () => {
      const payload = {
        studentInfo: { name: 'DevOps Candidate', rollNo: 'DEV-007' },
        subjects: [
          { name: 'DevOps Engineering', marks: 92, maxMarks: 100, credits: 4 },
          { name: 'Cloud Computing', marks: 88, maxMarks: 100, credits: 3 },
        ],
      };

      const res = await request(app).post('/api/calculate').send(payload);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.resultStatus).toBe('PASSED');
      expect(res.body.data.summary.overallPercentage).toBe(90);
      expect(res.body.data.summary.grade).toBe('O');
    });

    test('should return 400 Bad Request when subjects array is missing or empty', async () => {
      const res = await request(app).post('/api/calculate').send({ subjects: [] });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Invalid input/i);
    });

    test('should return 400 Bad Request when marks exceed maxMarks', async () => {
      const res = await request(app).post('/api/calculate').send({
        subjects: [{ name: 'Test', marks: 150, maxMarks: 100 }],
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/between 0 and 100/i);
    });
  });

  describe('GET /metrics', () => {
    test('should return monitoring metrics', async () => {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.body.metrics).toHaveProperty('totalRequests');
      expect(res.body.metrics).toHaveProperty('endpointHits');
    });
  });
});
