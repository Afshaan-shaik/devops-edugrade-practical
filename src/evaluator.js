/**
 * Student Marks & Grade Evaluator Service
 * Handles calculation of Percentage, GPA, Grade Points, and Pass/Fail status
 */

const GRADE_SCALE = [
  { min: 90, grade: 'O', point: 10, label: 'Outstanding' },
  { min: 80, grade: 'A+', point: 9, label: 'Excellent' },
  { min: 70, grade: 'A', point: 8, label: 'Very Good' },
  { min: 60, grade: 'B+', point: 7, label: 'Good' },
  { min: 55, grade: 'B', point: 6, label: 'Above Average' },
  { min: 50, grade: 'C', point: 5, label: 'Average' },
  { min: 40, grade: 'P', point: 4, label: 'Pass' },
  { min: 0, grade: 'F', point: 0, label: 'Fail' },
];

/**
 * Get grade, points, and label for a given percentage score
 * @param {number} percentage 
 * @returns {object}
 */
function getGradeDetails(percentage) {
  const rounded = Math.round(percentage * 100) / 100;
  for (const tier of GRADE_SCALE) {
    if (rounded >= tier.min) {
      return {
        grade: tier.grade,
        gradePoint: tier.point,
        gradeLabel: tier.label,
      };
    }
  }
  return { grade: 'F', gradePoint: 0, gradeLabel: 'Fail' };
}

/**
 * Validates a single subject object
 * @param {object} subject 
 */
function validateSubject(subject, index) {
  if (!subject || typeof subject !== 'object') {
    throw new Error(`Subject at index ${index} must be an object`);
  }

  const name = (subject.name || `Subject ${index + 1}`).trim();
  const marks = Number(subject.marks);
  const maxMarks = subject.maxMarks !== undefined ? Number(subject.maxMarks) : 100;
  const credits = subject.credits !== undefined ? Number(subject.credits) : 3;
  const passMarks = subject.passMarks !== undefined ? Number(subject.passMarks) : Math.ceil(maxMarks * 0.4);

  if (isNaN(marks)) {
    throw new Error(`Marks for "${name}" must be a valid number`);
  }
  if (isNaN(maxMarks) || maxMarks <= 0) {
    throw new Error(`Maximum marks for "${name}" must be greater than 0`);
  }
  if (marks < 0 || marks > maxMarks) {
    throw new Error(`Marks for "${name}" (${marks}) must be between 0 and ${maxMarks}`);
  }
  if (isNaN(credits) || credits <= 0) {
    throw new Error(`Credits for "${name}" must be a positive number`);
  }

  return { name, marks, maxMarks, credits, passMarks };
}

/**
 * Evaluates student performance across an array of subjects
 * @param {Array} subjects - List of subjects
 * @param {object} studentInfo - Optional student metadata (name, rollNo, semester)
 * @returns {object} Full evaluation report
 */
function evaluateResults(subjects, studentInfo = {}) {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    throw new Error('Subjects list must be a non-empty array');
  }

  let totalMarksObtained = 0;
  let totalMaxMarks = 0;
  let totalCredits = 0;
  let weightedGradePoints = 0;
  let failedSubjectsCount = 0;

  const processedSubjects = subjects.map((sub, idx) => {
    const validated = validateSubject(sub, idx);
    const percentage = (validated.marks / validated.maxMarks) * 100;
    const gradeDetails = getGradeDetails(percentage);
    const isPassed = validated.marks >= validated.passMarks;

    if (!isPassed) {
      failedSubjectsCount += 1;
    }

    totalMarksObtained += validated.marks;
    totalMaxMarks += validated.maxMarks;
    totalCredits += validated.credits;
    weightedGradePoints += gradeDetails.gradePoint * validated.credits;

    return {
      name: validated.name,
      marks: validated.marks,
      maxMarks: validated.maxMarks,
      credits: validated.credits,
      passMarks: validated.passMarks,
      percentage: Number(percentage.toFixed(2)),
      grade: gradeDetails.grade,
      gradePoint: gradeDetails.gradePoint,
      gradeLabel: gradeDetails.gradeLabel,
      status: isPassed ? 'PASS' : 'FAIL',
    };
  });

  const overallPercentage = Number(((totalMarksObtained / totalMaxMarks) * 100).toFixed(2));
  const gpa = totalCredits > 0 ? Number((weightedGradePoints / totalCredits).toFixed(2)) : 0;
  const overallGradeDetails = getGradeDetails(overallPercentage);

  // Overall pass/fail condition
  const isOverallPassed = failedSubjectsCount === 0;

  let division = 'Failed';
  if (isOverallPassed) {
    if (overallPercentage >= 75) {
      division = 'First Class with Distinction';
    } else if (overallPercentage >= 60) {
      division = 'First Class';
    } else if (overallPercentage >= 50) {
      division = 'Second Class';
    } else {
      division = 'Pass Class';
    }
  }

  // Find top and lowest scoring subjects
  const sorted = [...processedSubjects].sort((a, b) => b.percentage - a.percentage);
  const highestSubject = sorted[0];
  const lowestSubject = sorted[sorted.length - 1];

  return {
    student: {
      name: (studentInfo.name || 'Anonymous Student').trim(),
      rollNo: (studentInfo.rollNo || 'N/A').trim(),
      semester: (studentInfo.semester || 'Current Semester').trim(),
      academicYear: studentInfo.academicYear || new Date().getFullYear().toString(),
    },
    summary: {
      totalSubjects: processedSubjects.length,
      totalMarksObtained: Number(totalMarksObtained.toFixed(2)),
      totalMaxMarks,
      overallPercentage,
      gpa,
      grade: isOverallPassed ? overallGradeDetails.grade : 'F',
      gradeLabel: isOverallPassed ? overallGradeDetails.gradeLabel : 'Fail',
      resultStatus: isOverallPassed ? 'PASSED' : 'FAILED',
      division,
      failedSubjectsCount,
      highestScore: { subject: highestSubject.name, marks: highestSubject.marks, percentage: highestSubject.percentage },
      lowestScore: { subject: lowestSubject.name, marks: lowestSubject.marks, percentage: lowestSubject.percentage },
    },
    subjects: processedSubjects,
    evaluatedAt: new Date().toISOString(),
  };
}

module.exports = {
  GRADE_SCALE,
  getGradeDetails,
  validateSubject,
  evaluateResults,
};
