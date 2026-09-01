/**
 * Unit Tests for Student Marks & Grade Evaluator
 */

const {
  getGradeDetails,
  validateSubject,
  evaluateResults,
  GRADE_SCALE,
} = require('../src/evaluator');

describe('Grade Scale Details', () => {
  test('should return Outstanding (O, 10 points) for score >= 90', () => {
    const res = getGradeDetails(95);
    expect(res.grade).toBe('O');
    expect(res.gradePoint).toBe(10);
    expect(res.gradeLabel).toBe('Outstanding');
  });

  test('should return Excellent (A+, 9 points) for score 85', () => {
    const res = getGradeDetails(85);
    expect(res.grade).toBe('A+');
    expect(res.gradePoint).toBe(9);
  });

  test('should return Very Good (A, 8 points) for score 72', () => {
    const res = getGradeDetails(72);
    expect(res.grade).toBe('A');
    expect(res.gradePoint).toBe(8);
  });

  test('should return Fail (F, 0 points) for score below 40', () => {
    const res = getGradeDetails(35);
    expect(res.grade).toBe('F');
    expect(res.gradePoint).toBe(0);
  });

  test('should handle exact boundary conditions correctly', () => {
    expect(getGradeDetails(90).grade).toBe('O');
    expect(getGradeDetails(80).grade).toBe('A+');
    expect(getGradeDetails(70).grade).toBe('A');
    expect(getGradeDetails(60).grade).toBe('B+');
    expect(getGradeDetails(55).grade).toBe('B');
    expect(getGradeDetails(50).grade).toBe('C');
    expect(getGradeDetails(40).grade).toBe('P');
    expect(getGradeDetails(39.9).grade).toBe('F');
  });
});

describe('Subject Validation', () => {
  test('should validate and normalize a valid subject', () => {
    const valid = validateSubject({ name: 'DevOps', marks: 85, maxMarks: 100, credits: 4 }, 0);
    expect(valid.name).toBe('DevOps');
    expect(valid.marks).toBe(85);
    expect(valid.maxMarks).toBe(100);
    expect(valid.credits).toBe(4);
    expect(valid.passMarks).toBe(40);
  });

  test('should throw error on non-object subject', () => {
    expect(() => validateSubject(null, 0)).toThrow('Subject at index 0 must be an object');
  });

  test('should throw error when marks are NaN', () => {
    expect(() => validateSubject({ marks: 'abc' }, 0)).toThrow('Marks for "Subject 1" must be a valid number');
  });

  test('should throw error when marks exceed maxMarks', () => {
    expect(() => validateSubject({ name: 'Math', marks: 105, maxMarks: 100 }, 0)).toThrow(
      'Marks for "Math" (105) must be between 0 and 100'
    );
  });

  test('should throw error when marks are negative', () => {
    expect(() => validateSubject({ name: 'Physics', marks: -5, maxMarks: 100 }, 0)).toThrow(
      'Marks for "Physics" (-5) must be between 0 and 100'
    );
  });
});

describe('Overall Result Evaluation', () => {
  const sampleSubjects = [
    { name: 'DevOps', marks: 90, maxMarks: 100, credits: 4 },
    { name: 'Cloud Computing', marks: 80, maxMarks: 100, credits: 4 },
    { name: 'Operating Systems', marks: 70, maxMarks: 100, credits: 3 },
  ];

  test('should compute total marks, percentage, and SGPA accurately', () => {
    const result = evaluateResults(sampleSubjects, { name: 'Alice', rollNo: 'CS101' });

    expect(result.student.name).toBe('Alice');
    expect(result.student.rollNo).toBe('CS101');
    expect(result.summary.totalSubjects).toBe(3);
    expect(result.summary.totalMarksObtained).toBe(240);
    expect(result.summary.totalMaxMarks).toBe(300);
    expect(result.summary.overallPercentage).toBe(80);
    expect(result.summary.resultStatus).toBe('PASSED');
    expect(result.summary.division).toBe('First Class with Distinction');
    // SGPA = (10*4 + 9*4 + 8*3) / (4+4+3) = (40 + 36 + 24) / 11 = 100 / 11 = 9.09
    expect(result.summary.gpa).toBe(9.09);
  });

  test('should mark as FAILED if any single subject has marks < passMarks', () => {
    const failedSubjects = [
      { name: 'DevOps', marks: 95, maxMarks: 100, credits: 4 },
      { name: 'Chemistry', marks: 32, maxMarks: 100, credits: 4 }, // Failed
    ];
    const result = evaluateResults(failedSubjects);
    expect(result.summary.resultStatus).toBe('FAILED');
    expect(result.summary.failedSubjectsCount).toBe(1);
    expect(result.summary.division).toBe('Failed');
  });

  test('should reject empty subjects array', () => {
    expect(() => evaluateResults([])).toThrow('Subjects list must be a non-empty array');
  });
});
