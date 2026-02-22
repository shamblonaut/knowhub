# 📚 Corpus — Academic Resource Hub

<p align="center">
  <a href="#-key-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-architecture">Architecture</a>
</p>

---

**Corpus** is a centralized web portal designed for seamless academic resource sharing between HODs, Faculty, and Students. It combines traditional resource management with modern AI-powered features like hybrid search and a RAG-based study assistant.

---

## 🚀 Key Features

- **🛡️ Secure Access Control** — Role-based permissions for HOD, Faculty, and Students (JWT-backed).
- **📂 Smart Repository** — Organize resources by Semester, Subject, and Unit with support for PDF, PPT, Word, and Images.
- **✅ Streamlined Approval** — Faculty-led verification workflow to ensure quality content.
- **📢 Digital Notice Board** — Real-time updates with "NEW" badges and pinned announcements.
- **🔍 Hybrid AI Search** — Combines keyword matching with semantic vector search for fast, relevant results.
- **🤖 AI Study Assistant** — Integrated RAG-based chat to answer questions using curated course materials.
- **📊 HOD Dashboard** — Comprehensive analytics on uploads, downloads, and department activity.

---

## 🛠️ Tech Stack

| Component    | Technology                                                   |
| :----------- | :----------------------------------------------------------- |
| **Frontend** | React, Vite, Tailwind CSS, TanStack Query                    |
| **Backend**  | Django, Django REST Framework, SimpleJWT                     |
| **Database** | MongoDB (via MongoEngine)                                    |
| **AI/ML**    | Sentence Transformers (`all-MiniLM-L6-v2`), Groq (Llama 3.1) |
| **Storage**  | Local Media Management                                       |

---

## 🏁 Getting Started

### 📋 Prerequisites

- **Python** 3.10+
- **Node.js** 20+
- **MongoDB** 7.0+ (Running on `localhost:27017`)

### 🛠️ Installation & Setup

#### 1. Clone & Database

```bash
git clone https://github.com/safa-nasrin/Corpus
cd Corpus
# Ensure mongod is running
sudo systemctl start mongod
```

#### 2. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Pre-load AI Model
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

python manage.py runserver 8000
```

#### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 👥 User Roles

| Role        | Responsibility                                                          |
| :---------- | :---------------------------------------------------------------------- |
| **HOD**     | Department management, analytics oversight, faculty & subject creation. |
| **Faculty** | Resource verification, subject ownership, posting announcements.        |
| **Student** | Resource discovery, peer-to-peer uploads, AI-assisted learning.         |

---

## 📖 Further Documentation

- **[Full Architecture Guide](docs/ARCHITECTURE.md)** — Dive deep into schemas and system flows.
- **[API Specification](docs/API_DESIGN.md)** — Complete endpoint documentation and request contracts.

---

## 📸 Screenshots

### AI Features

![AI Features](https://github.com/user-attachments/assets/13759020-8d4d-4292-8e5f-5fb8d08958fa)

### Analytics

![Analytics](https://github.com/user-attachments/assets/b9f8547d-20cf-4591-ac42-f9dae77ea7a8)

### Repository

![Repository](https://github.com/user-attachments/assets/7f89e047-fa3b-4fff-85ec-d8476bd5d1e1)

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more details on how to get involved.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
