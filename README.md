# Student Planner

A full-stack Student Planner web application built with React, Node.js, Express, and MySQL.

## Phase 1 — Authentication

Phase 1 includes user registration, login, logout, JWT authentication, and protected routes.

### Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, TailwindCSS, Axios, React Router |
| Backend | Node.js, Express |
| Database | MySQL |
| Auth | JWT, bcryptjs |

## Project Structure

```
Student_Planner/
├── backend/
│   ├── config/          # Environment & database config
│   ├── controllers/     # Request handlers
│   ├── middleware/      # JWT auth middleware
│   ├── models/          # Database access layer
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── sql/             # SQL scripts
│   ├── app.js           # Express app setup
│   └── index.js         # Server entry point
├── frontend/
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── contexts/    # React context (Auth)
│       ├── layouts/     # Page layouts
│       ├── pages/       # Route pages
│       └── services/    # API client & auth service
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+

### 1. Database setup

Run the Phase 1 SQL script (optional — the backend auto-creates tables on startup):

```bash
mysql -u root -p < backend/sql/phase1.sql
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials
npm install
npm run dev
```

The API runs at `http://localhost:5000`.

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## API Endpoints (Phase 1)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login and receive JWT |
| POST | `/api/auth/logout` | Yes | Logout (client clears token) |
| GET | `/api/auth/me` | Yes | Get current user profile |

### Example: Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"secret123","fullname":"John Doe","email":"john@example.com"}'
```

### Example: Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"secret123"}'
```

### Example: Protected route

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## License

ISC
