/**
 * EduGrade Frontend Application Logic
 * DevOps Practical Demo - Connects to Express REST API & Health Services
 */

// Default Presets
const PRESET_ENGINEERING = [
  { name: 'DevOps & Cloud Engineering', marks: 88, maxMarks: 100, credits: 4 },
  { name: 'Data Structures & Algorithms', marks: 82, maxMarks: 100, credits: 4 },
  { name: 'Operating Systems', marks: 76, maxMarks: 100, credits: 3 },
  { name: 'Computer Networks', marks: 85, maxMarks: 100, credits: 3 },
  { name: 'Database Management Systems', marks: 91, maxMarks: 100, credits: 3 },
];

const PRESET_HIGH_SCHOOL = [
  { name: 'Mathematics', marks: 95, maxMarks: 100, credits: 1 },
  { name: 'Physics', marks: 84, maxMarks: 100, credits: 1 },
  { name: 'Chemistry', marks: 79, maxMarks: 100, credits: 1 },
  { name: 'Computer Science', marks: 92, maxMarks: 100, credits: 1 },
  { name: 'English Literature', marks: 80, maxMarks: 100, credits: 1 },
  { name: 'Environmental Studies', marks: 87, maxMarks: 100, credits: 1 },
];

// DOM Elements
const subjectsBody = document.getElementById('subjectsBody');
const btnAddSubject = document.getElementById('btnAddSubject');
const marksForm = document.getElementById('marksForm');
const btnCalculate = document.getElementById('btnCalculate');
const btnPrintReport = document.getElementById('btnPrintReport');
const resultPlaceholder = document.getElementById('resultPlaceholder');
const resultContent = document.getElementById('resultContent');

// Status & Version Elements
const containerStatusBadge = document.getElementById('containerStatusBadge');
const statusLabelText = document.getElementById('statusLabelText');
const versionBadge = document.getElementById('versionBadge');

// Preset Buttons
const presetEngineering = document.getElementById('presetEngineering');
const presetHighSchool = document.getElementById('presetHighSchool');
const presetSampleData = document.getElementById('presetSampleData');
const presetClear = document.getElementById('presetClear');

// Modal Elements
const devOpsModal = document.getElementById('devOpsModal');
const btnDevOpsModal = document.getElementById('btnDevOpsModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const diagStatus = document.getElementById('diagStatus');
const diagVersion = document.getElementById('diagVersion');
const diagEnv = document.getElementById('diagEnv');
const diagHost = document.getElementById('diagHost');
const diagUptime = document.getElementById('diagUptime');
const diagNode = document.getElementById('diagNode');

// UGC Scale Toggle
const scaleToggle = document.getElementById('scaleToggle');
const scaleBody = document.getElementById('scaleBody');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSubjectRows(PRESET_ENGINEERING);
  checkServiceHealth();
  setInterval(checkServiceHealth, 12000); // Poll health every 12 seconds
});

// Event Listeners
btnAddSubject.addEventListener('click', () => addSubjectRow());
presetEngineering.addEventListener('click', () => loadSubjectRows(PRESET_ENGINEERING));
presetHighSchool.addEventListener('click', () => loadSubjectRows(PRESET_HIGH_SCHOOL));
presetSampleData.addEventListener('click', () => loadSubjectRows(PRESET_ENGINEERING));
presetClear.addEventListener('click', () => clearAllRows());

btnPrintReport.addEventListener('click', () => {
  window.print();
});

// UGC Scale toggle
scaleToggle.addEventListener('click', () => {
  scaleToggle.classList.toggle('open');
  scaleBody.classList.toggle('open');
});

// DevOps Modal controls
btnDevOpsModal.addEventListener('click', () => {
  devOpsModal.classList.add('open');
  checkServiceHealth();
});
btnCloseModal.addEventListener('click', () => devOpsModal.classList.remove('open'));
devOpsModal.addEventListener('click', (e) => {
  if (e.target === devOpsModal) devOpsModal.classList.remove('open');
});

/**
 * Loads a set of subjects into the input table
 */
function loadSubjectRows(subjectsList) {
  subjectsBody.innerHTML = '';
  subjectsList.forEach((sub) => addSubjectRow(sub.name, sub.marks, sub.maxMarks, sub.credits));
}

/**
 * Clears all subject rows and leaves one empty row
 */
function clearAllRows() {
  subjectsBody.innerHTML = '';
  addSubjectRow('', '', 100, 3);
  resetResults();
}

/**
 * Adds a new subject row to the table
 */
function addSubjectRow(name = '', marks = '', maxMarks = 100, credits = 3) {
  const row = document.createElement('tr');
  row.className = 'subject-row';
  row.innerHTML = `
    <td>
      <input type="text" class="table-input sub-name" placeholder="Subject Name" value="${escapeHtml(name)}" required>
    </td>
    <td>
      <input type="number" class="table-input sub-marks" placeholder="0" min="0" max="${maxMarks}" value="${marks}" required>
    </td>
    <td>
      <input type="number" class="table-input sub-max" placeholder="100" min="1" value="${maxMarks}" required>
    </td>
    <td>
      <input type="number" class="table-input sub-credits" placeholder="3" min="1" max="10" value="${credits}" required>
    </td>
    <td>
      <button type="button" class="btn-remove-row" title="Remove Subject">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </td>
  `;

  // Attach delete button handler
  row.querySelector('.btn-remove-row').addEventListener('click', () => {
    if (subjectsBody.querySelectorAll('tr').length > 1) {
      row.remove();
    } else {
      alert('At least one subject is required.');
    }
  });

  // Dynamically update max attribute of marks when maxMarks changes
  const marksInput = row.querySelector('.sub-marks');
  const maxInput = row.querySelector('.sub-max');
  maxInput.addEventListener('input', () => {
    marksInput.max = maxInput.value || 100;
  });

  subjectsBody.appendChild(row);
}

/**
 * Handle Form Submission & Result Calculation
 */
marksForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const rows = subjectsBody.querySelectorAll('.subject-row');
  const subjects = [];

  for (const row of rows) {
    const name = row.querySelector('.sub-name').value.trim();
    const marks = parseFloat(row.querySelector('.sub-marks').value);
    const maxMarks = parseFloat(row.querySelector('.sub-max').value);
    const credits = parseFloat(row.querySelector('.sub-credits').value);

    if (!name) {
      alert('Please provide a name for every subject.');
      return;
    }
    if (isNaN(marks) || marks < 0 || marks > maxMarks) {
      alert(`Invalid marks for "${name}". Must be between 0 and ${maxMarks}.`);
      return;
    }

    subjects.push({ name, marks, maxMarks, credits });
  }

  const studentInfo = {
    name: document.getElementById('studentName').value,
    rollNo: document.getElementById('studentRoll').value,
    semester: document.getElementById('studentSemester').value,
    academicYear: document.getElementById('academicYear').value,
  };

  btnCalculate.disabled = true;
  btnCalculate.innerHTML = `Calculating...`;

  try {
    const response = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjects, studentInfo }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Evaluation calculation failed');
    }

    renderResults(data.data);
  } catch (error) {
    console.error('Calculation API Error:', error);
    alert(`Error: ${error.message}`);
  } finally {
    btnCalculate.disabled = false;
    btnCalculate.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
      Calculate Results
    `;
  }
});

/**
 * Renders the returned result data into the DOM
 */
function renderResults(result) {
  resultPlaceholder.classList.add('hidden');
  resultContent.classList.remove('hidden');
  btnPrintReport.disabled = false;

  const { summary, subjects } = result;

  // Banner
  const outcomeBanner = document.getElementById('outcomeBanner');
  const outcomeStatus = document.getElementById('outcomeStatus');
  const outcomeDivision = document.getElementById('outcomeDivision');
  const outcomeGradePill = document.getElementById('outcomeGradePill');
  const outcomeIcon = document.getElementById('outcomeIcon');

  if (summary.resultStatus === 'PASSED') {
    outcomeBanner.classList.remove('fail');
    outcomeStatus.textContent = 'PASSED';
    outcomeIcon.textContent = '✓';
    outcomeDivision.textContent = summary.division;
  } else {
    outcomeBanner.classList.add('fail');
    outcomeStatus.textContent = 'FAILED';
    outcomeIcon.textContent = '✗';
    outcomeDivision.textContent = `Failed in ${summary.failedSubjectsCount} subject(s)`;
  }

  outcomeGradePill.textContent = `${summary.grade} (${summary.gpa})`;

  // Key Metrics
  document.getElementById('valPercentage').textContent = `${summary.overallPercentage}%`;
  document.getElementById('barPercentage').style.width = `${Math.min(100, Math.max(0, summary.overallPercentage))}%`;
  document.getElementById('valGpa').textContent = summary.gpa.toFixed(2);
  document.getElementById('valTotalMarks').textContent = `${summary.totalMarksObtained} / ${summary.totalMaxMarks}`;
  document.getElementById('valSubjectCount').textContent = `${summary.totalSubjects} Subjects`;
  document.getElementById('valGradeLabel').textContent = summary.gradeLabel;
  document.getElementById('valFailedCount').textContent = summary.failedSubjectsCount === 0 ? '0 Backlogs' : `${summary.failedSubjectsCount} Backlogs`;

  // Subject Table
  const reportBody = document.getElementById('reportTableBody');
  reportBody.innerHTML = '';
  subjects.forEach((sub) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(sub.name)}</strong></td>
      <td>${sub.marks} / ${sub.maxMarks}</td>
      <td>${sub.percentage}%</td>
      <td><strong>${sub.grade}</strong></td>
      <td>${sub.gradePoint}</td>
      <td>${sub.credits}</td>
      <td>
        <span class="${sub.status === 'PASS' ? 'badge-pass' : 'badge-fail'}">${sub.status}</span>
      </td>
    `;
    reportBody.appendChild(tr);
  });

  // Highlights
  document.getElementById('hlTopSubject').textContent = summary.highestScore.subject;
  document.getElementById('hlTopScore').textContent = `${summary.highestScore.marks} marks (${summary.highestScore.percentage}%)`;
  document.getElementById('hlLowSubject').textContent = summary.lowestScore.subject;
  document.getElementById('hlLowScore').textContent = `${summary.lowestScore.marks} marks (${summary.lowestScore.percentage}%)`;
}

/**
 * Resets the results view back to placeholder
 */
function resetResults() {
  resultPlaceholder.classList.remove('hidden');
  resultContent.classList.add('hidden');
  btnPrintReport.disabled = true;
}

/**
 * Checks service health & updates UI
 */
async function checkServiceHealth() {
  try {
    const res = await fetch('/health');
    if (!res.ok) throw new Error('Health check returned non-200');

    const data = await res.json();
    const dot = containerStatusBadge.querySelector('.status-dot');
    dot.className = 'status-dot healthy';
    statusLabelText.textContent = `Online (${data.status})`;

    versionBadge.textContent = `v${data.version}`;

    // Diagnostics modal
    diagStatus.textContent = data.status;
    diagVersion.textContent = `v${data.version}`;
    diagEnv.textContent = data.environment;
    diagHost.textContent = data.host;
    diagUptime.textContent = `${data.uptimeSeconds}s`;
    diagNode.textContent = data.system.nodeVersion;
  } catch (err) {
    const dot = containerStatusBadge.querySelector('.status-dot');
    dot.className = 'status-dot unhealthy';
    statusLabelText.textContent = 'Offline';
    diagStatus.textContent = 'DOWN';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, (tag) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[tag] || tag));
}
