# Campus Training Portal (TrainX)

An AI-powered, role-based enterprise campus training management platform designed to streamline training, skill evaluation, attendance, assessments, AI interviews, and placement preparation across colleges.

---

## 🚀 Overview

The **Campus Training Portal** is a full-stack platform built for educational institutions and corporate training providers. It enables multi-tenant management for Super Admins, College Admins, Coordinators, Mentors, and Students with dedicated dashboards, real-time analytics, AI-generated learning roadmaps, automated assessments, live session tracking, and attendance monitoring.

---

## ✨ Features

- **Multi-Role Access Control**: Granular dashboards for Super Admin, College Admin, Coordinator, Mentor, and Student.
- **AI-Powered Learning Roadmaps**: Instant personalized career/skill learning roadmaps driven by Google Gemini & Groq LLMs.
- **AI Mock Interviews & Skill Gap Analysis**: Automated interview evaluations and automated weak area identification.
- **Coding & Practice Problems**: Interactive coding environment with problem sets and automated evaluation.
- **Assessments & Quizzes**: Custom quiz creation, timed assessments, instant scoring, and performance reports.
- **Attendance Management**: Lecture session creation, QR code/digital student attendance marking, and real-time attendance percentage summaries.
- **Live Sessions & Study Materials**: Scheduled video lectures, batch announcements, and downloadable resources.
- **Email & OTP Verification**: Integrated Brevo transactional email delivery for secure password resets and OTP authentication.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React (Vite)
- **Routing**: React Router v7
- **UI & Styling**: Custom CSS Design System with CSS Variables, Responsive Layouts & Glassmorphism
- **Icons**: Lucide React
- **Charts & Data**: Recharts, XLSX
- **Real-Time Communication**: Socket.io Client

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MySQL 8.0+ (`mysql2/promise`)
- **Authentication**: JWT (JSON Web Tokens) & `bcryptjs`
- **Email Service**: Brevo API (`@getbrevo/brevo`)
- **AI Services**: Google Gemini API (`@google/genai`) & Groq API
- **Real-Time**: Socket.io

---

## 📁 Project Structure

```text
CAMPUS-TRAINING-PORTAL/
│
├── frontend/                  # React + Vite Frontend Application
│   ├── public/                # Static public assets
│   ├── src/
│   │   ├── assets/            # Images, branding & icons
│   │   ├── components/        # Reusable UI components & layouts
│   │   ├── context/           # React Context Providers (Auth, Theme)
│   │   ├── hooks/             # Custom React Hooks
│   │   ├── pages/             # Role-based pages (Student, Mentor, Coordinator, SuperAdmin, Auth)
│   │   ├── services/          # API client services
│   │   ├── utils/             # Utility functions & helpers
│   │   ├── App.jsx            # Application root & routes
│   │   └── main.jsx           # Vite entry point
│   ├── package.json
│   └── vite.config.js
│
├── backend/                   # Express.js Backend API
│   ├── src/
│   │   ├── ai/                # AI integration modules (Gemini / Groq)
│   │   ├── config/            # DB, environment & initialization logic
│   │   ├── controllers/       # Route request handlers
│   │   ├── middleware/        # Auth, role-checking & upload middlewares
│   │   ├── models/            # Database models & queries
│   │   ├── routes/            # REST API route endpoints
│   │   ├── services/          # Business logic & email services
│   │   ├── socket/            # Real-time WebSockets handlers
│   │   └── utils/             # Helper utilities
│   ├── scripts/               # DB seeders & maintenance scripts
│   ├── server.js              # Entry server point
│   └── package.json
│
├── database/                  # Database definitions
│   ├── schema/
│   │   └── schema.sql         # Database schema (DDL)
│   ├── migrations/            # Database migration scripts
│   └── seeds/                 # Seeding resources
│
├── docs/                      # Architectural & verification documentation
│   ├── END_TO_END_FUNCTIONALITY_REPORT.md
│   ├── FINAL_DEPLOYMENT_READINESS_REPORT.md
│   └── VERIFICATION_REPORT.md
│
├── .env.example               # Template for environment variables
├── .gitignore                 # Git ignore configuration
├── package.json               # Root workspace scripts
└── README.md                  # Project documentation
```

---

## 📋 Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MySQL**: v8.0 or higher

---

## ⚙️ Environment Variables Setup

1. Copy `.env.example` in `Backend/.env`:
   ```bash
   cp .env.example Backend/.env
   ```
2. Configure environment variables in `Backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173

   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=training_portal_db

   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d

   BREVO_API_KEY=your_brevo_api_key
   BREVO_SENDER_EMAIL=your_email@domain.com
   BREVO_SENDER_NAME=TrainX Training Portal

   AI_API_KEY=your_gemini_api_key
   Groq_AI_API_KEY=your_groq_api_key
   ```

---

## 💻 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/PakshalJain733/CAMPUS-TRAINING-PORTAL.git
cd CAMPUS-TRAINING-PORTAL
```

### 2. Install Dependencies

#### Install Frontend Dependencies:
```bash
cd Frontend
npm install
cd ..
```

#### Install Backend Dependencies:
```bash
cd Backend
npm install
cd ..
```

---

## 🗄️ Database Setup

1. Make sure your MySQL service is running.
2. Create the MySQL database or let the backend automatically initialize it on startup:
   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS training_portal_db;"
   ```
3. (Optional) Manually import schema:
   ```bash
   mysql -u root -p training_portal_db < database/schema/schema.sql
   ```
4. Seed initial coding problems:
   ```bash
   cd Backend
   npm run import:c2c
   ```

---

## 🏃 Running the Application

### Option A: Run Frontend & Backend Concurrently (Root)
```bash
npm install -g concurrently   # If not already installed globally
npm run dev
```

### Option B: Run Services Individually

#### Start Backend API Server:
```bash
cd Backend
npm run dev
```
*Backend will run on `http://localhost:5000`*

#### Start Frontend Dev Server:
```bash
cd Frontend
npm run dev
```
*Frontend will run on `http://localhost:5173`*

---

## 🔑 User Roles

| Role | Access Scope | Key Capabilities |
| :--- | :--- | :--- |
| **Super Admin** | Platform Wide | Manage colleges, system health, global users & global system settings |
| **College Admin** | College Level | Manage departments, batches, faculty, and college metrics |
| **Coordinator** | Department Level | Track student progress, view defaulters, monitor placement readiness |
| **Mentor / Trainer** | Batch / Class Level | Create assessments, schedule live sessions, upload study material, mark attendance |
| **Student** | Individual | Access AI Roadmaps, attempt quizzes & coding problems, view attendance & analytics |

---

## 📡 Key API Routes Overview

- **Auth**: `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/forgot-password`
- **Users**: `/api/v1/users`, `/api/v1/users/profile`
- **Colleges & Departments**: `/api/v1/colleges`, `/api/v1/departments`, `/api/v1/batches`
- **Assessments**: `/api/v1/assessments`, `/api/v1/assessments/:id/submit`
- **Attendance**: `/api/v1/attendance`, `/api/v1/attendance/sessions`
- **AI Services**: `/api/v1/ai/roadmap`, `/api/v1/ai/interview`, `/api/v1/ai/skill-gap`
- **Practice Problems**: `/api/v1/practice-problems`

---

## 🔒 Security Guidelines

- **Environment Secrets**: Never commit `.env` or API keys to repository.
- **Git History**: Ensure `.env` is ignored by `.gitignore` across all branches.
- **Authentication**: JWT tokens are transmitted via Bearer headers and validated on protected endpoints.
