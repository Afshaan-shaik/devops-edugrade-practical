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

// Simple request metrics tracker & log buffer
const metrics = {
  totalRequests: 0,
  endpointHits: {},
  statusCodes: {},
  lastErrors: [],
  recentLogs: [],
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

    const logMeta = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip || req.connection.remoteAddress || '127.0.0.1',
    };

    logger.info('HTTP Request Handled', logMeta);

    metrics.recentLogs.unshift({
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString(),
      level: res.statusCode >= 400 ? 'WARN' : 'INFO',
      message: `${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`,
      details: logMeta,
    });
    if (metrics.recentLogs.length > 50) metrics.recentLogs.pop();
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
 * GPA to Percentage Conversion Endpoint (New in v1.1.0)
 */
app.get('/api/convert/gpa-to-percentage', (req, res) => {
  try {
    const gpa = parseFloat(req.query.gpa);
    const { convertGpaToPercentage } = require('./src/evaluator');
    const percentage = convertGpaToPercentage(gpa);
    res.json({ success: true, gpa, percentage, formula: 'GPA * 9.5' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
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

/**
 * DevOps Live Logs API
 */
app.get('/api/devops/logs', (req, res) => {
  res.json({
    success: true,
    logs: metrics.recentLogs,
  });
});

/**
 * DevOps Lab Status API (All 12 Steps Metadata)
 */
app.get('/api/devops/status', (req, res) => {
  res.json({
    success: true,
    status: {
      app: 'EduGrade DevOps',
      version: APP_VERSION,
      releaseName: RELEASE_NAME,
      environment: NODE_ENV,
      uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
      port: PORT,
      host: os.hostname(),
      platform: os.platform(),
      git: {
        branch: 'main',
        latestTag: 'v1.1.0',
        activeCommit: 'a71403d',
        remote: 'https://github.com/Afshaan-shaik/devops-edugrade-practical.git',
      },
      container: {
        name: 'edugrade-web-container',
        image: 'edugrade:1.0.0',
        base: 'node:20-alpine',
        user: 'node',
        healthStatus: 'HEALTHY',
        ports: '80:8080 (Production) / 8080:8080 (Local)',
      },
      stepsCompleted: 12,
      totalSteps: 12,
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
  function startServer(portToUse) {
    serverInstance = app.listen(portToUse, () => {
      logger.info(`EduGrade Server started successfully on port ${portToUse}`, {
        port: portToUse,
        version: APP_VERSION,
        env: NODE_ENV,
        url: `http://localhost:${portToUse}`,
      });
    });

    serverInstance.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = Number(portToUse) + 1;
        logger.warn(`Port ${portToUse} is already in use. Retrying on port ${nextPort}...`);
        startServer(nextPort);
      } else {
        logger.error('Server startup error', { error: err.message });
      }
    });
  }

  startServer(PORT);

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
