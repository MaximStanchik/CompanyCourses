 # Company Courses
 
 A web platform for publishing and taking IT courses.
 
 The project consists of:
 
 - **Backend**: Node.js (Express) + Prisma + PostgreSQL, JWT authentication, file storage in **MinIO**
 - **Frontend**: React application
 - **Infrastructure**: Docker Compose (PostgreSQL + MinIO + backend + frontend)
 
 ## Diagrams
 
 ### Use Case Diagram
 
 ![Use case diagram](Documentation/diagrams/images/useCase-diagram.png)
 
 ### Architecture Diagram
 
 ![Architecture diagram](Documentation/diagrams/images/architecture-diagram.png)
 
 ### Database Diagram
 
 ![Database diagram](Documentation/diagrams/images/database-diagram.png)
 
 ## Quick start (Docker Compose)
 
 The Docker configuration is located in the `Realization` folder.
 
 1. Start all services:
 
 ```bash
 docker-compose up -d --build
 ```
 
 2. Check status:
 
 ```bash
 docker-compose ps
 ```
 
 After startup, the following will be available:
 
 - **Frontend**: http://localhost:3000
 - **Backend**: http://localhost:9000
 - **MinIO (S3 API)**: http://localhost:9075
 - **MinIO Console**: http://localhost:9001
 - **PostgreSQL**: localhost:5433
 
 Additional Docker instructions (logs, restart, troubleshooting) are available in `Realization/DOCKER_README.md`.
 
 ## Tech stack
 
 - **Backend**
   - Node.js 18
   - Express
   - Prisma (`Realization/backend/prisma/schema.prisma`)
   - PostgreSQL
   - MinIO (S3-compatible object storage)
   - JWT (`jsonwebtoken`)
   - OAuth via `passport` (Google/Facebook/Yandex/Dribbble)
   - WebSocket: `socket.io`
   - Email: `nodemailer`
 - **Frontend**
   - React 18 (Create React App)
   - Redux
   - Bootstrap / Reactstrap
   - i18next
 
 ## Core entities (from the DB schema)
 
 - **Users and profile**: `User`, `Profile`
 - **Courses and categories**: `Course`, `Category`, `CourseCategory`
 - **Learning flow**: `Enrollment`, `Lecture`, `Step`, `TestAttempt`
 - **Engagement**: `CourseComment`, `CourseRating`, `FavoriteCourse`, reactions
 - **Communication**: `Chat`, `Message`, `Reaction`, `Notification`, `SupportMessage`
 
 ## Repository structure
 
 - `Documentation/` — documentation and diagrams
 - `Realization/` — project implementation
   - `backend/` — Node.js API
   - `frontend/` — React application
   - `docker-compose.yml` — full system startup
   - `database/`, `testData/` — auxiliary data
 
 ## Environment variables (important)
 
 Most variables are already set in `Realization/docker-compose.yml`. If you run services outside compose, pay attention to:
 
 - `DATABASE_URL`
 - `JWT_SECRET`
 - `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`
 
 ## Running without Docker (local)
 
 1. Start PostgreSQL and MinIO (you can use Docker Compose).
 2. Backend:
 
 ```bash
 npm install
 npm run dev
 ```
 
 3. Frontend:
 
 ```bash
 npm install
 npm start
 ```
