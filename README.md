<div align="center">
  <img width="1200" height="auto" alt="Kianda Admissions Portal" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  
  # Kianda Admissions Portal
  ### *Institutional Command Center & Candidate Journey Tracker*
</div>

---

## 🏛️ Project Overview
The **Kianda Admissions Portal** is a high-density, full-stack ERP module designed to manage the end-to-end enrollment cycle for Kianda School. It transitions candidates from initial application through academic assessment, parent interviews, and final admission, maintaining total institutional data integrity.

## 🚀 Core Features

### 1. Administrative Command Center
*   **Real-time Indicators**: Visual tracking of application volume, current vacancies, and acceptance rates.
*   **Grade Enrollment Ledger**: A high-fidelity Recharts-powered analytics suite visualizing demand vs. capacity across all grade levels.
*   **Journey Tracker**: A sequential activity feed that visualizes candidate progression (New ➔ Passed ➔ Scheduled ➔ Admitted) with automated "Status Guards."
*   **Academic Calendar**: Integrated view of upcoming assessments and interview slots.

### 2. Candidate Experience
*   **Premium Application Flow**: A multi-stage, animated application interface with custom-designed inputs (Gold/Navy aesthetic).
*   **Document Management**: Secure upload system for Birth Certificates, School Reports, and Application Letters.
*   **Dynamic Logic**: Grade-based conditional forms (e.g., specific past-school questions for Grade 7 applicants).

### 3. Intelligence & Reporting
*   **Professional PDF Export**: Instant generation of candidate dossiers with restructured layouts prioritizing Motivation Statements and Narrative sections.
*   **Bulk Operational Tools**: ZIP-based bulk export of application data synchronized with main filter logic.
*   **Automated Communication**: Integrated email engine for Assessment Invitations, Interview Invites (Finance-led), and Admission Offers.

## 🛠️ Technology Stack
*   **Frontend**: React 19, TailwindCSS 4, Motion, Recharts, Lucide Icons.
*   **Backend**: Node.js/Express with Drizzle ORM.
*   **Database**: PostgreSQL.
*   **Security**: JWT-based Administrative Authentication, Bcrypt Password Hashing.
*   **Reporting**: jsPDF, JSZip, XLSX.

## 📦 Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL Instance

### 1. Environment Configuration
Create a `.env` file in the root directory:
```bash
PORT=5000
DATABASE_URL=postgres://user:pass@localhost:5432/kianda_db
JWT_SECRET=your_luxury_secret
EMAIL_USER=admissions@kianda.co.ke
EMAIL_PASS=your_app_password
```

### 2. Database Initialization
```bash
npm run db:push    # Push schema to PostgreSQL
```

### 3. Development Server
```bash
npm install        # Install dependencies
npm run dev        # Launch concurrently (Vite + Express)
```

## 📐 Design Philosophy
The system adheres to **Institutional Premium** aesthetics:
*   **High Data Density**: Minimal white space, maximum informational throughput for registrars.
*   **Visual Hierarchy**: Use of Kianda Navy (#18216D) for gravity and Kianda Gold (#FFC425) for action signals.
*   **Animated Transitions**: Micro-animations via `motion` to provide a "living" interface feel.

---
*Built for Kianda School Admissions Office.*
