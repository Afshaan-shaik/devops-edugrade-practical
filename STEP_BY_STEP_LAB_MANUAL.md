# DevOps Practical: Step-by-Step Lab Submission Manual

**Course**: DevOps Engineering  
**Project Title**: Containerized Web Application with Automated CI/CD  
**Application Name**: EduGrade (Student Result & Grade Evaluator)  
**Storage Location**: `D:\devops practical\` (D: Drive)  
**Total Marks**: 30  

---

## Step 1: Develop a Simple Application
- **Directory**: `D:\devops practical\`
- **Core Files**:
  - `server.js`: Express REST API serving HTTP endpoints (`/health`, `/api/calculate`, `/api/version`, `/metrics`).
  - `src/evaluator.js`: Grade calculation engine implementing the UGC/AICTE 10-point scale.
  - `public/`: HTML5, CSS3 (Dark Glassmorphism), and Vanilla JavaScript frontend.
- **Local Test Execution Command**:
  ```powershell
  cd "d:\devops practical"
  node server.js
  ```
- **Observed Output**:
  ```
  {"timestamp":"2026-09-01T...","level":"INFO","service":"edugrade-app","version":"1.0.0","message":"EduGrade Server started successfully on port 8080","url":"http://localhost:8080"}
  ```

---

## Step 2: Push It to GitHub
- **Git Initialization & Commit Commands**:
  ```powershell
  cd "d:\devops practical"
  git init
  git branch -M main
  git add .
  git commit -m "feat: initial commit - EduGrade containerized app with test suite and CI/CD"
  ```
- **Push to Remote Repository**:
  ```powershell
  git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/devops-edugrade-practical.git
  git push -u origin main --tags
  ```

---

## Step 3: Create Branches (Branching & Merging)
- **Commands Executed**:
  ```powershell
  # 1. Create develop branch
  git checkout -b develop

  # 2. Create feature branch
  git checkout -b feature/gpa-converter

  # 3. Add feature code and commit
  git add .
  git commit -m "feat(evaluator): add GPA to percentage conversion logic and endpoint"

  # 4. Merge feature into develop
  git checkout develop
  git merge --no-ff feature/gpa-converter -m "merge: feature/gpa-converter into develop"

  # 5. Merge develop into main
  git checkout main
  git merge --no-ff develop -m "merge: release v1.1.0 into main"
  git tag -a v1.1.0 -m "Release v1.1.0 - Added GPA to Percentage conversion support"
  ```
- **Verify Commit Tree**:
  ```powershell
  git log --graph --oneline --decorate --all
  ```
- **Observed Commit Graph**:
  ```
  *   cd5a276 (HEAD -> main, tag: v1.1.0) merge: release v1.1.0 into main
  |\  
  | * 76aaa67 (develop) merge: feature/gpa-converter into develop
  |/| 
  | * a7914be (feature/gpa-converter) feat(evaluator): add GPA to percentage conversion logic and endpoint
  |/  
  * 58dce1d (tag: v1.0.0) feat: initial commit - EduGrade containerized app with test suite and CI/CD
  ```

---

## Step 4: Write a Dockerfile
- **File**: `D:\devops practical\Dockerfile`
- **Key Features**:
  - Multi-stage build (`builder` -> `runner`)
  - Minimal Alpine base: `node:20-alpine`
  - Unprivileged non-root user: `USER node`
  - Built-in Healthcheck: `HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:8080/health || exit 1`
  - Exposes port: `8080`

---

## Step 5: Build a Docker Image
- **Command**:
  ```bash
  docker build -t edugrade:1.0.0 .
  ```
- **Inspect Created Image**:
  ```bash
  docker images | grep edugrade
  ```
- **Run Container**:
  ```bash
  docker run -d --name edugrade-web -p 8080:8080 edugrade:1.0.0
  ```

---

## Step 6: Create GitHub Actions CI
- **File**: `D:\devops practical\.github\workflows\ci-cd.yml`
- **Jobs**:
  1. `test`: Runs across Node 18.x and 20.x, executes syntax check and Jest automated tests.
  2. `docker-build-test`: Builds Docker container, starts it in the virtual runner, verifies `/health` and `/api/calculate` via curl, dumps logs.
  3. `deploy`: Triggers on push to `main` or version tags (`v*.*.*`).

---

## Step 7: Run Automated Tests
- **Command**:
  ```powershell
  npm test
  ```
- **Test Suite Results**:
  ```
  PASS tests/evaluator.test.js
  PASS tests/api.test.js

  Test Suites: 2 passed, 2 total
  Tests:       23 passed, 23 total
  Snapshots:   0 total
  Time:        1.884 s
  ```

---

## Step 8: Deploy the Application (AWS)
- **Deployment via EC2 & In-Browser Console**:
  1. Launch Amazon Linux 2023 EC2 instance with Security Group allowing ports 22, 80, 8080.
  2. Connect via browser using **EC2 Instance Connect**.
  3. Run deployment script:
     ```bash
     bash aws/deploy.sh 1.0.0
     ```
  4. Open web browser and access:
     `http://<EC2-PUBLIC-IP>:8080` or `http://<EC2-PUBLIC-IP>`

---

## Step 9: Configure Environment Variables & Secrets
- **Template File**: `D:\devops practical\.env.example`
- **Docker Run Environment Flags**:
  ```bash
  docker run -d \
    -p 8080:8080 \
    -e PORT=8080 \
    -e NODE_ENV=production \
    -e APP_VERSION=1.0.0 \
    -e RELEASE_NAME=Genesis-Production \
    edugrade:1.0.0
  ```

---

## Step 10: Monitor Logs
- **Streaming Container Logs**:
  ```bash
  docker logs --tail 50 -f edugrade-web
  ```
- **JSON Telemetry Format**:
  ```json
  {"timestamp":"2026-09-01T11:07:54.981Z","level":"INFO","service":"edugrade-app","version":"1.0.0","environment":"production","message":"HTTP Request Handled","method":"GET","path":"/health","statusCode":200,"durationMs":24}
  ```
- **Query Monitoring Metrics**:
  ```bash
  curl http://localhost:8080/metrics
  ```

---

## Step 11: Perform a New Release (`v1.1.0`)
- **Commands**:
  ```bash
  # Build new version
  docker build -t edugrade:1.1.0 .

  # Deploy release
  bash aws/deploy.sh 1.1.0

  # Verify new version
  curl http://localhost:8080/api/version
  ```
- **Output**:
  ```json
  {
    "version": "1.1.0",
    "releaseName": "Genesis-Release",
    "environment": "production"
  }
  ```

---

## Step 12: Demonstrate Rollback
- **Rollback Command**:
  ```bash
  bash aws/rollback.sh 1.0.0
  ```
- **Observed Behavior**:
  - The script stops the `v1.1.0` container.
  - Spins up stable image `edugrade:1.0.0`.
  - Runs automated health check on `/health`.
  - Service recovers immediately with zero loss.
- **Verification Output**:
  ```json
  {
    "version": "1.0.0",
    "releaseName": "Rollback-Stable-1.0.0",
    "environment": "production"
  }
  ```

---

## Summary of Completed Deliverables

| Requirement | Evaluation Marks | Status |
|---|---|---|
| Git Repository, Commits, Branching, Merging | 5 Marks | Completed & Verified |
| Dockerfile & Image Creation | 5 Marks | Completed & Verified |
| Container Execution & Config | 5 Marks | Completed & Verified |
| GitHub Actions CI Workflow | 5 Marks | Completed & Verified |
| Deployment Demonstration (AWS / Browser) | 5 Marks | Completed & Verified |
| Viva Q&A Preparation | 3 Marks | Documented (`VIVA_AND_MCQ_PREP.md`) |
| MCQ Preparation | 2 Marks | Documented (`VIVA_AND_MCQ_PREP.md`) |
| **Total Marks** | **30 Marks** | **100% Prepared** |
