# 📚 KnowHub

> Departmental Digital Resource & Knowledge Hub — Solve-a-Thon Track 1 (BCA)

A centralized web portal for academic resource sharing between HOD, Faculty, and Students. Built in 24 hours.

---

## Tech Stack

| Layer        | Technology                               |
| ------------ | ---------------------------------------- |
| Frontend     | React 18 + Vite + Tailwind CSS           |
| Backend      | Django 5 + Django REST Framework         |
| Database     | MongoDB via MongoEngine                  |
| Auth         | JWT (djangorestframework-simplejwt)      |
| AI Search    | sentence-transformers (all-MiniLM-L6-v2) |
| File Storage | Local disk (Django MEDIA_ROOT)           |

---

## Features

- **Role-based access** — HOD, Faculty, and Student roles with distinct permissions
- **Smart Repository** — Upload PDFs, PPTs, DOCs, and images organized by Semester, Subject, and Unit
- **Gatekeeper Approval** — Student uploads require Faculty approval before going live
- **Digital Notice Board** — Post department circulars with "NEW" badge for 24 hours
- **Advanced Filtering** — Filter resources by Semester, Subject, Format, and Professor
- **AI-Powered Search** — Hybrid keyword + semantic search using local embeddings
- **HOD Analytics Dashboard** — Upload stats, top resources, faculty activity charts

---

## Project Structure

```
knowledge_hub/
├── backend/                  # Django project
│   ├── core/                 # Settings, URLs
│   ├── accounts/             # Auth, user management
│   ├── repository/           # Resources, subjects, uploads
│   ├── notices/              # Notice board
│   ├── analytics/            # HOD dashboard data
│   ├── search/               # AI search & recommendations
│   ├── media/                # Uploaded files (gitignored)
│   └── manage.py
├── frontend/                 # React + Vite app
│   └── src/
│       ├── api/              # Axios instance
│       ├── components/       # Reusable UI components
│       ├── context/          # AuthContext
│       ├── hooks/            # Custom hooks
│       └── pages/            # Route-level pages
├── ARCHITECTURE.md           # Full system architecture reference
├── API_DESIGN.md             # Complete API contracts
└── README.md
```

---

## Prerequisites

- Python 3.10+
- Node.js 20+
- MongoDB 7.0 running on `localhost:27017`

---

## Getting Started

### 1. Clone the repo

```bash
git clone <repo-url>
cd knowledge_hub
```

### 2. Start MongoDB

```bash
sudo systemctl start mongod
sudo systemctl status mongod   # should show: active (running)
```

### 3. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate

pip install django djangorestframework djangorestframework-simplejwt \
            mongoengine django-cors-headers Pillow python-dotenv passlib

# Download AI model (80MB, only needed once)
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

python manage.py check        # should show 0 issues
python manage.py runserver 8000
```

### 4. Frontend setup

```bash
cd frontend
npm install
npm run dev                   # starts on http://localhost:5173
```

### 5. Open the app

Navigate to **http://localhost:5173**

---

## Demo Accounts

Seed these before demoing (use the management command or create manually):

| Role    | Email           | Password |
| ------- | --------------- | -------- |
| HOD     | hod@bca.edu     | Demo@123 |
| Faculty | faculty@bca.edu | Demo@123 |
| Student | student@bca.edu | Demo@123 |

---

## User Roles

### HOD (Admin)

- Creates Faculty accounts and manages Subjects
- Approves/rejects any student upload
- Views analytics dashboard
- Pins and deletes notices

### Faculty

- Uploads resources (auto-approved and immediately live)
- Reviews and approves student uploads for their assigned subjects
- Posts notices

### Student

- Self-registers with USN
- Uploads notes (enters pending approval queue)
- Browses and downloads approved resources
- Views notices

---

## API

Backend runs at `http://localhost:8000/api/v1/`

All endpoints require `Authorization: Bearer <token>` except `/auth/register/` and `/auth/login/`.

See [`API_DESIGN.md`](./API_DESIGN.md) for complete request/response contracts.

Key endpoint groups:

- `/auth/` — Register, login, token refresh, user profile
- `/subjects/` — Subject and semester management
- `/resources/` — Upload, browse, download, approve, reject
- `/notices/` — Department notice board
- `/analytics/` — HOD dashboard stats
- `/search/` — AI-powered search and recommendations

---

## File Upload Rules

| Format       | Extensions              |
| ------------ | ----------------------- |
| PDF          | `.pdf`                  |
| Presentation | `.ppt`, `.pptx`         |
| Document     | `.doc`, `.docx`         |
| Image        | `.jpg`, `.jpeg`, `.png` |

Maximum file size: **50MB**  
All other formats are rejected with a 400 error.

---

## Architecture

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for:

- Full system architecture and request flow
- MongoDB collection schemas
- Frontend component tree
- Permission matrix
- AI search implementation details

---

## Development Notes

- No Django ORM — all models use MongoEngine Documents
- No `django.contrib.admin` or `django.contrib.auth` — custom JWT auth with MongoEngine
- Faculty approval is scoped to their assigned subjects only
- `is_new` on notices is computed at serialization (not stored in DB)
- File deletion from disk happens on resource rejection
- AI embeddings are generated in a background thread on approval

---

## Team

Built at Solve-a-Thon 2026 — Track 1 (BCA)

