/**
 * EduGrade Web Application Server
 * DevOps Practical - Containerized Web App with CI/CD
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const logger = require('./src/logger');
const { evaluateResults, GRADE_SCALE } = require('./src/evaluator');

const app = express();
const PORT = process.env.PORT || 8080;
const APP_VERSION = process.env.APP_VERSION || '1.0.0';
const RELEASE_NAME = process.env.RELEASE_NAME || 'Genesis-Release';
const NODE_ENV = process.env.NODE_ENV || 'production';
const START_TIME = Date.now();

// Simple request metrics tracker
const metrics = {
  totalRequests: 0,
  endpointHits: {},
  statusCodes: {},
  lastErrors: [],
};

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging & metrics middleware
app.use((req, res, next) => {
  metrics.totalRequests += 1;
  const endpoint = `${req.method} ${req.path}`;
  metrics.endpointHits[endpoint] = (metrics.endpointHits[endpoint] || 0) + 1;

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.statusCodes[res.statusCode] = (metrics.statusCodes[res.statusCode] || 0) + 1;

    logger.info('HTTP Request Handled', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    });
  });

  next();
});

// Serve static assets from public/
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Health Check Endpoint
 * Used by Docker HEALTHCHECK, AWS ALB/Target Group, and Kubernetes liveness probes
 */
app.get('/health', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);
  res.status(200).json({
    status: 'UP',
    service: 'edugrade-web-app',
    version: APP_VERSION,
    releaseName: RELEASE_NAME,
    environment: NODE_ENV,
    uptimeSeconds,
    timestamp: new Date().toISOString(),
    host: os.hostname(),
    system: {
      platform: os.platform(),
      totalMemMB: Math.round(os.totalmem() / (1024 * 1024)),
      freeMemMB: Math.round(os.freemem() / (1024 * 1024)),
      nodeVersion: process.version,
    },
  });
});

/**
 * Version Endpoint
 * Demonstrates new releases (Step 11) and rollbacks (Step 12)
 */
app.get('/api/version', (req, res) => {
  res.json({
    version: APP_VERSION,
    releaseName: RELEASE_NAME,
    environment: NODE_ENV,
    buildTime: process.env.BUILD_TIME || new Date(START_TIME).toISOString(),
    gitCommit: process.env.GIT_COMMIT || 'local-dev',
  });
});

/**
 * Grade Scale Info Endpoint
 */
app.get('/api/scale', (req, res) => {
  res.json({
    scale: GRADE_SCALE,
    description: '10-point UGC/AICTE Standard Grading System',
  });
});

/**
 * Calculate Student Result Endpoint
 */
app.post('/api/calculate', (req, res) => {
  try {
    const { subjects, studentInfo } = req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input: "subjects" array is required and must not be empty.',
      });
    }

    const result = evaluateResults(subjects, studentInfo || {});

    logger.info('Result evaluated successfully', {
      student: result.student.name,
      overallPercentage: result.summary.overallPercentage,
      grade: result.summary.grade,
      resultStatus: result.summary.resultStatus,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Calculation Error', { error: error.message });
    metrics.lastErrors.unshift({
      timestamp: new Date().toISOString(),
      message: error.message,
    });
    if (metrics.lastErrors.length > 10) metrics.lastErrors.pop();

    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Metrics Endpoint for Monitoring
 */
app.get('/metrics', (req, res) => {
  res.json({
    metrics: {
      uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
      totalRequests: metrics.totalRequests,
      endpointHits: metrics.endpointHits,
      statusCodes: metrics.statusCodes,
      recentErrors: metrics.lastErrors,
    },
  });
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Only start the server if file is executed directly (allows test imports)
let serverInstance;
if (require.main === module) {
  serverInstance = app.listen(PORT, () => {
    logger.info(`EduGrade Server started successfully on port ${PORT}`, {
      port: PORT,
      version: APP_VERSION,
      env: NODE_ENV,
      url: `http://localhost:${PORT}`,
    });
  });

  // Graceful shutdown handling
  const shutdown = (signal) => {
    logger.warn(`Received ${signal}. Shutting down gracefully...`);
    if (serverInstance) {
      serverInstance.close(() => {
        logger.info('HTTP server closed. Exiting process.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
