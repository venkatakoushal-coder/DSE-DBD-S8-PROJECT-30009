# EdTech - Cross Platform for Students and Teachers

A clean, modern, and data-driven cross-platform educational platform built for students and teachers with React.js, Vite, Node.js, Express, and MySQL.

---

## 1. Project Overview

This platform connects students and faculty in a unified academic environment:
- **Students** can browse course catalogs, enroll in modules, study curated learning materials (videos, lecture PDFs, articles, assignments), track verified completion progress, take timed quizzes, and receive personalized interventions from educators.
- **Teachers (Faculty)** can author and administer courses, organize sequenced curriculum materials, compose assessments with customizable passing criteria, monitor cohort progress metrics, identify weak or struggling students, and dispatch targeted remedial interventions.

---

## 2. Technology Stack

- **Frontend**: React.js (v18), Vite, React Router DOM (v6), Vanilla CSS (Inter typography, clean university light theme).
- **Backend**: Node.js, Express.js (v4).
- **Database**: MySQL (using `mysql2/promise` with connection pooling).
- **Authentication**: JWT (`jsonwebtoken`) and password hashing with `bcryptjs`.

---

## 3. Architecture & Directory Structure

```
project-root/
│
├── src/
│   ├── components/
│   │   ├── CourseCard.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProgressBar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── CourseDetails.jsx
│   │   ├── CourseList.jsx
│   │   ├── CourseManagement.jsx
│   │   ├── Interventions.jsx
│   │   ├── Login.jsx
│   │   ├── QuizPage.jsx
│   │   ├── Register.jsx
│   │   ├── RoleSelection.jsx
│   │   ├── StudentDashboard.jsx
│   │   ├── StudentPerformance.jsx
│   │   ├── TeacherCourses.jsx
│   │   └── TeacherDashboard.jsx
│   ├── services/
│   │   └── api.js
│   ├── styles/
│   │   └── index.css
│   ├── App.jsx
│   └── main.jsx
│
├── server/
│   ├── middleware/
│   │   ├── auth.js
│   │   └── role.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── courses.js
│   │   ├── enrollments.js
│   │   ├── interventions.js
│   │   ├── materials.js
│   │   ├── performance.js
│   │   ├── progress.js
│   │   └── quizzes.js
│   ├── db.js
│   └── server.js
│
├── database/
│   └── schema.sql
│
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 4. Exactly 9 MySQL Database Tables

The database strictly contains 9 tables with foreign keys and relational integrity:

1. `users`: Stores user accounts with role (`student` or `teacher`), hashed passwords, department, and timestamps.
2. `courses`: Stores academic courses created by faculty, with `course_code`, title, category, description, and `teacher_id` foreign key.
3. `enrollments`: Tracks student course enrollments with `UNIQUE(student_id, course_id)` preventing duplicate registrations.
4. `learning_materials`: Stores curriculum resources (video, pdf, article, assignment) sequenced by `sequence_order`.
5. `student_progress`: Tracks completion state for each student and material with `UNIQUE(student_id, material_id)`.
6. `quizzes`: Stores course assessments with total marks, passing thresholds, and time limits in minutes.
7. `quiz_questions`: Stores multiple choice questions (options A, B, C, D) and point values linked to quizzes.
8. `quiz_submissions`: Records student exam attempts, total score, percentage, and pass/fail status computed strictly on the backend.
9. `educator_interventions`: Stores direct guidance and remedial links sent by teachers to students enrolled in their courses.

---

## 5. Demo Accounts

The database comes pre-seeded with verified demo accounts (hashed with bcrypt):

### Teacher Account
- **Email**: `teacher@edtech.edu`
- **Password**: `password123`
- **Role**: `teacher`
- **Name**: Prof. Alan Turing (Computer Science)

### Student Account
- **Email**: `student@edtech.edu`
- **Password**: `password123`
- **Role**: `student`
- **Name**: Ada Lovelace (Computer Science)

---

## 6. Setup and Running Instructions

### STEP 1: Install Prerequisites
Ensure Node.js (v18+) and MySQL Server (v8.0+) are installed on your system.

### STEP 2: Open Project Directory
Open terminal inside the project root folder.

### STEP 3: Install Dependencies
```bash
npm install
```

### STEP 4: Initialize MySQL Database
Open **MySQL Workbench** or your MySQL command line client and execute:
```sql
database/schema.sql
```
*(Or import via terminal: `mysql -u root -p < database/schema.sql`)*

### STEP 5: Configure Environment Variables
Create `.env` file in the project root by copying `.env.example`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=edtech_db
JWT_SECRET=your_secret_key_here
PORT=5000
```

### STEP 6: Start Backend Server
In your first terminal, run:
```bash
node server/server.js
```
The server will verify connection to MySQL and begin listening on `http://localhost:5000`.

### STEP 7: Start React Frontend
In a **second terminal**, start the Vite dev server:
```bash
npm run dev
```

### STEP 8: Open Application
Navigate to `http://localhost:5173` in your web browser.

---

## 7. Key Architecture & Viva Questions

### Q1: How is access control enforced for course materials and quizzes?
**Answer**: Access control is enforced at both the React UI layer and the Express backend API layer. The backend queries the `enrollments` table before returning materials or allowing quiz access. If a student is not actively enrolled in the course, the API strictly returns an HTTP `403 Forbidden` status code.

### Q2: How is course progress calculated?
**Answer**: Progress is computed using actual database records in MySQL. It counts the number of completed items for the student from `student_progress` where `is_completed = 1` and divides it by the total count of `learning_materials` for that course. No mock or hardcoded percentages are used.

### Q3: How are quiz scores evaluated?
**Answer**: Quiz scores are calculated entirely on the server. When a student submits their selected options, the backend pulls the question records, checks the correct options, totals the points, computes the percentage, and determines whether the student passed based on `passing_marks`. React is never trusted with score calculation.

### Q4: How is teacher ownership protected?
**Answer**: Each course management, syllabus edit, and quiz creation route queries the `courses` table to verify that `course.teacher_id === req.user.user_id`. If a teacher tries to edit another teacher's course, the backend rejects the request with HTTP `403 Forbidden`.
