# 🎓 CertGen — MERN Online Certificate Generator

A full-stack certificate generation and delivery platform built with **MongoDB, Express, React, Node.js**.

---

## ✨ Features

- **3 Beautiful Certificate Templates**: Modern, Classic, Elegant
- **PDF Certificate Generation** using Puppeteer (real browser-rendered)
- **Automated Email Delivery** with PDF attachment via Nodemailer
- **Bulk Operations**: Import participants via CSV, bulk generate & send certificates
- **Certificate Verification**: Public URL to verify certificate authenticity
- **Exam Management**: Create exams with custom settings, colors, passing scores
- **Participant Tracking**: Track scores, pass/fail status, certificate issuance
- **JWT Authentication**: Secure instructor/admin accounts
- **Responsive Dashboard**: Stats overview, recent activity

---

## 📁 Project Structure

```
cert-generator/
├── backend/
│   ├── models/
│   │   ├── User.js          # Admin/instructor accounts
│   │   ├── Exam.js          # Exam configuration
│   │   ├── Participant.js   # Exam participants with scores
│   │   └── Certificate.js   # Issued certificates
│   ├── routes/
│   │   ├── auth.js          # Login, register, profile
│   │   ├── exams.js         # CRUD for exams
│   │   ├── participants.js  # Add/manage participants
│   │   └── certificates.js  # Generate, send, verify certs
│   ├── middleware/
│   │   └── auth.js          # JWT protect middleware
│   ├── utils/
│   │   ├── pdfGenerator.js  # Puppeteer PDF generation
│   │   └── emailSender.js   # Nodemailer email utility
│   ├── templates/
│   │   └── certificate.js   # HTML certificate templates
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── LoginPage.js
        │   ├── RegisterPage.js
        │   ├── DashboardPage.js
        │   ├── ExamsPage.js
        │   ├── CreateExamPage.js
        │   ├── ExamDetailPage.js   # Main management page
        │   └── VerifyPage.js       # Public certificate verification
        ├── components/
        │   └── Layout.js           # Sidebar navigation
        ├── context/
        │   └── AuthContext.js      # Auth state management
        └── utils/
            └── api.js              # Axios instance with auth
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Gmail or SMTP account for emails

### 2. Clone & Install

```bash
# Install all dependencies
npm run install:all
```

### 3. Configure Backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cert-generator
JWT_SECRET=your_super_secret_key_here

# Gmail setup
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password   # NOT your regular password!

FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords → Generate one for "Mail"

### 4. Run Development

```bash
# Run both backend & frontend together
npm run dev

# Or separately:
npm run start:backend   # Port 5000
npm run start:frontend  # Port 3000
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Exams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exams` | List all exams |
| POST | `/api/exams` | Create exam |
| PUT | `/api/exams/:id` | Update exam |
| DELETE | `/api/exams/:id` | Delete exam |

### Participants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/participants/exam/:examId` | Get participants |
| POST | `/api/participants` | Add participant |
| POST | `/api/participants/bulk` | Bulk import |
| PUT | `/api/participants/:id` | Update score |
| DELETE | `/api/participants/:id` | Remove participant |

### Certificates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/certificates/verify/:certId` | **Public** verify cert |
| GET | `/api/certificates/exam/:examId` | List exam certificates |
| POST | `/api/certificates/generate/:participantId` | Generate + send |
| POST | `/api/certificates/bulk-generate/:examId` | Bulk generate + send |
| DELETE | `/api/certificates/:certId` | Revoke certificate |

---

## 🎨 Certificate Templates

| Template | Style | Best For |
|----------|-------|----------|
| **Modern** | Light background, corner accents, gradient text | Professional courses |
| **Classic** | Parchment style, ornamental borders | Academic exams |
| **Elegant** | Dark luxury, gold accents | Premium programs |

---

## 🔄 Certificate Flow

```
1. Create Exam → Set template, instructor, passing score
2. Add Participants → Individual or bulk CSV import
3. Issue Certificate → Click "Issue" or "Send All Certificates"
4. PDF Generated → Puppeteer renders HTML → PDF
5. Email Sent → PDF attached, verification link included
6. Verify → Public URL /verify/:certId shows validity
```

---

## 🛡️ Security Notes

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens expire in 7 days
- Each user can only manage their own exams
- Certificate verification is public but read-only

---

## 🚀 Deployment

### Backend (Railway / Render)
```bash
# Set environment variables in your hosting platform
# Build command: npm install
# Start command: node server.js
```

### Frontend (Vercel / Netlify)
```bash
# Build: npm run build
# Set REACT_APP_API_URL=https://your-backend.com/api
```

### MongoDB
Use MongoDB Atlas for production — update `MONGODB_URI` in env.

---

## 📦 Key Dependencies

**Backend**: Express, Mongoose, Puppeteer, Nodemailer, JWT, bcryptjs, uuid  
**Frontend**: React 18, React Router v6, Axios, React Hot Toast
