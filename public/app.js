/**
 * EduGrade Student Result & Grade Converter
 * Interactive Client Logic with DevOps Telemetry Integration
 */

const $ = id => document.getElementById(id);
let lastResult = null;
const defaults = ['Software Engineering', 'Machine Learning', 'Cloud Computing', 'Data Mining', 'Java Programming'];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  engineeringTemplate();
  renderRecords();
  updateStats();
  checkBackendHealth();
});

function addSubject(data = {}) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="row-num"></td>
    <td><input class="s-name" placeholder="Subject name" value="${escapeHtml(data.name || '')}"></td>
    <td><input class="s-code" placeholder="Code" value="${escapeHtml(data.code || '')}"></td>
    <td><input class="s-marks" type="number" min="0" placeholder="0" value="${data.marks ?? ''}"></td>
    <td><input class="s-max" type="number" min="1" placeholder="100" value="${data.max ?? 100}"></td>
    <td><input class="s-credit" type="number" min="1" max="10" placeholder="4" value="${data.credit ?? 4}"></td>
    <td><button class="remove" title="Remove" onclick="removeSubject(this)">×</button></td>
  `;
  $('subjectRows').appendChild(tr);
  renumber();
}

function removeSubject(btn) {
  if ($('subjectRows').children.length <= 1) {
    return showError('At least one subject is required.');
  }
  btn.closest('tr').remove();
  renumber();
}

function renumber() {
  [...$('subjectRows').children].forEach((r, i) => {
    r.querySelector('.row-num').textContent = String(i + 1).padStart(2, '0');
  });
}

function setSubjects(items) {
  $('subjectRows').innerHTML = '';
  items.forEach(addSubject);
}

function engineeringTemplate() {
  setSubjects(defaults.map((name, i) => ({
    name,
    code: `MCA${101 + i}`,
    max: 100,
    credit: 4
  })));
  toast('Engineering template loaded');
}

function schoolTemplate() {
  setSubjects(['English', 'Mathematics', 'Science', 'Social Science', 'Kannada', 'Computer Science'].map((name, i) => ({
    name,
    code: `SUB${101 + i}`,
    max: 100,
    credit: 4
  })));
  toast('High school template loaded');
}

function loadSample() {
  $('name').value = 'Pavan Pujar';
  $('roll').value = 'P02AS25S126035';
  $('course').value = 'MCA';
  $('semester').value = 'Semester 2';
  $('year').value = '2025–2026';
  $('institution').value = "KLE Society's P. C. Jabin Science College";
  setSubjects(defaults.map((name, i) => ({
    name,
    code: `MCA${201 + i}`,
    marks: [86, 78, 91, 74, 83][i],
    max: 100,
    credit: [4, 4, 3, 4, 4][i]
  })));
  location.hash = 'formSection';
  toast('Sample student loaded');
}

function clearAll() {
  $('name').value = '';
  $('roll').value = '';
  $('course').value = '';
  $('report').style.display = 'none';
  engineeringTemplate();
  $('message').className = 'message';
}

function grade(p) {
  if (p >= 90) return ['O', 10, 'Outstanding'];
  if (p >= 80) return ['A+', 9, 'Excellent'];
  if (p >= 70) return ['A', 8, 'Very Good'];
  if (p >= 60) return ['B+', 7, 'Good'];
  if (p >= 55) return ['B', 6, 'Above Average'];
  if (p >= 50) return ['C', 5, 'Average'];
  if (p >= 40) return ['P', 4, 'Pass'];
  return ['F', 0, 'Fail'];
}

function showError(text) {
  $('message').textContent = text;
  $('message').className = 'message error';
  $('message').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function calculate() {
  const name = $('name').value.trim();
  const roll = $('roll').value.trim();

  if (!name || !roll) {
    return showError('Please enter the student name and registration number.');
  }

  const subjects = [];
  for (const row of $('subjectRows').children) {
    const subject = {
      name: row.querySelector('.s-name').value.trim(),
      code: row.querySelector('.s-code').value.trim(),
      marks: Number(row.querySelector('.s-marks').value),
      max: Number(row.querySelector('.s-max').value),
      credit: Number(row.querySelector('.s-credit').value)
    };

    if (!subject.name || !Number.isFinite(subject.marks) || subject.max <= 0 || subject.credit <= 0) {
      return showError('Complete all subject fields with valid positive values.');
    }
    if (subject.marks < 0 || subject.marks > subject.max) {
      return showError(`Marks for ${subject.name} must be between 0 and ${subject.max}.`);
    }

    subject.percent = (subject.marks / subject.max) * 100;
    [subject.grade, subject.point, subject.remark] = grade(subject.percent);
    subject.status = subject.percent >= 40 ? 'PASS' : 'FAIL';
    subjects.push(subject);
  }

  const obtained = subjects.reduce((s, x) => s + x.marks, 0);
  const maximum = subjects.reduce((s, x) => s + x.max, 0);
  const percentage = (obtained / maximum) * 100;
  const totalCredits = subjects.reduce((s, x) => s + x.credit, 0);
  const sgpa = totalCredits > 0 ? (subjects.reduce((s, x) => s + x.point * x.credit, 0) / totalCredits) : 0;
  const passed = subjects.filter(x => x.status === 'PASS').length;
  const result = passed === subjects.length ? 'PASS' : 'FAIL';
  const [finalGrade, , remark] = grade(percentage);

  let classification = percentage >= 75 ? 'Distinction' :
                       percentage >= 60 ? 'First Class' :
                       percentage >= 50 ? 'Second Class' :
                       percentage >= 40 ? 'Pass Class' : 'Fail';

  if (result === 'FAIL') {
    classification = 'Result Withheld — Failed Subject';
  }

  lastResult = {
    id: Date.now(),
    name,
    roll,
    course: $('course').value.trim() || '—',
    semester: $('semester').value,
    year: $('year').value,
    institution: $('institution').value,
    subjects,
    obtained,
    maximum,
    percentage,
    sgpa,
    passed,
    result,
    finalGrade,
    classification,
    remark
  };

  renderReport();
  $('message').className = 'message';
  $('report').style.display = 'block';
  $('report').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Telemetry: notify backend REST API so server logs request and updates /metrics
  syncEvaluationTelemetry(lastResult);
}

function renderReport() {
  const r = lastResult;
  $('initials').textContent = r.name.split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase();
  $('reportName').textContent = r.name;
  $('reportRoll').textContent = r.roll;
  $('reportCourse').textContent = r.course;
  $('reportSem').textContent = r.semester;
  $('reportInstitution').textContent = r.institution;
  $('reportYear').textContent = r.year;
  $('percentage').textContent = r.percentage.toFixed(1) + '%';
  $('scoreRing').style.background = `conic-gradient(${r.result === 'PASS' ? '#2563eb' : '#ef4444'} ${r.percentage * 3.6}deg, #e8edf4 0)`;
  $('totalMarks').textContent = `${r.obtained} / ${r.maximum}`;
  $('sgpa').textContent = r.sgpa.toFixed(2);
  $('finalGrade').textContent = r.result === 'PASS' ? r.finalGrade : 'F';
  $('passedCount').textContent = `${r.passed} / ${r.subjects.length}`;
  $('classification').textContent = r.classification;

  const pill = $('resultPill');
  pill.textContent = r.result;
  pill.className = 'result-pill ' + (r.result === 'PASS' ? 'pass' : 'fail');

  $('resultRows').innerHTML = r.subjects.map(s => `
    <tr>
      <td><strong>${escapeHtml(s.name)}</strong></td>
      <td>${escapeHtml(s.code || '—')}</td>
      <td>${s.marks} / ${s.max}</td>
      <td>${s.percent.toFixed(1)}%</td>
      <td>${s.credit}</td>
      <td><strong>${s.grade}</strong></td>
      <td>${s.point}</td>
      <td><span class="result-pill ${s.status === 'PASS' ? 'pass' : 'fail'}" style="padding:5px 8px">${s.status}</span></td>
    </tr>
  `).join('');

  $('performanceText').textContent = r.result === 'PASS'
    ? `${r.remark} performance. ${r.name} has successfully passed all ${r.subjects.length} subjects with an overall percentage of ${r.percentage.toFixed(1)}%.`
    : `${r.name} must clear ${r.subjects.length - r.passed} failed subject(s). Minimum 40% is required in every subject.`;
}

function records() {
  try {
    return JSON.parse(localStorage.getItem('edugrade-records')) || [];
  } catch {
    return [];
  }
}

function saveRecord() {
  if (!lastResult) return;
  let list = records();
  const index = list.findIndex(x => x.roll.toLowerCase() === lastResult.roll.toLowerCase());
  if (index >= 0) {
    list[index] = lastResult;
  } else {
    list.unshift(lastResult);
  }
  localStorage.setItem('edugrade-records', JSON.stringify(list));
  renderRecords();
  updateStats();
  toast(index >= 0 ? 'Record updated' : 'Student result saved');
}

function deleteRecord(id) {
  if (!confirm('Delete this student record?')) return;
  localStorage.setItem('edugrade-records', JSON.stringify(records().filter(x => x.id !== id)));
  renderRecords();
  updateStats();
  toast('Record deleted');
}

function viewRecord(id) {
  lastResult = records().find(x => x.id === id);
  if (!lastResult) return;
  renderReport();
  $('report').style.display = 'block';
  $('report').scrollIntoView({ behavior: 'smooth' });
}

function renderRecords() {
  const q = $('search').value.toLowerCase();
  const f = $('filter').value;
  const list = records().filter(x => (x.name.toLowerCase().includes(q) || x.roll.toLowerCase().includes(q)) && (f === 'all' || x.result === f));

  $('recordsRows').innerHTML = list.map(x => `
    <tr>
      <td><strong>${escapeHtml(x.name)}</strong></td>
      <td>${escapeHtml(x.roll)}</td>
      <td>${escapeHtml(x.course)}</td>
      <td>${escapeHtml(x.semester)}</td>
      <td>${x.percentage.toFixed(1)}%</td>
      <td>${x.sgpa.toFixed(2)}</td>
      <td>${x.result === 'PASS' ? x.finalGrade : 'F'}</td>
      <td><span class="result-pill ${x.result === 'PASS' ? 'pass' : 'fail'}" style="padding:5px 8px">${x.result}</span></td>
      <td>
        <button class="btn btn-soft" style="padding:7px 10px" onclick="viewRecord(${x.id})">View</button>
        <button class="remove" onclick="deleteRecord(${x.id})">×</button>
      </td>
    </tr>
  `).join('');

  $('empty').style.display = list.length ? 'none' : 'block';
}

function updateStats() {
  const list = records();
  const passed = list.filter(x => x.result === 'PASS').length;
  const avg = list.length ? list.reduce((s, x) => s + x.sgpa, 0) / list.length : 0;
  $('totalStudents').textContent = list.length;
  $('passRate').textContent = (list.length ? (passed / list.length * 100) : 0).toFixed(0) + '%';
  $('avgSgpa').textContent = avg.toFixed(1);
  $('reportCount').textContent = list.length;
}

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[tag] || tag));
}

// DevOps Server Telemetry
async function checkBackendHealth() {
  try {
    const res = await fetch('/health');
    if (res.ok) {
      const data = await res.json();
      const statusText = $('statusText');
      if (statusText) {
        statusText.textContent = `Online · v${data.version || '1.0.0'}`;
      }
    }
  } catch (e) {
    // Graceful fallback for standalone static preview
  }
}

async function syncEvaluationTelemetry(result) {
  try {
    await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentInfo: {
          name: result.name,
          rollNo: result.roll,
          course: result.course,
          semester: result.semester,
          academicYear: result.year,
        },
        subjects: result.subjects.map(s => ({
          name: s.name,
          marks: s.marks,
          maxMarks: s.max,
          credits: s.credit
        }))
      })
    });
  } catch (err) {
    // Non-blocking telemetry
  }
}
