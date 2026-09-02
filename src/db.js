/**
 * Database Module for MySQL Integration
 * Handles connection pooling, queries, and graceful fallbacks
 */

const mysql = require('mysql2/promise');
const logger = require('./logger');

let pool = null;
let isConnected = false;

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edugrade_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

/**
 * Initialize MySQL Connection Pool
 */
async function initDb() {
  try {
    pool = mysql.createPool(DB_CONFIG);
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    isConnected = true;
    logger.info('MySQL Database connected successfully', {
      host: DB_CONFIG.host,
      database: DB_CONFIG.database,
      port: DB_CONFIG.port,
    });
    return true;
  } catch (err) {
    isConnected = false;
    logger.warn('MySQL Database not reachable. Running in standalone mode.', {
      error: err.message,
      host: DB_CONFIG.host,
    });
    return false;
  }
}

/**
 * Save Student Evaluation and Subjects into MySQL
 */
async function saveEvaluationRecord({ student, result }) {
  if (!isConnected || !pool) {
    throw new Error('MySQL Database is not connected');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Insert or update student master
    const [studentResult] = await connection.execute(
      `INSERT INTO students (full_name, roll_no, course, semester, academic_year, institution)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         course = VALUES(course),
         semester = VALUES(semester),
         academic_year = VALUES(academic_year),
         institution = VALUES(institution)`,
      [
        student.name || 'Anonymous',
        student.rollNo || `ROLL-${Date.now()}`,
        student.course || 'MCA',
        student.semester || 'Semester 4',
        student.year || '2025-2026',
        student.institution || "KLE Society's P. C. Jabin Science College",
      ]
    );

    // Get student ID
    let studentId = studentResult.insertId;
    if (!studentId) {
      const [rows] = await connection.execute('SELECT id FROM students WHERE roll_no = ?', [student.rollNo]);
      if (rows.length > 0) studentId = rows[0].id;
    }

    // 2. Insert evaluation summary
    const [evalResult] = await connection.execute(
      `INSERT INTO evaluations (student_id, total_marks, max_marks, percentage, sgpa, grade, result_status, total_credits)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        result.totalMarks || 0,
        result.maxMarks || 0,
        result.overallPercentage || 0,
        result.sgpa || 0,
        result.grade || 'F',
        result.resultStatus || 'FAILED',
        result.totalCredits || 0,
      ]
    );

    const evaluationId = evalResult.insertId;

    // 3. Insert subjects breakdown
    if (Array.isArray(result.subjects)) {
      for (const sub of result.subjects) {
        await connection.execute(
          `INSERT INTO evaluation_subjects (evaluation_id, subject_name, subject_code, marks, max_marks, credits, grade, grade_point)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            evaluationId,
            sub.name || 'Subject',
            sub.code || 'SUB',
            sub.marks || 0,
            sub.maxMarks || sub.max || 100,
            sub.credits || 4,
            sub.grade || 'F',
            sub.gradePoint !== undefined ? sub.gradePoint : (sub.point || 0),
          ]
        );
      }
    }

    await connection.commit();
    return { success: true, evaluationId, studentId };
  } catch (err) {
    await connection.rollback();
    logger.error('Failed to save evaluation to MySQL', { error: err.message });
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Fetch all student evaluations from MySQL
 */
async function getAllEvaluations() {
  if (!isConnected || !pool) return [];
  try {
    const [rows] = await pool.query('SELECT * FROM v_student_report_card ORDER BY evaluated_at DESC');
    return rows;
  } catch (err) {
    logger.error('Failed to fetch evaluations from MySQL', { error: err.message });
    return [];
  }
}

/**
 * Fetch single student evaluation with subject details
 */
async function getEvaluationDetails(evaluationId) {
  if (!isConnected || !pool) return null;
  try {
    const [evalRows] = await pool.execute(
      'SELECT * FROM v_student_report_card WHERE evaluation_id = ?',
      [evaluationId]
    );
    if (evalRows.length === 0) return null;

    const [subRows] = await pool.execute(
      'SELECT * FROM evaluation_subjects WHERE evaluation_id = ?',
      [evaluationId]
    );

    return {
      evaluation: evalRows[0],
      subjects: subRows,
    };
  } catch (err) {
    logger.error('Failed to fetch evaluation details from MySQL', { error: err.message });
    return null;
  }
}

/**
 * Get DB status
 */
function getDbStatus() {
  return {
    connected: isConnected,
    config: {
      host: DB_CONFIG.host,
      database: DB_CONFIG.database,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
    },
  };
}

module.exports = {
  initDb,
  saveEvaluationRecord,
  getAllEvaluations,
  getEvaluationDetails,
  getDbStatus,
};
