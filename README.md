# Online Polling System 🗳️

A clean, minimal, full-stack **Online Polling System** built for a 45-minute interactive workshop. It features passwordless phone authentication using the **Minimoth OTP API**, real-time vote percentage tracking, and instant poll creation.

---

## ⚡ Workshop Architecture & Scope

This project strictly follows the minimalist workshop constraints:

| Scope | Specification | Details |
|---|---|---|
| **Frontend Pages** | **3 Pages** | 1. `AuthPage` (Phone + OTP verification)<br>2. `PollsPage` (Community poll listing + creation)<br>3. `PollDetailPage` (Voting interface & live results) |
| **Backend Endpoints** | **5 Endpoints** | 1. `POST /api/auth/send-otp`<br>2. `POST /api/auth/verify-otp`<br>3. `GET /api/polls`<br>4. `POST /api/polls`<br>5. `POST /api/polls/:id/vote` |
| **Database Entities** | **3 Models** | 1. `users` (id, phone, created_at)<br>2. `polls` (id, question, creator_phone, voters, created_at)<br>3. `options` (id, poll_id, text, votes_count) |
| **Authentication** | **Minimoth OTP** | WhatsApp/SMS OTP via [minimoth.dev](https://minimoth.dev) with automatic sandbox fallback |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and insert your Minimoth API key:
```env
PORT=5001
MINIMOTH_API_KEY=your_minimoth_api_key_here
```

> **Note on Testing/Sandbox Mode:**
> - If you have a Minimoth sandbox key (`mm_test_...`), Minimoth accepts code `000000`.
> - If running locally without an API key yet, demo mode automatically activates and allows code `000000` so workshop attendees can test immediately without setup friction.

Start the backend server:
```bash
npm run dev
# Server runs on http://localhost:5001
```

### 2. Frontend Setup

In a separate terminal:
```bash
cd frontend
npm install
cp .env.example .env
```

`frontend/.env`:
```env
VITE_API_URL=http://localhost:5001
```

Start the Vite dev server:
```bash
npm run dev
# App runs on http://localhost:5173
```

Open your browser to `http://localhost:5173`.

---

## 📡 API Reference

### 1. Send OTP
* **URL:** `POST /api/auth/send-otp`
* **Body:**
  ```json
  { "phone": "+919876543210" }
  ```
* **Response:**
  ```json
  { "success": true, "message": "OTP sent successfully" }
  ```

### 2. Verify OTP
* **URL:** `POST /api/auth/verify-otp`
* **Body:**
  ```json
  { "phone": "+919876543210", "code": "000000" }
  ```
* **Response:**
  ```json
  { "success": true, "user": { "id": 1, "phone": "+919876543210" } }
  ```

### 3. List Polls
* **URL:** `GET /api/polls` *(Optional: `?id=1` for single poll)*
* **Response:**
  ```json
  {
    "success": true,
    "polls": [
      {
        "id": 1,
        "question": "What is your primary web stack?",
        "creator_phone": "+919999988888",
        "total_votes": 32,
        "options": [
          { "id": 1, "text": "React + Node.js", "votes_count": 14, "percentage": 44 }
        ]
      }
    ]
  }
  ```

### 4. Create Poll
* **URL:** `POST /api/polls`
* **Body:**
  ```json
  {
    "question": "Which database do you prefer?",
    "options": ["PostgreSQL", "SQLite", "MongoDB"],
    "creatorPhone": "+919876543210"
  }
  ```
* **Response:**
  ```json
  { "success": true, "pollId": 2, "message": "Poll created successfully!" }
  ```

### 5. Cast Vote
* **URL:** `POST /api/polls/:id/vote`
* **Body:**
  ```json
  {
    "optionId": 1,
    "voterPhone": "+919876543210"
  }
  ```
* **Response:**
  ```json
  { "success": true, "message": "Your vote has been cast successfully!" }
  ```
  *(Prevents duplicate voting by the same user on the same poll with HTTP 409).*

---

## 🗄️ Database Schema

Uses built-in SQLite (`better-sqlite3`), stored locally in `backend/polling.db`:
- **`users`**: `id`, `phone`, `created_at`
- **`polls`**: `id`, `question`, `creator_phone`, `voters`, `created_at`
- **`options`**: `id`, `poll_id`, `text`, `votes_count`

---

## 🎨 Tech Stack

- **Frontend:** React 19, Vite, Vanilla CSS (Modern dark aesthetics, glassmorphism, responsive cards, micro-interactions).
- **Backend:** Node.js, Express, Better-SQLite3, dotenv.
- **Auth Provider:** [Minimoth](https://minimoth.dev) WhatsApp/SMS OTP.
