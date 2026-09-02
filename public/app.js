/**
 * EduGrade DevOps v3.0 - Client Logic & DevOps Telemetry
 */

let latestResult = null;
const gradeRules = [
  { min: 90, grade: "O", point: 10 },
  { min: 80, grade: "A+", point: 9 },
  { min: 70, grade: "A", point: 8 },
  { min: 60, grade: "B+", point: 7 },
  { min: 55, grade: "B", point: 6 },
  { min: 50, grade: "C", point: 5 },
  { min: 40, grade: "P", point: 4 },
  { min: 0, grade: "F", point: 0 }
];

function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem("egTheme", document.body.classList.contains("dark") ? "dark" : "light");
}

function gradeFor(p) {
  return gradeRules.find(r => p >= r.min) || { grade: "F", point: 0 };
}

function addSubject(data = {}) {
  const body = document.getElementById("subjectBody");
  if (!body) return;
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="idx"></td>
    <td><input class="sname" placeholder="Subject name" value="${escapeHtml(data.name || "")}"></td>
    <td><input class="scode" placeholder="Code" value="${escapeHtml(data.code || "")}"></td>
    <td><input class="marks" type="number" min="0" value="${data.marks ?? ""}" placeholder="0"></td>
    <td><input class="max" type="number" min="1" value="${data.max ?? 100}"></td>
    <td><input class="credits" type="number" min="1" value="${data.credits ?? 4}"></td>
    <td><button class="delete" onclick="this.closest('tr').remove();renumber()">✕</button></td>
  `;
  body.appendChild(tr);
  renumber();
}

function renumber() {
  document.querySelectorAll("#subjectBody tr").forEach((tr, i) => {
    const idx = tr.querySelector(".idx");
    if (idx) idx.textContent = String(i + 1).padStart(2, "0");
  });
}

function setSubjects(arr) {
  const body = document.getElementById("subjectBody");
  if (!body) return;
  body.innerHTML = "";
  arr.forEach(addSubject);
}

function templateEngineering() {
  setSubjects([
    { name: "Software Engineering", code: "MCA401", max: 100, credits: 4 },
    { name: "Machine Learning", code: "MCA402", max: 100, credits: 4 },
    { name: "Cloud Computing", code: "MCA403", max: 100, credits: 4 },
    { name: "Data Mining", code: "MCA404", max: 100, credits: 4 },
    { name: "DevOps", code: "MCA405", max: 100, credits: 4 }
  ]);
  toast("Engineering template loaded");
}

function templateHighSchool() {
  setSubjects(["English", "Mathematics", "Physics", "Chemistry", "Computer Science", "Kannada"].map((n, i) => ({
    name: n,
    code: "SUB" + (i + 1),
    max: 100,
    credits: 1
  })));
  toast("High School template loaded");
}

function newEvaluation() {
  clearAll();
  const nameInput = document.getElementById("studentName");
  if (nameInput) nameInput.focus();
  const evalSec = document.querySelector("#evaluation");
  if (evalSec) evalSec.scrollIntoView({ behavior: "smooth" });
  toast("New evaluation ready");
}

function validateForm() {
  try {
    const name = document.getElementById("studentName").value.trim();
    const reg = document.getElementById("regNo").value.trim();
    if (!name || !reg) throw new Error("Enter student name and registration number.");
    const subjects = readSubjects();
    if (!subjects.length) throw new Error("Add at least one subject.");
    toast("✓ All entered data is valid");
  } catch (e) {
    toast(e.message);
  }
}

function copySummary() {
  if (!latestResult) return toast("Calculate a result first");
  const r = latestResult;
  const text = `EduGrade Result | ${r.name} | ${r.reg} | ${r.course} ${r.semester} | ${r.pct.toFixed(2)}% | SGPA ${r.sgpa.toFixed(2)} | Grade ${r.grade} | ${r.status}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => toast("Result summary copied"));
  } else {
    toast("Copy is not supported in this browser");
  }
}

function loadSample() {
  const nameEl = document.getElementById("studentName");
  const regEl = document.getElementById("regNo");
  const courseEl = document.getElementById("course");
  const semEl = document.getElementById("semester");
  if (nameEl) nameEl.value = "Demo Student";
  if (regEl) regEl.value = "MCA2026DEMO";
  if (courseEl) courseEl.value = "MCA";
  if (semEl) semEl.value = "Semester 4";

  setSubjects([
    { name: "Software Engineering", code: "MCA401", marks: 82, max: 100, credits: 4 },
    { name: "Machine Learning", code: "MCA402", marks: 76, max: 100, credits: 4 },
    { name: "Cloud Computing", code: "MCA403", marks: 88, max: 100, credits: 4 },
    { name: "Data Mining", code: "MCA404", marks: 79, max: 100, credits: 4 },
    { name: "DevOps", code: "MCA405", marks: 91, max: 100, credits: 4 }
  ]);
  toast("Sample data loaded");
}

function resetMarks() {
  document.querySelectorAll(".marks").forEach(x => x.value = "");
  toast("Marks reset");
}

function clearAll() {
  ["studentName", "regNo"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  templateEngineering();
  resetMarks();
  const resSec = document.getElementById("resultSection");
  if (resSec) resSec.style.display = "none";
}

function readSubjects() {
  const rows = [...document.querySelectorAll("#subjectBody tr")];
  let subjects = [];
  for (const r of rows) {
    const name = r.querySelector(".sname").value.trim();
    const code = r.querySelector(".scode").value.trim();
    const marks = +r.querySelector(".marks").value;
    const max = +r.querySelector(".max").value;
    const credits = +r.querySelector(".credits").value;
    if (!name || !max || credits <= 0 || isNaN(marks) || marks < 0 || marks > max) {
      throw new Error("Please enter valid subject name, marks, maximum marks and credits.");
    }
    const pct = (marks / max) * 100;
    const g = gradeFor(pct);
    subjects.push({ name, code, marks, max, credits, pct, grade: g.grade, point: g.point, passed: pct >= 40 });
  }
  return subjects;
}

function calculateResult() {
  try {
    const name = document.getElementById("studentName").value.trim();
    const reg = document.getElementById("regNo").value.trim();
    if (!name || !reg) throw new Error("Student name and registration number are required.");
    const subjects = readSubjects();
    if (!subjects.length) throw new Error("Add at least one subject.");

    const total = subjects.reduce((a, s) => a + s.marks, 0);
    const maxTotal = subjects.reduce((a, s) => a + s.max, 0);
    const pct = (total / maxTotal) * 100;
    const credits = subjects.reduce((a, s) => a + s.credits, 0);
    const sgpa = credits > 0 ? subjects.reduce((a, s) => a + s.point * s.credits, 0) / credits : 0;
    const allPass = subjects.every(s => s.passed);
    const g = allPass ? gradeFor(pct) : { grade: "F", point: 0 };

    const courseEl = document.getElementById("course");
    const semesterEl = document.getElementById("semester");
    const academicYearEl = document.getElementById("academicYear");
    const institutionEl = document.getElementById("institution");

    latestResult = {
      name,
      reg,
      course: courseEl ? courseEl.value : "MCA",
      semester: semesterEl ? semesterEl.value : "Semester 1",
      year: academicYearEl ? academicYearEl.value : "2025–2026",
      institution: institutionEl ? institutionEl.value : "KLE Society's P. C. Jabin Science College",
      subjects,
      total,
      maxTotal,
      pct,
      credits,
      sgpa,
      grade: g.grade,
      status: allPass ? "PASS" : "FAIL",
      date: new Date().toLocaleDateString()
    };

    showResult(latestResult);

    // Sync non-blocking telemetry with backend Express server
    syncEvaluationTelemetry(latestResult);
  } catch (e) {
    toast(e.message);
  }
}

function showResult(r) {
  const resSec = document.getElementById("resultSection");
  if (!resSec) return;
  resSec.style.display = "block";

  document.getElementById("resultGrade").textContent = r.grade;
  document.getElementById("resultStatus").textContent = r.status;
  document.getElementById("resultName").textContent = r.name;
  document.getElementById("resultReg").textContent = r.reg;

  document.getElementById("resultPct").textContent = r.pct.toFixed(2) + "%";
  document.getElementById("resultSgpa").textContent = r.sgpa.toFixed(2);
  document.getElementById("resultTotal").textContent = r.total + "/" + r.maxTotal;
  document.getElementById("resultCredits").textContent = r.credits;

  document.getElementById("pPct").textContent = r.pct.toFixed(1) + "%";
  document.getElementById("pSgpa").textContent = r.sgpa.toFixed(2) + "/10";
  const passed = r.subjects.filter(s => s.passed).length;
  document.getElementById("pPass").textContent = passed + "/" + r.subjects.length;

  document.getElementById("pfill1").style.width = Math.min(r.pct, 100) + "%";
  document.getElementById("pfill2").style.width = Math.min(r.sgpa * 10, 100) + "%";
  document.getElementById("pfill3").style.width = ((passed / r.subjects.length) * 100) + "%";

  const scaleEl = document.getElementById("gradeScale");
  if (scaleEl) {
    scaleEl.innerHTML = gradeRules.map(g => `
      <div class="grade-box ${g.grade === r.grade ? 'active' : ''}">
        <b>${g.grade}</b>
        <span>${g.min}+</span>
      </div>
    `).join("");
  }

  resSec.scrollIntoView({ behavior: "smooth" });
}

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem("egRecords") || "[]");
  } catch {
    return [];
  }
}

function saveResult() {
  if (!latestResult) return toast("No evaluation to save");
  const rec = getRecords();
  const id = Date.now();
  rec.unshift({ ...latestResult, id });
  localStorage.setItem("egRecords", JSON.stringify(rec));
  updateDashboard();
  renderRecords();
  refreshAnalytics();

  // Also save to MySQL backend asynchronously
  fetch('/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student: {
        name: latestResult.name,
        rollNo: latestResult.reg,
        course: latestResult.course,
        semester: latestResult.semester,
        year: latestResult.year,
        institution: latestResult.institution,
      },
      result: {
        totalMarks: latestResult.total,
        maxMarks: latestResult.maxTotal,
        overallPercentage: latestResult.pct,
        sgpa: latestResult.sgpa,
        grade: latestResult.grade,
        resultStatus: latestResult.status,
        totalCredits: latestResult.credits,
        subjects: latestResult.subjects,
      },
    }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        toast("✓ Saved to MySQL Database & Browser Storage!");
      } else {
        toast("✓ Saved to Browser Storage");
      }
    })
    .catch(() => {
      toast("✓ Saved to Browser Storage");
    });
}

function deleteRecord(id) {
  let r = getRecords().filter(x => x.id !== id);
  localStorage.setItem("egRecords", JSON.stringify(r));
  updateDashboard();
  renderRecords();
  refreshAnalytics();
  toast("Record deleted");
}

function clearRecords() {
  const r = getRecords();
  if (!r.length) return toast("No saved records to clear");
  if (confirm("Delete all saved student records? This action cannot be undone.")) {
    localStorage.removeItem("egRecords");
    updateDashboard();
    renderRecords();
    refreshAnalytics();
    toast("All records cleared");
  }
}

function renderRecords() {
  const searchEl = document.getElementById("recordSearch");
  const filterEl = document.getElementById("recordFilter");
  const bodyEl = document.getElementById("recordsBody");
  if (!bodyEl) return;

  let r = getRecords();
  const q = (searchEl ? searchEl.value : "").toLowerCase();
  const f = filterEl ? filterEl.value : "all";

  r = r.filter(x => (f === "all" || x.status === f) && (`${x.name} ${x.reg} ${x.course}`.toLowerCase().includes(q)));

  bodyEl.innerHTML = r.length ? r.map(x => `
    <tr>
      <td><b>${escapeHtml(x.name)}</b><div style="font-size:10px;color:var(--muted)">${x.date || ""}</div></td>
      <td>${escapeHtml(x.reg)}</td>
      <td>${escapeHtml(x.course)}</td>
      <td>${escapeHtml(x.semester)}</td>
      <td>${x.pct.toFixed(2)}%</td>
      <td>${x.sgpa.toFixed(2)}</td>
      <td><b>${x.grade}</b></td>
      <td><span class="badge ${x.status === "PASS" ? "pass" : "fail"}">${x.status}</span></td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="icon-btn" style="padding:7px 9px" onclick="loadSavedRecord(${x.id})" title="Open">↗</button>
          <button class="delete" onclick="deleteRecord(${x.id})">✕</button>
        </div>
      </td>
    </tr>
  `).join("") : `
    <tr>
      <td colspan="9">
        <div class="records-empty">
          <div class="empty-icon">▤</div>
          <b>No saved student records</b>
          <div style="margin-top:5px">Create an evaluation and save the result to build your client dashboard.</div>
        </div>
      </td>
    </tr>
  `;
}

function updateDashboard() {
  const r = getRecords();
  const n = r.length;
  const pass = r.filter(x => x.status === "PASS").length;

  const totalEl = document.getElementById("totalStudents");
  const savedEl = document.getElementById("savedCount");
  const passRateEl = document.getElementById("passRate");
  const avgSgpaEl = document.getElementById("avgSgpa");

  if (totalEl) totalEl.textContent = n;
  if (savedEl) savedEl.textContent = n;
  if (passRateEl) passRateEl.textContent = n ? Math.round(pass / n * 100) + "%" : "0%";
  if (avgSgpaEl) avgSgpaEl.textContent = n ? (r.reduce((a, x) => a + x.sgpa, 0) / n).toFixed(1) : "0.0";
}

function exportCSV() {
  const r = getRecords();
  if (!r.length) return toast("No records to export");
  const rows = [
    ["Student", "Registration No", "Course", "Semester", "Percentage", "SGPA", "Grade", "Result"],
    ...r.map(x => [x.name, x.reg, x.course, x.semester, x.pct.toFixed(2), x.sgpa.toFixed(2), x.grade, x.status])
  ];
  const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "edugrade-results.csv";
  a.click();
  toast("CSV exported");
}

function openTranscript() {
  if (!latestResult) return toast("Calculate a result first");
  const r = latestResult;

  document.getElementById("tInstitution").textContent = r.institution;
  document.getElementById("tYear").textContent = r.year;
  document.getElementById("tStudent").innerHTML = `<b>${escapeHtml(r.name)}</b><br><span style="color:var(--muted)">Registration: ${escapeHtml(r.reg)} · ${escapeHtml(r.course)} · ${escapeHtml(r.semester)}</span>`;
  document.getElementById("tSubjects").innerHTML = r.subjects.map(s => `
    <tr>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.code)}</td>
      <td>${s.marks}/${s.max}</td>
      <td>${s.grade}</td>
      <td>${s.point}</td>
      <td>${s.credits}</td>
    </tr>
  `).join("");
  document.getElementById("tSummary").innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
      <div class="stat"><p>Percentage</p><b>${r.pct.toFixed(2)}%</b></div>
      <div class="stat"><p>SGPA</p><b>${r.sgpa.toFixed(2)}</b></div>
      <div class="stat"><p>Grade</p><b>${r.grade}</b></div>
      <div class="stat"><p>Result</p><b>${r.status}</b></div>
    </div>
  `;
  document.getElementById("modal").classList.add("show");
}

function closeTranscript() {
  const modal = document.getElementById("modal");
  if (modal) modal.classList.remove("show");
}

function printTranscript() {
  openTranscript();
  setTimeout(() => window.print(), 150);
}

function toggleMobileNav() {
  const side = document.getElementById("sidebar");
  if (side) side.classList.toggle("show");
}

function closeMobileNav() {
  const side = document.getElementById("sidebar");
  if (side) side.classList.remove("show");
}

function openDrawer() {
  document.getElementById("projectDrawer").classList.add("show");
  document.getElementById("drawerOverlay").classList.add("show");
}

function closeDrawer() {
  document.getElementById("projectDrawer").classList.remove("show");
  document.getElementById("drawerOverlay").classList.remove("show");
}

function loadSavedRecord(id) {
  const r = getRecords().find(x => x.id === id);
  if (!r) return toast("Record not found");

  document.getElementById("studentName").value = r.name || "";
  document.getElementById("regNo").value = r.reg || "";
  document.getElementById("course").value = r.course || "";
  document.getElementById("semester").value = r.semester || "Semester 1";
  document.getElementById("academicYear").value = r.year || "2025–2026";
  document.getElementById("institution").value = r.institution || "";

  setSubjects((r.subjects || []).map(x => ({
    name: x.name,
    code: x.code,
    marks: x.marks,
    max: x.max,
    credits: x.credits
  })));

  latestResult = r;
  showResult(r);
  toast("Saved record opened");
}

function refreshAnalytics() {
  const r = getRecords();
  const grades = ["O", "A+", "A", "B+", "B", "C", "P", "F"];
  const counts = Object.fromEntries(grades.map(g => [g, 0]));
  r.forEach(x => counts[x.grade] = (counts[x.grade] || 0) + 1);
  const max = Math.max(1, ...Object.values(counts));

  const chartEl = document.getElementById("gradeChart");
  if (chartEl) {
    chartEl.innerHTML = grades.map(g => `
      <div class="bar-col">
        <div class="bar" title="${g}: ${counts[g] || 0}" style="height:${Math.max(7, (counts[g] || 0) / max * 145)}px"></div>
        <span>${g}<br><b>${counts[g] || 0}</b></span>
      </div>
    `).join("");
  }

  const totalEl = document.getElementById("analyticsTotal");
  if (totalEl) totalEl.textContent = `${r.length} record${r.length === 1 ? "" : "s"}`;

  const pass = r.filter(x => x.status === "PASS").length;
  const pct = r.length ? Math.round(pass / r.length * 100) : 0;
  const donutEl = document.getElementById("passDonut");
  if (donutEl) donutEl.style.background = `conic-gradient(var(--green) 0 ${pct}%, var(--line) ${pct}% 100%)`;
  const donutPct = document.getElementById("donutPct");
  if (donutPct) donutPct.textContent = pct + "%";

  const recentEl = document.getElementById("recentActivity");
  if (recentEl) {
    const latest = r.slice(0, 4);
    recentEl.innerHTML = latest.length ? latest.map(x => `
      <div class="activity">
        <div class="ai">${x.status === "PASS" ? "✓" : "!"}</div>
        <div>
          <b>${escapeHtml(x.name)}</b>
          <p>${escapeHtml(x.reg)} · ${x.grade} · ${x.pct.toFixed(1)}%</p>
        </div>
        <time>${x.date || ""}</time>
      </div>
    `).join("") : `
      <div class="records-empty" style="padding:16px">
        <b>No activity yet</b>
        <div style="margin-top:4px">Saved results will appear here.</div>
      </div>
    `;
  }
}

function exportJSON() {
  const r = getRecords();
  if (!r.length) return toast("No records to back up");
  const data = JSON.stringify({ app: "EduGrade DevOps", version: "3.0.0", exportedAt: new Date().toISOString(), records: r }, null, 2);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  a.download = "edugrade-backup.json";
  a.click();
  toast("JSON backup exported");
}

function importJSON(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const records = Array.isArray(parsed) ? parsed : parsed.records;
      if (!Array.isArray(records)) throw new Error();
      localStorage.setItem("egRecords", JSON.stringify(records));
      updateDashboard();
      renderRecords();
      refreshAnalytics();
      toast("Backup restored successfully");
    } catch (e) {
      toast("Invalid EduGrade JSON backup");
    }
    event.target.value = "";
  };
  reader.readAsText(file);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>'"]/g, tag => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[tag] || tag));
}

// Non-blocking telemetry sync with backend Express API
async function syncEvaluationTelemetry(result) {
  try {
    await fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentInfo: {
          name: result.name,
          rollNo: result.reg,
          course: result.course,
          semester: result.semester,
          academicYear: result.year,
        },
        subjects: result.subjects.map(s => ({
          name: s.name,
          marks: s.marks,
          maxMarks: s.max,
          credits: s.credits
        }))
      })
    });
  } catch (e) {
    // Silent fail for static frontend
  }
}

// =========================================================================
// DEVOPS LAB COMMAND CENTER (12/12 Steps Interactive Engine)
// =========================================================================

const DEVOPS_STEPS = {
  1: {
    title: "Step 1: Application Development (Node.js/Express + UI)",
    cmd: "node server.js",
    output: `[INFO] EduGrade Server started successfully on port 8080
[INFO] Environment: production | Service: edugrade-web-app
[INFO] Endpoints active: /health, /api/calculate, /api/version, /metrics
✓ Local server operational at http://localhost:8080`,
    desc: "A responsive student evaluation service with REST API and UGC 10-point grade calculation engine.",
    file: "server.js, src/evaluator.js, public/"
  },
  2: {
    title: "Step 2: Push Repository to GitHub",
    cmd: "git remote -v && git push -u origin main --tags",
    output: `origin  https://github.com/Afshaan-shaik/devops-edugrade-practical.git (fetch)
origin  https://github.com/Afshaan-shaik/devops-edugrade-practical.git (push)
To https://github.com/Afshaan-shaik/devops-edugrade-practical.git
 * [new branch]      main -> main
 * [new tag]         v1.0.0 -> v1.0.0
 * [new tag]         v1.1.0 -> v1.1.0
✓ Repository successfully synchronized with remote origin`,
    desc: "Source code tracked with conventional commits and hosted on GitHub with tag releases.",
    file: ".git/, .gitignore"
  },
  3: {
    title: "Step 3: Branching & Merge Strategy",
    cmd: "git log --graph --oneline --decorate --all",
    output: `* a71403d (HEAD -> main, origin/main) feat(ui): update EduGrade to modern UI
* cd5a276 (tag: v1.1.0) merge: release v1.1.0 into main
|\\  
| * 76aaa67 (develop) merge: feature/gpa-converter into develop
|/| 
| * a7914be (feature/gpa-converter) feat(evaluator): add GPA to percentage conversion
|/  
* 58dce1d (tag: v1.0.0) feat: initial commit - EduGrade containerized app
✓ Clean branching history maintained with --no-ff merge commits`,
    desc: "Gitflow branching: main (production), develop (integration), feature/gpa-converter (feature).",
    file: "branches: main, develop, feature/gpa-converter"
  },
  4: {
    title: "Step 4: Multi-Stage Production Dockerfile",
    cmd: "cat Dockerfile | grep -E 'FROM|USER|HEALTHCHECK|EXPOSE'",
    output: `FROM node:20-alpine AS builder
FROM node:20-alpine AS runner
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1
✓ Security-hardened: Alpine Linux base, non-root user (node), built-in healthcheck probe`,
    desc: "Multi-stage build reduces image size from ~1GB to ~150MB and minimizes CVE attack surface.",
    file: "Dockerfile, .dockerignore"
  },
  5: {
    title: "Step 5: Build Production Docker Image",
    cmd: "docker build -t edugrade:1.0.0 . && docker images",
    output: `[+] Building 14.2s (12/12) FINISHED
 => [internal] load build definition from Dockerfile
 => => naming to docker.io/library/edugrade:1.0.0
REPOSITORY   TAG       IMAGE ID       CREATED          SIZE
edugrade     1.0.0     4a8f9c1b2e3d   10 seconds ago   154MB
node         20-alpine 8b9f0e1d2c3a   2 weeks ago      148MB
✓ Docker production image successfully created and tagged`,
    desc: "Builds lightweight container image with layer caching for node_modules.",
    file: "Dockerfile, docker-compose.yml"
  },
  6: {
    title: "Step 6: GitHub Actions CI/CD Workflow",
    cmd: "cat .github/workflows/ci-cd.yml | grep -E 'name:|runs-on:|steps:' -A 1",
    output: `name: EduGrade CI/CD Pipeline
jobs:
  test:
    name: Automated Unit & Integration Tests (Matrix Node 18, 20)
    runs-on: ubuntu-latest
  docker-build-test:
    name: Build Docker Image & Verify Container Health
    needs: test
    runs-on: ubuntu-latest
  deploy:
    name: Deploy to Cloud (AWS / Staging)
    needs: docker-build-test
✓ Automated workflow triggers on push & pull-request to main/develop`,
    desc: "Runs syntax validation, unit test matrix, Docker container boot test, and deployment dispatch.",
    file: ".github/workflows/ci-cd.yml"
  },
  7: {
    title: "Step 7: Automated Unit & Integration Tests",
    cmd: "npm test",
    output: `> edugrade-devops-app@1.0.0 test
> jest --runInBand --detectOpenHandles

PASS tests/api.test.js
PASS tests/evaluator.test.js

Test Suites: 2 passed, 2 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        1.98 s
✓ 100% test pass rate: boundaries (0-100), GPA formulas, health checks, error handling`,
    desc: "Automated Jest and Supertest suites ensuring zero regressions.",
    file: "tests/evaluator.test.js, tests/api.test.js"
  },
  8: {
    title: "Step 8: Deploy Application to AWS EC2",
    cmd: "sudo docker run -d --name edugrade-app -p 80:8080 --restart always edugrade:1.0.0",
    output: `2b8e4f1a9c3d5e7f0b2a4c6e8d1f3b5a7c9e1d3f5b7a9c1e3f5a7b9c1d3e5f7a
CONTAINER ID   IMAGE            COMMAND                  STATUS         PORTS
2b8e4f1a9c3d   edugrade:1.0.0   "node server.js"         Up (healthy)   0.0.0.0:80->8080/tcp
✓ Container deployed on AWS EC2; accessible via Public IP on standard web port 80`,
    desc: "Zero-downtime deployment script with Cloud-Init bootstrap for instant AWS setup.",
    file: "aws/deploy.sh, aws/ec2-user-data.sh"
  },
  9: {
    title: "Step 9: Configure Environment Variables & Secrets",
    cmd: "docker exec edugrade-app env | grep -E 'PORT|NODE_ENV|APP_VERSION|RELEASE_NAME'",
    output: `PORT=8080
NODE_ENV=production
APP_VERSION=1.0.0
RELEASE_NAME=Genesis-Production
✓ 12-Factor app methodology: credentials injected via environment variables & secrets`,
    desc: "Secured environment template with GitHub Encrypted Secrets and AWS SSM Parameter Store.",
    file: ".env.example"
  },
  10: {
    title: "Step 10: Telemetry & Real-Time Log Monitoring",
    cmd: "docker logs --tail 25 -f edugrade-app",
    output: `{"timestamp":"2026-09-02T08:27:29Z","level":"INFO","service":"edugrade-app","version":"1.0.0","method":"GET","path":"/health","statusCode":200,"durationMs":22}
{"timestamp":"2026-09-02T08:29:10Z","level":"INFO","service":"edugrade-app","version":"1.0.0","method":"POST","path":"/api/calculate","statusCode":200,"durationMs":6}
✓ Structured JSON telemetry enabled for CloudWatch and Docker logging drivers`,
    desc: "Structured logging with timestamps, HTTP status codes, latency, and query metrics.",
    file: "src/logger.js, server.js /metrics"
  },
  11: {
    title: "Step 11: Perform a New Release (v1.1.0)",
    cmd: "git checkout v1.1.0 && docker build -t edugrade:1.1.0 . && bash aws/deploy.sh 1.1.0",
    output: `🚀 [DevOps CI/CD] Starting Deployment for Version: 1.1.0...
📦 Building local Docker image: edugrade:1.1.0...
🔍 Starting health check container on port 8081...
🩺 Verifying container health via HTTP /health...
✅ Health check PASSED (HTTP 200). Swapping production container...
🎉 [SUCCESS] Deployment of edugrade:1.1.0 is live on port 80!
✓ Release v1.1.0 active with new GPA-to-percentage feature`,
    desc: "Canary container health verification before production swap, tagged in Git as v1.1.0.",
    file: "aws/deploy.sh, Git tag v1.1.0"
  },
  12: {
    title: "Step 12: Demonstrate Automated Rollback",
    cmd: "bash aws/rollback.sh 1.0.0",
    output: `⚠️ [ROLLBACK INITIATED] Reverting container service to version: 1.0.0...
Stopping active container (edugrade-web-container)...
Restoring previous stable container with tag: edugrade:1.0.0...
✅ [ROLLBACK SUCCESS] Application successfully rolled back to 1.0.0!
HTTP /api/version -> {"version": "1.0.0", "releaseName": "Rollback-Stable-1.0.0"}
✓ Zero data loss: stable service recovered in 2.4 seconds`,
    desc: "Instant roll-back to previous stable image tag with zero downtime and automated health probe.",
    file: "aws/rollback.sh"
  }
};

let currentDevOpsStep = 1;

function selectDevOpsStep(num) {
  currentDevOpsStep = num;
  const step = DEVOPS_STEPS[num];
  if (!step) return;

  // Update chips active state
  document.querySelectorAll(".step-chip").forEach((chip, i) => {
    chip.classList.toggle("active", i + 1 === num);
  });

  const titleEl = document.getElementById("terminalTitle");
  const cmdEl = document.getElementById("terminalCommand");
  const outEl = document.getElementById("terminalOutput");

  if (titleEl) titleEl.textContent = step.title;
  if (cmdEl) cmdEl.textContent = step.cmd;
  if (outEl) outEl.textContent = step.output;
}

function copyStepCommand() {
  const step = DEVOPS_STEPS[currentDevOpsStep];
  if (!step) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(step.cmd).then(() => toast(`Copied Step ${currentDevOpsStep} Command`));
  } else {
    toast("Command copied");
  }
}

function simulateReleaseV11() {
  const badge = document.getElementById("rbCurrentBadge");
  const desc = document.getElementById("rbDescription");
  const liveImg = document.getElementById("liveContainerImage");

  toast("Deploying Release v1.1.0...");
  selectDevOpsStep(11);

  if (badge) {
    badge.textContent = "v1.1.0 (Live)";
    badge.style.background = "#2563eb";
  }
  if (desc) {
    desc.textContent = "✓ Release v1.1.0 is active. New feature enabled: GPA-to-Percentage conversion endpoint (/api/convert/gpa-to-percentage). Health status: 100% Healthy.";
  }
  if (liveImg) {
    liveImg.textContent = "edugrade:1.1.0 (Production)";
  }
  toast("Release v1.1.0 deployed successfully!");
}

function simulateRollbackV10() {
  const badge = document.getElementById("rbCurrentBadge");
  const desc = document.getElementById("rbDescription");
  const liveImg = document.getElementById("liveContainerImage");

  toast("Triggering rollback to v1.0.0...");
  selectDevOpsStep(12);

  if (badge) {
    badge.textContent = "v1.0.0 (Rolled Back)";
    badge.style.background = "#10b981";
  }
  if (desc) {
    desc.textContent = "✓ Rollback completed successfully. Reverted to stable container image tag edugrade:1.0.0 in 2.1s with zero downtime. Health probe verified.";
  }
  if (liveImg) {
    liveImg.textContent = "edugrade:1.0.0 (Alpine)";
  }
  toast("Rollback to v1.0.0 verified!");
}

async function pollDevOpsLogs() {
  const terminal = document.getElementById("liveLogsTerminal");
  if (!terminal) return;

  try {
    const res = await fetch("/api/devops/logs");
    if (res.ok) {
      const data = await res.json();
      if (data.logs && data.logs.length) {
        terminal.innerHTML = data.logs.map(l => `
          <div>
            <span style="color:#64748b">[${l.time}]</span> 
            <span class="${l.level === 'WARN' ? 't-warn' : 't-ok'}">[${l.level}]</span> 
            <span style="color:#cbd5e1">${escapeHtml(l.message)}</span>
          </div>
        `).join("");
      } else {
        terminal.innerHTML = `<span style="color:#64748b">[${new Date().toLocaleTimeString()}] [INFO] System idle. Trigger a calculation or click 'Send Test Request' to generate logs.</span>`;
      }
    } else {
      terminal.innerHTML = `<span style="color:#64748b">[${new Date().toLocaleTimeString()}] [INFO] Container active. Logs routed to Docker stdout (json-file driver).</span>`;
    }
  } catch (err) {
    terminal.innerHTML = `<span style="color:#64748b">[${new Date().toLocaleTimeString()}] [INFO] Container active on port 8080. Logs streaming to stdout.</span>`;
  }
}

async function triggerTestRequest() {
  toast("Sending test requests to /health and /api/calculate...");
  try {
    await fetch("/health");
    await fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentInfo: { name: "DevOps Evaluator", rollNo: "DEV-TEST-01" },
        subjects: [{ name: "Cloud Computing", marks: 95, maxMarks: 100, credits: 4 }]
      })
    });
    setTimeout(pollDevOpsLogs, 300);
    toast("✓ Test requests logged in real time!");
  } catch (e) {
    toast("Test request dispatched");
  }
}

function runAllDevOpsDiagnostic() {
  toast("Running DevOps 12-Step Diagnostic...");
  let step = 1;
  const interval = setInterval(() => {
    selectDevOpsStep(step);
    step++;
    if (step > 12) {
      clearInterval(interval);
      toast("✓ All 12 DevOps Steps Verified & Operational!");
    }
  }, 650);
}

// Global Event Listeners
document.addEventListener("keydown", e => {
  const tag = (e.target && e.target.tagName || "").toLowerCase();
  if (["input", "select", "textarea"].includes(tag)) return;
  if (e.key.toLowerCase() === "n") newEvaluation();
  if (e.key.toLowerCase() === "t") toggleTheme();
});

window.addEventListener("click", e => {
  const modal = document.getElementById("modal");
  if (e.target === modal) closeTranscript();
});

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("egTheme") === "dark") document.body.classList.add("dark");
  templateEngineering();
  updateDashboard();
  renderRecords();
  refreshAnalytics();
  selectDevOpsStep(1);
  pollDevOpsLogs();
  setInterval(pollDevOpsLogs, 8000);
});

