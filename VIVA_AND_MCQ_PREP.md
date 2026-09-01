# DevOps Engineering Practical: Viva & MCQ Preparation Sheet

> **Practical Topic**: Containerized Web Application with Automated CI/CD  
> **Target Evaluation**: Viva (Item 6) & MCQ (Item 7) — Total 30 Marks

---

## Part 1: Comprehensive Viva Questions & Answers (25 Questions)

### Section A: Git & Version Control

#### Q1. What is the difference between `git merge` and `git rebase`?
- **Answer**: 
  - `git merge` combines the histories of two branches by creating a new **merge commit**. It preserves the exact chronological history and context of when branches were merged.
  - `git rebase` moves the entire feature branch to begin on the tip of the target branch, effectively rewriting the commit history to produce a clean, linear sequence without a merge commit.

#### Q2. Why did we use `git merge --no-ff` when merging our feature branch?
- **Answer**: `--no-ff` (no fast-forward) forces Git to create an explicit merge commit even if the branch could be fast-forwarded. This maintains a clear historical record in the Git log that a feature was developed on an isolated branch and merged into `develop`/`main`.

#### Q3. What is a Git Tag, and how is it used in CI/CD?
- **Answer**: A Git Tag is an immutable reference pointing to a specific commit in history. In CI/CD pipelines, tags (such as `v1.0.0` or `v1.1.0`) are commonly used as triggers to automatically build production Docker images and publish releases.

---

### Section B: Docker & Containerization

#### Q4. What is a multi-stage Dockerfile, and what are its advantages?
- **Answer**: Multi-stage builds use multiple `FROM` instructions in a single `Dockerfile`. 
  - **Stage 1 (Builder)** installs build tools and dependencies.
  - **Stage 2 (Runner)** copies only the production-ready artifacts into a minimal base image (e.g., `node:20-alpine`).
  - **Advantages**: Drastically reduced image size (from ~1GB down to ~150MB), reduced attack surface (no build tools left in production), and faster deployment.

#### Q5. Why should containers not run as the `root` user?
- **Answer**: Running as `root` inside a container is a security risk. If an attacker breaches the application via a vulnerability, they gain root privileges inside the container, increasing the risk of container escape attacks onto the host OS. Specifying `USER node` restricts permissions to the minimum necessary.

#### Q6. What does the `HEALTHCHECK` instruction do in a Dockerfile?
- **Answer**: `HEALTHCHECK` tells Docker how to test if the containerized application is actually functioning properly (e.g., querying `http://localhost:8080/health`). If the command fails for a specified number of retries, Docker marks the container status as `unhealthy`, allowing orchestrators to restart or replace it.

#### Q7. Explain the difference between `-p 80:8080` and `-p 8080:8080` in `docker run`.
- **Answer**: The syntax is `-p <HOST_PORT>:<CONTAINER_PORT>`. 
  - `-p 80:8080` maps port 80 on the host machine (standard HTTP web port) to port 8080 inside the container, allowing users to visit the site in a browser without specifying a port.
  - `-p 8080:8080` maps port 8080 on the host to port 8080 in the container.

#### Q8. What is the role of `.dockerignore`?
- **Answer**: It prevents unnecessary or sensitive files (like `node_modules/`, `.git/`, `.env`, test files, and logs) from being copied into the Docker build context. This speeds up build times and prevents secret leaks.

---

### Section C: CI/CD & GitHub Actions

#### Q9. What is CI/CD, and how does it benefit software engineering?
- **Answer**: 
  - **Continuous Integration (CI)**: Automatically builds and runs tests on code changes as soon as developers push to version control, catching bugs early.
  - **Continuous Deployment (CD)**: Automatically deploys validated code to staging or production environments with zero manual intervention, reducing release cycle times.

#### Q10. What components make up a GitHub Actions workflow?
- **Answer**: 
  - **Event (Trigger)**: e.g., `push`, `pull_request`, `workflow_dispatch`.
  - **Workflow**: The top-level automation process defined in YAML inside `.github/workflows/`.
  - **Job**: A set of steps executed on the same runner (e.g., `test`, `docker-build-test`, `deploy`).
  - **Runner**: The virtual machine (e.g., `ubuntu-latest`) that runs the job.
  - **Step / Action**: Individual tasks or commands (e.g., `actions/checkout@v4`, `npm test`).

#### Q11. Why did we use matrix testing in our GitHub Actions pipeline?
- **Answer**: Matrix testing allows the CI pipeline to run tests across multiple environments concurrently (e.g., testing across Node.js versions `18.x` and `20.x`) ensuring backward compatibility and cross-version stability before shipping.

#### Q12. How are secrets and environment variables protected in GitHub Actions?
- **Answer**: Sensitive credentials (such as AWS access keys, SSH keys, or Docker tokens) are stored in **GitHub Encrypted Secrets**. They are masked in build logs and injected into jobs exclusively as environment variables during execution.

---

### Section D: Cloud (AWS), Releases & Rollback

#### Q13. What is EC2 User Data, and when does it execute?
- **Answer**: User Data is a shell script passed to an EC2 instance upon creation. AWS runs it with `root` privileges once during the first instance boot to automatically install software (e.g., Docker, Git), configure services, and clone repositories.

#### Q14. What is a Security Group in AWS?
- **Answer**: A virtual firewall controlling inbound and outbound network traffic to an EC2 instance. For our web app, inbound rules allow:
  - Port 22 (SSH) for administration
  - Port 80 (HTTP) and 8080 (Custom TCP) for web browser traffic.

#### Q15. How does zero-downtime deployment work?
- **Answer**: Rather than stopping the old container before starting the new one, zero-downtime deployment launches the new container on an alternative port, runs health checks to verify that it responds with HTTP 200, switches incoming network traffic, and only then shuts down the old container.

#### Q16. How did we demonstrate rollback in this project?
- **Answer**: When version `v1.1.0` was deployed, the previous stable image tag `v1.0.0` was retained. During rollback, `aws/rollback.sh` stopped the `v1.1.0` container and immediately started `edugrade:1.0.0`, restoring service in less than 5 seconds without data loss.

#### Q17. What is the difference between Docker `CMD` and `ENTRYPOINT`?
- **Answer**: 
  - `ENTRYPOINT` defines the core executable that runs when the container starts.
  - `CMD` provides default arguments to the `ENTRYPOINT` which can be overridden when executing `docker run`.

---

## Part 2: 20 Multiple Choice Questions (MCQs) with Answers & Explanations

#### 1. In a multi-stage Docker build, what is the primary benefit of the second stage?
- A) It runs tests faster
- B) It reduces the final image size and removes unnecessary build tools
- C) It connects the container to the host network
- D) It exposes multiple ports simultaneously  
**Answer: B**  
*Explanation*: The second stage only copies over production artifacts, discarding compiler caches, development dependencies, and build toolchains.

---

#### 2. Which command is used to inspect the commit history as an ASCII graph?
- A) `git status --graph`
- B) `git log --graph --oneline --all`
- C) `git branch --tree`
- D) `git show-branch --graph`  
**Answer: B**  
*Explanation*: `git log --graph --oneline --all` outputs an ASCII graph showing branches, merges, and commit tags.

---

#### 3. What does the Docker instruction `USER node` accomplish?
- A) Installs Node.js inside the container
- B) Ensures container processes execute with unprivileged user permissions
- C) Creates a new system root account
- D) Links the container to the Node registry  
**Answer: B**  
*Explanation*: It enforces non-root execution, adhering to the principle of least privilege.

---

#### 4. In GitHub Actions, which keyword is used to make a job wait for another job to complete?
- A) `depends-on`
- B) `wait-for`
- C) `needs`
- D) `after`  
**Answer: C**  
*Explanation*: The `needs:` keyword defines explicit dependencies between workflow jobs.

---

#### 5. What HTTP status code is expected from a `/health` endpoint to indicate a healthy service?
- A) 200 OK
- B) 204 No Content
- C) 301 Moved Permanently
- D) 404 Not Found  
**Answer: A**  
*Explanation*: HTTP 200 signifies normal, successful operation for health probes.

---

#### 6. In AWS EC2, which port must be open in the Security Group to allow standard HTTP web browser access?
- A) 22
- B) 443
- C) 80
- D) 3306  
**Answer: C**  
*Explanation*: Port 80 is the default port for unencrypted HTTP web traffic.

---

#### 7. What is the effect of running `docker run -d`?
- A) Deletes the container after exit
- B) Runs the container in detached (background) mode
- C) Runs the container in debug mode
- D) Disables container networking  
**Answer: B**  
*Explanation*: The `-d` flag runs the container in the background and prints the container ID.

---

#### 8. Which file prevents secret tokens from being uploaded to a Git repository?
- A) `.dockerignore`
- B) `.gitignore`
- C) `package.json`
- D) `Dockerfile`  
**Answer: B**  
*Explanation*: `.gitignore` tells Git which files or directories to omit from source control tracking.

---

#### 9. What does the `--restart always` policy do for a Docker container?
- A) Restarts the container every hour
- B) Restarts the container if it stops or when Docker daemon reboots
- C) Restarts only on successful execution
- D) Prevents the container from ever stopping  
**Answer: B**  
*Explanation*: `always` guarantees the container restarts if it crashes or if the host machine restarts.

---

#### 10. Which command streams real-time logs from a Docker container named `my-app`?
- A) `docker monitor my-app`
- B) `docker logs -f my-app`
- C) `docker tail my-app`
- D) `docker watch my-app`  
**Answer: B**  
*Explanation*: `docker logs -f` follows (streams) the standard output/error logs in real time.

---

#### 11. In Git, which command creates and immediately switches to a new branch named `feature/gpa`?
- A) `git branch feature/gpa`
- B) `git switch-branch feature/gpa`
- C) `git checkout -b feature/gpa`
- D) `git new feature/gpa`  
**Answer: C**  
*Explanation*: `git checkout -b <branch>` (or `git switch -c <branch>`) creates and checks out the new branch in a single command.

---

#### 12. What does `npm test` execute in our project?
- A) Starts the production web server
- B) Runs the Jest automated unit and integration test suite
- C) Installs Node modules
- D) Compiles the CSS stylesheet  
**Answer: B**  
*Explanation*: `npm test` triggers the `jest` runner defined in `package.json`.

---

#### 13. Which command reverts a deployment back to image `edugrade:1.0.0`?
- A) `docker rollback edugrade:1.0.0`
- B) `docker run -d -p 80:8080 edugrade:1.0.0`
- C) `docker undo edugrade:1.0.0`
- D) `docker delete 1.1.0`  
**Answer: B**  
*Explanation*: Rollback in container environments is performed by running the previously validated image tag.

---

#### 14. What is the format of the GitHub Actions workflow file?
- A) JSON
- B) XML
- C) YAML
- D) TOML  
**Answer: C**  
*Explanation*: GitHub Actions configuration files use YAML syntax (`.yml` or `.yaml`).

---

#### 15. Where should production secrets (like database credentials or cloud API keys) NEVER be stored?
- A) AWS Secrets Manager
- B) GitHub Encrypted Secrets
- C) Hardcoded directly in source code or committed to Git
- D) Environment variables  
**Answer: C**  
*Explanation*: Hardcoded secrets in source code pose severe security risks and can easily be exposed in public repositories.

---

#### 16. In the 10-point UGC grade scale used in EduGrade, what is the minimum percentage required for an 'O' (Outstanding) grade?
- A) 80%
- B) 85%
- C) 90%
- D) 95%  
**Answer: C**  
*Explanation*: 90% and above yields an 'O' grade with 10 grade points.

---

#### 17. Which of the following is a browser-based environment that allows running Docker directly without local installation?
- A) GitHub Codespaces
- B) Play With Docker (PWD)
- C) AWS CloudShell / EC2 Instance Connect
- D) All of the above  
**Answer: D**  
*Explanation*: All three listed tools provide browser-accessible Linux shells with Docker support.

---

#### 18. What does `docker ps` display?
- A) All Docker images saved on disk
- B) Currently running containers
- C) Docker daemon system logs
- D) Network bridge settings  
**Answer: B**  
*Explanation*: `docker ps` lists active running containers and their port mappings.

---

#### 19. What is the function of the `curl` command in our Docker CI verification step?
- A) Downloads images from Docker Hub
- B) Sends HTTP requests to test endpoints like `/health` and `/api/calculate`
- C) Creates a new Git commit
- D) Monitors CPU usage  
**Answer: B**  
*Explanation*: `curl` performs automated HTTP requests to verify API responses.

---

#### 20. What is "Canary Deployment"?
- A) Deploying code to all servers at midnight
- B) Releasing new software to a small subset of users or staging containers before rolling out to everyone
- C) Manually editing production files via SSH
- D) Permanently deleting old container images  
**Answer: B**  
*Explanation*: Canary deployments test a new release with a small sample of traffic to detect defects before full rollout.
