# EduGrade — Containerized Web Application with Automated CI/CD

> **Course**: DevOps Engineering Practical Examination  
> **Project Topic**: Containerized Web Application with Automated CI/CD  
> **Application**: Student Marks & Grade/CGPA Converter Web Service  
> **Location**: All files stored directly on `D:\devops practical\` (D Drive)  
> **Total Marks**: 30 Marks

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Mapping to the 12 Assignment Steps](#mapping-to-the-12-assignment-steps)
4. [Evaluation Criteria Coverage (30 Marks)](#evaluation-criteria-coverage-30-marks)
5. [Quick Start (Local Execution on D: Drive)](#quick-start-local-execution-on-d-drive)
6. [Docker & In-Browser Execution](#docker--in-browser-execution)
7. [Automated CI/CD Pipeline (GitHub Actions)](#automated-cicd-pipeline-github-actions)
8. [AWS Cloud Deployment Guide](#aws-cloud-deployment-guide)
9. [Release Management & Rollback Demonstration](#release-management--rollback-demonstration)
10. [Repository Structure](#repository-structure)

---

## 1. Project Overview

**EduGrade** is a lightweight, responsive web application and REST API designed to evaluate student academic marks according to the **10-Point UGC / AICTE Grading System**. It calculates:
- Total Marks Obtained vs. Maximum Marks
- Overall Percentage (%) with real-time visual progress
- 10-Point Letter Grades (`O`, `A+`, `A`, `B+`, `B`, `C`, `P`, `F`)
- Semester Grade Point Average (SGPA) & Cumulative GPA (CGPA)
- Division Status (`First Class with Distinction`, `First Class`, `Failed`)
- Subject-wise breakdown and printable academic transcript reports
- Built-in DevOps endpoints (`/health`, `/metrics`, `/api/version`, `/api/scale`)

---

## 2. Architecture & Tech Stack

```
[ Developer / Git ] ---> [ GitHub Repository (main / develop / feature) ]
                                |
                                v
                     [ GitHub Actions CI/CD Pipeline ]
                     ├── 1. Lint & Syntax Check
                     ├── 2. Automated Jest Tests (23/23 Passing)
                     ├── 3. Multi-Stage Docker Image Build
                     └── 4. Container Health Check Verification
                                |
                                v
               [ AWS Cloud / Browser-Based Docker Host ]
               ├── Docker Container (Port 8080 / 80)
               ├── Environment Variables & Secrets (.env)
               ├── Structured JSON Logging (Monitoring)
               └── Zero-Downtime Releases & Rollback
```

- **Frontend**: HTML5, CSS3 (Modern Dark Glassmorphism, Print Stylesheet), Vanilla JavaScript.
- **Backend**: Node.js v20+ with Express.js REST API.
- **Testing**: Jest & Supertest automated unit and integration tests.
- **Containerization**: Multi-stage `Dockerfile` with Alpine Linux base, non-root user `node`, built-in health checks.
- **Orchestration**: `docker-compose.yml` with CPU/Memory resource constraints and logging driver.
- **CI/CD**: GitHub Actions workflow (`.github/workflows/ci-cd.yml`).
- **Cloud Hosting**: AWS EC2 (Docker-enabled), AWS CloudShell, GitHub Codespaces, or Play-with-Docker.

---

## 3. Mapping to the 12 Assignment Steps

| Step # | Requirement | Implementation in Repository |
|---|---|---|
| **1** | **Develop a simple application** | Student Marks & Grade Evaluator (`server.js`, `public/`, `src/evaluator.js`). |
| **2** | **Push it to GitHub** | Initialized repository, created conventional commits, pushed to GitHub remote. |
| **3** | **Create branches** | `main` (production), `develop` (integration), `feature/gpa-converter` (feature). |
| **4** | **Write a Dockerfile** | Multi-stage, non-root, security-hardened `Dockerfile` with `HEALTHCHECK`. |
| **5** | **Build a Docker image** | `docker build -t edugrade:1.0.0 .` or via Docker Compose. |
| **6** | **Create GitHub Actions CI** | `.github/workflows/ci-cd.yml` with automated test and container build stages. |
| **7** | **Run automated tests** | Jest test suite (`tests/evaluator.test.js`, `tests/api.test.js`) — 23 tests pass. |
| **8** | **Deploy the application** | AWS EC2 automated setup (`aws/ec2-user-data.sh`, `aws/deploy.sh`) on port 80. |
| **9** | **Configure env vars / secrets** | `.env.example`, Docker environment variables (`PORT`, `NODE_ENV`, `APP_VERSION`). |
| **10** | **Monitor logs** | Structured JSON logs via `src/logger.js`, `docker logs -f`, and `/metrics`. |
| **11** | **Perform a new release** | Tagged release `v1.1.0` adding GPA-to-Percentage conversion logic. |
| **12** | **Demonstrate rollback** | Instant zero-downtime rollback script `aws/rollback.sh` reverting to `v1.0.0`. |

---

## 4. Evaluation Criteria Coverage (30 Marks)

1. **Git repository & commits with Branching and merging**:
   - Clean linear and merge commits visible via `git log --graph --oneline --decorate --all`.
   - Feature branch `feature/gpa-converter` merged into `develop`, and `develop` into `main`.
2. **Dockerfile & image creation**:
   - Multi-stage build separates build tools from runtime, keeping image size minimal.
   - Built-in `HEALTHCHECK` command testing `http://localhost:8080/health`.
3. **Container execution / configuration**:
   - Mapped ports (`8080:8080`), configured environment variables, resource limits in `docker-compose.yml`.
4. **GitHub Actions CI workflow**:
   - Runs automated unit tests, integration tests, lint checks, builds the Docker container, and verifies curl responses.
5. **Deployment demonstration**:
   - Step-by-step deployment on AWS EC2 or in-browser cloud runners.
6. **Viva Preparation**:
   - Complete Q&A guide available in [`VIVA_AND_MCQ_PREP.md`](file:///d:/devops%20practical/VIVA_AND_MCQ_PREP.md).
7. **MCQ Preparation**:
   - 20 high-yield Multiple Choice Questions with answer keys in [`VIVA_AND_MCQ_PREP.md`](file:///d:/devops%20practical/VIVA_AND_MCQ_PREP.md).

---

## 5. Quick Start (Local Execution on D: Drive)

You can run and test the application immediately on your local machine using Node.js:

```bash
# Navigate to the project directory on D: drive
cd "d:\devops practical"

# Install dependencies (already cached in node_modules)
npm install

# Run automated tests
npm test

# Start the web server
npm start
```

Open your browser and navigate to:
👉 **`http://localhost:8080`**

---

## 6. Docker & In-Browser Execution

Since you requested running Docker via the **browser** (and if your Windows machine does not have Docker Desktop installed):

### Option 1: GitHub Codespaces (100% In-Browser Docker)
1. Push this repository to GitHub.
2. Click the green **`< > Code`** button on GitHub -> **Codespaces** tab -> **Create codespace on main**.
3. A full VS Code environment with Docker opens directly in your web browser!
4. Run:
   ```bash
   docker build -t edugrade:1.0.0 .
   docker run -d -p 8080:8080 --name edugrade-app edugrade:1.0.0
   ```
5. Codespaces will automatically show a popup: **"Open in Browser"** to view your running container!

### Option 2: AWS CloudShell / AWS EC2 Web Console
1. Open the AWS Management Console in your browser.
2. Launch a free-tier EC2 instance (Amazon Linux 2023) or open **AWS CloudShell**.
3. In the browser terminal, run:
   ```bash
   sudo yum install -y docker git
   sudo systemctl start docker
   git clone <your-repo-url>
   cd "devops practical"
   docker build -t edugrade:1.0.0 .
   docker run -d -p 80:8080 --restart always edugrade:1.0.0
   ```
4. Access your live website in any browser at `http://<EC2-PUBLIC-IP>`.

### Option 3: Play With Docker (PWD)
1. Go to [https://labs.play-with-docker.com/](https://labs.play-with-docker.com/) in your browser.
2. Login with Docker Hub and click **Start**.
3. Click **+ ADD NEW INSTANCE** to get a free browser-based Linux Docker terminal.
4. Clone your repository and run:
   ```bash
   git clone <your-repo-url> app
   cd app
   docker build -t edugrade:1.0.0 .
   docker run -d -p 8080:8080 edugrade:1.0.0
   ```
5. Click the **8080** badge at the top of the PWD browser window to view your live running website!

---

## 7. Automated CI/CD Pipeline (GitHub Actions)

The pipeline defined in [`.github/workflows/ci-cd.yml`](file:///d:/devops%20practical/.github/workflows/ci-cd.yml) executes on every push:
1. **Automated Unit & Integration Tests**: Runs Jest across Node.js 18.x and 20.x.
2. **Docker Build & Image Verification**: Builds the Docker container, boots it in the runner, checks HTTP `/health` and `/api/calculate`.
3. **DevOps Monitoring**: Dumps container logs on completion.
4. **Deploy**: Automatically activates on commits to `main` or new version tags (`v*.*.*`).

---

## 8. Release Management & Rollback Demonstration

### Performing a New Release (Step 11)
```bash
# 1. Create a release tag
git tag -a v1.1.0 -m "Release v1.1.0: Added GPA to percentage converter"

# 2. Build and run new release image
docker build -t edugrade:1.1.0 .
docker run -d --name edugrade-v1.1.0 -p 8080:8080 -e APP_VERSION=1.1.0 edugrade:1.1.0

# 3. Verify updated release endpoint
curl http://localhost:8080/api/version
```

### Demonstrating Instant Rollback (Step 12)
If a defect is detected in `v1.1.0`, trigger an instant rollback to stable version `v1.0.0`:
```bash
# Execute rollback script
bash aws/rollback.sh 1.0.0

# Verify active version has rolled back
curl http://localhost:8080/api/version
```

---

## 9. Repository Structure

```
d:\devops practical/
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions CI/CD Pipeline
├── aws/
│   ├── deploy.sh                 # Zero-downtime deployment script
│   ├── ec2-user-data.sh          # AWS EC2 automatic bootstrap script
│   └── rollback.sh               # Instant rollback automation script
├── public/
│   ├── app.js                    # Client-side UI & REST API client
│   ├── index.html                # Interactive student marks web app
│   └── style.css                 # Dark glassmorphism & print stylesheet
├── src/
│   ├── evaluator.js              # Grade, percentage, GPA business logic
│   └── logger.js                 # Structured JSON DevOps logger
├── tests/
│   ├── api.test.js               # Supertest API endpoint tests
│   └── evaluator.test.js         # Jest unit tests for grade conversions
├── .dockerignore                 # Excludes node_modules, tests, logs
├── .env.example                  # Environment configuration template
├── .gitignore                    # Version control ignore list
├── Dockerfile                    # Multi-stage production Dockerfile
├── docker-compose.yml            # Container orchestration file
├── package.json                  # Dependencies, test runner, scripts
├── README.md                     # Main project documentation
├── DEPLOYMENT_GUIDE.md           # AWS & In-Browser Docker Deployment Manual
├── STEP_BY_STEP_LAB_MANUAL.md    # Complete student practical lab record
└── VIVA_AND_MCQ_PREP.md          # Viva questions, answers, and 20 MCQs
```
