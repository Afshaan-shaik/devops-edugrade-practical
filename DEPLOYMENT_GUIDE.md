# AWS Deployment & In-Browser Docker Execution Guide

This guide provides end-to-end instructions for deploying the **EduGrade Containerized Web Application** to **AWS** and running Docker **directly in your web browser**.

---

## Part 1: Running Docker In Your Web Browser (3 Options)

Since your local Windows computer may not have Docker Desktop installed, you can build, run, and interact with Docker directly inside your web browser.

### Option A: GitHub Codespaces (Fastest, 1-Click Browser Docker)

GitHub Codespaces provides a full Ubuntu cloud container with Docker, Node.js, and VS Code pre-installed, accessible entirely inside your web browser.

1. **Push your code to GitHub**:
   ```powershell
   # In PowerShell on your computer:
   cd "d:\devops practical"
   git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
   git push -u origin main --tags
   ```
2. Open your repository on **github.com**.
3. Click the green **`< > Code`** button, select the **Codespaces** tab, and click **Create codespace on main**.
4. A full browser-based VS Code interface will load in 30 seconds.
5. In the built-in terminal at the bottom of your browser, run:
   ```bash
   # Build the Docker image
   docker build -t edugrade:1.0.0 .

   # Run the container
   docker run -d --name edugrade-app -p 8080:8080 edugrade:1.0.0
   ```
6. VS Code in your browser will display a notification:
   > *"Your application running on port 8080 is available."*
7. Click **Open in Browser** to interact with the containerized application!

---

### Option B: AWS CloudShell / AWS EC2 Browser Console

AWS provides browser-based terminal access to EC2 instances using **EC2 Instance Connect** or **AWS CloudShell**.

#### 1. Launch a Free-Tier EC2 Instance:
- Log in to the [AWS Management Console](https://aws.amazon.com/).
- Navigate to **EC2** -> Click **Launch Instance**.
- **Name**: `EduGrade-DevOps-Server`
- **AMI**: Amazon Linux 2023 (Free tier eligible)
- **Instance type**: `t2.micro` (or `t3.micro`)
- **Key Pair**: Select or create a key pair (`devops-key.pem`).
- **Network / Security Group**:
  - Allow **SSH** (Port 22) from `0.0.0.0/0`
  - Allow **HTTP** (Port 80) from `0.0.0.0/0`
  - Allow **Custom TCP** (Port 8080) from `0.0.0.0/0`
- Under **Advanced Details** -> **User Data**, paste the contents of `aws/ec2-user-data.sh`.
- Click **Launch Instance**.

#### 2. Connect via Browser:
- Select your running instance in the EC2 Console.
- Click **Connect** -> Choose **EC2 Instance Connect** -> Click **Connect**.
- A Linux terminal opens directly in your browser tab!

#### 3. Run Commands in the EC2 Browser Terminal:
```bash
# Verify Docker is running
sudo docker --version
sudo systemctl status docker

# Clone your repository
git clone https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git app
cd app

# Build production Docker image
sudo docker build -t edugrade:1.0.0 .

# Run container on Port 80
sudo docker run -d --name edugrade-web --restart always -p 80:8080 edugrade:1.0.0

# Verify container is running and healthy
sudo docker ps
curl http://localhost/health
```

#### 4. Open in Web Browser:
Copy the **Public IPv4 address** of your EC2 instance from AWS Console:
👉 `http://<YOUR-EC2-PUBLIC-IP>`

Your containerized student marks calculator is now accessible worldwide!

---

### Option C: Play With Docker (PWD)

[Play With Docker](https://labs.play-with-docker.com/) is a completely free, browser-based Docker playground hosted by Docker Inc.

1. Open [https://labs.play-with-docker.com/](https://labs.play-with-docker.com/).
2. Log in with your free Docker Hub account and click **Start**.
3. Click **+ ADD NEW INSTANCE**.
4. In the browser terminal, run:
   ```bash
   git clone https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
   cd "devops practical"
   docker build -t edugrade:1.0.0 .
   docker run -d --name edugrade-app -p 8080:8080 edugrade:1.0.0
   ```
5. A blue link with badge **8080** appears at the top of the browser screen. Click it to view the running web application in a new browser tab!

---

## Part 2: Step 9 — Environment Variables & Secrets Configuration

### 1. In Local / Container Development:
Use `.env` files and Docker CLI `-e` flags:
```bash
# Passing environment variables during docker run
docker run -d \
  -p 8080:8080 \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e APP_VERSION=1.0.0 \
  -e RELEASE_NAME="Genesis-Production" \
  edugrade:1.0.0
```

### 2. In GitHub Actions Secrets (CI/CD):
1. In your GitHub repository, go to **Settings** -> **Secrets and variables** -> **Actions**.
2. Add the following repository secrets:
   - `AWS_ACCESS_KEY_ID`: Your IAM user access key.
   - `AWS_SECRET_ACCESS_KEY`: Your IAM secret access key.
   - `AWS_REGION`: e.g. `us-east-1`
   - `EC2_HOST`: The Public IP or DNS of your EC2 instance.
   - `EC2_SSH_KEY`: The contents of your private `.pem` key.

### 3. In AWS Systems Manager (SSM) Parameter Store:
Store confidential values in AWS SSM:
```bash
aws ssm put-parameter \
  --name "/edugrade/prod/APP_VERSION" \
  --value "1.0.0" \
  --type "String"
```

---

## Part 3: Step 10 — Monitoring Application & Container Logs

### 1. Real-Time Docker Container Logs:
```bash
# View last 50 log lines and stream output in real-time
docker logs --tail 50 -f edugrade-web-container

# Filter only error logs
docker logs edugrade-web-container 2>&1 | grep -i "error"
```

### 2. Querying Telemetry via HTTP Endpoints:
```bash
# Health Status
curl -s http://localhost:8080/health | jq .

# Application Metrics (Request counts, response status codes)
curl -s http://localhost:8080/metrics | jq .
```

### 3. Streaming Logs to AWS CloudWatch:
Docker has a native `awslogs` log driver:
```bash
docker run -d \
  --log-driver=awslogs \
  --log-opt awslogs-region=us-east-1 \
  --log-opt awslogs-group=/aws/ec2/edugrade \
  -p 80:8080 \
  edugrade:1.0.0
```

---

## Part 4: Step 11 — Performing a New Release (`v1.1.0`)

1. Verify that `v1.1.0` tag is present in git:
   ```bash
   git tag -l
   ```
2. Build the new release container image:
   ```bash
   docker build -t edugrade:1.1.0 .
   ```
3. Deploy the new container using the deployment script:
   ```bash
   bash aws/deploy.sh 1.1.0
   ```
4. Verify that the version has been bumped by querying the `/api/version` endpoint:
   ```bash
   curl http://localhost:8080/api/version
   ```
   **Output:**
   ```json
   {
     "version": "1.1.0",
     "releaseName": "Genesis-Release",
     "environment": "production"
   }
   ```

---

## Part 5: Step 12 — Demonstrating Rollback to Stable Release (`v1.0.0`)

When a regression or failure occurs in `v1.1.0`, trigger an automated rollback:

1. Execute the rollback script:
   ```bash
   bash aws/rollback.sh 1.0.0
   ```
2. What happens behind the scenes:
   - The script verifies that `edugrade:1.0.0` is available.
   - It stops the faulty `v1.1.0` container gracefully.
   - It launches the previously validated `v1.0.0` image on port 80.
   - It performs an automated HTTP health check to confirm service recovery.
3. Verify that the version has reverted back to `1.0.0`:
   ```bash
   curl http://localhost:8080/api/version
   ```
   **Output:**
   ```json
   {
     "version": "1.0.0",
     "releaseName": "Rollback-Stable-1.0.0",
     "environment": "production"
   }
   ```
